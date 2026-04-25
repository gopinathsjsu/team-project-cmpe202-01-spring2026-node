package com.node.notificationService.channel;

import com.node.notificationService.events.*;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

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
                sendEmail(userEmail, "Booking Confirmed — " + e.getEventName(), "booking-confirmation", buildContext(e));
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
        String html = templateEngine.process(template, context);
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
        helper.setTo(to);
        helper.setSubject(subject);
        helper.setText(html, true);
        mailSender.send(message);
    }

    private Context buildContext(Object event) {
        Context ctx = new Context();
        ctx.setVariable("event", event);
        return ctx;
    }
}
