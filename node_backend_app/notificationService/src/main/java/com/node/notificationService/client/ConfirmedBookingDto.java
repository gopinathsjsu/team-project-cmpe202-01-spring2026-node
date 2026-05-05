package com.node.notificationService.client;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class ConfirmedBookingDto {
    private String bookingId;
    private String eventId;
    private String userId;
    private String userEmail;
    private String status;
    private Integer quantity;
}
