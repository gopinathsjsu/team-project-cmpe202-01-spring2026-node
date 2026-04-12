package com.node.eventServices.repository;

import com.node.eventServices.model.events.TicketType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TicketTypeRepository extends JpaRepository<TicketType, String> {

    List<TicketType> findByEventId(String eventId);

}
