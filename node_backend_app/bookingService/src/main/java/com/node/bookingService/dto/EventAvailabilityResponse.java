package com.node.bookingService.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class EventAvailabilityResponse {
    private String eventId;
    private Integer totalConfirmedTickets;
    private List<TicketTypeResponse> ticketTypes;
}
