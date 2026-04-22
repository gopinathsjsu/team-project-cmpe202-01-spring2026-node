package com.node.eventServices.repository;

import com.node.eventServices.model.events.EventCategory;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EventCategoryRepository extends JpaRepository<EventCategory, String> {
  
  EventCategory findByCategoryName(String categoryName);
  EventCategory findByCategoryId(String categoryId);
}