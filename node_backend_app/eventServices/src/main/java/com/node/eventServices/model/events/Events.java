package com.node.eventServices.model.events;

import jakarta.persistence.*;
import lombok.Data;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

@Entity
@Data
public class Events {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long eventId;

    private String eventName;

    private String eventDescription;

    @ManyToMany
    @JoinTable(
        name = "event_categories_mapping",
        joinColumns = @JoinColumn(name = "event_id"),
        inverseJoinColumns = @JoinColumn(name = "category_id")
    )
    private List<EventCategory> categories;

    private Long maxCapacity;

    private Long waitlistCapacity;

    @ManyToOne(cascade = CascadeType.ALL)
    @JoinColumn(name = "location_id")
    private EventLocation eventLocation;

    private String ticketPrice;

    private String imageUrl;

    // Keep legacy LocalDate fields for compatibility
    private LocalDate eventStartDate;

    private LocalDate eventEndDate;

    // Store absolute instants (UTC) for unambiguous scheduling
    private Instant eventStartInstant;

    private Instant eventEndInstant;

    private Instant eventPublishInstant;

    // Store the organizer's IANA timezone (e.g. "America/Los_Angeles") for display and calendar exports
    private String eventTimeZone;

    private LocalDate createdAt;

    private LocalDate updatedAt;

    private LocalDate eventPublishDate;

    private Long eventOwnerId;

    private Long approverId;

    @Enumerated(EnumType.STRING)
    private EventStatus status; // SUBMITTED, DRAFT, APPROVED, REJECTED, CANCELLED

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDate.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDate.now();

    }
}
