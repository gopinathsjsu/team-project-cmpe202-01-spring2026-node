package com.node.bookingService.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class UserBookingCountsDto {
    private long totalBookings;
    private long upcomingBookings;
}
