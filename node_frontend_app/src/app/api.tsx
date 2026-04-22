//  this file will communicate with backend api's using http calls
import axios from 'axios';
import type {
  AdminUserRow,
  Booking,
  BookingAdminMetrics,
  Event,
  EventAdminMetrics,
  EventBookingSummary,
  EventCategory,
  OrganizerEventSummary,
  PageResponse,
  TicketTypeApi,
  TicketTypeDraft,
  User,
  UserBooking,
  UserBookingCounts,
} from './types';

function mapBookingResponseToBooking(d: Record<string, unknown>): Booking {
  const statusRaw = String(d.status ?? '').toUpperCase();
  const confirmed =
    statusRaw === 'CONFIRMED' || statusRaw === 'CHECKED_IN' || statusRaw === 'BOOKED';
  return {
    id: String(d.bookingId ?? ''),
    eventId: String(d.eventId ?? ''),
    userId: String(d.userId ?? ''),
    userName: String(d.userName ?? ''),
    userEmail: String(d.userEmail ?? ''),
    ticketQuantity: Number(d.quantity ?? 0),
    totalAmount: Number(d.totalAmount ?? 0),
    bookingDate: String(d.createdAt ?? ''),
    status: confirmed ? 'confirmed' : 'cancelled',
  };
}

function mapBookingResponseForUserToUserBooking(d: Record<string, unknown>): UserBooking {
  const loc = (d.eventLocation as Record<string, unknown>) || {};
  return {
    bookingId: String(d.bookingId ?? ''),
    bookingReference: String(d.bookingReference ?? ''),
    eventId: String(d.eventId ?? ''),
    userId: String(d.userId ?? ''),
    userName: String(d.userName ?? ''),
    userEmail: String(d.userEmail ?? ''),
    quantity: Number(d.quantity ?? 0),
    totalAmount: Number(d.totalAmount ?? 0),
    createdAt: String(d.createdAt ?? ''),
    eventName: String(d.eventName ?? ''),
    eventDescription: String(d.eventDescription ?? ''),
    eventStartInstant: String(d.eventStartInstant ?? ''),
    eventEndInstant: String(d.eventEndInstant ?? ''),
    imageUrl: String(d.eventImageUrl ?? ''),
    status: String(d.status ?? ''),
    eventOwnerId: String(d.eventOwnerId ?? ''),
    eventOwnerName: String(d.eventOwnerName ?? ''),
    eventLocation: {
      locationName: String(loc.locationName ?? ''),
      locationAddress: String(loc.locationAddress ?? ''),
      latitude: loc.latitude != null ? Number(loc.latitude) : null,
      longitude: loc.longitude != null ? Number(loc.longitude) : null,
    },
    eventTimeZone: String(d.eventTimeZone ?? ''),
  };
}

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
const AUTH_STORAGE_KEY = 'user';

type StoredUser = User & {
  refreshToken?: string;
};

let refreshPromise: Promise<string> | null = null;

function mapBackendRole(role: unknown): User['role'] {
  if (role === 'ORGANIZER' || role === 'ADMIN') return role;
  return 'ATTENDEE';
}

function readStoredUser(): StoredUser | null {
  const userStr = localStorage.getItem(AUTH_STORAGE_KEY);
  if (!userStr) return null;

  try {
    return JSON.parse(userStr) as StoredUser;
  } catch {
    return null;
  }
}

function writeStoredUser(user: StoredUser): void {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
}

// Add interceptor to include token
axios.interceptors.request.use((config) => {
  const requestUrl = config.url ?? '';
  const isAuthPath =
    requestUrl.includes('/auth/login') ||
    requestUrl.includes('/auth/register') ||
    requestUrl.includes('/auth/refresh');

  if (isAuthPath) {
    return config;
  }

  const user = readStoredUser();
  if (user?.token) {
    config.headers.Authorization = `Bearer ${user.token}`;
  }
  return config;
});

axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as { _retry?: boolean; url?: string; headers?: Record<string, string> };
    const status = error?.response?.status;
    const requestUrl = originalRequest?.url ?? '';

    const isAuthPath =
      requestUrl.includes('/auth/login') ||
      requestUrl.includes('/auth/register') ||
      requestUrl.includes('/auth/refresh');

    if (status !== 401 || !originalRequest || originalRequest._retry || isAuthPath) {
      return Promise.reject(error);
    }

    const storedUser = readStoredUser();
    const currentRefreshToken = storedUser?.refreshToken;
    if (!storedUser || !currentRefreshToken) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      if (!refreshPromise) {
        refreshPromise = axios
          .post(`${API_BASE_URL}/auth/refresh`, { refreshToken: currentRefreshToken })
          .then((resp) => {
            const newAccessToken = resp.data?.accessToken;
            const newRefreshToken = resp.data?.refreshToken;
            if (!newAccessToken || !newRefreshToken) {
              throw new Error('Invalid refresh response');
            }
            writeStoredUser({
              ...storedUser,
              token: newAccessToken,
              refreshToken: newRefreshToken,
            });
            return newAccessToken as string;
          })
          .finally(() => {
            refreshPromise = null;
          });
      }

      const newToken = await refreshPromise;
      originalRequest.headers = originalRequest.headers ?? {};
      originalRequest.headers.Authorization = `Bearer ${newToken}`;
      return axios(originalRequest);
    } catch (refreshError) {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      return Promise.reject(refreshError);
    }
  }
);

