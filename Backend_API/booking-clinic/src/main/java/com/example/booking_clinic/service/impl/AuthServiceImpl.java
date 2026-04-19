package com.example.booking_clinic.service.impl;

import com.example.booking_clinic.common.exception.ResourceNotFoundException;
import com.example.booking_clinic.dto.auth.LoginRequest;
import com.example.booking_clinic.dto.auth.LoginResponse;
import com.example.booking_clinic.dto.auth.LogoutRequest;
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

import java.security.Security;
import java.time.LocalDateTime;
import com.example.booking_clinic.dto.auth.RefreshTokenRequest;
import com.example.booking_clinic.dto.auth.RefreshTokenResponse;
import com.example.booking_clinic.dto.auth.CurrentUserResponse;
import com.example.booking_clinic.dto.auth.ChangePasswordRequest;
import com.example.booking_clinic.dto.auth.ForgotPasswordRequest;
import com.example.booking_clinic.dto.auth.ResetPasswordRequest;
import com.example.booking_clinic.service.EmailService;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import java.util.Random;
import java.time.temporal.ChronoUnit;


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
    private final EmailService emailService;

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

    @Override
    @Transactional
    // Dữ liệu đầu vào là LogoutRequest , req chứa refreshToken
    // Nối reponsitory truy xuất database
    // Service dùng DTO và service gọi repository
    public void logout(LogoutRequest request) {
        RefreshToken refreshToken = refreshTokenRepository.findByRefreshToken(request.refreshToken())
                .orElseThrow(() -> new IllegalArgumentException("Refresh token is invalid"));

        refreshToken.setRevoked(true); // chỉnh revoked giá trị true để thu hồi token
        refreshTokenRepository.save(refreshToken);// Lưu vào DB
    }

    @Override
    @Transactional(readOnly = true)
    public CurrentUserResponse getCurrentUser() {
// lấy thông tin xác thực hiện tại từ Spring Security
// SecurityContextHolder là nơi Spring lưu thông tin user của request hiện tại
//Tức là backend đang kiểm tra request này đang được xác thực bởi ai
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        User principal = (User) authentication.getPrincipal();
//principal chính là user là JWT xác thực trước đó 
// Đoạn này dùng để biết chính xác user đang đăng nhập và tìm đúng user đó trong DB
        User user = userRepository.findByEmail(principal.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
//map entity User sang DTO để trả về client
        return new CurrentUserResponse(
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                user.getPhone(),
                user.getRole().getName(),
                user.getStatus()
        );
    }

    @Override
    @Transactional
    public void changePassword(ChangePasswordRequest request) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        User principal = (User) authentication.getPrincipal();

        User user = userRepository.findByEmail(principal.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if (!passwordEncoder.matches(request.oldPassword(), user.getPassword())) {
            throw new IllegalArgumentException("Incorrect old password");
        }

        if ("DOCTOR".equalsIgnoreCase(user.getRole().getName())) {
            String strongPasswordRegex = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$";
            if (!request.newPassword().matches(strongPasswordRegex)) {
                throw new IllegalArgumentException("Doctor password must be strong (at least 8 characters, including upper case, lower case, number and special character)");
            }
        }

        user.setPassword(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);

        refreshTokenRepository.deleteByUserId(user.getId());
    }

    @Override
    @Transactional
    public void forgotPassword(ForgotPasswordRequest request) {
        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new IllegalArgumentException("User with this email not found"));

        if (user.getLastOtpRequestTime() != null && ChronoUnit.MINUTES.between(user.getLastOtpRequestTime(), LocalDateTime.now()) < 1) {
            throw new IllegalStateException("You are requesting OTP too fast, please try again after 1 minute");
        }

        String otp = String.format("%06d", new Random().nextInt(999999));
        user.setResetPasswordOtp(otp);
        user.setOtpExpirationTime(LocalDateTime.now().plusMinutes(15));
        user.setOtpFailedAttempts(0);
        user.setLastOtpRequestTime(LocalDateTime.now());

        userRepository.save(user);

        emailService.sendOtpEmail(user.getEmail(), otp);
    }

    @Override
    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new IllegalArgumentException("User with this email not found"));

        if (user.getOtpFailedAttempts() != null && user.getOtpFailedAttempts() >= 5) {
            user.setResetPasswordOtp(null);
            userRepository.save(user);
            throw new IllegalStateException("Maximum OTP attempt limit reached. Please request a new OTP.");
        }

        if (user.getResetPasswordOtp() == null || !user.getResetPasswordOtp().equals(request.otpCode()) || 
            user.getOtpExpirationTime() == null || user.getOtpExpirationTime().isBefore(LocalDateTime.now())) {
            
            user.setOtpFailedAttempts(user.getOtpFailedAttempts() == null ? 1 : user.getOtpFailedAttempts() + 1);
            userRepository.save(user);
            throw new IllegalArgumentException("Invalid or expired OTP");
        }

        if ("DOCTOR".equalsIgnoreCase(user.getRole().getName())) {
            String strongPasswordRegex = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$";
            if (!request.newPassword().matches(strongPasswordRegex)) {
                throw new IllegalArgumentException("Doctor password must be strong (at least 8 characters, including upper case, lower case, number and special character)");
            }
        }

        user.setPassword(passwordEncoder.encode(request.newPassword()));
        user.setResetPasswordOtp(null);
        user.setOtpExpirationTime(null);
        user.setLastOtpRequestTime(null);
        user.setOtpFailedAttempts(0);
        userRepository.save(user);

        refreshTokenRepository.deleteByUserId(user.getId());
    }

}
