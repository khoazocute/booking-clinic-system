package com.example.booking_clinic.security;

import com.example.booking_clinic.entity.User;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import io.jsonwebtoken.Claims;
import java.util.function.Function;

@Service
public class JwtService {

    /** Required: there is no default, so a deployment can never run with a secret published in the repo. */
    @Value("${app.jwt.secret}")
    private String secretKey;

    private static final java.util.Set<String> KNOWN_WEAK_SECRETS = java.util.Set.of(
            "12345678901234567890123456789012", "DayLaChuoiBiMatCuaHeThongBookingClinicRatDaiVaKhoDoan123!@#");

    @jakarta.annotation.PostConstruct
    void validateSecret() {
        if (secretKey == null || secretKey.getBytes(StandardCharsets.UTF_8).length < 32) {
            throw new IllegalStateException("JWT_SECRET must be at least 32 bytes (use: openssl rand -hex 32)");
        }
        if (KNOWN_WEAK_SECRETS.contains(secretKey)) {
            throw new IllegalStateException("JWT_SECRET is a value published in the repository; set a random one");
        }
    }

    @Value("${app.jwt.access-token-expiration:${JWT_ACCESS_TOKEN_EXPIRATION:900000}}")
    private long accessTokenExpiration;

    @Value("${app.jwt.refresh-token-expiration:${JWT_REFRESH_TOKEN_EXPIRATION:604800000}}")
    private long refreshTokenExpiration;

    private SecretKey getSigningKey() {
        return Keys.hmacShaKeyFor(secretKey.getBytes(StandardCharsets.UTF_8));
    }
// Tạo AccessToken
    public String generateAccessToken(User user) {
        return Jwts.builder()
                .subject(user.getEmail())
                .claim("role", user.getRole().getName())
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + accessTokenExpiration))
                .signWith(getSigningKey())
                .compact();
    }
// Tạo refreshToken
    public String generateRefreshToken(User user) {
        return Jwts.builder()
                .subject(user.getEmail())
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + refreshTokenExpiration))
                .signWith(getSigningKey())
                .compact();
    }
// Xác thực JWT
// Dùng để nhận diện token đó thuộc user nào
    public String extractEmail(String token) {
        return extractClaim(token, Claims::getSubject);
    }   
//Kiểm tra xem token còn hạn và đúng user hay không
    public boolean isTokenValid(String token, User user) {
        String email = extractEmail(token);
        return email.equals(user.getEmail()) && !isTokenExpired(token);
    }

    private boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }

    private Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    private <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    private Claims extractAllClaims(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public String extractRole(String token) {
        return extractClaim(token, claims -> claims.get("role", String.class));
    }

}
