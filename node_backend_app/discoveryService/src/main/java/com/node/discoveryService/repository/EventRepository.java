package com.node.discoveryService.repository;

import com.node.discoveryService.model.Event;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface EventRepository extends JpaRepository<Event, Long>{
    List<Event> findByTitleContainingOrDescriptionContaining(String titleString, String descString);
};
