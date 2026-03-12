import type { Event, Booking } from './types';


export const mockEvents: Event[] = [
  {
    eventId: 'evt-1',
    eventName: 'Summer Music Festival 2026',
    eventDescription: 'Join us for an unforgettable evening of live music featuring top artists from around the world. Experience multiple stages, food vendors, and an amazing atmosphere.',
    categories: ['Music'],
    maxCapacity: 5000,
    waitlistCapacity: 5000,
    eventLocation: {
      locationName: 'San Francisco, CA',
      locationAddress: 'San Francisco, CA',
      latitude: null,
      longitude: null
    },
    ticketPrice: 89.99,
    ticketsSold: 3421,
    imageUrl: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea',
    eventOwnerId: 'user-2',
    approverId: null,
    eventStartDate: '2026-01-15T10:00:00Z',
    eventEndDate: '2026-01-15T10:00:00Z',
    eventStartInstant: '2026-01-15T10:00:00Z',
    eventEndInstant: '2026-01-15T10:00:00Z',
    eventPublishDate: '2026-01-15T10:00:00Z',
    eventTimeZone: 'America/Los_Angeles',
    updatedAt: null,
    status: 'published',
    tags: ['outdoor', 'festival', 'live-music'],
    createdAt: '2026-01-15T10:00:00Z'
  }
];

export const mockBookings: Booking[] = [
  {
    id: 'booking-1',
    eventId: 'evt-1',
    userId: 'user-1',
    userName: 'John Attendee',
    userEmail: 'john@example.com',
    ticketQuantity: 2,
    totalAmount: 179.98,
    bookingDate: '2026-01-20T14:30:00Z',
    status: 'confirmed'
  },
  {
    id: 'booking-2',
    eventId: 'evt-3',
    userId: 'user-1',
    userName: 'John Attendee',
    userEmail: 'john@example.com',
    ticketQuantity: 1,
    totalAmount: 75.00,
    bookingDate: '2026-01-22T10:15:00Z',
    status: 'confirmed'
  },
  {
    id: 'booking-3',
    eventId: 'evt-5',
    userId: 'user-1',
    userName: 'John Attendee',
    userEmail: 'john@example.com',
    ticketQuantity: 3,
    totalAmount: 75.00,
    bookingDate: '2026-01-24T16:45:00Z',
    status: 'confirmed'
  }
];
