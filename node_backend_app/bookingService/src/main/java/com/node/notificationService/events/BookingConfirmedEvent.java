package com.node.notificationService.events;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BookingConfirmedEvent {
    private String bookingId;
    private String eventId;
    private String userId;
    private String userEmail;
    private String userName;
    private String eventName;
    private String eventStartInstant;
    private String eventTimeZone;
    private int ticketQuantity;
    private double totalAmount;
}
