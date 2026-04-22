package com.node.bookingService.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class BookingAdminMetricsDto {
    private long totalBookingsNonCancelled;
    private long confirmedBookings;
}
