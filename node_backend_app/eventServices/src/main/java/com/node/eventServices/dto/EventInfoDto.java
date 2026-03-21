package com.node.eventServices.dto;


import com.node.eventServices.model.events.EventStatus;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

@Data
@Builder
public class EventInfoDto {

    private Long eventId; // UUID as String
    private String eventName;
    private String eventDescription;
    private List<String> categories; // category IDs
    private Long maxCapacity;
    private Long waitlistCapacity;
    private EventLocationDto eventLocation;
    private String ticketPrice;
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

    private Long eventOwnerId;
    private String eventOwnerName;
    private EventStatus status;
    private Long ticketsSold;
}
