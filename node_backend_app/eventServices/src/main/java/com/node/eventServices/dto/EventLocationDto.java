package com.node.eventServices.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class EventLocationDto {
    private String locationName;
    private String locationAddress;
    private Double latitude; // optional
    private Double longitude; // optional
}

