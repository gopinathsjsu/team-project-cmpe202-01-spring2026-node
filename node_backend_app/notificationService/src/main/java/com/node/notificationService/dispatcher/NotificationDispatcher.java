package com.node.notificationService.dispatcher;

import com.node.notificationService.channel.NotificationChannel;
import com.node.notificationService.events.NotificationEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class NotificationDispatcher {

    private final List<NotificationChannel> channels;

    public void dispatch(NotificationEvent event, String userEmail, String fcmToken) {
        log.info("Dispatching notification [{}] to {}", event.getClass().getSimpleName(), userEmail);
        channels.forEach(channel -> channel.send(event, userEmail, fcmToken));
    }
}
