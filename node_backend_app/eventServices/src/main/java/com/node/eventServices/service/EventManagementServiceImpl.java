package com.node.eventServices.service;

import com.node.eventServices.dto.EventAdminMetricsDto;
import com.node.eventServices.dto.OrganizerEventSummaryDto;
import com.node.eventServices.dto.EventInfoDto;
import com.node.eventServices.dto.TicketTypeItemRequest;
import com.node.eventServices.dto.TicketTypeResponse;
import com.node.eventServices.exception.ResourceNotFoundException;
import com.node.eventServices.messaging.EventPublisher;
import com.node.eventServices.model.User.User;
import com.node.eventServices.model.events.EventCategory;
import com.node.eventServices.model.events.EventStatus;
import com.node.eventServices.model.events.TicketType;
import com.node.eventServices.model.events.Events;
import com.node.eventServices.repository.EventRepository;
import com.node.eventServices.repository.TicketRepository;
import com.node.eventServices.repository.TicketTypeRepository;
import com.node.eventServices.repository.UserRepository;
import com.node.eventServices.utils.MapperUtils;
import com.node.notificationService.events.NewEventPublishedEvent;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

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
    private TicketTypeRepository ticketTypeRepository;
    @Autowired
    private MapperUtils mapper;
    @Autowired
    private EventPublisher eventPublisher;

    @Override
    @Transactional
    public EventInfoDto createEvent(Events event) {
        log.info("Creating event '{}' for owner={}", event.getEventName(), event.getEventOwnerId());
        Events saved = eventRepository.save(event);
        log.info("Saved event is: {}", event);
        return convertToDto(saved);
    }

    @Override
    public Optional<EventInfoDto> getEventById(String id) {
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
    public Page<EventInfoDto> getAdminEventsPage(EventStatus status, String q, Pageable pageable) {
        // Always pass a non-null search string. When q is blank we send "" so
        // the LIKE matches everything. Passing null lets the Postgres JDBC
        // driver infer the parameter type as bytea, which then breaks
        // lower()/trim() in the query (function lower(bytea) does not exist).
        String qq = (q == null) ? "" : q.trim();
        Page<Events> page = eventRepository.findAdminPage(status, qq, pageable);
        return page.map(this::convertToDto);
    }

    @Override
    public Page<EventInfoDto> getActiveEventsPage(String q, Pageable pageable) {
        // See getAdminEventsPage: never pass null for the search term.
        String qq = (q == null) ? "" : q.trim();
        return eventRepository.findActiveEventsPage(qq, pageable).map(this::convertToDto);
    }

    @Override
    public Page<EventInfoDto> getOrganizerEventsPage(String organizerId, String tab, Pageable pageable) {
        String t = tab == null || tab.isBlank() ? "all" : tab.trim().toLowerCase();
        Page<Events> page;
        switch (t) {
            case "published":
                page = eventRepository.findByEventOwnerIdAndStatus(organizerId, EventStatus.PUBLISHED, pageable);
                break;
            case "submitted":
                page = eventRepository.findByEventOwnerIdAndStatus(organizerId, EventStatus.SUBMITTED, pageable);
                break;
            case "completed":
                page = eventRepository.findByEventOwnerIdAndStatus(organizerId, EventStatus.COMPLETED, pageable);
                break;
            case "draft":
                page = eventRepository.findByEventOwnerIdAndStatus(organizerId, EventStatus.DRAFT, pageable);
                break;
            case "rejected":
                page = eventRepository.findByEventOwnerIdAndStatusIn(
                        organizerId, List.of(EventStatus.REJECTED, EventStatus.CANCELLED), pageable);
                break;
            default:
                page = eventRepository.findByEventOwnerId(organizerId, pageable);
        }
        return page.map(this::convertToDto);
    }

    @Override
    public OrganizerEventSummaryDto getOrganizerSummary(String organizerId) {
        long count = eventRepository.countByEventOwnerId(organizerId);
        Long sold = ticketTypeRepository.sumSoldQuantityForOrganizer(organizerId);
        BigDecimal rev = ticketTypeRepository.sumRevenueForOrganizer(organizerId);
        Long cap = eventRepository.sumMaxCapacityForOrganizer(organizerId);
        long soldL = sold != null ? sold : 0L;
        long capL = cap != null ? cap : 0L;
        int avg = capL > 0 ? (int) Math.min(100, Math.round((soldL * 100.0) / capL)) : 0;
        return OrganizerEventSummaryDto.builder()
                .eventCount(count)
                .ticketsSold(soldL)
                .totalRevenue(rev != null ? rev : BigDecimal.ZERO)
                .averageFillPercent(avg)
                .build();
    }

    @Override
    public EventAdminMetricsDto getAdminMetrics() {
        long total = eventRepository.count();
        long published = eventRepository.countByStatus(EventStatus.PUBLISHED);
        long submitted = eventRepository.countByStatus(EventStatus.SUBMITTED);
        BigDecimal revenue = ticketTypeRepository.sumRevenueFromSoldTickets();
        Long sold = ticketTypeRepository.sumTicketsSold();
        return EventAdminMetricsDto.builder()
                .totalEvents(total)
                .publishedEvents(published)
                .submittedEvents(submitted)
                .platformRevenue(revenue != null ? revenue : BigDecimal.ZERO)
                .ticketsSold(sold != null ? sold : 0L)
                .build();
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
    public EventInfoDto updateEvent(String id, Events eventDetails) {
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
    public void deleteEvent(String id) {
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
    public EventInfoDto approveEvent(String eventId, String adminId) {
        Events event = findEventOrThrow(eventId);
        EventStatus previousStatus = event.getStatus();

        log.info("Admin id={} approving event id={} (current status={})", adminId, eventId, previousStatus);
        event.transitionTo(EventStatus.APPROVED);
        event.setApproverId(adminId);

        event.transitionTo(EventStatus.PUBLISHED);
        event.setEventPublishInstant(Instant.now());

        Events saved = eventRepository.save(event);
        log.info("Event id={} approved and published: {} -> {}", eventId, previousStatus, saved.getStatus());

        if (saved.getStatus() == EventStatus.PUBLISHED) {
            publishNewEventPublished(saved);
        }

        return convertToDto(saved);
    }

    @Override
    @Transactional
    public EventInfoDto rejectEvent(String eventId, String adminId, String reason) {
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
    public List<EventInfoDto> getEventsByOrganizer(String organizerId) {
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
    public List<EventInfoDto> getEventsByOrganizerAndStatus(String organizerId, String status) {
        EventStatus eventStatus = EventStatus.fromString(status);
        log.debug("Fetching events for organizer id={}, status={}", organizerId, eventStatus);
        return eventRepository.findByEventOwnerIdAndStatus(organizerId, eventStatus).stream()
                .map(this::convertToDto)
                .toList();
    }

    @Override
    @Transactional
    public EventInfoDto updateEventStatus(String id, String status) {
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

        if (newStatus == EventStatus.PUBLISHED && previousStatus != EventStatus.PUBLISHED) {
            publishNewEventPublished(saved);
        }

        return convertToDto(saved);
    }

    private void publishNewEventPublished(Events event) {
        String organizerName = userRepository.findById(event.getEventOwnerId())
                .map(User::getUsername)
                .orElse("Unknown");
        String categoryName = null;
        if (event.getCategories() != null && !event.getCategories().isEmpty()) {
            EventCategory first = event.getCategories().get(0);
            categoryName = first != null ? first.getCategoryName() : null;
        }
        String locationName = null;
        if (event.getEventLocation() != null) {
            locationName = event.getEventLocation().getLocationName() != null
                    ? event.getEventLocation().getLocationName()
                    : event.getEventLocation().getLocationAddress();
        }
        NewEventPublishedEvent payload = NewEventPublishedEvent.builder()
                .eventId(event.getEventId())
                .eventName(event.getEventName())
                .eventStartInstant(event.getEventStartInstant() != null
                        ? event.getEventStartInstant().toString() : null)
                .eventTimeZone(event.getEventTimeZone())
                .locationName(locationName)
                .category(categoryName)
                .ticketPrice(event.getTicketPrice() != null ? event.getTicketPrice().toPlainString() : null)
                .organizerName(organizerName)
                .build();
        eventPublisher.publish(event.getEventId(), payload);
    }

    private String findOrganizerNameById(String eventOwnerId) {
        return userRepository.findById(eventOwnerId)
                .map(User::getUsername)
                .orElse("Unknown Organizer");
    }

    public Events findEventOrThrow(String id) {
        return eventRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Event", id));
    }


    private Long findTicketsSoldForEvent(String eventId) {
        return (long) ticketRepository.findByEventId(eventId)
                .stream()
                .mapToInt(TicketType::getSoldQuantity)
                .sum();
    }

    private EventInfoDto convertToDto(Events event) {
        String ownerName = userRepository.findById(event.getEventOwnerId())
                .map(User::getUsername)
                .orElse("Unknown");
        Long ticketsSold = findTicketsSoldForEvent(event.getEventId());
        log.info("Tickets sold for event id={}: {}", event.getEventId(), ticketsSold);
        List<TicketType> ticketTypes = ticketTypeRepository.findByEventId(event.getEventId());
        log.info("Ticket types for event id={}: {}", event.getEventId(), ticketTypes);
        for (TicketType ticketType : ticketTypes) {
            log.info("Ticket type id={}: {}", ticketType.getId(), ticketType.getTicketType());
        }
        return mapper.convertEventToDto(event, ownerName, ticketsSold);
    }

    @Transactional
    public List<TicketTypeResponse> assignTicketTypesToEvent(String eventId, List<TicketTypeItemRequest> items) {
        log.info("Assigning {} ticket types to event id={}", items.size(), eventId);

        Events event = findEventOrThrow(eventId);

        List<TicketType> ticketTypes = items.stream()
                .map(item -> TicketType.builder()
                        .eventId(eventId)
                        .ticketType(item.getTicketType())
                        .description(item.getDescription())
                        .price(item.getPrice())
                        .totalQuantity(item.getTotalQuantity())
                        .waitlistCapacity(item.getWaitlistCapacity() != null ? item.getWaitlistCapacity() : 0)
                        .soldQuantity(0)
                        .build())
                .toList();

        List<TicketType> saved = ticketTypeRepository.saveAll(ticketTypes);
        log.info("Assigned {} ticket types to event id={}", saved.size(), eventId);
        return saved.stream().map(this::toTicketTypeResponse).toList();
    }

    public List<TicketTypeResponse> getTicketTypesByEvent(String eventId) {
        log.debug("Fetching ticket types for event id={}", eventId);
        return ticketTypeRepository.findByEventId(eventId).stream()
                .map(this::toTicketTypeResponse)
                .toList();
    }

    private TicketTypeResponse toTicketTypeResponse(TicketType tt) {
        return TicketTypeResponse.builder()
                .id(tt.getId())
                .eventId(tt.getEventId())
                .ticketType(tt.getTicketType())
                .description(tt.getDescription())
                .price(tt.getPrice())
                .totalQuantity(tt.getTotalQuantity())
                .waitlistCapacity(tt.getWaitlistCapacity())
                .soldQuantity(tt.getSoldQuantity())
                .availableQuantity(tt.getAvailableQuantity())
                .build();
    }
}
