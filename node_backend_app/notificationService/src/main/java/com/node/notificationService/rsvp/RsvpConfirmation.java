package com.node.notificationService.rsvp;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Entity
@Table(name = "rsvp_confirmation", indexes = {
        @Index(name = "idx_rsvp_event", columnList = "event_id")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RsvpConfirmation {

    @Id
    @Column(name = "booking_id", nullable = false, length = 64)
    private String bookingId;

    @Column(name = "event_id", nullable = false, length = 64)
    private String eventId;

    @Column(name = "user_email", nullable = false, length = 256)
    private String userEmail;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 16)
    private RsvpStatus status;

    @Column(name = "responded_at", nullable = false)
    private Instant respondedAt;
}
