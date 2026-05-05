package com.node.notificationService.rsvp;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class RsvpService {

    private final RsvpConfirmationRepository repository;

    @Transactional
    public RsvpConfirmation record(String bookingId, String eventId, String userEmail, RsvpStatus status) {
        RsvpConfirmation entry = repository.findById(bookingId).orElseGet(() ->
                RsvpConfirmation.builder().bookingId(bookingId).build());
        entry.setEventId(eventId);
        entry.setUserEmail(userEmail);
        entry.setStatus(status);
        entry.setRespondedAt(Instant.now());
        RsvpConfirmation saved = repository.save(entry);
        log.info("RSVP recorded: booking={} event={} status={}", bookingId, eventId, status);
        return saved;
    }

    public List<RsvpConfirmation> listForEvent(String eventId) {
        return repository.findByEventId(eventId);
    }
}
