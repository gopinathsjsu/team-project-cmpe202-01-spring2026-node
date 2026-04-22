package com.node.eventServices.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class BookTicketRequest {
    @NotNull(message = "eventId is required")
    private String eventId;

    @NotNull(message = "userId is required")
    private String userId;

    @NotNull(message = "quantity is required")
    @Min(value = 1, message = "quantity must be at least 1")
    private Integer quantity;

    private String ticketType; // optional; defaults to "General" in service
}