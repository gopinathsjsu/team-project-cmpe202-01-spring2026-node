package com.node.eventServices.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class OrganizerEventSummaryDto {
    private long eventCount;
    private long ticketsSold;
    private BigDecimal totalRevenue;
    /** 0–100; tickets sold vs total capacity across organizer events */
    private int averageFillPercent;
}
