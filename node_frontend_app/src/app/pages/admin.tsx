import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '../components/ui/select';
import {
    Calendar,
    Users,
    DollarSign,
    TrendingUp,
    Shield,
    Search,
    Eye,
    Ban,
    CheckCircle,
    AlertTriangle,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import { runAPI } from '../api';
import { resolveEventImageUrl } from '@/lib/eventImageStorage';
import type { AdminUserRow, BookingAdminMetrics, Event, EventAdminMetrics } from '../types';

const PAGE_SIZE = 10;

function PaginationBar(props: {
    page: number;
    totalPages: number;
    totalElements: number;
    onPageChange: (p: number) => void;
    disabled?: boolean;
}) {
    const { page, totalPages, totalElements, onPageChange, disabled } = props;
    if (totalElements === 0) return null;
    return (
        <div className="flex items-center justify-between gap-4 pt-4 border-t mt-4">
            <p className="text-sm text-gray-600">
                Showing page {page + 1} of {Math.max(1, totalPages)} 
            </p>
            <div className="flex gap-2">
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={disabled || page <= 0}
                    onClick={() => onPageChange(page - 1)}
                >
                    <ChevronLeft className="h-4 w-4" />
                    Prev
                </Button>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={disabled || page >= totalPages - 1}
                    onClick={() => onPageChange(page + 1)}
                >
                    Next
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>
            <div>
                <p className="text-sm text-gray-600">{totalElements} item(s) total</p>
            </div>
        </div>
    );
}

function tabToEventStatus(tab: string): string | null {
    switch (tab) {
        case 'published':
            return 'PUBLISHED';
        case 'approved':
            return 'APPROVED';
        case 'cancelled':
            return 'CANCELLED';
        case 'submitted':
            return 'SUBMITTED';
        default:
            return null;
    }
}

export function AdminPanel() {
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const api = runAPI();

    const [eventMetrics, setEventMetrics] = useState<EventAdminMetrics | null>(null);
    const [bookingMetrics, setBookingMetrics] = useState<BookingAdminMetrics | null>(null);

    const [events, setEvents] = useState<Event[]>([]);
    const [eventsPage, setEventsPage] = useState(0);
    const [eventsTotal, setEventsTotal] = useState(0);
    const [eventsTotalPages, setEventsTotalPages] = useState(0);
    const [eventsLoading, setEventsLoading] = useState(false);

    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedEventSearch, setDebouncedEventSearch] = useState('');
    const [activeEventsTab, setActiveEventsTab] = useState('all');

    useEffect(() => {
        const t = window.setTimeout(() => setDebouncedEventSearch(searchQuery), 400);
        return () => window.clearTimeout(t);
    }, [searchQuery]);

    useEffect(() => {
        setEventsPage(0);
    }, [debouncedEventSearch]);

    const [bookings, setBookings] = useState<Record<string, unknown>[]>([]);
    const [bookingEventTitles, setBookingEventTitles] = useState<Record<string, string>>({});
    const [bookingsPage, setBookingsPage] = useState(0);
    const [bookingsTotal, setBookingsTotal] = useState(0);
    const [bookingsTotalPages, setBookingsTotalPages] = useState(0);
    const [bookingsLoading, setBookingsLoading] = useState(false);

    const [adminUsers, setAdminUsers] = useState<AdminUserRow[]>([]);
    const [usersPage, setUsersPage] = useState(0);
    const [usersTotal, setUsersTotal] = useState(0);
    const [usersTotalPages, setUsersTotalPages] = useState(0);
    const [usersLoading, setUsersLoading] = useState(false);
    const [userRoleFilter, setUserRoleFilter] = useState<string>('all');
    const [userSearchQuery, setUserSearchQuery] = useState('');
    const [debouncedUserSearch, setDebouncedUserSearch] = useState('');

    useEffect(() => {
        const t = window.setTimeout(() => setDebouncedUserSearch(userSearchQuery), 400);
        return () => window.clearTimeout(t);
    }, [userSearchQuery]);

    useEffect(() => {
        setUsersPage(0);
    }, [debouncedUserSearch]);

    const loadMetrics = useCallback(() => {
        api.getEventAdminMetrics().then(setEventMetrics).catch(console.error);
        api.getBookingAdminMetrics().then(setBookingMetrics).catch(console.error);
    }, [api]);

    const loadEventsPage = useCallback(() => {
        setEventsLoading(true);
        const status = tabToEventStatus(activeEventsTab);
        api
            .getAdminEventsPaged({
                page: eventsPage,
                size: PAGE_SIZE,
                status,
                q: debouncedEventSearch,
            })
            .then((res) => {
                setEvents(res.content);
                setEventsTotal(res.totalElements);
                setEventsTotalPages(res.totalPages);
            })
            .catch((e) => {
                console.error(e);
                toast.error('Failed to load events');
            })
            .finally(() => setEventsLoading(false));
    }, [api, activeEventsTab, eventsPage, debouncedEventSearch]);

    const loadBookingsPage = useCallback(() => {
        setBookingsLoading(true);
        api
            .getAdminBookingsPaged({ page: bookingsPage, size: PAGE_SIZE })
            .then(async (res) => {
                setBookingsTotal(res.totalElements);
                setBookingsTotalPages(res.totalPages);
                const rows = Array.isArray(res.content) ? res.content : [];
                setBookings(rows);
                const ids = [...new Set(rows.map((b) => String((b as { eventId?: string }).eventId ?? '')))].filter(
                    Boolean
                );
                const titles: Record<string, string> = {};
                await Promise.all(
                    ids.map(async (eventId) => {
                        try {
                            const ev = await api.getEventById(eventId);
                            titles[eventId] = ev?.eventName ?? eventId;
                        } catch {
                            titles[eventId] = eventId;
                        }
                    })
                );
                setBookingEventTitles((prev) => ({ ...prev, ...titles }));
            })
            .catch((e) => {
                console.error(e);
                toast.error('Failed to load bookings');
            })
            .finally(() => setBookingsLoading(false));
    }, [api, bookingsPage]);

    const loadUsersPage = useCallback(() => {
        setUsersLoading(true);
        api
            .getAdminUsersPaged({
                page: usersPage,
                size: PAGE_SIZE,
                role: userRoleFilter === 'all' ? undefined : userRoleFilter,
                q: debouncedUserSearch,
            })
            .then((res) => {
                setAdminUsers(res.content);
                setUsersTotal(res.totalElements);
                setUsersTotalPages(res.totalPages);
            })
            .catch((e) => {
                console.error(e);
                toast.error('Failed to load users (admin only)');
            })
            .finally(() => setUsersLoading(false));
    }, [api, usersPage, userRoleFilter, debouncedUserSearch]);

    useEffect(() => {
        loadMetrics();
    }, [loadMetrics]);

    useEffect(() => {
        loadEventsPage();
    }, [loadEventsPage]);

    useEffect(() => {
        loadBookingsPage();
    }, [loadBookingsPage]);

    useEffect(() => {
        loadUsersPage();
    }, [loadUsersPage]);

    const derivedBookings = useMemo(() => {
        return bookings.map((raw) => {
            const b = raw as {
                bookingId?: string;
                eventId?: string;
                userId?: string;
                userEmail?: string;
                quantity?: number;
                totalAmount?: number | string;
                status?: string;
            };
            const st = String(b.status ?? '').toUpperCase();
            const isConfirmed = st === 'CONFIRMED' || st === 'CHECKED_IN' || st === 'BOOKED';
            return {
                id: String(b.bookingId ?? ''),
                eventId: String(b.eventId ?? ''),
                userLabel: b.userEmail || b.userId || '—',
                ticketQuantity: Number(b.quantity ?? 0),
                totalAmount: Number(b.totalAmount ?? 0),
                statusLabel: isConfirmed ? 'confirmed' : String(b.status ?? '').toLowerCase(),
            };
        });
    }, [bookings]);

    if (currentUser?.role !== 'ADMIN') {
        return (
            <div className="container mx-auto px-4 py-16 text-center">
                <h2 className="text-2xl font-bold mb-4">Access Denied</h2>
                <p className="text-gray-600 mb-6">Only administrators can access this panel</p>
                <Button onClick={() => navigate('/')}>Go Home</Button>
            </div>
        );
    }

    const totalEvents = eventMetrics?.totalEvents ?? 0;
    const publishedEvents = eventMetrics?.publishedEvents ?? 0;
    const totalRevenue = Number(eventMetrics?.platformRevenue ?? 0);
    const totalTicketsSold = eventMetrics?.ticketsSold ?? 0;
    const totalBookings = bookingMetrics?.totalBookingsNonCancelled ?? 0;
    const confirmedBookings = bookingMetrics?.confirmedBookings ?? 0;

    const refreshEvents = () => {
        loadMetrics();
        loadEventsPage();
    };

    const handleApproveEvent = (eventId: string) => {
        api.approveEvent(eventId, currentUser?.id).then(() => {
            toast.success('Event approved');
            refreshEvents();
        }).catch(() => toast.error('Failed to approve event'));
    };

    const handleRejectEvent = (eventId: string) => {
        if (confirm('Are you sure you want to reject this event?')) {
            api.rejectEvent(eventId, currentUser?.id, 'Rejected by admin').then(() => {
                toast.success('Event rejected');
                refreshEvents();
            }).catch(() => toast.error('Failed to reject event'));
        }
    };

    const handleSuspendEvent = (eventId: string) => {
        api.updateEventStatus(eventId, 'SUSPENDED').then(() => {
            toast.success('Event suspended');
            refreshEvents();
        }).catch(() => toast.error('Failed to suspend event'));
    };

    const handleCancelEvent = (eventId: string) => {
        api.updateEventStatus(eventId, 'CANCELLED').then(() => {
            toast.success('Event cancelled');
            refreshEvents();
        }).catch(() => toast.error('Failed to cancel event'));
    };

    const handleToSubmitEvent = (eventId: string) => {
        api.updateEventStatus(eventId, 'SUBMITTED').then(() => {
            toast.success('Event moved to submitted');
            refreshEvents();
        }).catch(() => toast.error('Failed to update event'));
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="container mx-auto px-4 py-8">
                <div className="flex items-center gap-3 mb-8">
                    <Shield className="h-8 w-8 text-blue-600" />
                    <div>
                        <h1 className="text-3xl font-bold">Admin Panel</h1>
                        <p className="text-gray-600">Manage events, users, and platform analytics</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
                            <Calendar className="h-4 w-4 text-gray-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{totalEvents}</div>
                            <p className="text-xs text-gray-500 mt-1">{publishedEvents} published</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
                            <Users className="h-4 w-4 text-gray-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{totalBookings}</div>
                            <p className="text-xs text-gray-500 mt-1">{confirmedBookings} confirmed / checked-in</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Tickets Sold</CardTitle>
                            <TrendingUp className="h-4 w-4 text-gray-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{totalTicketsSold}</div>
                            <p className="text-xs text-gray-500 mt-1">Across all events</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Platform Revenue</CardTitle>
                            <DollarSign className="h-4 w-4 text-gray-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">${totalRevenue.toFixed(2)}</div>
                            <p className="text-xs text-gray-500 mt-1">From ticket sales (sold × price)</p>
                        </CardContent>
                    </Card>
                </div>

                <Card className="mb-8">
                    <CardHeader>
                        <CardTitle>Event Management</CardTitle>
                        <CardDescription>Review and moderate platform events</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="relative mb-6">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Search events or organizers..."
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    setEventsPage(0);
                                }}
                                className="pl-10"
                            />
                        </div>

                        <Tabs
                            value={activeEventsTab}
                            onValueChange={(v) => {
                                setActiveEventsTab(v);
                                setEventsPage(0);
                            }}
                        >
                            <TabsList className="mb-4 flex flex-wrap h-auto gap-1">
                                <TabsTrigger value="all">All Events</TabsTrigger>
                                <TabsTrigger value="published">Published</TabsTrigger>
                                <TabsTrigger value="approved">Approved</TabsTrigger>
                                <TabsTrigger value="cancelled">Suspended / Cancelled</TabsTrigger>
                                <TabsTrigger value="submitted">Submitted</TabsTrigger>
                            </TabsList>

                            <TabsContent value="all">
                                <EventManagementList
                                    events={events}
                                    loading={eventsLoading}
                                    onApprove={handleApproveEvent}
                                    onReject={handleRejectEvent}
                                    onSuspend={handleSuspendEvent}
                                    navigate={navigate}
                                    onCancel={handleCancelEvent}
                                    onToSubmit={handleToSubmitEvent}
                                />
                                <PaginationBar
                                    page={eventsPage}
                                    totalPages={eventsTotalPages}
                                    totalElements={eventsTotal}
                                    onPageChange={setEventsPage}
                                    disabled={eventsLoading}
                                />
                            </TabsContent>

                            <TabsContent value="published">
                                <EventManagementList
                                    events={events}
                                    loading={eventsLoading}
                                    onApprove={handleApproveEvent}
                                    onReject={handleRejectEvent}
                                    onSuspend={handleSuspendEvent}
                                    navigate={navigate}
                                    onCancel={handleCancelEvent}
                                    onToSubmit={handleToSubmitEvent}
                                />
                                <PaginationBar
                                    page={eventsPage}
                                    totalPages={eventsTotalPages}
                                    totalElements={eventsTotal}
                                    onPageChange={setEventsPage}
                                    disabled={eventsLoading}
                                />
                            </TabsContent>

                            <TabsContent value="approved">
                                <EventManagementList
                                    events={events}
                                    loading={eventsLoading}
                                    onApprove={handleApproveEvent}
                                    onReject={handleRejectEvent}
                                    onSuspend={handleSuspendEvent}
                                    navigate={navigate}
                                    onCancel={handleCancelEvent}
                                    onToSubmit={handleToSubmitEvent}
                                />
                                <PaginationBar
                                    page={eventsPage}
                                    totalPages={eventsTotalPages}
                                    totalElements={eventsTotal}
                                    onPageChange={setEventsPage}
                                    disabled={eventsLoading}
                                />
                            </TabsContent>

                            <TabsContent value="cancelled">
                                <EventManagementList
                                    events={events}
                                    loading={eventsLoading}
                                    onApprove={handleApproveEvent}
                                    onReject={handleRejectEvent}
                                    onSuspend={handleSuspendEvent}
                                    navigate={navigate}
                                    onCancel={handleCancelEvent}
                                    onToSubmit={handleToSubmitEvent}
                                />
                                <PaginationBar
                                    page={eventsPage}
                                    totalPages={eventsTotalPages}
                                    totalElements={eventsTotal}
                                    onPageChange={setEventsPage}
                                    disabled={eventsLoading}
                                />
                            </TabsContent>

                            <TabsContent value="submitted">
                                <EventManagementList
                                    events={events}
                                    loading={eventsLoading}
                                    onApprove={handleApproveEvent}
                                    onReject={handleRejectEvent}
                                    onSuspend={handleSuspendEvent}
                                    navigate={navigate}
                                    onCancel={handleCancelEvent}
                                    onToSubmit={handleToSubmitEvent}
                                />
                                <PaginationBar
                                    page={eventsPage}
                                    totalPages={eventsTotalPages}
                                    totalElements={eventsTotal}
                                    onPageChange={setEventsPage}
                                    disabled={eventsLoading}
                                />
                            </TabsContent>
                        </Tabs>
                    </CardContent>
                </Card>

                <Card className="mb-8">
                    <CardHeader>
                        <CardTitle>Bookings</CardTitle>
                        <CardDescription>Ticket purchases (paginated)</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {derivedBookings.length === 0 && !bookingsLoading ? (
                            <div className="text-center py-8 text-gray-500">No bookings yet</div>
                        ) : (
                            <div className="space-y-3">
                                {derivedBookings.map((booking) => {
                                    const eventTitle =
                                        bookingEventTitles[booking.eventId] ?? booking.eventId;
                                    return (
                                        <div
                                            key={booking.id}
                                            className="flex items-center justify-between p-3 border rounded-lg"
                                        >
                                            <div className="flex-1 min-w-0">
                                                <div className="font-medium truncate">{booking.userLabel}</div>
                                                <div className="text-sm text-gray-600 truncate">{eventTitle}</div>
                                            </div>
                                            <div className="text-right shrink-0 px-2">
                                                <div className="font-medium">${booking.totalAmount.toFixed(2)}</div>
                                                <div className="text-sm text-gray-600">
                                                    {booking.ticketQuantity}{' '}
                                                    {booking.ticketQuantity === 1 ? 'ticket' : 'tickets'}
                                                </div>
                                            </div>
                                            <Badge
                                                variant={booking.statusLabel === 'confirmed' ? 'default' : 'secondary'}
                                                className="ml-4"
                                            >
                                                {booking.statusLabel}
                                            </Badge>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                        <PaginationBar
                            page={bookingsPage}
                            totalPages={bookingsTotalPages}
                            totalElements={bookingsTotal}
                            onPageChange={setBookingsPage}
                            disabled={bookingsLoading}
                        />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Users</CardTitle>
                        <CardDescription>Registered accounts (filter by role or email)</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col sm:flex-row gap-4 mb-6">
                            <div className="w-full sm:w-48">
                                <Select
                                    value={userRoleFilter}
                                    onValueChange={(v) => {
                                        setUserRoleFilter(v);
                                        setUsersPage(0);
                                    }}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Role" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All roles</SelectItem>
                                        <SelectItem value="ATTENDEE">Attendee</SelectItem>
                                        <SelectItem value="ORGANIZER">Organizer</SelectItem>
                                        <SelectItem value="ADMIN">Admin</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input
                                    placeholder="Filter by email..."
                                    value={userSearchQuery}
                                    onChange={(e) => {
                                        setUserSearchQuery(e.target.value);
                                        setUsersPage(0);
                                    }}
                                    className="pl-10"
                                />
                            </div>
                        </div>

                        {adminUsers.length === 0 && !usersLoading ? (
                            <div className="text-center py-8 text-gray-500">No users match</div>
                        ) : (
                            <div className="space-y-2">
                                {adminUsers.map((u) => (
                                    <div
                                        key={u.id}
                                        className="flex items-center justify-between p-3 border rounded-lg"
                                    >
                                        <div>
                                            <div className="font-medium">{u.email}</div>
                                            <div className="text-xs text-gray-500 font-mono">{u.id}</div>
                                        </div>
                                        <Badge variant="secondary">{u.role}</Badge>
                                    </div>
                                ))}
                            </div>
                        )}
                        <PaginationBar
                            page={usersPage}
                            totalPages={usersTotalPages}
                            totalElements={usersTotal}
                            onPageChange={setUsersPage}
                            disabled={usersLoading}
                        />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

function EventManagementList({
    events,
    loading,
    onApprove,
    onReject,
    onSuspend,
    onCancel,
    onToSubmit,
    navigate,
}: {
    events: Event[];
    loading?: boolean;
    onApprove: (id: string) => void;
    onReject: (id: string) => void;
    onSuspend: (id: string) => void;
    onCancel: (id: string) => void;
    onToSubmit: (id: string) => void;
    navigate: (path: string) => void;
}) {
    if (loading) {
        return (
            <div className="text-center py-12 text-gray-600">
                Loading events…
            </div>
        );
    }

    if (events.length === 0) {
        return (
            <div className="text-center py-12">
                <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">No events found</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {events.map((event: Event, index: number) => {
                const st = String(event.status ?? '').toLowerCase();
                return (
                    <div key={event.eventId || (event as { id?: string }).id || index} className="flex items-start gap-4 p-4 border rounded-lg">
                        <img
                            src={resolveEventImageUrl(event.imageUrl)}
                            alt={event.eventName}
                            className="w-24 h-24 object-cover rounded"
                        />
                        <div className="flex-1">
                            <div className="flex items-start justify-between mb-2">
                                <div>
                                    <h3 className="font-semibold mb-1">{event.eventName}</h3>
                                    <p className="text-sm text-gray-600">by {event.eventOwnerName}</p>
                                    <p className="text-sm text-gray-600">
                                        {format(
                                            new Date(String(event.eventStartInstant || event.eventStartDate || '').replace('Z', '')),
                                            'MMM dd, yyyy'
                                        )}{' '}
                                        at{' '}
                                        {event.eventStartInstant
                                            ? format(new Date(String(event.eventStartInstant).replace('Z', '')), 'h:mm a')
                                            : ''}
                                    </p>
                                </div>
                                <Badge
                                    variant={
                                        st === 'published'
                                            ? 'default'
                                            : st === 'cancelled' || st === 'rejected'
                                              ? 'destructive'
                                              : 'secondary'
                                    }
                                >
                                    {String(event.status)}
                                </Badge>
                            </div>

                            <div className="flex items-center gap-4 text-sm mb-3">
                                <span className="text-gray-600">
                                    {event.ticketsSold} / {event.maxCapacity ?? 0} tickets sold
                                </span>
                                <span className="font-medium">
                                    $
                                    {(
                                        (event.ticketsSold || 0) *
                                        Number(event.ticketPrice ?? 0)
                                    ).toFixed(2)}{' '}
                                    revenue
                                </span>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => navigate(`/events/${event.eventId}`)}
                                >
                                    <Eye className="h-4 w-4 mr-1" />
                                    View
                                </Button>

                                {st === 'submitted' && (
                                    <>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => onApprove(event.eventId!)}
                                            className="text-green-600 border-green-600 hover:bg-green-50"
                                        >
                                            <CheckCircle className="h-4 w-4 mr-1" />
                                            Approve
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => onReject(event.eventId!)}
                                            className="text-red-600 border-red-600 hover:bg-red-50"
                                        >
                                            <Ban className="h-4 w-4 mr-1" />
                                            Reject
                                        </Button>
                                    </>
                                )}

                                {st === 'published' && (
                                    <>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => onToSubmit(event.eventId!)}
                                            className="text-orange-600 border-orange-600 hover:bg-orange-50"
                                        >
                                            <AlertTriangle className="h-4 w-4 mr-1" />
                                            To Submit
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => onSuspend(event.eventId!)}
                                            className="text-orange-600 border-orange-600 hover:bg-orange-50"
                                        >
                                            <AlertTriangle className="h-4 w-4 mr-1" />
                                            Suspend
                                        </Button>
                                    </>
                                )}

                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => onCancel(event.eventId!)}
                                    className="text-red-600 border-red-600 hover:bg-red-50"
                                >
                                    <Ban className="h-4 w-4 mr-1" />
                                    Remove
                                </Button>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
