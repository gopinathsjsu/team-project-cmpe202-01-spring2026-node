package com.node.eventServices.controller;

import com.node.eventServices.dto.CreateEventRequest;
import com.node.eventServices.dto.EventLocationDto;
import com.node.eventServices.model.events.EventCategory;
import com.node.eventServices.model.events.EventLocation;
import com.node.eventServices.model.events.Events;
import com.node.eventServices.repository.EventCategoryRepository;
import com.node.eventServices.service.EventManagementService;
import lombok.extern.slf4j.Slf4j;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.Point;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

import java.time.ZoneId;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Slf4j
@RestController
@RequestMapping("/api/v1/events")
public class EventServicesController {

    @Autowired
    private EventManagementService eventManagementService;

    @Autowired
    private EventCategoryRepository eventCategoryRepository;

    private final GeometryFactory geometryFactory = new GeometryFactory();

    private EventLocation buildLocation(EventLocationDto dto) {
        if (dto == null) return null;
        EventLocation loc = new EventLocation();
        loc.setLocationName(dto.getLocationName());
        loc.setLocationAddress(dto.getLocationAddress());
        if (dto.getLatitude() != null && dto.getLongitude() != null) {
            // JTS uses (x=longitude, y=latitude)
            Point p = geometryFactory.createPoint(new Coordinate(dto.getLongitude(), dto.getLatitude()));
            p.setSRID(4326);
            loc.setLocation(p);
        }
        return loc;
    }

