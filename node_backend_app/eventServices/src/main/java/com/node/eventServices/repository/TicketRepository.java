package com.node.eventServices.repository;

import com.node.eventServices.model.tickets.Ticket;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TicketRepository extends JpaRepository<Ticket, Long> {

    List<Ticket> findByEvent_EventIdAndStatus(Long eventId, String status);

    List<Ticket> findByEvent_EventId(Long eventId);
}
