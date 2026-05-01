package com.node.discoveryService.service;

import com.node.discoveryService.dto.EventFilters;
import com.node.discoveryService.model.Event;
import com.node.discoveryService.repository.EventRepository;
import com.node.discoveryService.specification.EventSpecification;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.ZoneOffset;

@Slf4j
@Service
public class EventService {

    @Autowired
    private EventRepository eventRepository;

    public Page<Event> searchEvents(Pageable pageable, String keyword, String location, LocalDate date, String category) {
        log.debug("searchEvents (browseEvents): keyword={}, location={}, date={}, category={}",
                keyword, location, date, category);

        EventFilters filters = new EventFilters();
        filters.setQ(keyword);
        filters.setLocationText(location);
        if (date != null) {
            filters.setDateFrom(date.atStartOfDay(ZoneOffset.UTC).toInstant());
        }
        filters.setCategory(category);
        filters.setPriceType(EventFilters.PriceType.ALL);
        // Original browse endpoint did not restrict to future-only.
        filters.setFutureOnly(false);

        Page<Event> page = eventRepository.findAll(EventSpecification.withFilters(filters), pageable);
        log.debug("searchEvents matched {} events (page {} of {})",
                page.getTotalElements(), page.getNumber(), page.getTotalPages());
        return page;
    }

    public Page<Event> searchAllEvents(Pageable pageable, EventFilters filters) {
        log.debug("searchAllEvents filters: q={}, locationText={}, geo=({},{},r={}km), dateFrom={}, dateTo={}, priceType={}, category={}, status={}, futureOnly={}",
                filters.getQ(), filters.getLocationText(),
                filters.getLat(), filters.getLng(), filters.getRadiusKm(),
                filters.getDateFrom(), filters.getDateTo(),
                filters.getPriceType(), filters.getCategory(),
                filters.getStatus(), filters.isFutureOnly());

        Page<Event> page = eventRepository.findAll(EventSpecification.withFilters(filters), pageable);
        log.info("searchAllEvents matched {} events (page {} of {})",
                page.getTotalElements(), page.getNumber(), page.getTotalPages());
        return page;
    }
}
