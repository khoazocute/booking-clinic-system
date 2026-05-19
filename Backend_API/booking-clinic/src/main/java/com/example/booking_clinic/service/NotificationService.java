package com.example.booking_clinic.service;

import com.example.booking_clinic.dto.notification.NotificationResponse;
import com.example.booking_clinic.entity.User;

import java.util.List;

public interface NotificationService {
    List<NotificationResponse> getMyNotifications();

    NotificationResponse getNotificationById(Long id);

    NotificationResponse markAsRead(Long id);

    void markAllAsRead();

    void createNotification(User user, String title, String message, String type, String referenceType, Long referenceId);

    void createNotificationForAdmins(String title, String message, String type, String referenceType, Long referenceId);

    List<NotificationResponse> getAllNotifications();
}
