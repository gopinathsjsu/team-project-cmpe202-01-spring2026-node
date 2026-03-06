//  this file will communicate with backend api's using http calls
import axios from 'axios';
import type { Event, Booking, User } from './types';

const API_BASE_URL = 'http://localhost:5000/api';

export function runAPI() {
  return {
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
    deleteEvent : async (id: string): Promise<void> => {
      await axios.delete(`${API_BASE_URL}/events/${id}`);
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
    deleteUser : async (id: string): Promise<void> => {
      await axios.delete(`${API_BASE_URL}/users/${id}`);
    },
  };
}