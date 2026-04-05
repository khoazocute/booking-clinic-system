package com.example.booking_clinic.service.impl;

import com.example.booking_clinic.common.exception.ResourceNotFoundException;
import com.example.booking_clinic.dto.auth.LoginRequest;
import com.example.booking_clinic.dto.auth.LoginResponse;
import com.example.booking_clinic.dto.auth.RegisterRequest;
import com.example.booking_clinic.dto.auth.RegisterResponse;
import com.example.booking_clinic.entity.Role;
import com.example.booking_clinic.entity.User;
import com.example.booking_clinic.repository.RefreshTokenRepository;
import com.example.booking_clinic.repository.RoleRepository;
import com.example.booking_clinic.repository.UserRepository;
import com.example.booking_clinic.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.example.booking_clinic.entity.RefreshToken;
import com.example.booking_clinic.security.JwtService;
import java.time.LocalDateTime;
import com.example.booking_clinic.dto.auth.RefreshTokenRequest;
import com.example.booking_clinic.dto.auth.RefreshTokenResponse;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private static final String DEFAULT_ROLE = "PATIENT";
    private static final String DEFAULT_STATUS = "ACTIVE";

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    private final RefreshTokenRepository refreshTokenRepository;
    private final JwtService jwtService;

    @Override
    @Transactional //Mỏi phương thức đăng ký và đăng nhập sẽ được thực thi trong một transaction riêng biệt, 
    // đảm bảo tính toàn vẹn dữ liệu và rollback nếu có lỗi xảy ra trong quá trình thực thi.
    public RegisterResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new IllegalArgumentException("Email already in use: " + request.email());
        }

        Role patientRole = roleRepository.findByName(DEFAULT_ROLE)
                .orElseThrow(() -> new ResourceNotFoundException("Role PATIENT was not found"));

        User savedUser = userRepository.save(
                User.builder()
                        .role(patientRole)
                        .fullName(request.fullName())
                        .email(request.email())
                        .phone(request.phone())
                        .password(passwordEncoder.encode(request.password()))
                        .avatarUrl("default-avatar.png")
                        .status(DEFAULT_STATUS)
                        .build()
        );

        return new RegisterResponse(
                savedUser.getId(),
                savedUser.getFullName(),
                savedUser.getEmail(),
                savedUser.getPhone(),
                savedUser.getRole().getName(),
                savedUser.getStatus(),
                savedUser.getCreatedAt()
        );
    }

    @Override
    @Transactional//Đánh dấu phương thức login là read-only, 
    // cho biết rằng phương thức này chỉ thực hiện các thao tác đọc dữ liệu từ cơ sở dữ liệu mà không thực hiện bất kỳ thay đổi nào.
    public LoginResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new IllegalArgumentException("Invalid email or password"));

        if (!passwordEncoder.matches(request.password(), user.getPassword())) {
            throw new IllegalArgumentException("Invalid email or password");
        }

        if (!"ACTIVE".equalsIgnoreCase(user.getStatus())) {
            throw new IllegalStateException("Account is not active");
        }
        String accessToken = jwtService.generateAccessToken(user);
        String refreshTokenValue = jwtService.generateRefreshToken(user);

        RefreshToken refreshToken = RefreshToken.builder()
                .user(user)
                .refreshToken(refreshTokenValue)
                .expiredAt(LocalDateTime.now().plusDays(7))
                .revoked(false)
                .build();

        refreshTokenRepository.save(refreshToken);
        return new LoginResponse(
                accessToken,
                refreshTokenValue,
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                user.getPhone(),
                user.getRole().getName(),//Lấy tên role từ đối tượng Role của user
                user.getStatus()
        );
    }

    @Override
    @Transactional(readOnly = true)
    public RefreshTokenResponse refreshToken(RefreshTokenRequest request) {
        RefreshToken refreshToken = refreshTokenRepository.findByRefreshToken(request.refreshToken())
                .orElseThrow(() -> new IllegalArgumentException("Refresh token is invalid"));

        if (Boolean.TRUE.equals(refreshToken.getRevoked())) {
            throw new IllegalStateException("Refresh token has been revoked");
        }

        User user = refreshToken.getUser();

        if (!jwtService.isTokenValid(refreshToken.getRefreshToken(), user)) {
            throw new IllegalArgumentException("Refresh token is expired or invalid");
        }

        String newAccessToken = jwtService.generateAccessToken(user);

        return new RefreshTokenResponse(newAccessToken);
    }

}
