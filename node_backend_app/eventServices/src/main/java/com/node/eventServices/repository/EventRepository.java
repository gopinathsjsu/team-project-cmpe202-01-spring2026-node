package com.node.eventServices.repository;

import com.node.eventServices.model.events.EventStatus;
import com.node.eventServices.model.events.Events;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;

@Repository
public interface EventRepository extends JpaRepository<Events, Long> {
    List<Events> findByStatus(String status);
    List<Events> findByEventOwnerId(Long ownerId);
    List<Events> findByEventNameContainingIgnoreCase(String name);
    List<Events> findByEventOwnerIdAndStatus(Long ownerId, String status);

    @Query("SELECT e FROM Events e WHERE e.status = 'APPROVED' AND e.eventStartInstant > CURRENT_TIMESTAMP")
    List<Events> findActiveEvents();

    @Query("SELECT e FROM Events e WHERE e.status = :status AND e.eventStartInstant > :date")
    List<Events> findEventsWithDateAndStatus(EventStatus status, Instant date);

    @Query("Delete FROM Events")
    void deleteAllEvents();
}
