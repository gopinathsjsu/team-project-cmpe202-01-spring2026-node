package com.node.eventServices.controller;

import com.node.eventServices.model.events.EventCategory;
import com.node.eventServices.service.EventCategoryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;

import java.util.List;

@Controller
@RequestMapping("/api/v1/event-categories")
public class EventCategoryController {

    @Autowired
    EventCategoryService eventCategoryService;

    @PostMapping
    public EventCategory addCategory(@RequestBody EventCategory category)
    {
        return eventCategoryService.addCategory(category);
    }

    @GetMapping
    public List<EventCategory> getAllEventCategories()
    {
        return eventCategoryService.getAllEventCategories();
    }
}
