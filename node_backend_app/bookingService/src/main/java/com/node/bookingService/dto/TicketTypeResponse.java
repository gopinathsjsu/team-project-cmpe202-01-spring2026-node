package com.node.bookingService.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class TicketTypeResponse {
    private String id;
    private String eventId;
    private String ticketType;
    private String description;
    private BigDecimal price;
    private Integer totalQuantity;
    private Integer waitlistCapacity;
    private Integer soldQuantity;
    private Integer availableQuantity;
}
