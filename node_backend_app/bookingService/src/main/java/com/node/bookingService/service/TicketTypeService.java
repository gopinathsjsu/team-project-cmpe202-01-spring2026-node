package com.node.bookingService.service;

import com.node.bookingService.dto.CreateTicketTypeRequest;
import com.node.bookingService.dto.TicketTypeItemRequest;
import com.node.bookingService.dto.TicketTypeResponse;
import com.node.bookingService.exception.ResourceNotFoundException;
import com.node.bookingService.model.TicketType;
import com.node.bookingService.repository.TicketTypeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class TicketTypeService {

    private final TicketTypeRepository ticketTypeRepository;
    private final EventServiceClient eventServiceClient;

    @Transactional
    public TicketTypeResponse createTicketType(CreateTicketTypeRequest request) {
        log.info("Creating ticket type '{}' for event id={}", request.getTicketType(), request.getEventId());

        if (!eventServiceClient.eventExists(request.getEventId())) {
            throw new ResourceNotFoundException("Event not found with id: " + request.getEventId());
        }

        TicketType ticketType = TicketType.builder()
                .eventId(request.getEventId())
                .ticketType(request.getTicketType())
                .description(request.getDescription())
                .price(request.getPrice())
                .totalQuantity(request.getTotalQuantity())
                .waitlistCapacity(request.getWaitlistCapacity() != null ? request.getWaitlistCapacity() : 0)
                .soldQuantity(0)
                .build();

        TicketType saved = ticketTypeRepository.save(ticketType);
        log.info("Ticket type created: id={}, name='{}', event={}", saved.getId(), saved.getTicketType(), saved.getEventId());
        return toResponse(saved);
    }

    @Transactional
    public List<TicketTypeResponse> assignTicketTypesToEvent(String eventId, List<TicketTypeItemRequest> items) {
        log.info("Assigning {} ticket types to event id={}", items.size(), eventId);

        if (!eventServiceClient.eventExists(eventId)) {
            throw new ResourceNotFoundException("Event not found with id: " + eventId);
        }

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
        return saved.stream().map(this::toResponse).toList();
    }

    public List<TicketTypeResponse> getTicketTypesByEvent(String eventId) {
        log.debug("Fetching ticket types for event id={}", eventId);
        return ticketTypeRepository.findByEventId(eventId).stream()
                .map(this::toResponse)
                .toList();
    }

    public TicketTypeResponse getTicketTypeById(String id) {
        log.debug("Fetching ticket type id={}", id);
        TicketType tt = ticketTypeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket type not found with id: " + id));
        return toResponse(tt);
    }

    @Transactional
    public TicketTypeResponse updateTicketType(String id, CreateTicketTypeRequest request) {
        log.info("Updating ticket type id={}", id);
        TicketType tt = ticketTypeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket type not found with id: " + id));

        tt.setTicketType(request.getTicketType());
        tt.setDescription(request.getDescription());
        tt.setPrice(request.getPrice());
        tt.setTotalQuantity(request.getTotalQuantity());
        if (request.getWaitlistCapacity() != null) {
            tt.setWaitlistCapacity(request.getWaitlistCapacity());
        }

        TicketType saved = ticketTypeRepository.save(tt);
        log.info("Ticket type updated: id={}", saved.getId());
        return toResponse(saved);
    }

    @Transactional
    public void deleteTicketType(String id) {
        log.info("Deleting ticket type id={}", id);
        if (!ticketTypeRepository.existsById(id)) {
            throw new ResourceNotFoundException("Ticket type not found with id: " + id);
        }
        ticketTypeRepository.deleteById(id);
        log.info("Ticket type deleted: id={}", id);
    }

    private TicketTypeResponse toResponse(TicketType tt) {
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
