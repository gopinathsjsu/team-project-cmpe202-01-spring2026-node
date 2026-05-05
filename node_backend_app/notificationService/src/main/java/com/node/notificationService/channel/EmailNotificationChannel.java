package com.node.notificationService.channel;

import com.node.notificationService.events.*;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import jakarta.mail.util.ByteArrayDataSource;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import java.nio.charset.StandardCharsets;

@Component
@RequiredArgsConstructor
@Slf4j
public class EmailNotificationChannel implements NotificationChannel {

    private final JavaMailSender mailSender;
    private final TemplateEngine templateEngine;

    @Async
    @Override
    public void send(NotificationEvent event, String userEmail, String fcmToken) {
        try {
            if (event instanceof BookingConfirmedEvent e) {
                sendEmail(userEmail, "Booking Confirmed — " + e.getEventName(), "booking-confirmation", buildContext(e), IcsBuilder.build(e));
            } else if (event instanceof BookingReminderEvent e) {
                sendEmail(userEmail, "Reminder: " + e.getEventName() + " is tomorrow", "booking-reminder", buildContext(e));
            } else if (event instanceof BookingPendingEvent e) {
                sendEmail(userEmail, "You're on the Waitlist — " + e.getEventName(), "booking-pending", buildContext(e));
            } else if (event instanceof BookingCancelledEvent e) {
                sendEmail(userEmail, "Booking Cancelled — " + e.getEventName(), "booking-cancelled", buildContext(e));
            } else if (event instanceof NewEventPublishedEvent e) {
                sendEmail(userEmail, "New Event: " + e.getEventName(), "new-event", buildContext(e));
            }
        } catch (Exception ex) {
            log.error("Failed to send email to {}: {}", userEmail, ex.getMessage());
        }
    }

    private void sendEmail(String to, String subject, String template, Context context) throws MessagingException {
        sendEmail(to, subject, template, context, null);
    }

    private void sendEmail(String to, String subject, String template, Context context, String icsContent) throws MessagingException {
        String html = templateEngine.process(template, context);
        MimeMessage message = mailSender.createMimeMessage();
        boolean multipart = icsContent != null;
        MimeMessageHelper helper = new MimeMessageHelper(message, multipart, "UTF-8");
        helper.setTo(to);
        helper.setSubject(subject);
        helper.setText(html, true);
        if (multipart) {
            ByteArrayDataSource ds = new ByteArrayDataSource(
                    icsContent.getBytes(StandardCharsets.UTF_8),
                    "text/calendar; method=REQUEST; charset=UTF-8");
            helper.addAttachment("invite.ics", ds);
        }
        mailSender.send(message);
    }

    private Context buildContext(Object event) {
        Context ctx = new Context();
        ctx.setVariable("event", event);
        return ctx;
    }
}
