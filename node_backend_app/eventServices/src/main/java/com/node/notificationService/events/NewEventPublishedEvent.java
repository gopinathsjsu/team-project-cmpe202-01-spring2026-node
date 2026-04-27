package com.node.notificationService.events;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NewEventPublishedEvent {
    private String eventId;
    private String eventName;
    private String eventStartInstant;
    private String eventTimeZone;
    private String locationName;
    private String category;
    private String ticketPrice;
    private String organizerName;
}
