package com.node.bookingService.repository;

import com.node.bookingService.model.TicketType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.List;

@Repository
public interface TicketTypeRepository extends JpaRepository<TicketType, String> {

    List<TicketType> findByEventId(String eventId);

    Optional<TicketType> findByTicketTypeAndEventId(String ticketType, String eventId);

    void deleteByTicketTypeAndEventId(String ticketType, String eventId);
}
