package com.universidad.redes.infrastructure.security;

import com.universidad.redes.application.port.out.AppUserRepositoryPort;
import com.universidad.redes.domain.model.AppUser;
import com.universidad.redes.domain.model.UserRole;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.boot.ApplicationArguments;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AdminUserInitializerTest {

    @Mock
    private AppUserRepositoryPort userRepository;

    @Mock
    private ApplicationArguments applicationArguments;

    @Test
    void shouldCreateAnActiveAdminWithABcryptPassword() {
        PasswordEncoder passwordEncoder = new BCryptPasswordEncoder(4);
        String plainPassword = "SecurePassword123!";
        when(userRepository.findByEmail("admin@osidev.local")).thenReturn(Optional.empty());
        when(userRepository.save(any(AppUser.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        AdminUserInitializer initializer = new AdminUserInitializer(
                userRepository,
                passwordEncoder,
                "admin@osidev.local",
                "Administrador OSI",
                plainPassword
        );

        initializer.run(applicationArguments);

        ArgumentCaptor<AppUser> userCaptor = ArgumentCaptor.forClass(AppUser.class);
        verify(userRepository).save(userCaptor.capture());
        AppUser savedUser = userCaptor.getValue();

        assertThat(savedUser.email()).isEqualTo("admin@osidev.local");
        assertThat(savedUser.displayName()).isEqualTo("Administrador OSI");
        assertThat(savedUser.role()).isEqualTo(UserRole.ADMIN);
        assertThat(savedUser.active()).isTrue();
        assertThat(savedUser.passwordHash()).isNotEqualTo(plainPassword);
        assertThat(passwordEncoder.matches(plainPassword, savedUser.passwordHash())).isTrue();
    }
}
