package com.node.notificationService.rsvp;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RsvpConfirmationRepository extends JpaRepository<RsvpConfirmation, String> {
    List<RsvpConfirmation> findByEventId(String eventId);
}
