package com.node.notificationService.channel;

import com.google.firebase.messaging.FirebaseMessaging;
import com.google.firebase.messaging.Message;
import com.google.firebase.messaging.Notification;
import com.node.notificationService.events.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

@Component
@Slf4j
public class PushNotificationChannel implements NotificationChannel {

    @Async
    @Override
    public void send(NotificationEvent event, String userEmail, String fcmToken) {
        if (fcmToken == null || fcmToken.isBlank()) {
            return;
        }
        try {
            String[] payload = resolvePayload(event);
            Message message = Message.builder()
                    .setToken(fcmToken)
                    .setNotification(Notification.builder()
                            .setTitle(payload[0])
                            .setBody(payload[1])
                            .build())
                    .build();
            FirebaseMessaging.getInstance().send(message);
        } catch (Exception ex) {
            log.error("Failed to send push notification to token {}: {}", fcmToken, ex.getMessage());
        }
    }

    private String[] resolvePayload(NotificationEvent event) {
        if (event instanceof BookingConfirmedEvent e) {
            return new String[]{
                    "Booking Confirmed!",
                    "You're registered for " + e.getEventName() + " (" + e.getTicketQuantity() + " ticket(s))"
            };
        }
        if (event instanceof BookingPendingEvent e) {
            return new String[]{
                    "You're on the Waitlist",
                    "Position #" + e.getWaitlistPosition() + " for " + e.getEventName()
            };
        }
        if (event instanceof BookingCancelledEvent e) {
            return new String[]{
                    "Booking Cancelled",
                    "Your booking for " + e.getEventName() + " has been cancelled"
            };
        }
        if (event instanceof NewEventPublishedEvent e) {
            return new String[]{
                    "New Event: " + e.getEventName(),
                    "By " + e.getOrganizerName() + " at " + e.getLocationName()
            };
        }
        return new String[]{"Notification", "You have a new notification"};
    }
}
