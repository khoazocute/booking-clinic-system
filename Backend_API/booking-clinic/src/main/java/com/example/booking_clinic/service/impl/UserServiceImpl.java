package com.example.booking_clinic.service.impl;

import com.example.booking_clinic.dto.user.UpdateProfileRequest;
import com.example.booking_clinic.entity.User;
import com.example.booking_clinic.repository.UserRepository;
import com.example.booking_clinic.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;

    @Override
    @Transactional
    public void updateProfile(UpdateProfileRequest request) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        User principal = (User) authentication.getPrincipal();

        User user = userRepository.findByEmail(principal.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if (request.fullName() != null && !request.fullName().isBlank()) {
            user.setFullName(request.fullName());
        }
        if (request.phone() != null && !request.phone().isBlank()) {
            user.setPhone(request.phone());
        }
        if (request.avatarUrl() != null && !request.avatarUrl().isBlank()) {
            user.setAvatarUrl(request.avatarUrl());
        }

        userRepository.save(user);
    }
}
