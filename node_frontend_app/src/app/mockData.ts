import type { Event, Booking, User } from './types';

export const categories = [
  'Music',
  'Business',
  'Food & Drink',
  'Health',
  'Sports & Fitness',
  'Technology',
  'Arts & Culture',
  'Education',
  'Charity & Causes',
  'Other'
];

export const mockUsers: User[] = [
  {
    id: 'user-1',
    name: 'John Attendee',
    email: 'john@example.com',
    role: 'attendee'
  },
  {
    id: 'user-2',
    name: 'Sarah Organizer',
    email: 'sarah@example.com',
    role: 'organizer'
  },
  {
    id: 'user-3',
    name: 'Admin User',
    email: 'admin@example.com',
    role: 'admin'
  }
];

export const mockEvents: Event[] = [
  {
    id: 'evt-1',
    title: 'Summer Music Festival 2026',
    description: 'Join us for an unforgettable evening of live music featuring top artists from around the world. Experience multiple stages, food vendors, and an amazing atmosphere.',
    category: 'Music',
    date: '2026-07-15',
    time: '18:00',
    location: 'San Francisco, CA',
    venue: 'Golden Gate Park',
    price: 89.99,
    capacity: 5000,
    ticketsSold: 3421,
    image: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea',
    organizerId: 'user-2',
    organizerName: 'Sarah Organizer',
    status: 'published',
    tags: ['outdoor', 'festival', 'live-music'],
    createdAt: '2026-01-15T10:00:00Z'
  },
  {
    id: 'evt-2',
    title: 'Tech Innovation Summit',
    description: 'Discover the latest trends in AI, blockchain, and emerging technologies. Network with industry leaders and attend workshops led by top experts.',
    category: 'Technology',
    date: '2026-03-20',
    time: '09:00',
    location: 'New York, NY',
    venue: 'Javits Center',
    price: 299.99,
    capacity: 2000,
    ticketsSold: 1847,
    image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87',
    organizerId: 'user-2',
    organizerName: 'Sarah Organizer',
    status: 'published',
    tags: ['conference', 'networking', 'innovation'],
    createdAt: '2026-01-10T14:00:00Z'
  },
  {
    id: 'evt-3',
    title: 'Wine Tasting Evening',
    description: 'Sample exquisite wines from local vineyards paired with gourmet cheeses. Learn from expert sommeliers about wine selection and tasting techniques.',
    category: 'Food & Drink',
    date: '2026-02-28',
    time: '19:00',
    location: 'Napa Valley, CA',
    venue: 'Vineyard Estate',
    price: 75.00,
    capacity: 100,
    ticketsSold: 92,
    image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3',
    organizerId: 'user-2',
    organizerName: 'Sarah Organizer',
    status: 'published',
    tags: ['tasting', 'wine', 'gourmet'],
    createdAt: '2026-01-20T16:00:00Z'
  },
  {
    id: 'evt-4',
    title: 'Charity Marathon Run',
    description: 'Run for a cause! All proceeds go to local children\'s hospitals. Choose from 5K, 10K, or full marathon distances. Every participant receives a medal.',
    category: 'Sports & Fitness',
    date: '2026-04-10',
    time: '07:00',
    location: 'Boston, MA',
    venue: 'City Center',
    price: 45.00,
    capacity: 10000,
    ticketsSold: 7234,
    image: 'https://images.unsplash.com/photo-1452626038306-9aae5e071dd3',
    organizerId: 'user-2',
    organizerName: 'Sarah Organizer',
    status: 'published',
    tags: ['charity', 'running', 'fitness'],
    createdAt: '2026-01-05T08:00:00Z'
  },
  {
    id: 'evt-5',
    title: 'Modern Art Exhibition',
    description: 'Explore contemporary art from emerging artists. Interactive installations, guided tours, and artist meet-and-greets throughout the day.',
    category: 'Arts & Culture',
    date: '2026-03-05',
    time: '10:00',
    location: 'Chicago, IL',
    venue: 'Contemporary Art Museum',
    price: 25.00,
    capacity: 500,
    ticketsSold: 387,
    image: 'https://images.unsplash.com/photo-1561214115-f2f134cc4912',
    organizerId: 'user-2',
    organizerName: 'Sarah Organizer',
    status: 'published',
    tags: ['art', 'exhibition', 'culture'],
    createdAt: '2026-01-18T12:00:00Z'
  },
  {
    id: 'evt-6',
    title: 'Business Leadership Workshop',
    description: 'A full-day intensive workshop on leadership skills, team management, and business strategy. Includes lunch and networking sessions.',
    category: 'Business',
    date: '2026-02-25',
    time: '08:30',
    location: 'Austin, TX',
    venue: 'Convention Center',
    price: 199.00,
    capacity: 300,
    ticketsSold: 245,
    image: 'https://images.unsplash.com/photo-1552664730-d307ca884978',
    organizerId: 'user-2',
    organizerName: 'Sarah Organizer',
    status: 'published',
    tags: ['workshop', 'leadership', 'business'],
    createdAt: '2026-01-12T09:00:00Z'
  },
  {
    id: 'evt-7',
    title: 'Jazz Night Under the Stars',
    description: 'An intimate evening of smooth jazz with renowned musicians. Bring a blanket and enjoy music under the night sky with craft cocktails available.',
    category: 'Music',
    date: '2026-05-18',
    time: '20:00',
    location: 'Seattle, WA',
    venue: 'Waterfront Park',
    price: 55.00,
    capacity: 800,
    ticketsSold: 612,
    image: 'https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f',
    organizerId: 'user-2',
    organizerName: 'Sarah Organizer',
    status: 'published',
    tags: ['jazz', 'outdoor', 'music'],
    createdAt: '2026-01-22T15:00:00Z'
  },
  {
    id: 'evt-8',
    title: 'Yoga & Wellness Retreat',
    description: 'A weekend of relaxation, meditation, and yoga sessions. Includes healthy meals, spa access, and wellness workshops with certified instructors.',
    category: 'Health',
    date: '2026-06-12',
    time: '09:00',
    location: 'Sedona, AZ',
    venue: 'Mountain Resort',
    price: 450.00,
    capacity: 50,
    ticketsSold: 38,
    image: 'https://images.unsplash.com/photo-1545389336-cf090694435e',
    organizerId: 'user-2',
    organizerName: 'Sarah Organizer',
    status: 'published',
    tags: ['wellness', 'yoga', 'retreat'],
    createdAt: '2026-01-25T11:00:00Z'
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
