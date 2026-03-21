package com.node.eventServices.controller;

import com.node.eventServices.dto.CreateEventRequest;
import com.node.eventServices.dto.EventInfoDto;
import com.node.eventServices.model.events.Events;
import com.node.eventServices.service.EventManagementService;
import com.node.eventServices.utils.MapperUtils;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Slf4j
@RestController
@RequestMapping("/api/v1/events")
public class EventServicesController {

    @Autowired
    private EventManagementService eventManagementService;

    @Autowired
    private MapperUtils mapper;

    @PostMapping
    public EventInfoDto createEvent(@RequestBody CreateEventRequest request) {
        log.info("Received request to create event: {}", request);
        Events event = mapper.convertCreateEventDtoToEvent(request);
        return eventManagementService.createEvent(event);
    }

    @GetMapping("/{id}")
    public ResponseEntity<EventInfoDto> getEventById(@PathVariable Long id) {
        Optional<EventInfoDto> event = eventManagementService.getEventById(id);
        return event.map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping
    public List<EventInfoDto> getAllEvents() {

        System.out.println("Get all events called");
        return eventManagementService.getAllEvents();
    }

    @GetMapping("/activeEvents")
    public List<EventInfoDto> getAllActiveEvents() {

        return eventManagementService.getAllActiveEvents();
    }

    @GetMapping("/getEventsByDateAndStatus/{status}")
    public List<EventInfoDto> getEventsByDateAndStatus(@RequestParam String status, @RequestBody Instant date) {
        return eventManagementService.getAllEventsWithDateAndStatus(status.toUpperCase(), date);
    }

    @PutMapping("/{id}")
    public ResponseEntity<EventInfoDto> updateEvent(@PathVariable Long id, @RequestBody CreateEventRequest request) {
        try {
            Events eventDetails = mapper.convertCreateEventDtoToEvent(request);
            EventInfoDto updatedEvent = eventManagementService.updateEvent(id, eventDetails);
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

    @DeleteMapping("/deleteAll")
    public ResponseEntity<Void> deleteEvent() {
        eventManagementService.deleteAllEvent();
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/status/{status}")
    public List<EventInfoDto> getEventsByStatus(@PathVariable String status) {
        return eventManagementService.getEventsByStatus(status);
    }

    /** Events pending admin approval (SUBMITTED). For admin moderation workflow. */
    @GetMapping("/pending")
    public List<EventInfoDto> getPendingEvents() {
        return eventManagementService.getEventsByStatus("SUBMITTED");
    }

    @PutMapping("/{id}/approve")
    public ResponseEntity<EventInfoDto> approveEvent(@PathVariable Long id, @RequestParam Long approverId) {
        try {
            EventInfoDto approvedEvent = eventManagementService.approveEvent(id, approverId);
            return ResponseEntity.ok(approvedEvent);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PutMapping("/{id}/reject")
    public ResponseEntity<EventInfoDto> rejectEvent(@PathVariable Long id, @RequestParam Long adminId, @RequestParam(required = false) String reason) {
        try {
            EventInfoDto rejectedEvent = eventManagementService.rejectEvent(id, adminId, reason);
            return ResponseEntity.ok(rejectedEvent);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<EventInfoDto> updateEventStatus(@PathVariable Long id, @RequestParam String status) {
        try {
            EventInfoDto updatedEvent = eventManagementService.updateEventStatus(id, status.toUpperCase());
            return ResponseEntity.ok(updatedEvent);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/organizer/{organizerId}")
    public List<EventInfoDto> getEventsByOrganizer(@PathVariable Long organizerId) {
        return eventManagementService.getEventsByOrganizer(organizerId);
    }

    @GetMapping("/search")
    public List<EventInfoDto> searchEvents(@RequestParam String name) {
        return eventManagementService.searchEvents(name);
    }

    @GetMapping("/organizer/{organizerId}/status/{status}")
    public List<EventInfoDto> getEventsByOrganizerAndStatus(@PathVariable Long organizerId, @PathVariable String status) {
        return eventManagementService.getEventsByOrganizerAndStatus(organizerId, status);
    }
}
