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
  timezone: string;
  eventPublishDate: string;
  updatedAt: string | null;
  status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'cancelled' | 'published';
  tags: string[];
  createdAt: string | null;

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
