package com.node.eventServices.controller;

import com.node.eventServices.model.events.EventCategory;
import com.node.eventServices.service.EventCategoryService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/v1/events/categories")
public class EventCategoryController {

    @Autowired
    EventCategoryService eventCategoryService;

    @PostMapping
    public EventCategory addCategory(@RequestBody EventCategory category) {
        log.info("Creating event category: name={}", category.getCategoryName());
        EventCategory saved = eventCategoryService.addCategory(category);
        log.debug("Event category saved: id={}, name={}", saved.getCategoryId(), saved.getCategoryName());
        return saved;
    }

    @GetMapping
    public List<EventCategory> getAllEventCategories() {
        List<EventCategory> categories = eventCategoryService.getAllEventCategories();
        log.debug("Returning {} event categories", categories.size());
        return categories;
    }
}
