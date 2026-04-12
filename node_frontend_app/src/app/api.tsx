//  this file will communicate with backend api's using http calls
import axios from 'axios';
import type { Event, Booking, User, EventCategory, TicketTypeDraft, TicketTypeApi, UserBooking } from './types';

function normalizeTicketTypeApi(raw: unknown): TicketTypeApi | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const id = r.id != null ? String(r.id) : '';
  if (!id) return null;
  return {
    id,
    eventId: r.eventId != null ? String(r.eventId) : '',
    ticketType: String(r.ticketType ?? ''),
    description: (r.description as string) ?? null,
    price: r.price != null ? Number(r.price) : 0,
    totalQuantity: Number(r.totalQuantity ?? 0),
    waitlistCapacity: r.waitlistCapacity != null ? Number(r.waitlistCapacity) : 0,
    soldQuantity: r.soldQuantity != null ? Number(r.soldQuantity) : 0,
    availableQuantity:
      r.availableQuantity != null
        ? Number(r.availableQuantity)
        : Math.max(0, Number(r.totalQuantity ?? 0) - Number(r.soldQuantity ?? 0)),
  };
}

// Use same-origin `/api/v1` in dev so Vite can proxy to event (8080) vs booking (8082).
// Override with VITE_API_BASE_URL when serving the SPA behind a gateway.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api/v1';

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
    getActiveEvents: async (): Promise<Event[]> => {
      const response = await axios.get(`${API_BASE_URL}/events/activeEvents`);
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
    approveEvent: async (id: string, approverId: string): Promise<Event> => {
      const response = await axios.put(`${API_BASE_URL}/events/${id}/approve?approverId=${approverId}`);
      return response.data;
    },
    rejectEvent: async (id: string, adminId: string, reason: string): Promise<Event> => {
      const params = new URLSearchParams({ adminId });
      if (reason) params.set('reason', reason);
      const response = await axios.put(`${API_BASE_URL}/events/${id}/reject?${params.toString()}`);
      return response.data;
    },
    updateEventStatus: async (id: string, status: string): Promise<Event> => {
      const response = await axios.patch(`${API_BASE_URL}/events/${id}/status?status=${status}`);
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

    // Bookings
    getBookings: async (): Promise<Booking[]> => {
      const response = await axios.get(`${API_BASE_URL}/bookings`);
      const list = Array.isArray(response.data) ? response.data : [];
      return list.map((d: { ticketId: number; eventId: number; eventName?: string; userId: number; username?: string; quantity: number; status: string; bookingDate: string; ticketType?: string; totalPrice: number }) => ({
        id: String(d.ticketId),
        eventId: String(d.eventId),
        userId: String(d.userId),
        userName: d.username ?? '',
        userEmail: '',
        ticketQuantity: d.quantity,
        totalAmount: d.totalPrice ?? 0,
        bookingDate: d.bookingDate,
        status: d.status === 'BOOKED' ? 'confirmed' : 'cancelled',
      }));
    },
     getEventBookings: async (eventId: string): Promise<Booking[]> => {
      const response = await axios.get(`${API_BASE_URL}/bookings/event/${eventId}`);
      const list = Array.isArray(response.data) ? response.data : [];
      return list;
    },
    addBooking: async (booking: Booking, ticketTypeName?: string): Promise<Booking> => {
      const response = await axios.post(`${API_BASE_URL}/bookings`, {
        eventId: String(booking.eventId),
        userId: String(booking.userId),
        userEmail: booking.userEmail,
        quantity: booking.ticketQuantity,
        ticketType: ticketTypeName?.trim() || 'General',
      });
      const d = response.data;
      return {
        id: String(d.ticketId),
        eventId: String(d.eventId),
        userId: String(d.userId),
        userName: d.username ?? booking.userName,
        userEmail: booking.userEmail ?? '',
        ticketQuantity: d.quantity,
        totalAmount: d.totalPrice ?? 0,
        bookingDate: d.bookingDate,
        status: d.status === 'BOOKED' ? 'confirmed' : 'cancelled',
      };
    },
    cancelBooking: async (id: string): Promise<void> => {
      await axios.put(`${API_BASE_URL}/bookings/${id}/cancel`);
    },

    getUserBookings: async (userId: string): Promise<UserBooking[]> => {
      const response = await axios.get(`${API_BASE_URL}/bookings/user/${userId}`);
      const list = Array.isArray(response.data) ? response.data : [];
      return list;
    },

    getEventsBookedByUserId: async (userId: string): Promise<Event[]> => {
      const response = await axios.get(`${API_BASE_URL}/bookings/user/${userId}/events`);
      return response.data;
    },

    cancelBookingByUserIdAndEventId: async (userId: string, eventId: string): Promise<void> => {
      await axios.put(`${API_BASE_URL}/bookings/${userId}/${eventId}/cancel`);
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

    /** Booking service: ticket types for an event (requires JWT when booking service enforces auth) */
    getTicketTypesForEvent: async (eventId: string): Promise<TicketTypeApi[]> => {
      const response = await axios.get(`${API_BASE_URL}/ticket-types/event/${eventId}`);
      return Array.isArray(response.data) ? response.data : [];
    },

    assignTicketTypesToEvent: async (
      eventId: string,
      items: Array<{
        ticketType: string;
        description?: string;
        price: number;
        totalQuantity: number;
        waitlistCapacity?: number;
      }>
    ): Promise<TicketTypeApi[]> => {
      const body = items.map((i) => ({
        ticketType: i.ticketType,
        description: i.description,
        price: i.price,
        totalQuantity: i.totalQuantity,
        waitlistCapacity: i.waitlistCapacity ?? 0,
      }));
      const response = await axios.post(`${API_BASE_URL}/ticket-types/event/${eventId}`, body);
      return response.data;
    },

    createTicketType: async (
      eventId: string,
      item: {
        ticketType: string;
        description?: string;
        price: number;
        totalQuantity: number;
        waitlistCapacity?: number;
      }
    ): Promise<TicketTypeApi> => {
      const response = await axios.post(`${API_BASE_URL}/ticket-types`, {
        eventId: String(eventId),
        ticketType: item.ticketType,
        description: item.description,
        price: item.price,
        totalQuantity: item.totalQuantity,
        waitlistCapacity: item.waitlistCapacity ?? 0,
      });
      const n = normalizeTicketTypeApi(response.data);
      if (!n) throw new Error('Invalid ticket type response');
      return n;
    },

    updateTicketType: async (
      ticketTypeId: string,
      eventId: string,
      item: {
        ticketType: string;
        description?: string;
        price: number;
        totalQuantity: number;
        waitlistCapacity?: number;
      }
    ): Promise<TicketTypeApi> => {
      const response = await axios.put(`${API_BASE_URL}/ticket-types/${encodeURIComponent(ticketTypeId)}`, {
        eventId: String(eventId),
        ticketType: item.ticketType,
        description: item.description,
        price: item.price,
        totalQuantity: item.totalQuantity,
        waitlistCapacity: item.waitlistCapacity ?? 0,
      });
      const n = normalizeTicketTypeApi(response.data);
      if (!n) throw new Error('Invalid ticket type response');
      return n;
    },

    deleteTicketType: async (ticketTypeId: string): Promise<void> => {
      await axios.delete(`${API_BASE_URL}/ticket-types/${encodeURIComponent(ticketTypeId)}`);
    },

    /**
     * Reconcile form rows with booking-service ticket types: remove deleted rows (if none sold),
     * update existing, create new.
     */
    syncTicketTypesForEvent: async (eventId: string, rows: TicketTypeDraft[]): Promise<void> => {
      const valid = rows.filter((r) => r.ticketType.trim() && r.totalQuantity > 0);
      const existing = await axios
        .get(`${API_BASE_URL}/ticket-types/event/${encodeURIComponent(String(eventId))}`)
        .then((r) =>
          Array.isArray(r.data)
            ? (r.data as unknown[]).map(normalizeTicketTypeApi).filter((x): x is TicketTypeApi => x != null)
            : []
        );
      const keptIds = new Set(
        valid.map((r) => r.backendId).filter((id): id is string => id != null && id !== '')
      );
      for (const ex of existing) {
        if (!keptIds.has(String(ex.id))) {
          const sold = ex.soldQuantity ?? 0;
          if (sold > 0) continue;
          await axios.delete(`${API_BASE_URL}/ticket-types/${encodeURIComponent(String(ex.id))}`);
        }
      }
      const eid = String(eventId);
      for (const r of valid) {
        const payload = {
          ticketType: r.ticketType.trim(),
          description: r.description.trim() || undefined,
          price: r.price,
          totalQuantity: r.totalQuantity,
          waitlistCapacity: r.waitlistCapacity ?? 0,
        };
        if (r.backendId != null && r.backendId !== '') {
          await axios.put(`${API_BASE_URL}/ticket-types/${encodeURIComponent(r.backendId)}`, {
            eventId: eid,
            ...payload,
          });
        } else {
          await axios.post(`${API_BASE_URL}/ticket-types`, {
            eventId: eid,
            ...payload,
          });
        }
      }
    },
  };
}

export function newTicketTypeRow(partial?: Partial<TicketTypeDraft>): TicketTypeDraft {
  return {
    localKey:
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `row-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    ticketType: partial?.ticketType ?? '',
    description: partial?.description ?? '',
    price: partial?.price ?? 0,
    totalQuantity: partial?.totalQuantity ?? 0,
    waitlistCapacity: partial?.waitlistCapacity ?? 0,
    backendId: partial?.backendId,
    soldQuantity: partial?.soldQuantity,
  };
}

export function ticketTypeApiToDraft(api: TicketTypeApi): TicketTypeDraft {
  return newTicketTypeRow({
    backendId: String(api.id),
    ticketType: api.ticketType,
    description: api.description ?? '',
    price: typeof api.price === 'number' ? api.price : Number(api.price),
    totalQuantity: api.totalQuantity,
    waitlistCapacity: api.waitlistCapacity ?? 0,
    soldQuantity: api.soldQuantity ?? 0,
  });
}