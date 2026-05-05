package com.node.notificationService.scheduler;

import com.node.notificationService.client.BookingClient;
import com.node.notificationService.client.ConfirmedBookingDto;
import com.node.notificationService.client.EventClient;
import com.node.notificationService.client.UpcomingEventDto;
import com.node.notificationService.dispatcher.NotificationDispatcher;
import com.node.notificationService.events.BookingReminderEvent;
import com.node.notificationService.rsvp.RsvpStatus;
import com.node.notificationService.rsvp.RsvpTokenService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class ReminderScheduler {

    private final NotificationDispatcher dispatcher;
    private final EventClient eventClient;
    private final BookingClient bookingClient;
    private final RsvpTokenService rsvpTokenService;

    @Value("${notification.reminder.timezone:America/Los_Angeles}")
    private String reminderTimezone;

    @Value("${notification.public-base-url:http://localhost:8083}")
    private String publicBaseUrl;

    @Scheduled(cron = "${notification.reminder.cron:0 0 18 * * *}", zone = "${notification.reminder.timezone:America/Los_Angeles}")
    public void sendEventReminders() {
        runReminderJob();
    }

    public int runReminderJob() {
        ZoneId zone = ZoneId.of(reminderTimezone);
        LocalDate tomorrow = LocalDate.now(zone).plusDays(1);
        Instant windowStart = tomorrow.atStartOfDay(zone).toInstant();
        Instant windowEnd = tomorrow.plusDays(1).atStartOfDay(zone).toInstant();
        log.info("Reminder job: scanning events starting in [{}, {}) tz={}", windowStart, windowEnd, zone);

        List<UpcomingEventDto> events = eventClient.getActiveEvents();
        int eventsMatched = 0;
        int remindersSent = 0;

        for (UpcomingEventDto event : events) {
            Instant start = event.getEventStartInstant();
            if (start == null || start.isBefore(windowStart) || !start.isBefore(windowEnd)) {
                continue;
            }
            eventsMatched++;
            List<ConfirmedBookingDto> bookings = bookingClient.getConfirmedBookingsForEvent(event.getEventId());
            log.info("Reminder job: event {} ('{}') has {} confirmed bookings", event.getEventId(), event.getEventName(), bookings.size());

            for (ConfirmedBookingDto booking : bookings) {
                if (booking.getUserEmail() == null || booking.getUserEmail().isBlank()) {
                    continue;
                }
                String confirmUrl = buildRsvpUrl(booking.getBookingId(), event.getEventId(),
                        booking.getUserEmail(), RsvpStatus.CONFIRMED, start);
                String declineUrl = buildRsvpUrl(booking.getBookingId(), event.getEventId(),
                        booking.getUserEmail(), RsvpStatus.DECLINED, start);
                BookingReminderEvent reminder = BookingReminderEvent.builder()
                        .bookingId(booking.getBookingId())
                        .eventId(event.getEventId())
                        .userId(booking.getUserId())
                        .userEmail(booking.getUserEmail())
                        .userName(deriveUserName(booking.getUserEmail()))
                        .eventName(event.getEventName())
                        .eventStartInstant(start.toString())
                        .eventTimeZone(event.getEventTimeZone())
                        .eventLocationName(event.getEventLocation() != null ? event.getEventLocation().getLocationName() : null)
                        .eventLocationAddress(event.getEventLocation() != null ? event.getEventLocation().getLocationAddress() : null)
                        .ticketQuantity(booking.getQuantity() != null ? booking.getQuantity() : 0)
                        .rsvpConfirmUrl(confirmUrl)
                        .rsvpDeclineUrl(declineUrl)
                        .build();
                dispatcher.dispatch(reminder, booking.getUserEmail(), null);
                remindersSent++;
            }
        }
        log.info("Reminder job complete: scannedEvents={}, matchedEvents={}, remindersSent={}",
                events.size(), eventsMatched, remindersSent);
        return remindersSent;
    }

    private String buildRsvpUrl(String bookingId, String eventId, String userEmail, RsvpStatus status, Instant eventStart) {
        String token = rsvpTokenService.mint(bookingId, eventId, userEmail, status, eventStart);
        return UriComponentsBuilder.fromHttpUrl(publicBaseUrl)
                .path("/api/v1/notifications/rsvp/respond")
                .queryParam("token", token)
                .build()
                .encode(StandardCharsets.UTF_8)
                .toUriString();
    }

    private String deriveUserName(String email) {
        if (email == null) return "";
        int at = email.indexOf('@');
        return at > 0 ? email.substring(0, at) : email;
    }
}
