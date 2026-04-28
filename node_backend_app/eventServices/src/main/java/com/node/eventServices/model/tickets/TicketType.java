package com.node.eventServices.model.tickets;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Entity
@Table(name = "ticket_types")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TicketType {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false)
    private String eventId;

    @Column(nullable = false)
    private String ticketType;

    private String description;

    @Column(precision = 10, scale = 2, nullable = false)
    private BigDecimal price;

    @Column(nullable = false)
    private Integer totalQuantity;

    @Column(nullable = false)
    private Integer waitlistCapacity;

    @Column(nullable = false)
    @Builder.Default
    private Integer soldQuantity = 0;

    public Integer getAvailableQuantity() {
        return totalQuantity - soldQuantity;
    }

    public boolean hasAvailability(int requested) {
        return getAvailableQuantity() >= requested;
    }
}