    @PostMapping
    public Events createEvent(@RequestBody CreateEventRequest request) {
        Events event = new Events();
        event.setEventName(request.getEventName());
        event.setEventDescription(request.getEventDescription());
        event.setMaxCapacity(request.getMaxCapacity());
        event.setWaitlistCapacity(request.getWaitlistCapacity());
        event.setEventLocation(buildLocation(request.getEventLocation()));
        event.setTicketPrice(request.getTicketPrice());
        event.setImageUrl(request.getImageUrl());
        // If client provided date-only values use them; otherwise we'll derive from Instants below
        event.setEventStartDate(request.getEventStartDate());
        event.setEventEndDate(request.getEventEndDate());
        // Map Instants and timezone when provided
        if (request.getEventStartInstant() != null) {
            event.setEventStartInstant(request.getEventStartInstant());
        }
        if (request.getEventEndInstant() != null) {
            event.setEventEndInstant(request.getEventEndInstant());
        }
        if (request.getEventPublishInstant() != null) {
            event.setEventPublishInstant(request.getEventPublishInstant());
        }
        if (request.getEventTimeZone() != null) {
            event.setEventTimeZone(request.getEventTimeZone());
        }

        // Derive legacy LocalDate fields from instants if they were not supplied
        ZoneId zone = (request.getEventTimeZone() != null && !request.getEventTimeZone().isBlank())
                ? ZoneId.of(request.getEventTimeZone()) : ZoneOffset.UTC;
        if (event.getEventStartDate() == null && event.getEventStartInstant() != null) {
            event.setEventStartDate(event.getEventStartInstant().atZone(zone).toLocalDate());
        }
        if (event.getEventEndDate() == null && event.getEventEndInstant() != null) {
            event.setEventEndDate(event.getEventEndInstant().atZone(zone).toLocalDate());
        }
        if (event.getEventPublishDate() == null && event.getEventPublishInstant() != null) {
            event.setEventPublishDate(event.getEventPublishInstant().atZone(zone).toLocalDate());
        }

        event.setEventOwnerId(request.getEventOwnerId());
        event.setStatus(request.getStatus());

        // map category IDs to entities
        List<EventCategory> categories = new ArrayList<>();
        if (request.getCategories() != null && !request.getCategories().isEmpty()) {
            eventCategoryRepository.findAllById(request.getCategories()).forEach(categories::add);
        }
        event.setCategories(categories);

        return eventManagementService.createEvent(event);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Events> getEventById(@PathVariable Long id) {
        return eventManagementService.getEventById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping
    public List<Events> getAllEvents() {
        return eventManagementService.getAllEvents();
    }

    @PutMapping("/{id}")
    public ResponseEntity<Events> updateEvent(@PathVariable Long id, @RequestBody CreateEventRequest request) {
        try {
            log.info(request.getEventStartInstant().toString()+" is start" );
            Events eventDetails = new Events();
            eventDetails.setEventName(request.getEventName());
            eventDetails.setEventDescription(request.getEventDescription());
            eventDetails.setMaxCapacity(request.getMaxCapacity());
            eventDetails.setWaitlistCapacity(request.getWaitlistCapacity());
            eventDetails.setEventLocation(buildLocation(request.getEventLocation()));
            eventDetails.setTicketPrice(request.getTicketPrice());
            eventDetails.setImageUrl(request.getImageUrl());
            eventDetails.setEventStartDate(request.getEventStartDate());
            eventDetails.setEventEndDate(request.getEventEndDate());
            // Map Instants and timezone when provided
            if (request.getEventStartInstant() != null) {

                eventDetails.setEventStartInstant(request.getEventStartInstant());
                log.info(eventDetails.getEventStartInstant().toString()+" is start" );
            }
            if (request.getEventEndInstant() != null) {
                eventDetails.setEventEndInstant(request.getEventEndInstant());
            }
            if (request.getEventPublishInstant() != null) {
                eventDetails.setEventPublishInstant(request.getEventPublishInstant());
            }
            if (request.getEventTimeZone() != null) {
                eventDetails.setEventTimeZone(request.getEventTimeZone());
            }

            // Derive date-only fields from instants if not provided
            ZoneId zoneUpd = (request.getEventTimeZone() != null && !request.getEventTimeZone().isBlank())
                    ? ZoneId.of(request.getEventTimeZone()) : ZoneOffset.UTC;
            if (eventDetails.getEventStartDate() == null && eventDetails.getEventStartInstant() != null) {
                eventDetails.setEventStartDate(eventDetails.getEventStartInstant().atZone(zoneUpd).toLocalDate());
            }
            if (eventDetails.getEventEndDate() == null && eventDetails.getEventEndInstant() != null) {
                eventDetails.setEventEndDate(eventDetails.getEventEndInstant().atZone(zoneUpd).toLocalDate());
            }
            if (eventDetails.getEventPublishDate() == null && eventDetails.getEventPublishInstant() != null) {
                eventDetails.setEventPublishDate(eventDetails.getEventPublishInstant().atZone(zoneUpd).toLocalDate());
            }

            eventDetails.setEventOwnerId(request.getEventOwnerId());
            eventDetails.setStatus(request.getStatus());

            List<EventCategory> categories = new ArrayList<>();
            if (request.getCategories() != null && !request.getCategories().isEmpty()) {
                eventCategoryRepository.findAllById(request.getCategories()).forEach(categories::add);
            }
            eventDetails.setCategories(categories);

            Events updatedEvent = eventManagementService.updateEvent(id, eventDetails);
            return ResponseEntity.ok(updatedEvent);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<Events> updateEventStatus(@PathVariable Long id, @RequestParam String status) {
        try {
            Events updatedEvent = eventManagementService.updateEventStatus(id, status);
            return ResponseEntity.ok(updatedEvent);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteEvent(@PathVariable Long id) {
        eventManagementService.deleteEvent(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/status/{status}")
    public List<Events> getEventsByStatus(@PathVariable String status) {
        return eventManagementService.getEventsByStatus(status);
    }

    @PutMapping("/{id}/approve")
    public ResponseEntity<Events> approveEvent(@PathVariable Long id, @RequestParam Long approverId) {
        try {
            Events approvedEvent = eventManagementService.approveEvent(id, approverId);
            return ResponseEntity.ok(approvedEvent);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PutMapping("/{id}/reject")
    public ResponseEntity<Events> rejectEvent(@PathVariable Long id, @RequestParam Long adminId, @RequestParam(required = false) String reason) {
        try {
            Events rejectedEvent = eventManagementService.rejectEvent(id, adminId, reason);
            return ResponseEntity.ok(rejectedEvent);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/organizer/{organizerId}")
    public List<Events> getEventsByOrganizer(@PathVariable Long organizerId) {
        return eventManagementService.getEventsByOrganizer(organizerId);
    }

    @GetMapping("/search")
    public List<Events> searchEvents(@RequestParam String name) {
        return eventManagementService.searchEvents(name);
    }

    @GetMapping("/organizer/{organizerId}/status/{status}")
    public List<Events> getEventsByOrganizerAndStatus(@PathVariable Long organizerId, @PathVariable String status) {
        return eventManagementService.getEventsByOrganizerAndStatus(organizerId, status);
    }
}
