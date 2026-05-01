package com.node.discoveryService.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import org.locationtech.jts.geom.Point;


@Entity
public class EventLocation {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String locationId;

    private String locationName;
    private String locationAddress;

    /**
     * Spatial column written by the events-service. Read here for proximity
     * filtering; we never serialise the raw JTS Point — `latitude` and
     * `longitude` JSON properties are exposed instead.
     */
    @Column(columnDefinition = "geometry(Point,4326)")
    @JsonIgnore
    private Point location;

    public String getLocationId() {
        return locationId;
    }

    public String getLocationName() {
        return locationName;
    }

    public String getLocationAddress() {
        return locationAddress;
    }

    public Point getLocation() {
        return location;
    }

    public void setLocationId(String locationId) {
        this.locationId = locationId;
    }

    public void setLocationName(String locationName) {
        this.locationName = locationName;
    }

    public void setLocationAddress(String locationAddress) {
        this.locationAddress = locationAddress;
    }

    public void setLocation(Point location) {
        this.location = location;
    }

    @JsonProperty("latitude")
    public Double getLatitude() {
        if (this.location == null) return null;
        return this.location.getY();
    }

    @JsonProperty("longitude")
    public Double getLongitude() {
        if (this.location == null) return null;
        return this.location.getX();
    }
}
