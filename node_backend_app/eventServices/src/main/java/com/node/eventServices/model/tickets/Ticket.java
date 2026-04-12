package com.node.eventServices.model.tickets;

import com.node.eventServices.model.events.Events;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "tickets")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Ticket {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String ticketId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "event_id", nullable = false)
    private Events event;

    @Column(nullable = false)
    private String userId;

    @Column(nullable = false)
    private Integer quantity;

    @Column(nullable = false)
    private String status;

    private Instant bookingDate;

    private String ticketType;

    @Column(precision = 10, scale = 2)
    private BigDecimal totalPrice;

    @PrePersist
    protected void onCreate() {
        if (bookingDate == null) {
            bookingDate = Instant.now();
        }
    }
}
