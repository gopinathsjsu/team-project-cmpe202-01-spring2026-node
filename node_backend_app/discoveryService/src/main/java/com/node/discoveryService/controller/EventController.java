package com.node.discoveryService.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;

import com.node.discoveryService.service.EventService;
import com.node.discoveryService.model.Event;

import java.time.LocalDate;
//import java.util.List;

@RestController
public class EventController {
    
    @Autowired 
    private EventService eventService;

    @GetMapping("/browseEvents")
    public Page<Event> search(@RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "10") int size,
                              @RequestParam(defaultValue = "eventStartDate") String sortBy,  @RequestParam(defaultValue = "asc") String sortDir,
                              @RequestParam(required = false) String keyword, @RequestParam(required = false) String location, @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date, @RequestParam(required = false) String category) {
        
        Sort sort = sortDir.equalsIgnoreCase("Desc") ? Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();                        
        Pageable pageable = PageRequest.of(page, size, sort);
        return eventService.searchEvents(pageable, keyword, location, date, category);
    }  
}