export function runAPI() {
  return {
    // Auth
    login: async (email: string, password: string): Promise<User> => {
      const response = await axios.post(`${API_BASE_URL}/auth/login`, { email, password });
      const data = response.data;
      const authUser: StoredUser = {
        id: data.user?.id,
        name: data.user?.username || data.user?.email || email,
        email: data.user?.email || email,
        role: mapBackendRole(data.user?.role),
        token: data.accessToken,
        refreshToken: data.refreshToken,
      };
      writeStoredUser(authUser);
      return authUser;
    },

    register: async (user: any): Promise<User> => {
      const response = await axios.post(`${API_BASE_URL}/auth/register`, user);
      const data = response.data;
      const authUser: StoredUser = {
        id: data.user?.id,
        name: data.user?.username || user.name || data.user?.email || user.email,
        email: data.user?.email || user.email,
        role: mapBackendRole(data.user?.role),
        token: data.accessToken,
        refreshToken: data.refreshToken,
      };
      writeStoredUser(authUser);
      return authUser;
    },

    // Categories
    getCategories: async (): Promise<EventCategory[]> => {
      const response = await axios.get(`${API_BASE_URL}/events/categories`);
      return response.data;
    },

    addCategory: async (category: EventCategory): Promise<EventCategory> => {
      const response = await axios.post(`${API_BASE_URL}/events/categories`, category);
      return response.data;
    },

    updateCategory: async (id: string, category: EventCategory): Promise<EventCategory> => {
      const response = await axios.put(`${API_BASE_URL}/events/categories/${id}`, category);
      return response.data;
    },

    deleteCategory: async (id: string): Promise<void> => {
      await axios.delete(`${API_BASE_URL}/events/categories/${id}`);
    },

    // Events
    getEvents: async (): Promise<Event[]> => {
      const response = await axios.get(`${API_BASE_URL}/events`);
      return response.data;
    },

    getEventAdminMetrics: async (): Promise<EventAdminMetrics> => {
      const response = await axios.get(`${API_BASE_URL}/events/admin/metrics`);
      return response.data;
    },

    getAdminEventsPaged: async (params: {
      page?: number;
      size?: number;
      status?: string | null;
      q?: string;
    }): Promise<PageResponse<Event>> => {
      const sp = new URLSearchParams();
      sp.set('page', String(params.page ?? 0));
      sp.set('size', String(params.size ?? 10));
      if (params.status) sp.set('status', params.status);
      if (params.q?.trim()) sp.set('q', params.q.trim());
      const response = await axios.get(`${API_BASE_URL}/events/admin/paged?${sp.toString()}`);
      return response.data;
    },
    getActiveEvents: async (): Promise<Event[]> => {
      const response = await axios.get(`${API_BASE_URL}/events/activeEvents`);
      return response.data;
    },

    getActiveEventsPaged: async (params: {
      page?: number;
      size?: number;
      q?: string;
    }): Promise<PageResponse<Event>> => {
      const sp = new URLSearchParams();
      sp.set('page', String(params.page ?? 0));
      sp.set('size', String(params.size ?? 12));
      if (params.q?.trim()) sp.set('q', params.q.trim());
      const response = await axios.get(`${API_BASE_URL}/events/activeEvents/paged?${sp.toString()}`);
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

    getOrganizerSummary: async (organizerId: string): Promise<OrganizerEventSummary> => {
      const response = await axios.get(
        `${API_BASE_URL}/events/organizer/${encodeURIComponent(organizerId)}/summary`
      );
      return response.data;
    },

    getOrganizerEventsPaged: async (params: {
      organizerId: string;
      tab?: string;
      page?: number;
      size?: number;
    }): Promise<PageResponse<Event>> => {
      const sp = new URLSearchParams();
      sp.set('page', String(params.page ?? 0));
      sp.set('size', String(params.size ?? 8));
      sp.set('tab', params.tab ?? 'all');
      const response = await axios.get(
        `${API_BASE_URL}/events/organizer/${encodeURIComponent(params.organizerId)}/events/paged?${sp.toString()}`
      );
      return response.data;
    },
    // Event Approvals
    getPendingEvents: async (): Promise<Event[]> => {
      const response = await axios.get(`${API_BASE_URL}/events/pending`);
      return response.data;
    },

    // Bookings
    getBookings: async (): Promise<Booking[]> => {
      const response = await axios.get(`${API_BASE_URL}/bookings/allBookings`);
      const list = Array.isArray(response.data) ? response.data : [];
      return list.map((d: { ticketId: number; eventId: number; eventName?: string; userId: number; username?: string; email?: string; quantity: number; status: string; bookingDate: string; ticketType?: string; totalPrice: number }) => ({
        id: String(d.ticketId),
        eventId: String(d.eventId),
        userId: String(d.userId),
        userName: d.username ?? '',
        userEmail: d.email ?? '',
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

    getEventBookingsPaged: async (params: {
      eventId: string;
      page?: number;
      size?: number;
    }): Promise<PageResponse<Booking>> => {
      const sp = new URLSearchParams();
      sp.set('page', String(params.page ?? 0));
      sp.set('size', String(params.size ?? 10));
      const response = await axios.get(
        `${API_BASE_URL}/bookings/event/${encodeURIComponent(params.eventId)}/paged?${sp.toString()}`
      );
      const data = response.data;
      const rawContent = Array.isArray(data.content) ? data.content : [];
      return {
        ...data,
        content: rawContent.map((row: Record<string, unknown>) => mapBookingResponseToBooking(row)),
      };
    },

    getEventBookingSummary: async (eventId: string): Promise<EventBookingSummary> => {
      const response = await axios.get(
        `${API_BASE_URL}/bookings/event/${encodeURIComponent(eventId)}/summary`
      );
      return response.data;
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

    getAllBookings: async (): Promise<Booking[]> => {
      const response = await axios.get(`${API_BASE_URL}/bookings/allBookings`);
      const list = Array.isArray(response.data) ? response.data : [];
      return list;
    },

    getBookingAdminMetrics: async (): Promise<BookingAdminMetrics> => {
      const response = await axios.get(`${API_BASE_URL}/bookings/admin/metrics`);
      return response.data;
    },

    getAdminBookingsPaged: async (params: {
      page?: number;
      size?: number;
    }): Promise<PageResponse<Record<string, unknown>>> => {
      const sp = new URLSearchParams();
      sp.set('page', String(params.page ?? 0));
      sp.set('size', String(params.size ?? 10));
      const response = await axios.get(`${API_BASE_URL}/bookings/admin/paged?${sp.toString()}`);
      return response.data;
    },
    getBookingById: async (id: string): Promise<Booking | null> => {
      try {
        const response = await axios.get(`${API_BASE_URL}/bookings/bookingById/${id}`);
        const d = response.data;
        return {
          id: String(d.ticketId),
          eventId: String(d.eventId),
          userId: String(d.userId),
          userName: d.username ?? '',
          userEmail: d.email ?? '',
          ticketQuantity: d.quantity,
          totalAmount: d.totalPrice ?? 0,
          bookingDate: d.bookingDate,
          status: d.status === 'BOOKED' ? 'confirmed' : 'cancelled',
        };
      } catch (error) {
        console.error(`Error fetching booking with id ${id}:`, error);
        return null;
      }
    },

    getUserBookingByBookingId: async (id: string): Promise<UserBooking | null> => {
      try {
        const response = await axios.get(`${API_BASE_URL}/bookings/userBookingById/${id}`);
        const d = response.data;
        return d;
      } catch (error) {
        console.error(`Error fetching booking with id ${id}:`, error);
        return null;
      }
    },

    cancelBooking: async (id: string): Promise<void> => {
      await axios.put(`${API_BASE_URL}/bookings/${id}/cancel`);
    },

    getUserBookings: async (userId: string): Promise<UserBooking[]> => {
      const response = await axios.get(`${API_BASE_URL}/bookings/user/${userId}`);
      const list = Array.isArray(response.data) ? response.data : [];
      return list;
    },

    getUserBookingCounts: async (userId: string): Promise<UserBookingCounts> => {
      const response = await axios.get(`${API_BASE_URL}/bookings/user/${encodeURIComponent(userId)}/counts`);
      return response.data;
    },

    getUserBookingsPaged: async (params: {
      userId: string;
      page?: number;
      size?: number;
    }): Promise<PageResponse<UserBooking>> => {
      const sp = new URLSearchParams();
      sp.set('page', String(params.page ?? 0));
      sp.set('size', String(params.size ?? 10));
      const response = await axios.get(
        `${API_BASE_URL}/bookings/user/${encodeURIComponent(params.userId)}/paged?${sp.toString()}`
      );
      const data = response.data;
      const rawContent = Array.isArray(data.content) ? data.content : [];
      return {
        ...data,
        content: rawContent.map((row: Record<string, unknown>) => mapBookingResponseForUserToUserBooking(row)),
      };
    },

    getEventsBookedByUserId: async (userId: string): Promise<Event[]> => {
      const response = await axios.get(`${API_BASE_URL}/bookings/user/${userId}/events`);
      return response.data;
    },

    cancelBookingByUserIdAndEventId: async (userId: string, eventId: string): Promise<void> => {
      await axios.put(`${API_BASE_URL}/bookings/${userId}/${eventId}/cancel`);
    },

    // Users (admin list uses identity `/admin/users`; legacy path kept for callers)
    getAdminUsersPaged: async (params: {
      page?: number;
      size?: number;
      role?: string;
      q?: string;
    }): Promise<PageResponse<AdminUserRow>> => {
      const sp = new URLSearchParams();
      sp.set('page', String(params.page ?? 0));
      sp.set('size', String(params.size ?? 10));
      if (params.role) sp.set('role', params.role);
      if (params.q?.trim()) sp.set('q', params.q.trim());
      const response = await axios.get(`${API_BASE_URL}/admin/users?${sp.toString()}`);
      const data = response.data;
      const rawContent = Array.isArray(data.content) ? data.content : [];
      const content: AdminUserRow[] = rawContent.map((row: { id?: string; email?: string; role?: AdminUserRow['role'] }) => ({
        id: row.id != null ? String(row.id) : '',
        email: row.email ?? '',
        role: (row.role ?? 'ATTENDEE') as AdminUserRow['role'],
      }));
      return {
        ...data,
        content,
      };
    },

    getUsers: async (): Promise<User[]> => {
      const sp = new URLSearchParams();
      sp.set('page', '0');
      sp.set('size', '500');
      const response = await axios.get(`${API_BASE_URL}/admin/users?${sp.toString()}`);
      const data = response.data;
      const rawContent = Array.isArray(data.content) ? data.content : [];
      return rawContent.map((row: { id?: string; email?: string; role?: User['role'] }) => ({
        id: row.id != null ? String(row.id) : '',
        name: row.email ?? '',
        email: row.email ?? '',
        role: (row.role ?? 'ATTENDEE') as User['role'],
        token: '',
      }));
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