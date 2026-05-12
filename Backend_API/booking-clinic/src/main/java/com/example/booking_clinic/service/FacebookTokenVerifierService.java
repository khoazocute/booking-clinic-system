package com.example.booking_clinic.service;

import com.example.booking_clinic.common.exception.OAuth2EmailRequiredException;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@Service
public class FacebookTokenVerifierService {

    private static final String GRAPH_API_URL =
            "https://graph.facebook.com/me?fields=id,name,email,picture.type(large)&access_token=";

    /**
     * Gọi Facebook Graph API để lấy thông tin user từ Access Token.
     * Ném OAuth2EmailRequiredException nếu tài khoản không có email (chưa liên kết/cấp quyền).
     */
    public FacebookUserInfo verify(String accessToken) {
        try {
            RestTemplate restTemplate = new RestTemplate();

            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                    GRAPH_API_URL + accessToken,
                    HttpMethod.GET,
                    null,
                    new ParameterizedTypeReference<Map<String, Object>>() {}
            );

            Map<String, Object> payload = response.getBody();

            if (payload == null || payload.containsKey("error")) {
                throw new IllegalArgumentException("Invalid Facebook Access Token");
            }

            // Facebook chỉ trả email nếu user đã verify email và cấp quyền "email"
            String email = (String) payload.get("email");
            if (email == null || email.isBlank()) {
                throw new OAuth2EmailRequiredException(
                        "Tài khoản Facebook của bạn chưa liên kết email. Vui lòng nhập email bổ sung để hoàn tất đăng nhập."
                );
            }

            String facebookId = (String) payload.get("id");
            String name = (String) payload.get("name");
            String picture = extractPictureUrl(payload);

            return new FacebookUserInfo(email, name, picture, facebookId);

        } catch (OAuth2EmailRequiredException e) {
            throw e;
        } catch (Exception e) {
            throw new IllegalArgumentException("Failed to verify Facebook Access Token: " + e.getMessage());
        }
    }

    private String extractPictureUrl(Map<String, Object> payload) {
        Object pictureObj = payload.get("picture");
        if (pictureObj instanceof Map<?, ?> pictureMap) {
            Object dataObj = pictureMap.get("data");
            if (dataObj instanceof Map<?, ?> dataMap) {
                Object urlObj = dataMap.get("url");
                if (urlObj instanceof String url) {
                    return url;
                }
            }
        }
        return null;
    }

    public record FacebookUserInfo(
            String email,
            String name,
            String picture,
            String facebookId
    ) {}
}
