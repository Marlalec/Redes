package com.universidad.redes.infrastructure.adapter.in.rest;

import com.universidad.redes.application.port.out.AppUserRepositoryPort;
import com.universidad.redes.application.port.out.facial.FacialIdentityPort;
import com.universidad.redes.domain.exception.FacialVerificationFailedException;
import com.universidad.redes.domain.exception.PendingAuthenticationException;
import com.universidad.redes.domain.model.AppUser;
import com.universidad.redes.domain.model.facial.FacialEnrollment;
import com.universidad.redes.domain.model.facial.FacialPreview;
import com.universidad.redes.domain.model.facial.FacialSurveillance;
import com.universidad.redes.domain.model.facial.FacialVerification;
import com.universidad.redes.infrastructure.adapter.in.rest.dto.request.FaceEnrollmentRequest;
import com.universidad.redes.infrastructure.adapter.in.rest.dto.request.LoginRequest;
import com.universidad.redes.infrastructure.adapter.in.rest.dto.response.AuthSessionResponse;
import com.universidad.redes.infrastructure.adapter.in.rest.dto.response.CsrfTokenResponse;
import com.universidad.redes.infrastructure.adapter.in.rest.dto.response.FaceEnrollmentResponse;
import com.universidad.redes.infrastructure.adapter.in.rest.dto.response.FaceEnrollmentStatusResponse;
import com.universidad.redes.infrastructure.adapter.in.rest.dto.response.FacePreviewStatusResponse;
import com.universidad.redes.infrastructure.adapter.in.rest.dto.response.FaceVerificationResponse;
import com.universidad.redes.infrastructure.adapter.in.rest.dto.response.PasswordLoginResponse;
import com.universidad.redes.infrastructure.adapter.in.rest.dto.response.SurveillanceStatusResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.logout.SecurityContextLogoutHandler;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private static final String PENDING_EMAIL = "OSI_PENDING_FACE_EMAIL";
    private static final String PENDING_EXPIRES_AT = "OSI_PENDING_FACE_EXPIRES_AT";
    private static final String PENDING_ATTEMPTS = "OSI_PENDING_FACE_ATTEMPTS";
    private static final int MAX_FACE_ATTEMPTS = 3;

    private final AuthenticationManager authenticationManager;
    private final AppUserRepositoryPort userRepository;
    private final SecurityContextRepository securityContextRepository;
    private final FacialIdentityPort facialIdentityPort;
    private final UserDetailsService userDetailsService;
    private final long pendingTimeoutSeconds;
    private final boolean livenessRequired;

    public AuthController(
            AuthenticationManager authenticationManager,
            AppUserRepositoryPort userRepository,
            SecurityContextRepository securityContextRepository,
            FacialIdentityPort facialIdentityPort,
            UserDetailsService userDetailsService,
            @Value("${app.face.pending-timeout-seconds:300}") long pendingTimeoutSeconds,
            @Value("${app.face.liveness-required:true}") boolean livenessRequired
    ) {
        this.authenticationManager = authenticationManager;
        this.userRepository = userRepository;
        this.securityContextRepository = securityContextRepository;
        this.facialIdentityPort = facialIdentityPort;
        this.userDetailsService = userDetailsService;
        this.pendingTimeoutSeconds = pendingTimeoutSeconds;
        this.livenessRequired = livenessRequired;
    }

    @GetMapping("/csrf")
    public CsrfTokenResponse getCsrfToken(HttpServletRequest request) {
        CsrfToken csrfToken = (CsrfToken) request.getAttribute(CsrfToken.class.getName());

        if (csrfToken == null) {
            throw new IllegalStateException("No fue posible generar el token de seguridad");
        }

        return new CsrfTokenResponse(csrfToken.getToken(), csrfToken.getHeaderName());
    }

    @PostMapping("/login")
    public PasswordLoginResponse login(
            @Valid @RequestBody LoginRequest loginRequest,
            HttpServletRequest request,
            HttpServletResponse response
    ) {
        Authentication authentication = authenticationManager.authenticate(
                UsernamePasswordAuthenticationToken.unauthenticated(
                        loginRequest.email().trim(),
                        loginRequest.password()
                )
        );

        AppUser user = findUser(authentication.getName());
        HttpSession session = request.getSession(true);
        request.changeSessionId();
        clearPendingAuthentication(session);
        SecurityContextHolder.clearContext();
        session.removeAttribute(HttpSessionSecurityContextRepository.SPRING_SECURITY_CONTEXT_KEY);

        if (facialIdentityPort.isEnrolled(subjectId(user))) {
            session.setAttribute(PENDING_EMAIL, user.email());
            session.setAttribute(
                    PENDING_EXPIRES_AT,
                    System.currentTimeMillis() + pendingTimeoutSeconds * 1000
            );
            session.setAttribute(PENDING_ATTEMPTS, 0);

            return new PasswordLoginResponse(
                    "FACE_REQUIRED",
                    null,
                    "Contraseña correcta. Completa la verificación frente a la cámara",
                    pendingTimeoutSeconds
            );
        }

        saveAuthenticatedContext(authentication, request, response);
        return new PasswordLoginResponse(
                "AUTHENTICATED",
                toSessionResponse(user),
                "Sesión iniciada correctamente",
                null
        );
    }

    @PostMapping("/face/verify")
    public FaceVerificationResponse verifyFace(
            HttpServletRequest request,
            HttpServletResponse response
    ) {
        HttpSession session = requirePendingSession(request);
        String email = (String) session.getAttribute(PENDING_EMAIL);
        AppUser user = findUser(email);
        facialIdentityPort.stopSurveillance(subjectId(user));
        FacialVerification verification = facialIdentityPort.verify(subjectId(user));

        if (!verification.matched()) {
            int attempts = ((Integer) session.getAttribute(PENDING_ATTEMPTS)) + 1;
            session.setAttribute(PENDING_ATTEMPTS, attempts);
            int remaining = MAX_FACE_ATTEMPTS - attempts;
            if (remaining <= 0) {
                clearPendingAuthentication(session);
                throw new FacialVerificationFailedException(
                        "Verificación facial bloqueada. Vuelve a ingresar tu contraseña"
                );
            }
            throw new FacialVerificationFailedException(
                    "El rostro no coincide. Intentos restantes: " + remaining
            );
        }

        UserDetails principal = userDetailsService.loadUserByUsername(user.email());
        Authentication authentication = UsernamePasswordAuthenticationToken.authenticated(
                principal,
                null,
                principal.getAuthorities()
        );
        request.changeSessionId();
        clearPendingAuthentication(session);
        saveAuthenticatedContext(authentication, request, response);

        return new FaceVerificationResponse(
                toSessionResponse(user),
                verification.livenessVerified(),
                "Rostro verificado. Sesión iniciada correctamente"
        );
    }

    @PostMapping("/face/cancel")
    public ResponseEntity<Void> cancelFaceVerification(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        if (session != null) {
            stopPendingPreview(session);
            clearPendingAuthentication(session);
        }
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/face/challenge/preview/start")
    public FacePreviewStatusResponse startPendingFacePreview(HttpServletRequest request) {
        HttpSession session = requirePendingSession(request);
        AppUser user = pendingUser(session);
        FacialSurveillance surveillance = facialIdentityPort.startSurveillance(subjectId(user));
        FacialPreview preview = facialIdentityPort.previewStatus(subjectId(user));
        return new FacePreviewStatusResponse(
                surveillance.active(),
                0,
                preview.required(),
                surveillance.faceDetected(),
                false,
                surveillance.message()
        );
    }

    @GetMapping("/face/challenge/preview/status")
    public FacePreviewStatusResponse getPendingFacePreviewStatus(HttpServletRequest request) {
        HttpSession session = requirePendingSession(request);
        AppUser user = pendingUser(session);
        String subjectId = subjectId(user);
        FacialPreview capture = facialIdentityPort.previewStatus(subjectId);
        if (capture.active()) {
            return toPreviewResponse(capture);
        }

        FacialSurveillance surveillance = facialIdentityPort.surveillanceStatus(subjectId);
        return new FacePreviewStatusResponse(
                surveillance.active(),
                0,
                capture.required(),
                surveillance.faceDetected(),
                false,
                surveillance.message()
        );
    }

    @GetMapping(value = "/face/challenge/preview/frame", produces = MediaType.IMAGE_JPEG_VALUE)
    public ResponseEntity<byte[]> getPendingFacePreviewFrame(HttpServletRequest request) {
        HttpSession session = requirePendingSession(request);
        AppUser user = pendingUser(session);
        String subjectId = subjectId(user);
        byte[] frame = facialIdentityPort.previewFrame(subjectId);
        if (frame == null || frame.length == 0) {
            frame = facialIdentityPort.surveillanceFrame(subjectId);
        }
        if (frame == null || frame.length == 0) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.ok()
                .cacheControl(CacheControl.noStore())
                .contentType(MediaType.IMAGE_JPEG)
                .body(frame);
    }

    @PostMapping("/face/challenge/preview/stop")
    public ResponseEntity<Void> stopPendingFacePreview(HttpServletRequest request) {
        HttpSession session = requirePendingSession(request);
        facialIdentityPort.stopSurveillance(subjectId(pendingUser(session)));
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/face/status")
    public FaceEnrollmentStatusResponse getFaceStatus(Authentication authentication) {
        AppUser user = findUser(authentication.getName());
        boolean enrolled = facialIdentityPort.isEnrolled(subjectId(user));
        return new FaceEnrollmentStatusResponse(
                enrolled,
                livenessRequired,
                enrolled
                        ? "Tu plantilla facial cifrada está activa"
                        : "Todavía no tienes una plantilla facial registrada"
        );
    }

    @GetMapping("/face/preview/status")
    public FacePreviewStatusResponse getFacePreviewStatus(Authentication authentication) {
        AppUser user = findUser(authentication.getName());
        FacialPreview preview = facialIdentityPort.previewStatus(subjectId(user));
        return new FacePreviewStatusResponse(
                preview.active(),
                preview.samples(),
                preview.required(),
                preview.faceDetected(),
                preview.livenessVerified(),
                preview.message()
        );
    }

    @GetMapping(value = "/face/preview/frame", produces = MediaType.IMAGE_JPEG_VALUE)
    public ResponseEntity<byte[]> getFacePreviewFrame(Authentication authentication) {
        AppUser user = findUser(authentication.getName());
        byte[] frame = facialIdentityPort.previewFrame(subjectId(user));
        if (frame == null || frame.length == 0) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.ok()
                .cacheControl(CacheControl.noStore())
                .contentType(MediaType.IMAGE_JPEG)
                .body(frame);
    }

    @PostMapping("/surveillance/start")
    public SurveillanceStatusResponse startSurveillance(Authentication authentication) {
        AppUser user = findUser(authentication.getName());
        FacialSurveillance surveillance = facialIdentityPort.startSurveillance(subjectId(user));
        return toSurveillanceResponse(surveillance);
    }

    @GetMapping("/surveillance/status")
    public SurveillanceStatusResponse getSurveillanceStatus(Authentication authentication) {
        AppUser user = findUser(authentication.getName());
        return toSurveillanceResponse(facialIdentityPort.surveillanceStatus(subjectId(user)));
    }

    @GetMapping(value = "/surveillance/frame", produces = MediaType.IMAGE_JPEG_VALUE)
    public ResponseEntity<byte[]> getSurveillanceFrame(Authentication authentication) {
        AppUser user = findUser(authentication.getName());
        byte[] frame = facialIdentityPort.surveillanceFrame(subjectId(user));
        if (frame == null || frame.length == 0) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.ok()
                .cacheControl(CacheControl.noStore())
                .contentType(MediaType.IMAGE_JPEG)
                .body(frame);
    }

    @PostMapping("/surveillance/stop")
    public ResponseEntity<Void> stopSurveillance(Authentication authentication) {
        AppUser user = findUser(authentication.getName());
        facialIdentityPort.stopSurveillance(subjectId(user));
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/face/enrollment")
    public FaceEnrollmentResponse enrollFace(
            @Valid @RequestBody FaceEnrollmentRequest enrollmentRequest,
            Authentication authentication
    ) {
        AppUser user = findUser(authentication.getName());
        FacialEnrollment enrollment = facialIdentityPort.enroll(subjectId(user));
        return new FaceEnrollmentResponse(
                enrollment.enrolled(),
                enrollment.samples(),
                enrollment.livenessVerified(),
                enrollment.message()
        );
    }

    @DeleteMapping("/face/enrollment")
    public ResponseEntity<Void> deleteFace(Authentication authentication) {
        AppUser user = findUser(authentication.getName());
        facialIdentityPort.delete(subjectId(user));
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/session")
    public AuthSessionResponse getSession(Authentication authentication) {
        return toSessionResponse(findUser(authentication.getName()));
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(
            HttpServletRequest request,
            HttpServletResponse response,
            Authentication authentication
    ) {
        HttpSession session = request.getSession(false);
        if (session != null) {
            clearPendingAuthentication(session);
        }
        new SecurityContextLogoutHandler().logout(request, response, authentication);
        return ResponseEntity.noContent().build();
    }

    private AppUser findUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalStateException("La sesión no tiene un usuario válido"));
    }

    private AuthSessionResponse toSessionResponse(AppUser user) {
        return new AuthSessionResponse(
                user.id(),
                user.email(),
                user.displayName(),
                user.role().name()
        );
    }

    private void saveAuthenticatedContext(
            Authentication authentication,
            HttpServletRequest request,
            HttpServletResponse response
    ) {
        SecurityContext securityContext = SecurityContextHolder.createEmptyContext();
        securityContext.setAuthentication(authentication);
        SecurityContextHolder.setContext(securityContext);
        securityContextRepository.saveContext(securityContext, request, response);
    }

    private HttpSession requirePendingSession(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        if (session == null
                || !(session.getAttribute(PENDING_EMAIL) instanceof String)
                || !(session.getAttribute(PENDING_EXPIRES_AT) instanceof Long expiresAt)
                || !(session.getAttribute(PENDING_ATTEMPTS) instanceof Integer attempts)) {
            throw new PendingAuthenticationException(
                    "Primero debes validar tu correo y contraseña"
            );
        }
        if (System.currentTimeMillis() >= expiresAt || attempts >= MAX_FACE_ATTEMPTS) {
            clearPendingAuthentication(session);
            throw new PendingAuthenticationException(
                    "La verificación facial expiró. Ingresa nuevamente tu contraseña"
            );
        }
        return session;
    }

    private void clearPendingAuthentication(HttpSession session) {
        session.removeAttribute(PENDING_EMAIL);
        session.removeAttribute(PENDING_EXPIRES_AT);
        session.removeAttribute(PENDING_ATTEMPTS);
    }

    private AppUser pendingUser(HttpSession session) {
        return findUser((String) session.getAttribute(PENDING_EMAIL));
    }

    private void stopPendingPreview(HttpSession session) {
        Object pendingEmail = session.getAttribute(PENDING_EMAIL);
        if (pendingEmail instanceof String email) {
            userRepository.findByEmail(email)
                    .ifPresent(user -> {
                        try {
                            facialIdentityPort.stopSurveillance(subjectId(user));
                        } catch (RuntimeException ignored) {
                            // Cancelar el desafío no debe depender de la disponibilidad de la cámara.
                        }
                    });
        }
    }

    private FacePreviewStatusResponse toPreviewResponse(FacialPreview preview) {
        return new FacePreviewStatusResponse(
                preview.active(),
                preview.samples(),
                preview.required(),
                preview.faceDetected(),
                preview.livenessVerified(),
                preview.message()
        );
    }

    private String subjectId(AppUser user) {
        return "user-" + user.id();
    }

    private SurveillanceStatusResponse toSurveillanceResponse(FacialSurveillance surveillance) {
        return new SurveillanceStatusResponse(
                surveillance.active(),
                surveillance.faceDetected(),
                surveillance.message()
        );
    }
}
