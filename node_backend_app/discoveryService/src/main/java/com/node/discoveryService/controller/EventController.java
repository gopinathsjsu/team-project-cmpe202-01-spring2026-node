package com.node.discoveryService.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;

import com.node.discoveryService.service.EventService;
import com.node.discoveryService.model.Event;

import java.util.List;

@RestController
public class EventController {
    
    @Autowired 
    private EventService eventService;

    @GetMapping("/api/events/search")
    public List<Event> search(@RequestParam String keyword) {
        return eventService.searchEvents(keyword);
    }  
}
