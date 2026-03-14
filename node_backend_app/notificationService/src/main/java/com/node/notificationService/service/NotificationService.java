package com.node.notificationService.service;

import com.node.notificationService.service.NotificationServiceImpl.UserTokenProjection;

import java.util.List;

public interface NotificationService {
    void registerFcmToken(String userId, String userEmail, String fcmToken);
    String getFcmToken(String userId);
    List<UserTokenProjection> getAllUserTokens();
}
