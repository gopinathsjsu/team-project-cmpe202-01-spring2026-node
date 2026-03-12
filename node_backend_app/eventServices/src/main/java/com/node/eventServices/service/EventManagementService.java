package com.node.eventServices.service;

import com.node.eventServices.model.events.EventCategory;
import com.node.eventServices.model.events.Events;

import java.util.List;
import java.util.Optional;

public interface EventManagementService {
    Events createEvent(Events event);
    Optional<Events> getEventById(Long id);
    List<Events> getAllEvents();
    Events updateEvent(Long id, Events event);
    void deleteEvent(Long id);
    List<Events> getEventsByStatus(String status);
    Events approveEvent(Long eventId, Long approverId);
    Events rejectEvent(Long eventId, Long approverId);
    List<Events> getEventsByOrganizer(Long organizerId);
    List<Events> searchEvents(String name);
    List<Events> getEventsByOrganizerAndStatus(Long organizerId, String status);
}
