package com.universidad.redes.infrastructure.adapter.in.rest;

import com.universidad.redes.application.port.out.AppUserRepositoryPort;
import com.universidad.redes.application.port.out.facial.FacialIdentityPort;
import com.universidad.redes.domain.exception.FacialVerificationFailedException;
import com.universidad.redes.domain.model.AppUser;
import com.universidad.redes.domain.model.UserRole;
import com.universidad.redes.domain.model.facial.FacialVerification;
import com.universidad.redes.infrastructure.adapter.in.rest.dto.request.LoginRequest;
import com.universidad.redes.infrastructure.adapter.in.rest.dto.response.FaceVerificationResponse;
import com.universidad.redes.infrastructure.adapter.in.rest.dto.response.PasswordLoginResponse;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.context.SecurityContextRepository;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthControllerTest {

    @Mock
    private AuthenticationManager authenticationManager;

    @Mock
    private AppUserRepositoryPort userRepository;

    @Mock
    private SecurityContextRepository securityContextRepository;

    @Mock
    private FacialIdentityPort facialIdentityPort;

    @Mock
    private UserDetailsService userDetailsService;

    private AuthController controller;
    private MockHttpServletRequest request;
    private MockHttpServletResponse response;

    @BeforeEach
    void setUp() {
        controller = new AuthController(
                authenticationManager,
                userRepository,
                securityContextRepository,
                facialIdentityPort,
                userDetailsService,
                300,
                true
        );
        request = new MockHttpServletRequest();
        response = new MockHttpServletResponse();

        Authentication authentication = UsernamePasswordAuthenticationToken.authenticated(
                "admin@osidev.local",
                null,
                List.of(new SimpleGrantedAuthority("ROLE_ADMIN"))
        );
        when(authenticationManager.authenticate(any())).thenReturn(authentication);
        when(userRepository.findByEmail("admin@osidev.local")).thenReturn(Optional.of(user()));
    }

    @AfterEach
    void cleanSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void shouldCompletePasswordLoginWhenUserHasNoFaceTemplate() {
        when(facialIdentityPort.isEnrolled("user-1")).thenReturn(false);

        PasswordLoginResponse result = controller.login(credentials(), request, response);

        assertEquals("AUTHENTICATED", result.status());
        assertNotNull(result.user());
        assertEquals("admin@osidev.local", result.user().email());
        verify(securityContextRepository).saveContext(any(), any(), any());
    }

    @Test
    void shouldRequireFaceAndOnlyCreateAuthenticatedSessionAfterMatch() {
        when(facialIdentityPort.isEnrolled("user-1")).thenReturn(true);

        PasswordLoginResponse passwordResult = controller.login(credentials(), request, response);

        assertEquals("FACE_REQUIRED", passwordResult.status());
        assertNull(passwordResult.user());
        verify(securityContextRepository, never()).saveContext(any(), any(), any());

        when(facialIdentityPort.verify("user-1")).thenReturn(
                new FacialVerification(true, 0.72, true, "ok")
        );
        when(userDetailsService.loadUserByUsername("admin@osidev.local")).thenReturn(
                User.withUsername("admin@osidev.local")
                        .password("unused")
                        .roles("ADMIN")
                        .build()
        );

        FaceVerificationResponse faceResult = controller.verifyFace(request, response);

        assertEquals("admin@osidev.local", faceResult.user().email());
        assertEquals(true, faceResult.livenessVerified());
        verify(securityContextRepository).saveContext(any(), any(), any());
    }

    @Test
    void shouldRejectMismatchWithoutAuthenticatingSession() {
        when(facialIdentityPort.isEnrolled("user-1")).thenReturn(true);
        controller.login(credentials(), request, response);
        when(facialIdentityPort.verify("user-1")).thenReturn(
                new FacialVerification(false, 0.10, true, "no coincide")
        );

        assertThrows(
                FacialVerificationFailedException.class,
                () -> controller.verifyFace(request, response)
        );
        verify(securityContextRepository, never()).saveContext(any(), any(), any());
    }

    private LoginRequest credentials() {
        return new LoginRequest("admin@osidev.local", "correct-password");
    }

    private AppUser user() {
        return new AppUser(
                1,
                "admin@osidev.local",
                "Administrador OSI",
                "$2a$12$hash",
                UserRole.ADMIN,
                true
        );
    }
}
