package com.node.eventServices.repository;

import com.node.eventServices.model.events.EventStatus;
import com.node.eventServices.model.events.Events;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;

@Repository
public interface EventRepository extends JpaRepository<Events, String> {

    List<Events> findByStatus(EventStatus status);

    List<Events> findByEventOwnerId(String ownerId);

    List<Events> findByEventNameContainingIgnoreCase(String name);

    List<Events> findByEventOwnerIdAndStatus(String ownerId, EventStatus status);

    @Query("SELECT e FROM Events e WHERE e.status = 'PUBLISHED' AND e.eventStartInstant > CURRENT_TIMESTAMP")
    List<Events> findActiveEvents();

    @Query("SELECT e FROM Events e WHERE e.status = :status AND e.eventStartInstant > :date")
    List<Events> findEventsWithDateAndStatus(@Param("status") EventStatus status, @Param("date") Instant date);

    @Query("SELECT e FROM Events e WHERE e.status = 'PUBLISHED' AND " +
           "(LOWER(e.eventName) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(e.eventDescription) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    List<Events> searchPublishedEvents(@Param("keyword") String keyword);

    @Modifying
    @Query("DELETE FROM Events")
    void deleteAllEvents();
}
