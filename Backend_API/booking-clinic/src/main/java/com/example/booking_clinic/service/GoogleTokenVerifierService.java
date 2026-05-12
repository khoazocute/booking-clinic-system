package com.example.booking_clinic.service;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import java.util.Map;

@Service
public class GoogleTokenVerifierService {

    /**
     * Lấy thông tin user từ Google Access Token.
     *
     * @param accessToken Google Access Token string từ Frontend
     * @return GoogleUserInfo chứa email, name, picture, googleId
     * @throws IllegalArgumentException nếu token không hợp lệ
     */
    public GoogleUserInfo verify(String accessToken) {
        try {
            RestTemplate restTemplate = new RestTemplate();
            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(accessToken);
            HttpEntity<String> entity = new HttpEntity<>("", headers);

            ResponseEntity<Map> response = restTemplate.exchange(
                    "https://www.googleapis.com/oauth2/v3/userinfo",
                    HttpMethod.GET,
                    entity,
                    Map.class
            );

            Map<String, Object> payload = response.getBody();

            if (payload == null || !payload.containsKey("email")) {
                throw new IllegalArgumentException("Invalid Google Access Token");
            }

            String email = (String) payload.get("email");
            Boolean emailVerified = (Boolean) payload.get("email_verified");

            if (!Boolean.TRUE.equals(emailVerified)) {
                throw new IllegalArgumentException("Google email is not verified");
            }

            String name = (String) payload.get("name");
            String picture = (String) payload.get("picture");
            String googleId = (String) payload.get("sub"); // Google unique user ID

            return new GoogleUserInfo(email, name, picture, googleId);

        } catch (Exception e) {
            throw new IllegalArgumentException("Failed to verify Google Access Token: " + e.getMessage());
        }
    }

    /**
     * Record chứa thông tin user từ Google ID Token.
     */
    public record GoogleUserInfo(
            String email,
            String name,
            String picture,
            String googleId
    ) {}
}
