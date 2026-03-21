package com.node.eventServices.service;

import com.node.eventServices.dto.EventInfoDto;
import com.node.eventServices.model.User.User;
import com.node.eventServices.model.events.EventStatus;
import com.node.eventServices.model.tickets.Ticket;
import com.node.eventServices.model.events.Events;
import com.node.eventServices.repository.EventRepository;
import com.node.eventServices.repository.TicketRepository;
import com.node.eventServices.repository.UserRepository;
import com.node.eventServices.utils.MapperUtils;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Slf4j
@Service
public class EventManagementServiceImpl implements EventManagementService {

    @Autowired
    private EventRepository eventRepository;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private TicketRepository ticketRepository;
    @Autowired
    private MapperUtils mapper;

    @Override
    public EventInfoDto createEvent(Events event) {
        Events saved = eventRepository.save(event);
        log.info("Saved event is: {}", event);
        return convertToDto(saved);
    }

    @Override
    public Optional<EventInfoDto> getEventById(Long id) {
        Optional<EventInfoDto> eventOpt =  eventRepository.findById(id)
                .map(this::convertToDto);
        if(eventOpt.isPresent()) {
            log.info("Event found with ID {}: {}", id, eventOpt.get());
            return eventOpt;
        } else {
            log.warn("Event not found with ID {}", id);
            return Optional.empty();
        }
    }

    @Override
    public List<EventInfoDto> getAllEvents() {

        List<EventInfoDto> eventList = eventRepository.findAll().stream()
                .map(this::convertToDto)
                .toList();
        log.info("All Events retrieved: {}", eventList);
        return eventList;
    }

    @Override
    public List<EventInfoDto> getAllActiveEvents() {
        List<EventInfoDto> eventList = eventRepository.findActiveEvents().stream()
                .map(this::convertToDto)
                .toList();
        log.info("Active events retrieved: {}", eventList);
        return eventList;
    }

    @Override
    public List<EventInfoDto> getAllEventsWithDateAndStatus(String status, Instant date) {
        // Use case-insensitive mapping to avoid failures on lowercase input like "submitted"
        List<EventInfoDto> eventList = eventRepository.findEventsWithDateAndStatus(EventStatus.fromString(status), date).stream()
                .map(this::convertToDto)
                .toList();
        log.info("Events retrieved for status {} and date {}: {}", status, date, eventList);
        return eventList;
    }

    @Override
    public EventInfoDto updateEvent(Long id, Events eventDetails) {
        Events event = eventRepository.findById(id).orElseThrow(() -> new RuntimeException("Event not found"));
        event.setEventName(eventDetails.getEventName());
        event.setEventDescription(eventDetails.getEventDescription());
        event.setCategories(eventDetails.getCategories());
        event.setMaxCapacity(eventDetails.getMaxCapacity());
        event.setWaitlistCapacity(eventDetails.getWaitlistCapacity());
        event.setEventLocation(eventDetails.getEventLocation());
        event.setTicketPrice(eventDetails.getTicketPrice());
        event.setImageUrl(eventDetails.getImageUrl());
        event.setEventStartInstant(eventDetails.getEventStartInstant());
        event.setEventEndInstant(eventDetails.getEventEndInstant());
        event.setEventPublishInstant(eventDetails.getEventPublishInstant());
        event.setApproverId(eventDetails.getApproverId());
        event.setStatus(eventDetails.getStatus());
        //event.setTicketType(eventDetails.getTicketType());
        return convertToDto(eventRepository.save(event));
    }

    @Override
    public void deleteEvent(Long id) {
        log.info("** ATTENTION:: Deleting event with ID {}", id);
        eventRepository.deleteById(id);
        log.info("Deleted event with ID {}", id);
    }

    @Override
    public void deleteAllEvent() {
        log.info("** ATTENTION:: Deleting All events ");
        eventRepository.deleteAllEvents();
        log.info("Deleted All event");
    }

    @Override
    public List<EventInfoDto> getEventsByStatus(String status) {
        List<EventInfoDto> eventList = eventRepository.findByStatus(status)
                .stream()
                .map(this::convertToDto)
                .toList();
        log.info("Events retrieved with status {}: {}", status, eventList);
        return eventList;
    }

    @Override
    public EventInfoDto approveEvent(Long eventId, Long adminId) {
        Events event = eventRepository.findById(eventId).orElseThrow(() -> new RuntimeException("Event not found"));
        event.setStatus(EventStatus.fromString("APPROVED"));
        event.setApproverId(adminId);
        event.setEventPublishInstant(Instant.now());
        log.info("Approving event ID {} by admin ID {}", eventId, adminId);
        return convertToDto(eventRepository.save(event));
    }

    @Override
    public EventInfoDto rejectEvent(Long eventId, Long adminId, String reason) {
        Events event = eventRepository.findById(eventId).orElseThrow(() -> new RuntimeException("Event not found"));
        event.setStatus(EventStatus.fromString("REJECTED"));
        event.setApproverId(adminId);
        log.info("Rejecting event ID {} by admin ID {}. Reason: {}", eventId, adminId, reason);
        return convertToDto(eventRepository.save(event));
    }

    @Override
    public List<EventInfoDto> getEventsByOrganizer(Long organizerId) {
        return eventRepository.findByEventOwnerId(organizerId)
                .stream().map(this::convertToDto).toList();
    }

    @Override
    public List<EventInfoDto> searchEvents(String name) {
        return eventRepository.findByEventNameContainingIgnoreCase(name)
                .stream().map(this::convertToDto).toList();
    }

    @Override
    public List<EventInfoDto> getEventsByOrganizerAndStatus(Long organizerId, String status) {
        return eventRepository.findByEventOwnerIdAndStatus(organizerId, status)
                .stream().map(this::convertToDto).toList();
    }

    @Override
    public EventInfoDto updateEventStatus(Long id, String status) {
        Events event = eventRepository.findById(id).orElseThrow(() -> new RuntimeException("Event not found"));
        event.setStatus(EventStatus.fromString(status));
        log.info("Updating event ID {} status to {}", id, status);
        return convertToDto(eventRepository.save(event));
    }

    private String findOrganizerNameById(Long eventOwnerId) {
        return userRepository.findById(eventOwnerId)
                .map(User::getUsername)
                .orElse("Unknown Organizer");
    }

    private Long findTicketsSoldForEvent(Long eventId) {
        return (Long) (long) ticketRepository.findByEvent_EventIdAndStatus(eventId, "BOOKED")
                .stream().mapToInt(Ticket::getQuantity).sum();
    }

    private EventInfoDto convertToDto(Events event) {
        //log.info("Converting event ID {} to DTO. Event details: {}", event.getEventId(), event);
        String ownerName = userRepository.findById(event.getEventOwnerId())
                .map(User::getUsername)
                .orElse("Unknown");
        Long ticketsSold = findTicketsSoldForEvent(event.getEventId());
        log.info("Service:: Converting event {} to DTO. Owner: {}, Tickets Sold: {}", event.getEventId(), ownerName, ticketsSold);
        return mapper.convertEventToDto(event, ownerName, ticketsSold);
    }
}
