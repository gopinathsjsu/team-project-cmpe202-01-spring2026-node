package com.node.eventServices.service;

import com.node.eventServices.dto.EventInfoDto;
import com.node.eventServices.model.events.EventCategory;
import com.node.eventServices.model.events.Events;

import java.util.List;
import java.util.Optional;

public interface EventManagementService {
    EventInfoDto createEvent(Events event);
    Optional<EventInfoDto> getEventById(Long id);
    List<EventInfoDto> getAllEvents();
    EventInfoDto updateEvent(Long id, Events event);
    void deleteEvent(Long id);
    List<EventInfoDto> getEventsByStatus(String status);
    EventInfoDto approveEvent(Long eventId, Long approverId);
    EventInfoDto rejectEvent(Long eventId, Long adminId, String reason);
    List<EventInfoDto> getEventsByOrganizer(Long organizerId);
    List<EventInfoDto> searchEvents(String name);
    List<EventInfoDto> getEventsByOrganizerAndStatus(Long organizerId, String status);
    EventInfoDto updateEventStatus(Long id, String status);
}
