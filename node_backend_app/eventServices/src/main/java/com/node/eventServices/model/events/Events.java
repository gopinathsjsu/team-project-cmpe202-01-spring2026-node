package com.node.eventServices.model.events;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

@Entity
@Table(name = "events")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Events {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long eventId;

    @NotBlank(message = "Event name is required")
    private String eventName;

    private String eventDescription;

    @ManyToMany
    @JoinTable(
        name = "event_categories_mapping",
        joinColumns = @JoinColumn(name = "event_id"),
        inverseJoinColumns = @JoinColumn(name = "category_id")
    )
    private List<EventCategory> categories;

    @Positive(message = "Max capacity must be positive")
    private Long maxCapacity;

    private Long waitlistCapacity;

    @ManyToOne(cascade = CascadeType.ALL)
    @JoinColumn(name = "location_id")
    private EventLocation eventLocation;

    @Column(precision = 10, scale = 2)
    private BigDecimal ticketPrice;

    private String imageUrl;

    private LocalDate eventStartDate;

    private LocalDate eventEndDate;

    @NotNull(message = "Event start time is required")
    private Instant eventStartInstant;

    private Instant eventEndInstant;

    private Instant eventPublishInstant;

    private String eventTimeZone;

    private LocalDate createdAt;

    private LocalDate updatedAt;

    private LocalDate eventPublishDate;

    @NotNull(message = "Event owner is required")
    private Long eventOwnerId;

    private Long approverId;

    @Enumerated(EnumType.STRING)
    @NotNull
    @Builder.Default
    private EventStatus status = EventStatus.DRAFT;

    public void transitionTo(EventStatus newStatus) {
        this.status = this.status.transitionTo(newStatus);
    }
    /*
    public void setStatus(String newStatus) {
        this.status.changeStatus(newStatus);
    }

    public String getStatus() {
        return this.status.getCurrentStatus();
    }*/

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDate.now();
        if (status == null) {
            status = EventStatus.DRAFT;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDate.now();
    }
}
