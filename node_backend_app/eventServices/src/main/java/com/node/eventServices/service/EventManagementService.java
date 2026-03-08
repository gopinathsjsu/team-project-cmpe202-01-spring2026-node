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
}
