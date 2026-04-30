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
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDate;

@Repository
public interface EventRepository extends JpaRepository<Events, String> {

    long countByEventOwnerId(UUID ownerId);

    Page<Events> findByEventOwnerId(UUID ownerId, Pageable pageable);

    Page<Events> findByEventOwnerIdAndStatus(UUID ownerId, EventStatus status, Pageable pageable);

    @Query("SELECT e FROM Events e WHERE e.eventOwnerId = :ownerId AND e.status IN :statuses")
    Page<Events> findByEventOwnerIdAndStatusIn(
            @Param("ownerId") UUID ownerId,
            @Param("statuses") List<EventStatus> statuses,
            Pageable pageable);

    @Query("SELECT COALESCE(SUM(e.maxCapacity), 0) FROM Events e WHERE e.eventOwnerId = :ownerId")
    Long sumMaxCapacityForOrganizer(@Param("ownerId") UUID ownerId);

    // The :q parameter must be non-null (callers pass "" for "no filter").
    // A null String is bound as bytea by the Postgres driver and breaks lower().
    @Query("SELECT e FROM Events e WHERE e.status = 'PUBLISHED' AND e.eventStartInstant > CURRENT_TIMESTAMP AND " +
           "(LOWER(e.eventName) LIKE LOWER(CONCAT('%', :q, '%')) OR " +
           "LOWER(e.eventDescription) LIKE LOWER(CONCAT('%', :q, '%')))")
    Page<Events> findActiveEventsPage(@Param("q") String q, Pageable pageable);

    List<Events> findByStatus(EventStatus status);

    long countByStatus(EventStatus status);

    List<Events> findByEventOwnerId(UUID ownerId);

    List<Events> findByEventNameContainingIgnoreCase(String name);

    List<Events> findByEventOwnerIdAndStatus(UUID ownerId, EventStatus status);

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

    // :q must be non-null (callers pass "" for "no filter"). See findActiveEventsPage.
    // :status remains nullable -- enums are bound with explicit type so they don't
    // hit the bytea inference issue.
    @Query("SELECT e FROM Events e LEFT JOIN User u ON e.eventOwnerId = u.id WHERE " +
           "(:status IS NULL OR e.status = :status) AND " +
           "(LOWER(e.eventName) LIKE LOWER(CONCAT('%', :q, '%')) OR " +
           "LOWER(COALESCE(u.username, '')) LIKE LOWER(CONCAT('%', :q, '%')))")
    Page<Events> findAdminPage(@Param("status") EventStatus status, @Param("q") String q, Pageable pageable);

    @Query("SELECT e FROM Events e LEFT JOIN User u ON e.eventOwnerId = u.id WHERE " +
           "(LOWER(e.eventName) LIKE LOWER(CONCAT('%', :q, '%')) OR " +
           "LOWER(COALESCE(u.username, '')) LIKE LOWER(CONCAT('%', :q, '%')))")
    Page<Events> findAllAdminEventsPage(@Param("q") String q, Pageable pageable);

           @Modifying
    @Transactional
    @Query("update Events e set e.status = :toStatus where e.eventStartInstant < :today and e.status = :fromStatus")
    int markEventsCompletedBefore(@Param("today") LocalDate today, @Param("fromStatus") EventStatus fromStatus, @Param("toStatus") EventStatus toStatus);
}
