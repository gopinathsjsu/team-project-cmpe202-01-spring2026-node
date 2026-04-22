package com.node.discoveryService.repository;

import com.node.discoveryService.model.Event;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.List;

public interface EventRepository extends JpaRepository<Event, Long>, JpaSpecificationExecutor<Event>{
    List<Event> findByEventNameContainingOrEventDescriptionContaining(String name, String desc);
};

