package com.node.discoveryService.controller;

import com.node.discoveryService.dto.EventFilters;
import com.node.discoveryService.model.Event;
import com.node.discoveryService.model.EventStatus;
import com.node.discoveryService.service.EventService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.Set;

@Slf4j
@RestController
@RequestMapping("/api/v1/discover")
public class EventController {

    private static final Set<String> SORTABLE_FIELDS = Set.of(
            "eventStartInstant",
            "eventStartDate",
            "ticketPrice",
            "eventName",
            "createdAt"
    );
    private static final String DEFAULT_SORT = "eventStartInstant";

    @Autowired
    private EventService eventService;

    @GetMapping("/browseEvents")
    public Page<Event> search(@RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "10") int size,
                              @RequestParam(defaultValue = "eventStartDate") String sortBy,  @RequestParam(defaultValue = "asc") String sortDir,
                              @RequestParam(required = false) String keyword, @RequestParam(required = false) String location, @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date, @RequestParam(required = false) String category) {

        log.info("browseEvents request: page={}, size={}, sortBy={}, sortDir={}, keyword={}, location={}, date={}, category={}",
                page, size, sortBy, sortDir, keyword, location, date, category);

        Sort sort = sortDir.equalsIgnoreCase("Desc") ? Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);
        Page<Event> result = eventService.searchEvents(pageable, keyword, location, date, category);
        log.info("browseEvents response: returning {} of {} matching events", result.getNumberOfElements(), result.getTotalElements());
        return result;
    }

    @GetMapping("/events")
    public ResponseEntity<Page<Event>> browseAllEvents(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size,
            @RequestParam(defaultValue = DEFAULT_SORT) String sortBy,
            @RequestParam(defaultValue = "asc") String sortDir,

            @RequestParam(required = false) String q,
            @RequestParam(required = false) String location,
            @RequestParam(required = false) Double lat,
            @RequestParam(required = false) Double lng,
            @RequestParam(required = false) Double radiusKm,

            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateTo,

            @RequestParam(required = false) String priceType,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "true") boolean futureOnly) 
    {
        log.info("GET /api/v1/discover/events — q='{}', location='{}', lat={}, lng={}, radiusKm={}, dateFrom={}, dateTo={}, priceType={}, category={}, status={}, futureOnly={}, page={}, size={}, sortBy={}, sortDir={}",
                q, location, lat, lng, radiusKm, dateFrom, dateTo, priceType, category, status, futureOnly,
                page, size, sortBy, sortDir);

        // Clamp pagination to safe bounds.
        int safePage = Math.max(0, page);
        int safeSize = Math.min(Math.max(size, 1), 100);

        String resolvedSort = SORTABLE_FIELDS.contains(sortBy) ? sortBy : DEFAULT_SORT;
        Sort sort = "desc".equalsIgnoreCase(sortDir)
                ? Sort.by(resolvedSort).descending()
                : Sort.by(resolvedSort).ascending();
        Pageable pageable = PageRequest.of(safePage, safeSize, sort);

        EventFilters filters = new EventFilters();
        filters.setQ(q);
        filters.setLocationText(location);
        filters.setLat(lat);
        filters.setLng(lng);
        filters.setRadiusKm(radiusKm);
        filters.setDateFrom(toStartOfDayUtc(dateFrom));
        filters.setDateTo(toEndOfDayUtc(dateTo));
        filters.setPriceType(EventFilters.PriceType.from(priceType));
        filters.setCategory(category);
        filters.setStatus(parseStatus(status));
        filters.setFutureOnly(futureOnly);

        Page<Event> result = eventService.searchAllEvents(pageable, filters);
        return ResponseEntity.ok(result);
    }

    private static Instant toStartOfDayUtc(LocalDate date) {
        return date == null ? null : date.atStartOfDay().toInstant(ZoneOffset.UTC);
    }

    private static Instant toEndOfDayUtc(LocalDate date) {
        return date == null ? null : date.atTime(23, 59, 59).toInstant(ZoneOffset.UTC);
    }

    private static EventStatus parseStatus(String raw) {
        if (raw == null || raw.isBlank()) return null;
        try {
            return EventStatus.valueOf(raw.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            return null;
        }
    }
}
