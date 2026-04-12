package com.node.eventServices.model.events;

import jakarta.persistence.*;
import lombok.Data;
import org.locationtech.jts.geom.Point;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;

@Entity
@Data
public class EventLocation {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String locationId;

    private String locationName;

    private String locationAddress;

    @Column(columnDefinition = "geometry(Point,4326)")
    @JsonIgnore // prevent Jackson from attempting to serialize the raw JTS Point
    private Point location;

    // Expose latitude/longitude as json properties for the frontend
    @JsonProperty("latitude")
    public Double getLatitude() {
        if (this.location == null) return null;
        return this.location.getY(); // JTS: y = latitude
    }

    @JsonProperty("longitude")
    public Double getLongitude() {
        if (this.location == null) return null;
        return this.location.getX(); // JTS: x = longitude
    }
}
