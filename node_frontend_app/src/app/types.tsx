export type UserRole = 'attendee' | 'organizer' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  category: string;
  date: string;
  time: string;
  location: string;
  venue: string;
  price: number;
  capacity: number;
  ticketsSold: number;
  image: string;
  organizerId: string;
  organizerName: string;
  status: 'draft' | 'published' | 'cancelled';
  tags: string[];
  createdAt: string;
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
  title: string;
  description: string;
  category: string;
  date: string;
  time: string;
  location: string;
  venue: string;
  price: number;
  capacity: number;
  image: string;
  tags: string[];
}
