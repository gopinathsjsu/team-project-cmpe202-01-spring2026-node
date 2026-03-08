package com.node.eventServices.model.events;

import jakarta.persistence.*;
import lombok.Data;

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

    private LocalDate eventStartDate;

    private LocalDate eventEndDate;

    private LocalDate createdAt;

    private LocalDate updatedAt;

    private LocalDate eventPublishDate;

    private Long eventOwnerId;

    private Long approverId;

    private String status; // PENDING, APPROVED, REJECTED, CANCELLED

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDate.now();
        if (status == null) {
            status = "PENDING";
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDate.now();
    }
}
