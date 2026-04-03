package com.node.discoveryService.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.node.discoveryService.repository.EventRepository;
import com.node.discoveryService.specification.EventSpecification;
import com.node.discoveryService.model.Event;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Page;

import java.time.LocalDateTime;
//import java.util.List;


@Service
public class EventService {
    
    @Autowired
    private EventRepository eventRepository;

    public Page<Event> searchEvents(Pageable pageable, String keyword, String location, LocalDateTime date, String category)
    {
        //return eventRepository.findByTitleContainingOrDescriptionContaining(keyword, keyword);
        return eventRepository.findAll(EventSpecification.withFilters(keyword, location, date, category), pageable);
    }
}
