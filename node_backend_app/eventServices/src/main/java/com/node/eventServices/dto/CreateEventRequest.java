package com.node.eventServices.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Data
public class CreateEventRequest {

    @NotBlank(message = "Event name is required")
    private String eventName;
    private String eventDescription;

    private List<String> categories;

    @Positive(message = "Max capacity must be positive")
    private Long maxCapacity;
    private Long waitlistCapacity;
    private EventLocationDto eventLocation;

    private BigDecimal ticketPrice;

    private String imageUrl;
    // legacy date-only fields (optional)
    private LocalDate eventStartDate;
    private LocalDate eventEndDate;

    @NotNull(message = "Event start time is required")
    private Instant eventStartInstant;
    private Instant eventEndInstant;
    private Instant eventPublishInstant;

    // IANA timezone id supplied by client (e.g. "America/Los_Angeles"). Optional but recommended.
    private String eventTimeZone;

    @NotNull(message = "Event owner is required")
    private UUID eventOwnerId;
    private String status;
}
