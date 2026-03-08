package com.node.eventServices.repository;

import com.node.eventServices.model.events.Events;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EventRepository extends JpaRepository<Events, Long> {
    List<Events> findByStatus(String status);
    List<Events> findByEventOwnerId(Long ownerId);
    List<Events> findByEventNameContainingIgnoreCase(String name);
}
