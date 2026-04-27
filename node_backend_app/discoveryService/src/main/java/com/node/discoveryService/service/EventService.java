package com.node.discoveryService.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.node.discoveryService.repository.EventRepository;
import com.node.discoveryService.specification.EventSpecification;
import com.node.discoveryService.model.Event;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Page;

import java.time.LocalDate;

@Slf4j
@Service
public class EventService {

    @Autowired
    private EventRepository eventRepository;

    public Page<Event> searchEvents(Pageable pageable, String keyword, String location, LocalDate date, String category) {
        log.debug("searchEvents filters: keyword={}, location={}, date={}, category={}", keyword, location, date, category);
        Page<Event> page = eventRepository.findAll(
                EventSpecification.withFilters(keyword, location, date, category), pageable);
        log.debug("searchEvents matched {} events (page {} of {})",
                page.getTotalElements(), page.getNumber(), page.getTotalPages());
        return page;
    }
}
