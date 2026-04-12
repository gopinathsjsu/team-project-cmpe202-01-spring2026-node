package com.node.eventServices.service;

import com.node.eventServices.dto.EventInfoDto;
import com.node.eventServices.dto.TicketTypeItemRequest;
import com.node.eventServices.dto.TicketTypeResponse;
import com.node.eventServices.model.events.Events;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface EventManagementService {
    EventInfoDto createEvent(Events event);
    Optional<EventInfoDto> getEventById(String id);
    List<EventInfoDto> getAllEvents();
    List<EventInfoDto> getAllActiveEvents();
    EventInfoDto updateEvent(String id, Events event);
    void deleteEvent(String id);
    void deleteAllEvent();
    List<EventInfoDto> getEventsByStatus(String status);
    EventInfoDto approveEvent(String eventId, String approverId);
    EventInfoDto rejectEvent(String eventId, String adminId, String reason);
    List<EventInfoDto> getEventsByOrganizer(String organizerId);
    List<EventInfoDto> searchEvents(String name);
    List<EventInfoDto> getEventsByOrganizerAndStatus(String organizerId, String status);
    EventInfoDto updateEventStatus(String id, String status);
    List<EventInfoDto> getAllEventsWithDateAndStatus(String status, Instant date);
    List<TicketTypeResponse> getTicketTypesByEvent(String eventId);
    List<TicketTypeResponse> assignTicketTypesToEvent(String eventId, List<TicketTypeItemRequest> items);
}
