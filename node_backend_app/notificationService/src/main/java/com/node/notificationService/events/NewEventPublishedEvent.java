package com.node.notificationService.events;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public final class NewEventPublishedEvent implements NotificationEvent {
    private String eventId;
    private String eventName;
    private String eventStartInstant;
    private String eventTimeZone;
    private String locationName;
    private String category;
    private String ticketPrice;
    private String organizerName;
}
