package com.node.notificationService.client;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;

import java.time.Instant;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class UpcomingEventDto {
    private String eventId;
    private String eventName;
    private Instant eventStartInstant;
    private String eventTimeZone;
    private EventLocation eventLocation;

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class EventLocation {
        private String locationName;
        private String locationAddress;
    }
}
