package com.universidad.redes.infrastructure.adapter.in.rest;

import com.universidad.redes.application.port.out.AppUserRepositoryPort;
import com.universidad.redes.domain.model.AppUser;
import com.universidad.redes.infrastructure.adapter.in.rest.dto.request.LoginRequest;
import com.universidad.redes.infrastructure.adapter.in.rest.dto.response.AuthSessionResponse;
import com.universidad.redes.infrastructure.adapter.in.rest.dto.response.CsrfTokenResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.logout.SecurityContextLogoutHandler;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final AppUserRepositoryPort userRepository;
    private final SecurityContextRepository securityContextRepository;

    public AuthController(
            AuthenticationManager authenticationManager,
            AppUserRepositoryPort userRepository,
            SecurityContextRepository securityContextRepository
    ) {
        this.authenticationManager = authenticationManager;
        this.userRepository = userRepository;
        this.securityContextRepository = securityContextRepository;
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
    public AuthSessionResponse login(
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

        SecurityContext securityContext = SecurityContextHolder.createEmptyContext();
        securityContext.setAuthentication(authentication);
        SecurityContextHolder.setContext(securityContext);

        request.getSession(true);
        request.changeSessionId();
        securityContextRepository.saveContext(securityContext, request, response);

        return buildSessionResponse(authentication.getName());
    }

    @GetMapping("/session")
    public AuthSessionResponse getSession(Authentication authentication) {
        return buildSessionResponse(authentication.getName());
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(
            HttpServletRequest request,
            HttpServletResponse response,
            Authentication authentication
    ) {
        new SecurityContextLogoutHandler().logout(request, response, authentication);
        return ResponseEntity.noContent().build();
    }

    private AuthSessionResponse buildSessionResponse(String email) {
        AppUser user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalStateException("La sesión no tiene un usuario válido"));

        return new AuthSessionResponse(
                user.id(),
                user.email(),
                user.displayName(),
                user.role().name()
        );
    }
}
