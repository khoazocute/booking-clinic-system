package com.example.booking_clinic.config;

import com.example.booking_clinic.entity.Role;
import com.example.booking_clinic.entity.User;
import com.example.booking_clinic.repository.RoleRepository;
import com.example.booking_clinic.repository.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;

@Slf4j
@Configuration
public class DataSeeder {

    static final int MIN_ADMIN_PASSWORD_LENGTH = 12;

    /**
     * Creates the roles, and the first admin on an empty database. The admin credentials come from
     * ADMIN_EMAIL / ADMIN_PASSWORD: there is no default account, because any password written in the
     * repository is public.
     */
    @Bean
    CommandLineRunner seedData(RoleRepository roleRepository, UserRepository userRepository, PasswordEncoder passwordEncoder,
                               @Value("${app.seed.admin-email:}") String adminEmail,
                               @Value("${app.seed.admin-password:}") String adminPassword) {
        return args -> {
            if (roleRepository.count() == 0) {
                roleRepository.saveAll(List.of(
                        Role.builder().id(1L).name("ADMIN").build(),
                        Role.builder().id(2L).name("DOCTOR").build(),
                        Role.builder().id(3L).name("PATIENT").build()
                ));
            }

            if (userRepository.count() > 0) {
                return;
            }
            if (adminEmail.isBlank() || adminPassword.isBlank()) {
                log.warn("Empty database and no ADMIN_EMAIL / ADMIN_PASSWORD set: no admin account was created");
                return;
            }
            if (adminPassword.length() < MIN_ADMIN_PASSWORD_LENGTH) {
                throw new IllegalStateException("ADMIN_PASSWORD must be at least " + MIN_ADMIN_PASSWORD_LENGTH + " characters");
            }

            Role adminRole = roleRepository.findByName("ADMIN")
                    .orElseThrow(() -> new IllegalStateException("Role ADMIN was not found"));

            userRepository.save(User.builder()
                    .role(adminRole)
                    .fullName("System Admin")
                    .email(adminEmail.trim().toLowerCase())
                    .phone("0900000000")
                    .password(passwordEncoder.encode(adminPassword))
                    .avatarUrl("")
                    .status("ACTIVE")
                    .build());
            log.info("Seeded the first admin account: {}", adminEmail);
        };
    }
}
