package com.universidad.redes.infrastructure.security;

import com.universidad.redes.application.port.out.AppUserRepositoryPort;
import com.universidad.redes.domain.model.AppUser;
import com.universidad.redes.domain.model.UserRole;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DatabaseUserDetailsServiceTest {

    @Mock
    private AppUserRepositoryPort userRepository;

    @Test
    void shouldLoadTheDatabaseUserWithItsRole() {
        AppUser admin = new AppUser(
                1,
                "admin@osidev.local",
                "Administrador OSI",
                "$2a$12$exampleHashOnlyForThisUnitTest000000000000000000000",
                UserRole.ADMIN,
                true
        );
        when(userRepository.findByEmail("admin@osidev.local"))
                .thenReturn(Optional.of(admin));

        UserDetails details = new DatabaseUserDetailsService(userRepository)
                .loadUserByUsername("admin@osidev.local");

        assertThat(details.getUsername()).isEqualTo(admin.email());
        assertThat(details.isEnabled()).isTrue();
        assertThat(details.getAuthorities())
                .extracting("authority")
                .containsExactly("ROLE_ADMIN");
    }
}
