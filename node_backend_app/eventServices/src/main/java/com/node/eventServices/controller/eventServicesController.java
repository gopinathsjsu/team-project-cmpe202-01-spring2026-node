package com.node.eventServices.controller;

import com.node.eventServices.model.events.EventCategory;
import com.node.eventServices.model.events.Events;
import com.node.eventServices.service.EventManagementService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/events")
public class EventServicesController {

    @Autowired
    private EventManagementService eventManagementService;

    @PostMapping
    public Events createEvent(@RequestBody Events event) {
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
    public ResponseEntity<Events> updateEvent(@PathVariable Long id, @RequestBody Events eventDetails) {
        try {
            Events updatedEvent = eventManagementService.updateEvent(id, eventDetails);
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

}
