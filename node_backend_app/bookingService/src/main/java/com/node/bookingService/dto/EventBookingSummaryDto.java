package com.node.bookingService.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class EventBookingSummaryDto {
    private long confirmedBookingCount;
    private int confirmedTicketQuantity;
    private BigDecimal confirmedRevenue;
    private long cancelledBookingCount;
}
