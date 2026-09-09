package com.universidad.redes.infrastructure.security;

import com.universidad.redes.application.port.out.AppUserRepositoryPort;
import com.universidad.redes.domain.model.AppUser;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
public class DatabaseUserDetailsService implements UserDetailsService {

    private final AppUserRepositoryPort userRepository;

    public DatabaseUserDetailsService(AppUserRepositoryPort userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        AppUser user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("Usuario no encontrado"));

        return User.withUsername(user.email())
                .password(user.passwordHash())
                .roles(user.role().name())
                .disabled(!user.active())
                .build();
    }
}
