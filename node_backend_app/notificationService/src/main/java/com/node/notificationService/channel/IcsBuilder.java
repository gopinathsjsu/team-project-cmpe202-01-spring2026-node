package com.node.notificationService.channel;

import com.node.notificationService.events.BookingConfirmedEvent;

import java.time.Instant;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;

final class IcsBuilder {

    private static final DateTimeFormatter UTC_FMT =
            DateTimeFormatter.ofPattern("yyyyMMdd'T'HHmmss'Z'").withZone(ZoneOffset.UTC);

    private IcsBuilder() {}

    static String build(BookingConfirmedEvent e) {
        Instant start = parseInstant(e.getEventStartInstant());
        if (start == null) return null;
        Instant end = parseInstant(e.getEventEndInstant());
        if (end == null) end = start.plusSeconds(3600);

        String location = joinNonBlank(e.getEventLocationName(), e.getEventLocationAddress());
        String dtStamp = UTC_FMT.format(Instant.now());
        String uid = e.getBookingId() + "@node-event-platform";

        StringBuilder sb = new StringBuilder(512);
        sb.append("BEGIN:VCALENDAR\r\n")
          .append("VERSION:2.0\r\n")
          .append("PRODID:-//Node Event Platform//Booking//EN\r\n")
          .append("CALSCALE:GREGORIAN\r\n")
          .append("METHOD:REQUEST\r\n")
          .append("BEGIN:VEVENT\r\n")
          .append("UID:").append(uid).append("\r\n")
          .append("DTSTAMP:").append(dtStamp).append("\r\n")
          .append("DTSTART:").append(UTC_FMT.format(start)).append("\r\n")
          .append("DTEND:").append(UTC_FMT.format(end)).append("\r\n")
          .append("SUMMARY:").append(escape(nullToEmpty(e.getEventName()))).append("\r\n");
        if (!location.isEmpty()) {
            sb.append("LOCATION:").append(escape(location)).append("\r\n");
        }
        if (e.getEventDescription() != null && !e.getEventDescription().isBlank()) {
            sb.append("DESCRIPTION:").append(escape(e.getEventDescription())).append("\r\n");
        }
        sb.append("STATUS:CONFIRMED\r\n")
          .append("END:VEVENT\r\n")
          .append("END:VCALENDAR\r\n");
        return sb.toString();
    }

    private static Instant parseInstant(String s) {
        if (s == null || s.isBlank()) return null;
        try {
            return Instant.parse(s);
        } catch (Exception ex) {
            return null;
        }
    }

    private static String escape(String s) {
        return s.replace("\\", "\\\\")
                .replace("\n", "\\n")
                .replace(",", "\\,")
                .replace(";", "\\;");
    }

    private static String nullToEmpty(String s) {
        return s == null ? "" : s;
    }

    private static String joinNonBlank(String a, String b) {
        if (a == null || a.isBlank()) return b == null ? "" : b;
        if (b == null || b.isBlank() || b.equals(a)) return a;
        return a + ", " + b;
    }
}
