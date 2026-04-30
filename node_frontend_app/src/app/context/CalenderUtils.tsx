import type { Event } from '../types';
import { fromZonedTime, toZonedTime, formatInTimeZone } from 'date-fns-tz';

/**
 * Date / time / timezone helpers.
 *
 * Storage contract with the backend:
 *   - eventStartInstant / eventEndInstant are absolute UTC ISO-8601 strings
 *     (e.g. "2026-05-15T18:30:00Z").
 *   - eventTimeZone is an IANA timezone id (e.g. "America/Los_Angeles").
 *
 * The form layer always works with three pieces of input:
 *   { dateStr: "YYYY-MM-DD", timeStr: "HH:MM", tz: "Area/City" }
 * and converts to/from the UTC instant on the boundary.
 */

const browserTimeZone = (): string => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
};

const safeZone = (tz?: string | null): string => {
  if (!tz || typeof tz !== 'string' || !tz.trim()) return browserTimeZone();
  return tz.trim();
};

/**
 * Convert (date, time, timezone) → UTC ISO-8601 instant.
 * Example: ("2026-05-15", "18:30", "America/Los_Angeles") → "2026-05-16T01:30:00.000Z"
 */
export function convertToUTCInstant(dateStr: string, timeStr: string, timezone: string): string {
  const tz = safeZone(timezone);
  // date-fns-tz expects "YYYY-MM-DDTHH:mm:ss" treated as wall-clock in `tz`.
  const wallClock = `${dateStr}T${timeStr.length === 5 ? `${timeStr}:00` : timeStr}`;
  const utcDate = fromZonedTime(wallClock, tz);
  if (Number.isNaN(utcDate.getTime())) {
    throw new Error(`Invalid date/time: ${wallClock} in ${tz}`);
  }
  return utcDate.toISOString();
}

/**
 * Convert a UTC instant + timezone back to the form's (date, time) shape so
 * the edit page shows the user the same wall-clock the event was created with,
 * regardless of the viewer's browser timezone.
 */
export function extractZonedDateTime(
  utcInstant: string | null | undefined,
  timezone?: string | null,
): { date: string; time: string } {
  if (!utcInstant) return { date: '', time: '' };
  const tz = safeZone(timezone);
  const d = new Date(utcInstant);
  if (Number.isNaN(d.getTime())) return { date: '', time: '' };
  return {
    date: formatInTimeZone(d, tz, 'yyyy-MM-dd'),
    time: formatInTimeZone(d, tz, 'HH:mm'),
  };
}

/**
 * Format a UTC instant for display in the event's timezone.
 * `pattern` follows date-fns tokens (default: "MMM d, yyyy h:mm a zzz").
 */
export function formatInZone(
  utcInstant: string | null | undefined,
  timezone?: string | null,
  pattern: string = 'MMM d, yyyy h:mm a zzz',
): string {
  if (!utcInstant) return '';
  const tz = safeZone(timezone);
  const d = new Date(utcInstant);
  if (Number.isNaN(d.getTime())) return '';
  try {
    return formatInTimeZone(d, tz, pattern);
  } catch {
    return d.toISOString();
  }
}

/** Internal: format a Date as Google/ICS basic-format UTC stamp `YYYYMMDDTHHmmssZ`. */
const formatBasicUtc = (d: Date): string =>
  formatInTimeZone(d, 'UTC', "yyyyMMdd'T'HHmmss'Z'");

/**
 * Resolve event start/end instants to real Dates.
 * Falls back to a 2-hour duration only when no end instant is stored.
 */
const resolveRange = (event: Event): { start: Date; end: Date } => {
  const start = new Date(String(event.eventStartInstant ?? ''));
  if (Number.isNaN(start.getTime())) {
    throw new Error('Event has no valid start time');
  }
  let end: Date;
  if (event.eventEndInstant) {
    end = new Date(String(event.eventEndInstant));
    if (Number.isNaN(end.getTime()) || end.getTime() <= start.getTime()) {
      end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
    }
  } else {
    end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
  }
  return { start, end };
};

const safeLocation = (event: Event): string => {
  const loc = event.eventLocation;
  if (!loc) return '';
  return [loc.locationName, loc.locationAddress].filter(Boolean).join(', ');
};

const safeText = (s: string | null | undefined): string => (s ?? '').toString();

/**
 * Generate the Google Calendar "create event" URL.
 * The `dates` parameter is in UTC basic-format and `ctz` tells Google which
 * timezone to display the prefilled form in, so the user sees the wall-clock
 * the organizer entered.
 */
