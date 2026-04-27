package com.node.eventServices.repository;

import com.node.eventServices.model.events.TicketType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public interface TicketTypeRepository extends JpaRepository<TicketType, String> {

    List<TicketType> findByEventId(String eventId);

    @Query("SELECT COALESCE(SUM(t.soldQuantity * t.price), 0) FROM TicketType t")
    BigDecimal sumRevenueFromSoldTickets();

    @Query("SELECT COALESCE(SUM(t.soldQuantity), 0L) FROM TicketType t")
    Long sumTicketsSold();

    @Query("SELECT COALESCE(SUM(t.soldQuantity), 0L) FROM TicketType t WHERE t.eventId IN " +
           "(SELECT e.eventId FROM Events e WHERE e.eventOwnerId = :ownerId)")
    Long sumSoldQuantityForOrganizer(@Param("ownerId") UUID ownerId);

    @Query("SELECT COALESCE(SUM(t.soldQuantity * t.price), 0) FROM TicketType t WHERE t.eventId IN " +
           "(SELECT e.eventId FROM Events e WHERE e.eventOwnerId = :ownerId)")
    BigDecimal sumRevenueForOrganizer(@Param("ownerId") UUID ownerId);
}
