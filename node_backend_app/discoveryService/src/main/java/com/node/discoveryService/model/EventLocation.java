package com.node.discoveryService.model;

import jakarta.persistence.Id;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;


@Entity
public class EventLocation {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String locationId;
    
    private String locationName;
    private String locationAddress;


    public String getLocationName()
    {
        return locationName;
    }
    public String getLocationAddress()
    {
        return locationAddress;
    }
    

    public void setLocationName(String locationName)
    {
        this.locationName = locationName;
    }
    public void setLocationAddress(String locationAddress)
    {
        this.locationAddress = locationAddress;
    }
}
