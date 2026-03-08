package com.node.eventServices.model.events;

import jakarta.persistence.*;
import lombok.Data;
import org.locationtech.jts.geom.Point;

@Entity
@Data
public class EventLocation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long locationId;

    private String locationName;

    private String locationAddress;

    @Column(columnDefinition = "geometry(Point,4326)")
    private Point location;
}
