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

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

@Repository
public interface EventRepository extends JpaRepository<Events, String> {

    long countByEventOwnerId(String ownerId);

    Page<Events> findByEventOwnerId(String ownerId, Pageable pageable);

    Page<Events> findByEventOwnerIdAndStatus(String ownerId, EventStatus status, Pageable pageable);

    @Query("SELECT e FROM Events e WHERE e.eventOwnerId = :ownerId AND e.status IN :statuses")
    Page<Events> findByEventOwnerIdAndStatusIn(
            @Param("ownerId") String ownerId,
            @Param("statuses") List<EventStatus> statuses,
            Pageable pageable);

    @Query("SELECT COALESCE(SUM(e.maxCapacity), 0) FROM Events e WHERE e.eventOwnerId = :ownerId")
    Long sumMaxCapacityForOrganizer(@Param("ownerId") String ownerId);

    @Query("SELECT e FROM Events e WHERE e.status = 'PUBLISHED' AND e.eventStartInstant > CURRENT_TIMESTAMP AND " +
           "(:q IS NULL OR LOWER(e.eventName) LIKE LOWER(CONCAT('%', :q, '%')) OR " +
           "LOWER(e.eventDescription) LIKE LOWER(CONCAT('%', :q, '%')))")
    Page<Events> findActiveEventsPage(@Param("q") String q, Pageable pageable);

    List<Events> findByStatus(EventStatus status);

    long countByStatus(EventStatus status);

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

    @Query("SELECT e FROM Events e LEFT JOIN User u ON e.eventOwnerId = u.userId WHERE " +
           "(:status IS NULL OR e.status = :status) AND " +
           "((:q IS NULL OR TRIM(:q) = '') OR " +
           "LOWER(e.eventName) LIKE LOWER(CONCAT('%', :q, '%')) OR " +
           "LOWER(COALESCE(u.username, '')) LIKE LOWER(CONCAT('%', :q, '%')))")
    Page<Events> findAdminPage(@Param("status") EventStatus status, @Param("q") String q, Pageable pageable);
}
