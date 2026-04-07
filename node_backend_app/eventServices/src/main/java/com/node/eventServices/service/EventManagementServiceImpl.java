package com.node.eventServices.service;

import com.node.eventServices.dto.EventInfoDto;
import com.node.eventServices.exception.ResourceNotFoundException;
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
import org.springframework.transaction.annotation.Transactional;

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
    @Transactional
    public EventInfoDto createEvent(Events event) {
        log.info("Creating event '{}' for owner={}", event.getEventName(), event.getEventOwnerId());
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
        log.debug("Fetching all events");
        List<EventInfoDto> events = eventRepository.findAll().stream()
                .map(this::convertToDto)
                .toList();
        log.info("Retrieved {} events", events.size());
        return events;
    }

    @Override
    public List<EventInfoDto> getAllActiveEvents() {
        log.debug("Fetching all active (published) events");
        List<EventInfoDto> events = eventRepository.findActiveEvents().stream()
                .map(this::convertToDto)
                .toList();
        log.info("Retrieved {} active events", events.size());
        return events;
    }

    @Override
    public List<EventInfoDto> getAllEventsWithDateAndStatus(String status, Instant date) {
        EventStatus eventStatus = EventStatus.fromString(status);
        log.debug("Fetching events with status={} after date={}", eventStatus, date);
        List<EventInfoDto> events = eventRepository.findEventsWithDateAndStatus(eventStatus, date).stream()
                .map(this::convertToDto)
                .toList();
        log.info("Retrieved {} events for status={}, date={}", events.size(), status, date);
        return events;
    }

    @Override
    @Transactional
    public EventInfoDto updateEvent(Long id, Events eventDetails) {
        Events event = findEventOrThrow(id);
        log.info("Updating event id={}, name='{}'", id, event.getEventName());

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
        event.setEventTimeZone(eventDetails.getEventTimeZone());

        Events saved = eventRepository.save(event);
        log.info("Event id={} updated successfully", id);
        return convertToDto(saved);
    }

    @Override
    @Transactional
    public void deleteEvent(Long id) {
        findEventOrThrow(id);
        log.warn("Deleting event id={}", id);
        eventRepository.deleteById(id);
        log.info("Event id={} deleted", id);
    }

    @Override
    @Transactional
    public void deleteAllEvent() {
        log.warn("Deleting ALL events — this is a destructive operation");
        eventRepository.deleteAllEvents();
        log.info("All events deleted");
    }

    @Override
    public List<EventInfoDto> getEventsByStatus(String status) {
        EventStatus eventStatus = EventStatus.fromString(status);
        log.debug("Fetching events by status={}", eventStatus);
        List<EventInfoDto> eventList = eventRepository.findByStatus(eventStatus).stream()
                .map(this::convertToDto)
                .toList();
        log.info("Events retrieved with status {}: {}", status, eventList);
        return eventList;
    }

    @Override
    @Transactional
    public EventInfoDto approveEvent(Long eventId, Long adminId) {
        Events event = findEventOrThrow(eventId);
        EventStatus previousStatus = event.getStatus();

        log.info("Admin id={} approving event id={} (current status={})", adminId, eventId, previousStatus);
        event.transitionTo(EventStatus.APPROVED);
        event.setApproverId(adminId);

        Events saved = eventRepository.save(event);
        log.info("Event id={} approved: {} -> {}", eventId, previousStatus, saved.getStatus());
        return convertToDto(saved);
    }

    @Override
    @Transactional
    public EventInfoDto rejectEvent(Long eventId, Long adminId, String reason) {
        Events event = findEventOrThrow(eventId);
        EventStatus previousStatus = event.getStatus();

        log.info("Admin id={} rejecting event id={} (current status={}), reason='{}'",
                adminId, eventId, previousStatus, reason);
        event.transitionTo(EventStatus.REJECTED);
        event.setApproverId(adminId);

        Events saved = eventRepository.save(event);
        log.info("Event id={} rejected: {} -> {}", eventId, previousStatus, saved.getStatus());
        return convertToDto(saved);
    }

    @Override
    public List<EventInfoDto> getEventsByOrganizer(Long organizerId) {
        return eventRepository.findByEventOwnerId(organizerId)
                .stream().map(this::convertToDto).toList();
    }

    @Override
    public List<EventInfoDto> searchEvents(String name) {
        log.debug("Searching events with keyword='{}'", name);
        return eventRepository.searchPublishedEvents(name).stream()
                .map(this::convertToDto)
                .toList();
    }

    @Override
    public List<EventInfoDto> getEventsByOrganizerAndStatus(Long organizerId, String status) {
        EventStatus eventStatus = EventStatus.fromString(status);
        log.debug("Fetching events for organizer id={}, status={}", organizerId, eventStatus);
        return eventRepository.findByEventOwnerIdAndStatus(organizerId, eventStatus).stream()
                .map(this::convertToDto)
                .toList();
    }

    @Override
    @Transactional
    public EventInfoDto updateEventStatus(Long id, String status) {
        Events event = findEventOrThrow(id);
        EventStatus newStatus = EventStatus.fromString(status);
        EventStatus previousStatus = event.getStatus();

        log.info("Transitioning event id={} from {} to {}", id, previousStatus, newStatus);
        event.transitionTo(newStatus);

        if (newStatus == EventStatus.PUBLISHED) {
            event.setEventPublishInstant(Instant.now());
        }

        Events saved = eventRepository.save(event);
        log.info("Event id={} status updated: {} -> {}", id, previousStatus, saved);
        return convertToDto(saved);
    }

    private String findOrganizerNameById(Long eventOwnerId) {
        return userRepository.findById(eventOwnerId)
                .map(User::getUsername)
                .orElse("Unknown Organizer");
    }

        public Events findEventOrThrow(Long id) {
        return eventRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Event", id));
    }


    private Long findTicketsSoldForEvent(Long eventId) {
        return (long) ticketRepository.findByEvent_EventIdAndStatus(eventId, "BOOKED")
                .stream()
                .mapToInt(Ticket::getQuantity)
                .sum();
    }

    private EventInfoDto convertToDto(Events event) {
        String ownerName = userRepository.findById(event.getEventOwnerId())
                .map(User::getUsername)
                .orElse("Unknown");
        Long ticketsSold = findTicketsSoldForEvent(event.getEventId());
        return mapper.convertEventToDto(event, ownerName, ticketsSold);
    }
}
