package com.example.booking_clinic.config;

import com.example.booking_clinic.entity.Role;
import com.example.booking_clinic.entity.User;
import com.example.booking_clinic.repository.RoleRepository;
import com.example.booking_clinic.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;

@Configuration
public class DataSeeder {

    @Bean
    CommandLineRunner seedData(RoleRepository roleRepository, UserRepository userRepository, PasswordEncoder passwordEncoder) {
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

            Role adminRole = roleRepository.findByName("ADMIN")
                    .orElseThrow(() -> new IllegalStateException("Role ADMIN was not found"));

            userRepository.save(User.builder()
                    .role(adminRole)
                    .fullName("System Admin")
                    .email("admin@bookingclinic.local")
                    .phone("0900000000")
                    .password(passwordEncoder.encode("admin123"))
                    .avatarUrl("")
                    .status("ACTIVE")
                    .build());
        };
    }
}
