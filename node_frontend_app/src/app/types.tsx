export type UserRole = 'USER' | 'ORGANIZER' | 'ADMIN';

export interface User {
  id: string;
  name: string;
  email: string;
  token: string;
  role: UserRole;
  avatar?: string;
}

export interface EventCategory {
  id: string;
  categoryName: string;
  description: string;
  imageUrl: string;
}

export interface Event {
  eventId: string | null;
  eventName: string;
  eventDescription: string;
  categories: string[];
  maxCapacity: number;
  waitlistCapacity: number;
  eventLocation: {
    locationName: string;
    locationAddress: string;
    latitude: number | null;
    longitude: number | null;
  };

  ticketPrice: number;
  ticketsSold: number;
  imageUrl: string;
  eventOwnerId: string;
  approverId: string | null;
  eventStartDate: string;
  eventEndDate: string;
  eventStartInstant: string;
  eventEndInstant: string;
  eventTimeZone: string;
  eventPublishDate: string;
  updatedAt: string | null;
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'PUBLISHED' | 'COMPLETED' | 'SUSPENDED';
  tags: string[];
  createdAt: string | null;
  eventOwnerName?: string;
}

export interface Booking {
  id: string;
  eventId: string;
  userId: string;
  userName: string;
  userEmail: string;
  ticketQuantity: number;
  totalAmount: number;
  bookingDate: string;
  status: 'confirmed' | 'cancelled';
}

export interface EventFormData {
  eventName: string;
  eventDescription: string;
  categories: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  timeZone: string;
  location: string;
  venue: string;
  price: number;
  maxCapacity: number;
  waitlistCapacity: number;
  image: string;
  tags: string[];
}

export interface TicketTypes {
  id?: string;
  name: string;
  description: string;
  ticketType: string;
  price: number | '0.00';
  quantity: number;
  waitlistCapacity: number | 0;
  serviceFee: number;
  total: number;
}

/** Draft row for create/edit event forms (booking service) */
export interface TicketTypeDraft {
  localKey: string;
  /** Booking service uses string UUID primary keys */
  backendId?: string;
  ticketType: string;
  description: string;
  price: number;
  totalQuantity: number;
  waitlistCapacity: number;
  soldQuantity?: number;
}

/** Response from GET /api/v1/ticket-types/event/{eventId} */
export interface TicketTypeApi {
  id: string;
  eventId: string;
  ticketType: string;
  description?: string | null;
  price: number;
  totalQuantity: number;
  waitlistCapacity?: number | null;
  soldQuantity?: number | null;
  availableQuantity?: number | null;
}

export interface UserBooking {
  bookingId: string;
  bookingReference: string;
  eventId: string;
  userId: string;
  userName: string;
  userEmail: string;
  quantity: number;
  totalAmount: number;
  createdAt: string;
  eventName: string;
  eventDescription: string;
  eventStartInstant: string;
  eventEndInstant: string;
  imageUrl: string;
  status: String;
  eventOwnerId: string;
  eventOwnerName: string;
  eventLocation: {
    locationName: string;
    locationAddress: string;
    latitude: number | null;
    longitude: number | null;
  };
  eventTimeZone: string;
}
