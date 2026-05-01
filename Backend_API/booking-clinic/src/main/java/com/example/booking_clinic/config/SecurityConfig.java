package com.example.booking_clinic.config;

import com.example.booking_clinic.security.JwtAuthenticationFilter;

import jakarta.servlet.http.HttpServletResponse;
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
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
@Configuration
@RequiredArgsConstructor
@EnableMethodSecurity
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
                .exceptionHandling(ex -> ex
                .authenticationEntryPoint((request, response, authException) -> {
                        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                        response.setContentType("application/json");
                        response.getWriter().write("""
                        {"success":false,"message":"Unauthorized","data":null}
                        """);
                })
                .accessDeniedHandler((request, response, accessDeniedException) -> {
                        response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                        response.setContentType("application/json");
                        response.getWriter().write("""
                        {"success":false,"message":"Forbidden","data":null}
                        """);
                })
                )
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

                        // Doctor: GET public, POST/PATCH/PUT chỉ ADMIN
                        .requestMatchers(HttpMethod.GET, "/api/v1/doctors", "/api/v1/doctors/**").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/v1/doctors").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PATCH, "/api/v1/doctors/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/v1/doctors/**").hasRole("ADMIN")

                        // DoctorSchedule: GET public, POST/PATCH/PUT/DELETE chỉ ADMIN hoặc DOCTOR
                        .requestMatchers(HttpMethod.GET, "/api/v1/doctor-schedules", "/api/v1/doctor-schedules/**").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/v1/doctor-schedules").hasAnyRole("ADMIN", "DOCTOR")
                        .requestMatchers(HttpMethod.PATCH, "/api/v1/doctor-schedules/**").hasAnyRole("ADMIN", "DOCTOR")
                        .requestMatchers(HttpMethod.PUT, "/api/v1/doctor-schedules/**").hasAnyRole("ADMIN", "DOCTOR")
                        .requestMatchers(HttpMethod.DELETE, "/api/v1/doctor-schedules/**").hasAnyRole("ADMIN", "DOCTOR")

                        // Patient profile: chỉ PATIENT
                        .requestMatchers(HttpMethod.GET, "/api/v1/patients/me").hasRole("PATIENT")
                        .requestMatchers(HttpMethod.PATCH, "/api/v1/patients/me").hasRole("PATIENT")

                        // Appointment: PATIENT đặt lịch, xem lịch của mình (/me), huỷ lịch
                        .requestMatchers(HttpMethod.POST, "/api/v1/appointments").hasRole("PATIENT")
                        .requestMatchers(HttpMethod.GET, "/api/v1/appointments/me").hasRole("PATIENT")
                        .requestMatchers(HttpMethod.DELETE, "/api/v1/appointments/**").hasRole("PATIENT")
                        // DOCTOR/ADMIN xem lịch theo bác sĩ, cập nhật trạng thái
                        .requestMatchers(HttpMethod.GET, "/api/v1/appointments/doctor/**").hasAnyRole("DOCTOR", "ADMIN")
                        .requestMatchers(HttpMethod.PATCH, "/api/v1/appointments/**").hasAnyRole("DOCTOR", "ADMIN")
                        // ADMIN xem tất cả
                        .requestMatchers(HttpMethod.GET, "/api/v1/appointments").hasRole("ADMIN")
                        // Xem chi tiết 1 lịch hẹn (patient/doctor/admin)
                        .requestMatchers(HttpMethod.GET, "/api/v1/appointments/**").hasAnyRole("PATIENT", "DOCTOR", "ADMIN")

                        // Medical Record: DOCTOR tạo/cập nhật, DOCTOR/PATIENT/ADMIN xem
                        .requestMatchers(HttpMethod.POST, "/api/v1/medical-records").hasRole("DOCTOR")
                        .requestMatchers(HttpMethod.GET, "/api/v1/medical-records/**").hasAnyRole("DOCTOR", "PATIENT", "ADMIN")
                        .requestMatchers(HttpMethod.PATCH, "/api/v1/medical-records/**").hasRole("DOCTOR")
                        // Prescription: DOCTOR tạo đơn thuốc, GET cho DOCTOR/PATIENT/ADMIN, PATCH cho DOCTOR
                        .requestMatchers(HttpMethod.POST, "/api/v1/prescriptions").hasRole("DOCTOR")
                        .requestMatchers(HttpMethod.GET, "/api/v1/prescriptions/**").hasAnyRole("DOCTOR", "PATIENT", "ADMIN")
                        .requestMatchers(HttpMethod.PATCH, "/api/v1/prescriptions/**").hasRole("DOCTOR")
                        .requestMatchers(HttpMethod.GET, "/api/v1/medicines", "/api/v1/medicines/**").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/v1/medicines").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PATCH, "/api/v1/medicines/**").hasRole("ADMIN")
                        // Payment
                        .requestMatchers(HttpMethod.POST, "/api/v1/payments").hasAnyRole("PATIENT", "ADMIN")
                        .requestMatchers(HttpMethod.GET, "/api/v1/payments/**").hasAnyRole("PATIENT", "DOCTOR", "ADMIN")
                        .requestMatchers(HttpMethod.PATCH, "/api/v1/payments/**").hasRole("ADMIN")
                        
                        .anyRequest().authenticated()
                )
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
