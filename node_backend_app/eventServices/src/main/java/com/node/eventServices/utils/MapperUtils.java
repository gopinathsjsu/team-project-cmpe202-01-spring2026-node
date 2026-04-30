package com.node.eventServices.utils;

import com.node.eventServices.dto.CreateEventRequest;
import com.node.eventServices.dto.EventInfoDto;
import com.node.eventServices.dto.EventLocationDto;
import com.node.eventServices.model.events.EventCategory;
import com.node.eventServices.model.events.EventLocation;
import com.node.eventServices.model.events.EventStatus;
import com.node.eventServices.model.events.Events;
import com.node.eventServices.repository.EventCategoryRepository;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.Point;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import lombok.extern.slf4j.Slf4j;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
public class MapperUtils {

    @Autowired
    private EventCategoryRepository eventCategoryRepository;

    @Autowired
    private GeometryFactory geometryFactory;

    public EventInfoDto convertEventToDto(Events event, String organiserName, Long ticketsSold) {
        EventLocationDto locationDto = null;
        if (event.getEventLocation() != null) {
            locationDto = EventLocationDto.builder()
                    .locationName(event.getEventLocation().getLocationName())
                    .locationAddress(event.getEventLocation().getLocationAddress())
                    .latitude(event.getEventLocation().getLatitude())
                    .longitude(event.getEventLocation().getLongitude())
                    .build();
        }

        List<String> allowedTransitions = event.getStatus() != null
                ? event.getStatus().allowedTransitions().stream().map(Enum::name).toList()
                : List.of();

        EventInfoDto dto = EventInfoDto.builder()
                .eventId(event.getEventId())
                .eventName(event.getEventName())
                .eventDescription(event.getEventDescription())
                .categories(event.getCategories() != null
                        ? event.getCategories().stream().map(EventCategory::getCategoryName).toList()
                        : List.of())
                .maxCapacity(event.getMaxCapacity())
                .waitlistCapacity(event.getWaitlistCapacity())
                .eventLocation(locationDto)
                .ticketPrice(event.getTicketPrice())
                .imageUrl(event.getImageUrl())
                .eventStartInstant(event.getEventStartInstant())
                .eventEndInstant(event.getEventEndInstant())
                .eventPublishInstant(event.getEventPublishInstant())
                .eventTimeZone(event.getEventTimeZone())
                .status(event.getStatus())
                .allowedTransitions(allowedTransitions)
                .eventOwnerId(event.getEventOwnerId().toString())
                .eventOwnerName(organiserName)
                .ticketsSold(ticketsSold)

                .build();
        log.info("Mapped event {} to DTO: {}", event.getEventId(), dto);
        log.info("Saved event is: {}", event);
        return dto;
    }

    private EventLocation buildLocation(EventLocationDto dto) {
        if (dto == null) return null;
        EventLocation loc = new EventLocation();
        loc.setLocationName(dto.getLocationName());
        loc.setLocationAddress(dto.getLocationAddress());
        if (dto.getLatitude() != null && dto.getLongitude() != null) {
            Point p = geometryFactory.createPoint(new Coordinate(dto.getLongitude(), dto.getLatitude()));
            p.setSRID(4326);
            loc.setLocation(p);
        }
        return loc;
    }


    public Events convertCreateEventDtoToEvent(CreateEventRequest request) {
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
        event.setStatus(EventStatus.fromString(request.getStatus()));

        List<EventCategory> categories = new ArrayList<>();
        if (request.getCategories() != null && !request.getCategories().isEmpty()) {
            log.info("Mapping categories for event: {}", request.getCategories());
            for (String categoryId : request.getCategories()) {
                EventCategory category = eventCategoryRepository.findByCategoryId(categoryId);
                if (category != null) {
                    categories.add(category);
                }
            }
        }
        event.setCategories(categories);

        return event;
    }
    
}
