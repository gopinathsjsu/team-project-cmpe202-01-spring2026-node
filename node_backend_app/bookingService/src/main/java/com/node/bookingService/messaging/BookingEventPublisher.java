package com.node.bookingService.messaging;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class BookingEventPublisher {

    public static final String TOPIC = "booking.events";

    private final KafkaTemplate<String, Object> kafkaTemplate;

    public void publish(String key, Object event) {
        try {
            kafkaTemplate.send(TOPIC, key, event);
            log.info("Published {} to {} (key={})", event.getClass().getSimpleName(), TOPIC, key);
        } catch (Exception e) {
            log.error("Failed to publish {} to {}: {}", event.getClass().getSimpleName(), TOPIC, e.getMessage(), e);
        }
    }
}
