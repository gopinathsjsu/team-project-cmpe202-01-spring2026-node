package com.node.eventServices.service;

import com.node.eventServices.model.events.EventCategory;
import com.node.eventServices.repository.EventCategoryRepository;
import com.node.eventServices.model.events.Events;
import com.node.eventServices.repository.EventRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class EventManagementServiceImpl implements EventManagementService {

    @Autowired
    private EventRepository eventRepository;

    @Override
    public Events createEvent(Events event) {
        return eventRepository.save(event);
    }

    @Override
    public Optional<Events> getEventById(Long id) {
        return eventRepository.findById(id);
    }

    @Override
    public List<Events> getAllEvents() {
        return eventRepository.findAll();
    }

    @Override
    public Events updateEvent(Long id, Events eventDetails) {
        Events event = eventRepository.findById(id).orElseThrow(() -> new RuntimeException("Event not found"));
        event.setEventName(eventDetails.getEventName());
        event.setEventDescription(eventDetails.getEventDescription());
        event.setCategories(eventDetails.getCategories());
        event.setMaxCapacity(eventDetails.getMaxCapacity());
        event.setWaitlistCapacity(eventDetails.getWaitlistCapacity());
        event.setEventLocation(eventDetails.getEventLocation());
        event.setTicketPrice(eventDetails.getTicketPrice());
        event.setImageUrl(eventDetails.getImageUrl());
        event.setEventStartDate(eventDetails.getEventStartDate());
        event.setEventEndDate(eventDetails.getEventEndDate());
        event.setEventPublishDate(eventDetails.getEventPublishDate());
        return eventRepository.save(event);
    }

    @Override
    public void deleteEvent(Long id) {
        eventRepository.deleteById(id);
    }


}
