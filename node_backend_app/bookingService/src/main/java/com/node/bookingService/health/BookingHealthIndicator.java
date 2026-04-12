package com.node.bookingService.health;

import com.node.bookingService.repository.BookingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.actuate.health.Health;
import org.springframework.boot.actuate.health.HealthIndicator;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class BookingHealthIndicator implements HealthIndicator {

    private final BookingRepository bookingRepository;

    @Override
    public Health health() {
        try {
            long totalBookings = bookingRepository.count();
            return Health.up()
                    .withDetail("service", "bookingService")
                    .withDetail("totalBookings", totalBookings)
                    .build();
        } catch (Exception e) {
            return Health.down()
                    .withDetail("service", "bookingService")
                    .withException(e)
                    .build();
        }
    }
}
