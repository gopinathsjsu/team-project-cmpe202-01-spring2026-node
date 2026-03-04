package com.node.eventServices.model.events;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import lombok.Data;

import java.time.LocalDate;
import java.util.List;

@Entity
@Data
public class Events {

    @Id
    private Long eventId;

    private String eventName;

    private String eventDescription;

    private List<EventCategory> categories;

    private Long maxCapacity;

    private Long waitlistCapacity;

    private EventLocation eventLocation;

    private LocalDate eventStartDate;

    private LocalDate eventEndDate;

    private LocalDate createdAt;

    private LocalDate updatedAt;

    private LocalDate eventPublishDate;

    private Long eventOwnerId;

    private Long approverId;

    private String status;

}
