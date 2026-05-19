package com.example.booking_clinic.service;

import com.example.booking_clinic.dto.user.UpdateProfileRequest;
import com.example.booking_clinic.dto.user.UserResponse;

import java.util.List;

public interface UserService {
    List<UserResponse> getAllUsers();
    void updateProfile(UpdateProfileRequest request);
}
