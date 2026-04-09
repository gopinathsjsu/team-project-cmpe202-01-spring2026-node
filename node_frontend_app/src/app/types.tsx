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
