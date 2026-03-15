import type { Event } from '../types';
import { format } from 'date-fns';

/**
 * Generate a Google Calendar add event URL
 */
export function generateGoogleCalendarUrl(event: Event): string {
    const startDateTime = new Date(`${event.eventStartInstant}`);
    const endDateTime = new Date(startDateTime.getTime() + 2 * 60 * 60 * 1000); // Add 2 hours

    const formatDateForGoogle = (date: Date) => {
        return format(date, "yyyyMMdd'T'HHmmss");
    };

    const params = new URLSearchParams({
        action: 'TEMPLATE',
        text: event.eventName,
        dates: `${formatDateForGoogle(startDateTime)}/${formatDateForGoogle(endDateTime)}`,
        details: event.eventDescription,
        location: `${event.eventLocation.locationName}, ${event.eventLocation.locationAddress}`,
        sprop: 'name:Node Event Platform',
    });

    return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Download .ics calendar file for the event
 */
export function downloadICSFile(event: Event): void {
    const startDateTime = new Date(`${event.eventStartInstant}`);
    const endDateTime = new Date(startDateTime.getTime() + 2 * 60 * 60 * 1000);

    const formatDateForICS = (date: Date) => {
        return format(date, "yyyyMMdd'T'HHmmss");
    };

    const icsContent = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Node Event Platform//EN',
        'BEGIN:VEVENT',
        `UID:${event.eventId}@nodeeventplatform.com`,
        `DTSTAMP:${formatDateForICS(new Date())}`,
        `DTSTART:${formatDateForICS(startDateTime)}`,
        `DTEND:${formatDateForICS(endDateTime)}`,
        `SUMMARY:${event.eventName}`,
        `DESCRIPTION:${event.eventDescription.replace(/\n/g, '\\n')}`,
        `LOCATION:${event.eventLocation.locationName}, ${event.eventLocation.locationAddress}`,
        `ORGANIZER:CN=${event.eventOwnerId}`,
        'STATUS:CONFIRMED',
        'END:VEVENT',
        'END:VCALENDAR',
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${event.eventName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

/**
 * Generate other calendar service URLs
 */
export function generateOutlookCalendarUrl(event: Event): string {
    const startDateTime = new Date(`${event.eventStartInstant}`);
    const endDateTime = new Date(startDateTime.getTime() + 2 * 60 * 60 * 1000);

    const params = new URLSearchParams({
        subject: event.eventName,
        body: event.eventDescription,
        location: `${event.eventLocation.locationName}, ${event.eventLocation.locationAddress}`,
        startdt: startDateTime.toISOString(),
        enddt: endDateTime.toISOString(),
        path: '/calendar/action/compose',
    });

    return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
}

export function generateYahooCalendarUrl(event: Event): string {
    const startDateTime = new Date(`${event.eventStartInstant}`);
    const endDateTime = new Date(startDateTime.getTime() + 2 * 60 * 60 * 1000);

    const formatDateForYahoo = (date: Date) => {
        return format(date, "yyyyMMdd'T'HHmmss'Z'");
    };

    const params = new URLSearchParams({
        v: '60',
        title: event.eventName,
        st: formatDateForYahoo(startDateTime),
        et: formatDateForYahoo(endDateTime),
        desc: event.eventDescription,
        in_loc: `${event.eventLocation.locationName}, ${event.eventLocation.locationAddress}`,
    });

    return `https://calendar.yahoo.com/?${params.toString()}`;
}
