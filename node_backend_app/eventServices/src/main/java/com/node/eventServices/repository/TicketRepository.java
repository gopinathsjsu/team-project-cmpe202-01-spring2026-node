package com.node.eventServices.repository;

import com.node.eventServices.model.events.TicketType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TicketRepository extends JpaRepository<TicketType, String> {

    //List<TicketType> findByEventIdAndStatus(String eventId, String status);

    List<TicketType> findByEventId(String eventId);

    List<TicketType> findByEventIdAndTicketType(String eventId, String ticketType);


}
