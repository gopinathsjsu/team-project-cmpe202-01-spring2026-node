package com.node.notificationService.controller;

import com.node.notificationService.dto.FcmTokenRequest;
import com.node.notificationService.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @PostMapping("/fcm-token")
    public ResponseEntity<String> registerFcmToken(@RequestBody FcmTokenRequest request) {
        notificationService.registerFcmToken(request.getUserId(), request.getUserEmail(), request.getFcmToken());
        return ResponseEntity.ok("FCM token registered");
    }

    @DeleteMapping("/fcm-token/{userId}")
    public ResponseEntity<String> removeFcmToken(@PathVariable String userId) {
        notificationService.registerFcmToken(userId, "", "");
        return ResponseEntity.ok("FCM token removed");
    }
}
