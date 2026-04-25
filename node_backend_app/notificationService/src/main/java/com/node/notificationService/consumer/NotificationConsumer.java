package com.node.notificationService.consumer;

import com.node.notificationService.dispatcher.NotificationDispatcher;
import com.node.notificationService.events.*;
import com.node.notificationService.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class NotificationConsumer {

    private final NotificationDispatcher dispatcher;
    private final NotificationService notificationService;

    @KafkaListener(topics = "booking.events", groupId = "notification-service")
    public void handleBookingEvent(NotificationEvent event) {
        log.info("Received booking event: {}", event.getClass().getSimpleName());
        String userEmail = resolveEmail(event);
        String fcmToken = notificationService.getFcmToken(resolveUserId(event));
        dispatcher.dispatch(event, userEmail, fcmToken);
    }

    @KafkaListener(topics = "event.events", groupId = "notification-service")
    public void handleEventEvent(NotificationEvent event) {
        log.info("Received event.events message: {}", event.getClass().getSimpleName());
        if (event instanceof NewEventPublishedEvent e) {
            notificationService.getAllUserTokens().forEach(userToken ->
                dispatcher.dispatch(e, userToken.userEmail(), userToken.fcmToken())
            );
        }
    }

    private String resolveEmail(NotificationEvent event) {
        if (event instanceof BookingConfirmedEvent e) {
            return e.getUserEmail();
        }
        if (event instanceof BookingPendingEvent e) {
            return e.getUserEmail();
        }
        if (event instanceof BookingCancelledEvent e) {
            return e.getUserEmail();
        }
        return "";
    }

    private String resolveUserId(NotificationEvent event) {
        if (event instanceof BookingConfirmedEvent e) {
            return e.getUserId();
        }
        if (event instanceof BookingPendingEvent e) {
            return e.getUserId();
        }
        if (event instanceof BookingCancelledEvent e) {
            return e.getUserId();
        }
        return "";
    }
}
