package com.universidad.redes.infrastructure.security;

import com.universidad.redes.application.port.out.AppUserRepositoryPort;
import com.universidad.redes.domain.model.AppUser;
import com.universidad.redes.domain.model.UserRole;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class AdminUserInitializer implements ApplicationRunner {

    private static final Logger LOGGER = LoggerFactory.getLogger(AdminUserInitializer.class);

    private final AppUserRepositoryPort userRepository;
    private final PasswordEncoder passwordEncoder;
    private final String adminEmail;
    private final String adminName;
    private final String adminPassword;

    public AdminUserInitializer(
            AppUserRepositoryPort userRepository,
            PasswordEncoder passwordEncoder,
            @Value("${app.bootstrap-admin.email}") String adminEmail,
            @Value("${app.bootstrap-admin.name}") String adminName,
            @Value("${app.bootstrap-admin.password}") String adminPassword
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.adminEmail = adminEmail;
        this.adminName = adminName;
        this.adminPassword = adminPassword;
    }

    @Override
    public void run(ApplicationArguments arguments) {
        validateConfiguration();

        AppUser existingUser = userRepository.findByEmail(adminEmail).orElse(null);
        String passwordHash = existingUser != null
                && passwordEncoder.matches(adminPassword, existingUser.passwordHash())
                ? existingUser.passwordHash()
                : passwordEncoder.encode(adminPassword);

        AppUser adminUser = new AppUser(
                existingUser == null ? null : existingUser.id(),
                adminEmail,
                adminName,
                passwordHash,
                UserRole.ADMIN,
                true
        );

        userRepository.save(adminUser);
        LOGGER.info("Usuario administrador disponible para {}", adminUser.email());
    }

    private void validateConfiguration() {
        if (adminEmail == null || adminEmail.isBlank() || !adminEmail.contains("@")) {
            throw new IllegalStateException("APP_ADMIN_EMAIL debe contener un correo válido");
        }
        if (adminName == null || adminName.isBlank()) {
            throw new IllegalStateException("APP_ADMIN_NAME es obligatorio");
        }
        if (adminPassword == null || adminPassword.length() < 12) {
            throw new IllegalStateException(
                    "APP_ADMIN_PASSWORD es obligatoria y debe tener al menos 12 caracteres"
            );
        }
    }
}
