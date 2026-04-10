package com.example.booking_clinic.config;

import com.example.booking_clinic.security.JwtAuthenticationFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .cors(Customizer.withDefaults())
                .formLogin(AbstractHttpConfigurer::disable)
                .httpBasic(AbstractHttpConfigurer::disable)
                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                )
                // Sau này khi vào project sẽ sửa lại API thật 
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/api/v1/auth/**", "/api/v1/health").permitAll()
                        .requestMatchers("/api/v1/test/admin").hasRole("ADMIN")
                        .requestMatchers("/api/v1/test/doctor").hasRole("DOCTOR")
                        .requestMatchers("/api/v1/test/patient").hasRole("PATIENT")
                        // Specialty: GET public, POST/PATCH/DELETE chỉ ADMIN
                        .requestMatchers(HttpMethod.GET, "/api/v1/specialties", "/api/v1/specialties/**").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/v1/specialties").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PATCH, "/api/v1/specialties/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/api/v1/specialties/**").hasRole("ADMIN")


                        //Doctor : GET pulic , POST/PATCH/DELETE chỉ ADMIN
                        .requestMatchers(HttpMethod.GET, "/api/v1/doctors", "/api/v1/doctors/**").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/v1/doctors").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PATCH, "/api/v1/doctors/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/v1/doctors/**").hasRole("ADMIN")
                        // Chỉ ADMIN hoặc DOCTOR mới được tạo/sửa lịch làm việc
                        .requestMatchers(HttpMethod.POST, "/api/v1/doctors/*/schedules").hasAnyRole("ADMIN", "DOCTOR")
                        .anyRequest().authenticated()


                )

                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}               
