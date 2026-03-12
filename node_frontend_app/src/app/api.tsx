//  this file will communicate with backend api's using http calls
import axios from 'axios';
import type { Event, Booking, User, EventCategory } from './types';

const API_BASE_URL = 'http://localhost:8080/api/v1';

// Add interceptor to include token
axios.interceptors.request.use((config) => {
  const userStr = localStorage.getItem('user');
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      if (user?.token) {
        config.headers.Authorization = `Bearer ${user.token}`;
      }
    } catch (e) {
      // ignore
    }
  }
  return config;
});

export function runAPI() {
  return {
    // Auth
    login: async (email: string, password: string): Promise<User> => {
      const response = await axios.post(`${API_BASE_URL}/auth/authenticate`, { email, password });
      const data = response.data;
      return {
        id: data.id,
        name: data.username || data.email,
        email: data.email,
        role: data.role,
        token: data.token
      };
    },

    register: async (user: any): Promise<User> => {
      const response = await axios.post(`${API_BASE_URL}/auth/register`, user);
      const data = response.data;
      return {
        id: data.id,
        name: data.username || user.name || data.email,
        email: data.email,
        role: data.role,
        token: data.token
      };
    },

    // Categories
    getCategories: async (): Promise<EventCategory[]> => {
      const response = await axios.get(`${API_BASE_URL}/event/categories`);
      return response.data;
    },

    addCategory: async (category: EventCategory): Promise<EventCategory> => {
      const response = await axios.post(`${API_BASE_URL}/event/categories`, category);
      return response.data;
    },

    updateCategory: async (id: string, category: EventCategory): Promise<EventCategory> => {
      const response = await axios.put(`${API_BASE_URL}/event/categories/${id}`, category);
      return response.data;
    },

    deleteCategory: async (id: string): Promise<void> => {
      await axios.delete(`${API_BASE_URL}/event/categories/${id}`);
    },

    // Events
    getEvents: async (): Promise<Event[]> => {
      const response = await axios.get(`${API_BASE_URL}/events`);
      return response.data;
    },
    getEventById: async (id: string): Promise<Event> => {
      const response = await axios.get(`${API_BASE_URL}/events/${id}`);
      return response.data;
    },
    addEvent: async (event: Event): Promise<Event> => {
      const response = await axios.post(`${API_BASE_URL}/events`, event);
      return response.data;
    },
    updateEvent: async (id: string, event: Partial<Event>): Promise<Event> => {
      const response = await axios.put(`${API_BASE_URL}/events/${id}`, event);
      return response.data;
    },
    deleteEvent: async (id: string): Promise<void> => {
      await axios.delete(`${API_BASE_URL}/events/${id}`);
    },

    getEventsByOwnerId: async (ownerId: string): Promise<Event[]> => {
      const response = await axios.get(`${API_BASE_URL}/events/organizer/${ownerId}`);
      return response.data;
    },

    getEventsByOwnerIdAndStatus: async (ownerId: string, status: string): Promise<Event[]> => {
      const response = await axios.get(`${API_BASE_URL}/events/organizer/${ownerId}/status/${status}`);
      return response.data;
    },
    // Event Approvals
    getPendingEvents: async (): Promise<Event[]> => {
      const response = await axios.get(`${API_BASE_URL}/events/pending`);
      return response.data;
    },
    approveEvent: async (id: string): Promise<Event> => {
      const response = await axios.put(`${API_BASE_URL}/events/${id}/approve`);
      return response.data;
    },
    rejectEvent: async (id: string): Promise<Event> => {
      const response = await axios.put(`${API_BASE_URL}/events/${id}/reject`);
      return response.data;
    },

    // Bookings
    getBookings: async (): Promise<Booking[]> => {
      const response = await axios.get(`${API_BASE_URL}/bookings`);
      return response.data;
    },
    addBooking: async (booking: Booking): Promise<Booking> => {
      const response = await axios.post(`${API_BASE_URL}/bookings`, booking);
      return response.data;
    },
    cancelBooking: async (id: string): Promise<void> => {
      await axios.put(`${API_BASE_URL}/bookings/${id}/cancel`);
    },

    getUserBookings: async (userId: string): Promise<Booking[]> => {
      const response = await axios.get(`${API_BASE_URL}/bookings/user/${userId}`);
      return response.data;
    },

    // Users
    getUsers: async (): Promise<User[]> => {
      const response = await axios.get(`${API_BASE_URL}/users`);
      return response.data;
    },
    getUserById: async (id: string): Promise<User> => {
      const response = await axios.get(`${API_BASE_URL}/users/${id}`);
      return response.data;
    },
    addUser: async (user: User): Promise<User> => {
      const response = await axios.post(`${API_BASE_URL}/users`, user);
      return response.data;
    },
    updateUser: async (id: string, user: Partial<User>): Promise<User> => {
      const response = await axios.put(`${API_BASE_URL}/users/${id}`, user);
      return response.data;
    },
    deleteUser: async (id: string): Promise<void> => {
      await axios.delete(`${API_BASE_URL}/users/${id}`);
    },


  };
}