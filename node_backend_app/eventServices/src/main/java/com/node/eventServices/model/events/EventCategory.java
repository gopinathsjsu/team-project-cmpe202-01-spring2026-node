package com.node.eventServices.model.events;

import java.time.LocalDate;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import lombok.Data;

@Entity
@Data
public class EventCategory {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String categoryId;

    private String categoryName;

    private String categoryDescription;

    private String categoryImage;

    private LocalDate createdAt;

    private LocalDate updatedAt;

}
