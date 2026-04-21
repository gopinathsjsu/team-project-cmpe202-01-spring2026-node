package com.node.eventServices.health;

import com.node.eventServices.repository.EventRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.actuate.health.Health;
import org.springframework.boot.actuate.health.HealthIndicator;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class EventHealthIndicator implements HealthIndicator {

    private final EventRepository eventRepository;

    @Override
    public Health health() {
        try {
            long totalEvents = eventRepository.count();
            return Health.up()
                    .withDetail("service", "eventServices")
                    .withDetail("totalEvents", totalEvents)
                    .build();
        } catch (Exception e) {
            return Health.down()
                    .withDetail("service", "eventServices")
                    .withException(e)
                    .build();
        }
    }
}
