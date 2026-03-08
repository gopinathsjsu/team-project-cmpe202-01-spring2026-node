package com.node.eventServices.model.events;

import java.time.LocalDate;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import lombok.Data;

@Entity
@Data
public class EventUpdates {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long updateId;

    private String eventId;

    private String adminId;

    private String status;

    private String comments;

    private LocalDate reviewDate;

    private LocalDate createdAt;

}
