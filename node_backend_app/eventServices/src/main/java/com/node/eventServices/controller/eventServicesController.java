package com.node.eventServices.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
@RequestMapping("/events")
public class eventServicesController {

    @GetMapping("/getAllEvents")
    public List<Events> getAllEvents()
    {
        List<Events> events = new ArrayList<Events>();
    }
}
