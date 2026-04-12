package com.node.eventServices.model.events;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Entity
@Table(name = "event_updates")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EventUpdates {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String updateId;

    @Column(nullable = false)
    private String eventId;

    @Column(nullable = false)
    private String adminId;

    @Enumerated(EnumType.STRING)
    private EventStatus previousStatus;

    @Enumerated(EnumType.STRING)
    private EventStatus newStatus;

    private String comments;

    private Instant reviewDate;

    private Instant createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = Instant.now();
        if (reviewDate == null) {
            reviewDate = Instant.now();
        }
    }
}
