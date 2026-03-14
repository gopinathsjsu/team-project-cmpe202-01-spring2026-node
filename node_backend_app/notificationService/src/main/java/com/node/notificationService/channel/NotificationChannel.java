package com.node.notificationService.channel;

import com.node.notificationService.events.NotificationEvent;

public interface NotificationChannel {
    void send(NotificationEvent event, String userEmail, String fcmToken);
}
