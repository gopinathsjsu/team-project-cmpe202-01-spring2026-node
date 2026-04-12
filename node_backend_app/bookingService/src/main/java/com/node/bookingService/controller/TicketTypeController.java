package com.node.bookingService.controller;

import com.node.bookingService.dto.CreateTicketTypeRequest;
import com.node.bookingService.dto.TicketTypeItemRequest;
import com.node.bookingService.dto.TicketTypeResponse;
import com.node.bookingService.service.TicketTypeService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/v1/ticket-types")
public class TicketTypeController {

    @Autowired
    private TicketTypeService ticketTypeService;

    @PostMapping
    public ResponseEntity<TicketTypeResponse> createTicketType(
            @Valid @RequestBody CreateTicketTypeRequest request) {
        log.info("POST /api/v1/ticket-types — name='{}', eventId={}", request.getTicketType(), request.getEventId());
        return ResponseEntity.status(HttpStatus.CREATED).body(ticketTypeService.createTicketType(request));
    }

    @PostMapping("/event/{eventId}")
    public ResponseEntity<List<TicketTypeResponse>> assignTicketTypesToEvent(
            @PathVariable String eventId,
            @Valid @RequestBody List<TicketTypeItemRequest> items) {
        log.info("POST /api/v1/ticket-types/event/{} — assigning {} ticket types", eventId, items.size());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ticketTypeService.assignTicketTypesToEvent(eventId, items));
    }

    @GetMapping("/event/{eventId}")
    public ResponseEntity<List<TicketTypeResponse>> getTicketTypesByEvent(@PathVariable String eventId) {
        log.debug("GET /api/v1/ticket-types/event/{}", eventId);
        return ResponseEntity.ok(ticketTypeService.getTicketTypesByEvent(eventId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<TicketTypeResponse> getTicketTypeById(@PathVariable String id) {
        log.debug("GET /api/v1/ticket-types/{}", id);
        return ResponseEntity.ok(ticketTypeService.getTicketTypeById(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<TicketTypeResponse> updateTicketType(
            @PathVariable String id,
            @Valid @RequestBody CreateTicketTypeRequest request) {
        log.info("PUT /api/v1/ticket-types/{}", id);
        return ResponseEntity.ok(ticketTypeService.updateTicketType(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTicketType(@PathVariable String id) {
        log.info("DELETE /api/v1/ticket-types/{}", id);
        ticketTypeService.deleteTicketType(id);
        return ResponseEntity.noContent().build();
    }
}
