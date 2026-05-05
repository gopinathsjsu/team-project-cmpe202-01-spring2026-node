package com.node.notificationService.controller;

import com.node.notificationService.dto.FcmTokenRequest;
import com.node.notificationService.scheduler.ReminderScheduler;
import com.node.notificationService.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;
    private final ReminderScheduler reminderScheduler;

    @PostMapping("/reminders/run")
    public ResponseEntity<Map<String, Object>> runReminders() {
        log.info("POST /reminders/run — triggering reminder job manually");
        int sent = reminderScheduler.runReminderJob();
        return ResponseEntity.ok(Map.of("remindersSent", sent));
    }

    @PostMapping("/fcm-token")
    public ResponseEntity<String> registerFcmToken(@RequestBody FcmTokenRequest request) {
        log.debug("POST /fcm-token received: userId={}, email={}", request.getUserId(), request.getUserEmail());
        notificationService.registerFcmToken(request.getUserId(), request.getUserEmail(), request.getFcmToken());
        return ResponseEntity.ok("FCM token registered");
    }

    @DeleteMapping("/fcm-token/{userId}")
    public ResponseEntity<String> removeFcmToken(@PathVariable String userId) {
        log.info("DELETE /fcm-token: clearing token for userId={}", userId);
        notificationService.registerFcmToken(userId, "", "");
        return ResponseEntity.ok("FCM token removed");
    }
}
