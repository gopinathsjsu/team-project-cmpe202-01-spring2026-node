package com.node.notificationService.scheduler;

import com.node.notificationService.dispatcher.NotificationDispatcher;
import com.node.notificationService.events.BookingConfirmedEvent;
import com.node.notificationService.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Sends reminder push notifications and emails 24 hours before an event starts.
 *
 * Note: This scheduler queries the event and booking data. In a full microservice
 * setup this would call the Event Service and Booking Service over HTTP.
 * For now it is scaffolded to be wired up once those services are ready.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class ReminderScheduler {

    private final NotificationDispatcher dispatcher;
    private final NotificationService notificationService;

    @Scheduled(cron = "0 0 9 * * *")
    public void sendEventReminders() {
        log.info("Running daily event reminder job");
        // TODO: Call Event Service to fetch events starting in next 24 hours
        // TODO: For each event, call Booking Service to get confirmed bookings
        // TODO: For each booking, dispatch a reminder notification
        //
        // Example structure once wired:
        // List<EventDto> upcomingEvents = eventServiceClient.getEventsStartingIn(24);
        // upcomingEvents.forEach(event -> {
        //     List<BookingDto> bookings = bookingServiceClient.getConfirmedBookings(event.getEventId());
        //     bookings.forEach(booking -> {
        //         String fcmToken = notificationService.getFcmToken(booking.getUserId());
        //         BookingConfirmedEvent reminder = buildReminderEvent(booking, event);
        //         dispatcher.dispatch(reminder, booking.getUserEmail(), fcmToken);
        //     });
        // });
    }
}
