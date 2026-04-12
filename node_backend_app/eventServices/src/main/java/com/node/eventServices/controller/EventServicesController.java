package com.node.eventServices.controller;

import com.node.eventServices.dto.CreateEventRequest;
import com.node.eventServices.dto.EventInfoDto;
import com.node.eventServices.dto.TicketTypeItemRequest;
import com.node.eventServices.dto.TicketTypeResponse;
import com.node.eventServices.model.events.Events;
import com.node.eventServices.service.EventManagementService;
import com.node.eventServices.utils.MapperUtils;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;

@Slf4j
@RestController
@RequestMapping("/api/v1/events")
public class EventServicesController {

    @Autowired
    private EventManagementService eventManagementService;

    @Autowired
    private MapperUtils mapper;

    @PostMapping
    public ResponseEntity<EventInfoDto> createEvent(@Valid @RequestBody CreateEventRequest request) {
        log.info("POST /api/v1/events — creating event '{}'", request.getEventName());
        Events event = mapper.convertCreateEventDtoToEvent(request);
        EventInfoDto created = eventManagementService.createEvent(event);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping("/{id}")
    public ResponseEntity<EventInfoDto> getEventById(@PathVariable String id) {
        log.debug("GET /api/v1/events/{}", id);
        Optional<EventInfoDto> event = eventManagementService.getEventById(id);
        return event.map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping
    public ResponseEntity<List<EventInfoDto>> getAllEvents() {
        log.debug("GET /api/v1/events");
        return ResponseEntity.ok(eventManagementService.getAllEvents());
    }

    @GetMapping("/activeEvents")
    public ResponseEntity<List<EventInfoDto>> getAllActiveEvents() {
        log.debug("GET /api/v1/events/activeEvents");
        return ResponseEntity.ok(eventManagementService.getAllActiveEvents());
    }

    @GetMapping("/filter")
    public ResponseEntity<List<EventInfoDto>> getEventsByDateAndStatus(
            @RequestParam String status,
            @RequestParam Instant after) {
        log.debug("GET /api/v1/events/filter — status={}, after={}", status, after);
        return ResponseEntity.ok(eventManagementService.getAllEventsWithDateAndStatus(status, after));
    }

    @PutMapping("/{id}")
    public ResponseEntity<EventInfoDto> updateEvent(
            @PathVariable String id,
            @Valid @RequestBody CreateEventRequest request) {
        log.info("PUT /api/v1/events/{}", id);
        Events eventDetails = mapper.convertCreateEventDtoToEvent(request);
        EventInfoDto updatedEvent = eventManagementService.updateEvent(id, eventDetails);
        return ResponseEntity.ok(updatedEvent);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteEvent(@PathVariable String id) {
        log.info("DELETE /api/v1/events/{}", id);
        eventManagementService.deleteEvent(id);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/all")
    public ResponseEntity<Void> deleteAllEvents() {
        log.warn("DELETE /api/v1/events/all — destructive operation");
        eventManagementService.deleteAllEvent();
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/status/{status}")
    public ResponseEntity<List<EventInfoDto>> getEventsByStatus(@PathVariable String status) {
        log.debug("GET /api/v1/events/status/{}", status);
        return ResponseEntity.ok(eventManagementService.getEventsByStatus(status));
    }

    /** Events pending admin approval (SUBMITTED). For admin moderation workflow. */
    @GetMapping("/pending")
    public ResponseEntity<List<EventInfoDto>> getPendingEvents() {
        log.debug("GET /api/v1/events/pending");
        return ResponseEntity.ok(eventManagementService.getEventsByStatus("SUBMITTED"));
    }

    @PutMapping("/{id}/approve")
    public ResponseEntity<EventInfoDto> approveEvent(
            @PathVariable String id,
            @RequestParam String approverId) {
        log.info("PUT /api/v1/events/{}/approve by approverId={}", id, approverId);
        return ResponseEntity.ok(eventManagementService.approveEvent(id, approverId));
    }

    @PutMapping("/{id}/reject")
    public ResponseEntity<EventInfoDto> rejectEvent(
            @PathVariable String id,
            @RequestParam String adminId,
            @RequestParam(required = false) String reason) {
        log.info("PUT /api/v1/events/{}/reject by adminId={}, reason='{}'", id, adminId, reason);
        return ResponseEntity.ok(eventManagementService.rejectEvent(id, adminId, reason));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<EventInfoDto> updateEventStatus(
            @PathVariable String id,
            @RequestParam String status) {
        log.info("PATCH /api/v1/events/{}/status — newStatus={}", id, status);
        return ResponseEntity.ok(eventManagementService.updateEventStatus(id, status));
    }

    @GetMapping("/organizer/{organizerId}")
    public ResponseEntity<List<EventInfoDto>> getEventsByOrganizer(@PathVariable String organizerId) {
        log.debug("GET /api/v1/events/organizer/{}", organizerId);
        return ResponseEntity.ok(eventManagementService.getEventsByOrganizer(organizerId));
    }

    @GetMapping("/search")
    public ResponseEntity<List<EventInfoDto>> searchEvents(@RequestParam String name) {
        log.debug("GET /api/v1/events/search — name='{}'", name);
        return ResponseEntity.ok(eventManagementService.searchEvents(name));
    }

    @GetMapping("/organizer/{organizerId}/status/{status}")
    public ResponseEntity<List<EventInfoDto>> getEventsByOrganizerAndStatus(
            @PathVariable String organizerId,
            @PathVariable String status) {
        log.debug("GET /api/v1/events/organizer/{}/status/{}", organizerId, status);
        return ResponseEntity.ok(eventManagementService.getEventsByOrganizerAndStatus(organizerId, status));
    }

    @PostMapping("/ticketType/{eventId}")
    public ResponseEntity<List<TicketTypeResponse>> assignTicketTypesToEvent(
            @PathVariable String eventId,
            @Valid @RequestBody List<TicketTypeItemRequest> items) {
        log.info("POST /api/v1/ticket-types/event/{} — assigning {} ticket types", eventId, items.size());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(eventManagementService.assignTicketTypesToEvent(eventId, items));
    }

    @GetMapping("/ticketType/{eventId}")
    public ResponseEntity<List<TicketTypeResponse>> getTicketTypesByEvent(@PathVariable String eventId) {
        log.debug("GET /api/v1/ticket-types/event/{}", eventId);
        return ResponseEntity.ok(eventManagementService.getTicketTypesByEvent(eventId));
    }
}
