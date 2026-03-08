package com.node.eventServices.service;


import com.node.eventServices.model.events.EventCategory;
import com.node.eventServices.repository.EventCategoryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class EventCategoryService {

    @Autowired
    private EventCategoryRepository eventCategoryRepository;

    public EventCategory addCategory(EventCategory category) {
        return eventCategoryRepository.save(category);
    }

    public List<EventCategory> getAllEventCategories() {
        return eventCategoryRepository.findAll();
    }

}
