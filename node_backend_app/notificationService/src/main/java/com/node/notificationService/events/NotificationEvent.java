package com.node.notificationService.events;

import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonTypeInfo;

@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, property = "type")
@JsonSubTypes({
    @JsonSubTypes.Type(value = BookingConfirmedEvent.class, name = "BOOKING_CONFIRMED"),
    @JsonSubTypes.Type(value = BookingPendingEvent.class,   name = "BOOKING_PENDING"),
    @JsonSubTypes.Type(value = BookingCancelledEvent.class, name = "BOOKING_CANCELLED"),
    @JsonSubTypes.Type(value = NewEventPublishedEvent.class, name = "NEW_EVENT_PUBLISHED")
})
public sealed interface NotificationEvent
    permits BookingConfirmedEvent, BookingPendingEvent, BookingCancelledEvent, NewEventPublishedEvent {
}
