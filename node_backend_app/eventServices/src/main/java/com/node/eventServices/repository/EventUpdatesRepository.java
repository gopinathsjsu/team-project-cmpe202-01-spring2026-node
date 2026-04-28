package com.node.eventServices.repository;

import com.node.eventServices.model.events.EventUpdates;
import com.node.eventServices.model.events.Events;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface EventUpdatesRepository extends JpaRepository<EventUpdates, String> {


}
