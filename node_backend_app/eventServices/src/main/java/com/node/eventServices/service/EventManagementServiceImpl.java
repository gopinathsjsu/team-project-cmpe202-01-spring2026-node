package com.node.eventServices.service;

import com.node.eventServices.dto.EventInfoDto;
import com.node.eventServices.dto.EventLocationDto;
import com.node.eventServices.model.events.EventCategory;
import com.node.eventServices.repository.EventCategoryRepository;
import com.node.eventServices.model.events.Events;
import com.node.eventServices.repository.EventRepository;
import com.node.eventServices.repository.TicketRepository;
import com.node.eventServices.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.BootstrapContext;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class EventManagementServiceImpl implements EventManagementService {

    @Autowired
    private EventRepository eventRepository;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private TicketRepository ticketRepository;

    @Override
    public EventInfoDto createEvent(Events event) {
        Events saved = eventRepository.save(event);
        return convertToDto(saved);
    }

    @Override
    public Optional<EventInfoDto> getEventById(Long id) {
        return eventRepository.findById(id)
                .map(this::convertToDto);
    }

    @Override
    public List<EventInfoDto> getAllEvents() {
        return eventRepository.findAll().stream()
                .map(this::convertToDto)
                .toList();
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
        event.setEventStartDate(eventDetails.getEventStartDate());
        event.setEventEndDate(eventDetails.getEventEndDate());
        event.setEventPublishDate(eventDetails.getEventPublishDate());
        return convertToDto(eventRepository.save(event));
    }

    @Override
    public void deleteEvent(Long id) {
        eventRepository.deleteById(id);
    }

    @Override
    public List<EventInfoDto> getEventsByStatus(String status) {
        return eventRepository.findByStatus(status)
                .stream()
                .map(this::convertToDto)
                .toList();
    }

    @Override
    public EventInfoDto approveEvent(Long eventId, Long approverId) {
        Events event = eventRepository.findById(eventId).orElseThrow(() -> new RuntimeException("Event not found"));
        event.setStatus("APPROVED");
        event.setApproverId(approverId);
        return convertToDto(eventRepository.save(event));
    }

    @Override
    public EventInfoDto rejectEvent(Long eventId, Long adminId, String reason) {
        Events event = eventRepository.findById(eventId).orElseThrow(() -> new RuntimeException("Event not found"));
        event.setStatus("REJECTED");
        event.setApproverId(adminId);
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
        event.setStatus(status);
        return convertToDto(eventRepository.save(event));
    }

    EventInfoDto convertToDto(Events event) {
        EventInfoDto dto = EventInfoDto.builder()
                .eventId(event.getEventId())
                .eventName(event.getEventName())
                .eventDescription(event.getEventDescription())
                .categories(event.getCategories().stream().map(EventCategory::getCategoryName).toList())
                .maxCapacity(event.getMaxCapacity())
                .waitlistCapacity(event.getWaitlistCapacity())
                .eventLocation(
                    EventLocationDto.builder().locationName(event.getEventLocation().getLocationName())
                    .locationAddress(event.getEventLocation().getLocationAddress())
                    .latitude(event.getEventLocation().getLatitude())
                    .longitude(event.getEventLocation().getLongitude())
                    .build()
                )
                .ticketPrice(event.getTicketPrice())
                .imageUrl(event.getImageUrl())
                .eventStartInstant(event.getEventStartInstant())
                .eventEndInstant(event.getEventEndInstant())
                .eventPublishInstant(event.getEventPublishInstant())
                .status(event.getStatus())
                .eventOwnerId(event.getEventOwnerId())
                .eventOwnerName(findOrganizerNameById(event.getEventOwnerId()))
                .ticketsSold(findTicketsSoldForEvent(event.getEventId()))
                .build();
        return dto;
    }

    private String findOrganizerNameById(Long eventOwnerId) {
        return userRepository.findById(eventOwnerId)
                .map(user -> user.getUsername())
                .orElse("Unknown Organizer");
    }

    private Long findTicketsSoldForEvent(Long eventId) {
        // This method would ideally query the TicketRepository to count booked tickets for the event
        // For simplicity, we return 0 here. Implementing this would require injecting TicketRepository and querying it.
        Long noOfTicketsSold = (long) ticketRepository.findByEvent_EventIdAndStatus(eventId, "BOOKED")
                .stream().mapToInt(ticket -> ticket.getQuantity()).sum();
        return noOfTicketsSold;
    }
}
