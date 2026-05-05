package com.node.notificationService.rsvp;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@Slf4j
@RestController
@RequestMapping("/api/v1/notifications/rsvp")
@RequiredArgsConstructor
public class RsvpController {

    private final RsvpTokenService tokenService;
    private final RsvpService rsvpService;

    @GetMapping(value = "/respond", produces = MediaType.TEXT_HTML_VALUE)
    public ResponseEntity<String> respond(@RequestParam("token") String token) {
        Optional<RsvpTokenService.RsvpClaim> claimOpt = tokenService.verify(token);
        if (claimOpt.isEmpty()) {
            log.warn("RSVP click rejected: invalid or expired token");
            return ResponseEntity.status(400).contentType(MediaType.TEXT_HTML)
                    .body(htmlPage("Link expired or invalid",
                            "This RSVP link is no longer valid. Please contact the organizer."));
        }
        RsvpTokenService.RsvpClaim c = claimOpt.get();
        rsvpService.record(c.bookingId(), c.eventId(), c.userEmail(), c.status());
        String headline = c.status() == RsvpStatus.CONFIRMED
                ? "You're in. See you there!" : "Got it — we've marked you as not attending.";
        String body = c.status() == RsvpStatus.CONFIRMED
                ? "Thanks for confirming your RSVP."
                : "Thanks for letting the organizer know.";
        return ResponseEntity.ok(htmlPage(headline, body));
    }

    @GetMapping("/event/{eventId}")
    public ResponseEntity<List<RsvpConfirmation>> listForEvent(@PathVariable String eventId) {
        return ResponseEntity.ok(rsvpService.listForEvent(eventId));
    }

    private static String htmlPage(String headline, String body) {
        return "<!DOCTYPE html><html><head><meta charset=\"UTF-8\"><title>RSVP</title></head>"
                + "<body style=\"font-family:Arial,sans-serif;color:#333;max-width:520px;margin:60px auto;text-align:center;\">"
                + "<h2>" + escape(headline) + "</h2>"
                + "<p>" + escape(body) + "</p>"
                + "</body></html>";
    }

    private static String escape(String s) {
        return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;");
    }
}
