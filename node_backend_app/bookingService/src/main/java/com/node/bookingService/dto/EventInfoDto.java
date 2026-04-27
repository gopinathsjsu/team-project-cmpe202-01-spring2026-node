package com.node.bookingService.dto;

import com.node.bookingService.dto.EventLocationDto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Data
@Builder
public class EventInfoDto {

    private String eventId;
    private String eventName;
    private String eventDescription;
    private List<String> categories;
    private Long maxCapacity;
    private Long waitlistCapacity;
    private EventLocationDto eventLocation;
    private BigDecimal ticketPrice;
    private String imageUrl;
    // legacy date-only fields (optional)
    //private LocalDate eventStartDate;
    //private LocalDate eventEndDate;

    // New: accept absolute instants (ISO-8601 with offset/Z) from frontend
    // Example: "2026-01-15T10:00:00Z"
    private Instant eventStartInstant;
    private Instant eventEndInstant;
    private Instant eventPublishInstant;

    // IANA timezone id supplied by client (e.g. "America/Los_Angeles"). Optional but recommended.
    private String eventTimeZone;

    private UUID eventOwnerId;
    private String eventOwnerName;
    //private EventStatus status;
    private List<String> allowedTransitions;
    private Long ticketsSold;
    private String eventContactEmail;
    private String eventContactPhone;
}
