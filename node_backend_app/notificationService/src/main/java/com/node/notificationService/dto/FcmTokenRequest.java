package com.node.notificationService.dto;

import lombok.Data;

@Data
public class FcmTokenRequest {
    private String userId;
    private String userEmail;
    private String fcmToken;
}
