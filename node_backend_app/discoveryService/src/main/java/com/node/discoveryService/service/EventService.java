package com.node.discoveryService.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.node.discoveryService.repository.EventRepository;
import com.node.discoveryService.model.Event;

import java.util.List;


@Service
public class EventService {
    
    @Autowired
    private EventRepository eventRepository;

    public List<Event> searchEvents(String keyword)
    {
        return eventRepository.findByTitleContainingOrDescriptionContaining(keyword, keyword);
    }
}
