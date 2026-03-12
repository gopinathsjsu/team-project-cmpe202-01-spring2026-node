package com.node.eventServices.dto;

import lombok.Data;

@Data
public class EventLocationDto {
    private String locationName;
    private String locationAddress;
    private Double latitude; // optional
    private Double longitude; // optional
}

