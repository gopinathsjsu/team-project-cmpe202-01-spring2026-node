package com.node.eventServices.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class EventAdminMetricsDto {
    private long totalEvents;
    private long publishedEvents;
    private long submittedEvents;
    private BigDecimal platformRevenue;
    private long ticketsSold;
}