export function generateGoogleCalendarUrl(event: Event): string {
  const { start, end } = resolveRange(event);
  const tz = safeZone(event.eventTimeZone);

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: safeText(event.eventName) || 'Event',
    dates: `${formatBasicUtc(start)}/${formatBasicUtc(end)}`,
    details: safeText(event.eventDescription),
    location: safeLocation(event),
    ctz: tz,
    sprop: 'name:Node Event Platform',
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/** Download a .ics calendar file using UTC stamps so any timezone reads it correctly. */
export function downloadICSFile(event: Event): void {
  const { start, end } = resolveRange(event);

  const escapeIcs = (s: string) =>
    s
      .replace(/\\/g, '\\\\')
      .replace(/\r?\n/g, '\\n')
      .replace(/,/g, '\\,')
      .replace(/;/g, '\\;');

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Node Event Platform//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${safeText(event.eventId) || `${start.getTime()}@nodeeventplatform.com`}@nodeeventplatform.com`,
    `DTSTAMP:${formatBasicUtc(new Date())}`,
    `DTSTART:${formatBasicUtc(start)}`,
    `DTEND:${formatBasicUtc(end)}`,
    `SUMMARY:${escapeIcs(safeText(event.eventName) || 'Event')}`,
    `DESCRIPTION:${escapeIcs(safeText(event.eventDescription))}`,
    `LOCATION:${escapeIcs(safeLocation(event))}`,
    `ORGANIZER;CN=${escapeIcs(safeText(event.eventOwnerName) || 'Organizer')}:mailto:noreply@nodeeventplatform.com`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR',
  ];

  const icsContent = lines.join('\r\n');
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${(safeText(event.eventName) || 'event').replace(/[^a-z0-9]/gi, '_').toLowerCase()}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/** Outlook Live deep-link "create event" URL (uses absolute UTC ISO timestamps). */
export function generateOutlookCalendarUrl(event: Event): string {
  const { start, end } = resolveRange(event);

  const params = new URLSearchParams({
    path: '/calendar/action/compose',
    rru: 'addevent',
    subject: safeText(event.eventName) || 'Event',
    body: safeText(event.eventDescription),
    location: safeLocation(event),
    startdt: start.toISOString(),
    enddt: end.toISOString(),
  });

  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
}

/** Yahoo Calendar "create event" URL. */
export function generateYahooCalendarUrl(event: Event): string {
  const { start, end } = resolveRange(event);

  const params = new URLSearchParams({
    v: '60',
    title: safeText(event.eventName) || 'Event',
    st: formatBasicUtc(start),
    et: formatBasicUtc(end),
    desc: safeText(event.eventDescription),
    in_loc: safeLocation(event),
  });

  return `https://calendar.yahoo.com/?${params.toString()}`;
}

/**
 * Build the list of IANA timezones we expose in the create/edit forms.
 * Falls back to a curated short list if the runtime can't enumerate
 * `Intl.supportedValuesOf('timeZone')`.
 */
const FALLBACK_TIMEZONES = [
  'UTC',
  'America/Los_Angeles',
  'America/Denver',
  'America/Chicago',
  'America/New_York',
  'America/Phoenix',
  'America/Anchorage',
  'America/Honolulu',
  'America/Toronto',
  'America/Mexico_City',
  'America/Sao_Paulo',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Europe/Madrid',
  'Europe/Moscow',
  'Africa/Cairo',
  'Africa/Johannesburg',
  'Asia/Dubai',
  'Asia/Karachi',
  'Asia/Kolkata',
  'Asia/Bangkok',
  'Asia/Shanghai',
  'Asia/Singapore',
  'Asia/Tokyo',
  'Asia/Seoul',
  'Australia/Sydney',
  'Pacific/Auckland',
];

export const SUPPORTED_TIMEZONES: string[] = (() => {
  const intlAny = Intl as unknown as { supportedValuesOf?: (key: string) => string[] };
  if (typeof intlAny.supportedValuesOf === 'function') {
    try {
      const all = intlAny.supportedValuesOf('timeZone');
      if (Array.isArray(all) && all.length > 0) return all;
    } catch {
      // fall through to fallback
    }
  }
  return FALLBACK_TIMEZONES;
})();

/**
 * Format a tz id like "America/Los_Angeles" → "(GMT-07:00) America/Los Angeles"
 * for nicer display in the dropdown.
 */
export function describeTimeZone(tz: string, at: Date = new Date()): string {
  try {
    const offset = formatInTimeZone(at, tz, 'XXX');
    return `(GMT${offset === 'Z' ? '+00:00' : offset}) ${tz.replace(/_/g, ' ')}`;
  } catch {
    return tz;
  }
}

// Re-export the underlying helpers in case callers want direct access.
export { fromZonedTime, toZonedTime, formatInTimeZone };
