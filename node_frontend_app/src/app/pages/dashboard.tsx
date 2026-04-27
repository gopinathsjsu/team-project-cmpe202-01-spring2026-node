
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Badge } from '../components/ui/badge';
import {
    Calendar,
    Ticket,
    DollarSign,
    TrendingUp,
    Edit,
    Trash2,
    Plus,
    Eye,
    Users,
    ChevronLeft,
    ChevronRight,
    Shield,
} from 'lucide-react';

import { format } from 'date-fns';
import { toast } from 'sonner';
import { runAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import type { OrganizerEventSummary, UserBooking } from '../types';
import { resolveEventImageUrl } from '@/lib/eventImageStorage';

const createGoogleCalendarLink = (event: any) => {
    const title = encodeURIComponent(event.eventName || event.title || 'Event');
    const details = encodeURIComponent(event.eventDescription || event.description || '');
    const locationStr = event.eventLocation?.locationAddress || event.location || '';
    const location = encodeURIComponent(locationStr);

    // Prefer the exact Instant fields which contain the full UTC date/time (e.g., 2026-03-24T18:00:00Z)
    const startDateStr = event.eventStartInstant || event.eventStartDate || event.startDate || new Date().toISOString();
    const endDateStr = event.eventEndInstant || event.eventEndDate || event.endDate || new Date().toISOString();
    try {
        // Remove dashes, colons, and milliseconds to match Google Calendar format (YYYYMMDDTHHMMSSZ)
        const start = new Date(startDateStr).toISOString().replace(/-|:|\.\d\d\d/g, '');
        console.log("Start Date String:", startDateStr);
        console.log("Start Date:", start);
        const end = new Date(endDateStr).toISOString().replace(/-|:|\.\d\d\d/g, '');
        return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${start}/${end}&details=${details}&location=${location}`;
    } catch (e) {
        return '#';
    }
};

export function Dashboard() {
    const navigate = useNavigate();

    const api = runAPI();

    const [events, setEvents] = useState<any[]>([]);
    const [organizerSummary, setOrganizerSummary] = useState<OrganizerEventSummary | null>(null);
    const [orgTab, setOrgTab] = useState('all');
    const [orgPage, setOrgPage] = useState(0);
    const [orgTotal, setOrgTotal] = useState(0);
    const [orgTotalPages, setOrgTotalPages] = useState(0);
    const [orgLoading, setOrgLoading] = useState(false);

    const [myBookings, setMyBookings] = useState<any[]>([]);
    const [bookingCounts, setBookingCounts] = useState<{
        totalBookings: number;
        upcomingBookings: number;
    } | null>(null);
    const [attendeeBookingsPage, setAttendeeBookingsPage] = useState(0);
    const [attendeeBookingsTotal, setAttendeeBookingsTotal] = useState(0);
    const [attendeeBookingsTotalPages, setAttendeeBookingsTotalPages] = useState(0);
    const [attendeeBookingsLoading, setAttendeeBookingsLoading] = useState(false);
    const [adminUserCount, setAdminUserCount] = useState(0);
    const [totalUserCount, setTotalUserCount] = useState(0);
    //let myEvents: any[] = [];

    const authContext = useAuth();
    const currentUser = authContext.currentUser;

    useEffect(() => {
        if (!currentUser?.id) {
            navigate("/login");
            return;
        }
    }, [currentUser, navigate]);

    useEffect(() => {
        if (!currentUser?.id || currentUser.role !== 'ORGANIZER') return;
        let cancelled = false;
        api.getOrganizerSummary(currentUser.id)
            .then((data) => { if (!cancelled) setOrganizerSummary(data); })
            .catch((err) => { if (!cancelled) console.error(err); });
        return () => {
            cancelled = true;
        };
    }, [currentUser?.id, currentUser?.role]);

    useEffect(() => {
        if (currentUser?.role !== 'ADMIN') return;
        let cancelled = false;
        api.getAdminUsers(0, 100)
            .then((data) => {
                if (cancelled) return;
                const users = Array.isArray(data.users) ? data.users : [];
                setTotalUserCount(data.totalElements ?? users.length);
                setAdminUserCount(users.filter((u) => u.role === 'ADMIN').length);
            })
            .catch(() => {
                if (cancelled) return;
                setTotalUserCount(0);
                setAdminUserCount(0);
            });
        return () => {
            cancelled = true;
        };
    }, [currentUser?.role]);

    useEffect(() => {
        if (!currentUser?.id || currentUser.role !== 'ORGANIZER') return;
        let cancelled = false;
        setOrgLoading(true);
        api
            .getOrganizerEventsPaged({
                organizerId: currentUser.id,
                tab: orgTab,
                page: orgPage,
                size: 8,
            })
            .then((res) => {
                if (cancelled) return;
                setEvents(Array.isArray(res.content) ? res.content : []);
                setOrgTotal(res.totalElements);
                setOrgTotalPages(res.totalPages);
            })
            .catch((err) => { if (!cancelled) console.error(err); })
            .finally(() => { if (!cancelled) setOrgLoading(false); });
        return () => {
            cancelled = true;
        };
    }, [currentUser?.id, currentUser?.role, orgTab, orgPage]);

    useEffect(() => {
        if (currentUser?.role !== 'ATTENDEE' || !currentUser?.id) return;
        let cancelled = false;
        setAttendeeBookingsLoading(true);
        Promise.all([
            api.getUserBookingCounts(currentUser.id),
            api.getUserBookingsPaged({ userId: currentUser.id, page: attendeeBookingsPage, size: 10 }),
        ])
            .then(([counts, paged]) => {
                if (cancelled) return;
                setBookingCounts(counts);
                setMyBookings(Array.isArray(paged.content) ? paged.content : []);
                setAttendeeBookingsTotal(paged.totalElements);
                setAttendeeBookingsTotalPages(paged.totalPages);
            })
            .catch((err) => { if (!cancelled) console.error(err); })
            .finally(() => { if (!cancelled) setAttendeeBookingsLoading(false); });
        return () => {
            cancelled = true;
        };
    }, [currentUser?.id, currentUser?.role, attendeeBookingsPage]);

    // Attendee Dashboard
    if (currentUser?.role === 'ATTENDEE') {
        /* useEffect(() => {
        if (currentUser?.id) {
            api.getEventsBookedByUserId(currentUser.id).then((data) => {
                setEvents(Array.isArray(data) ? data : []);
            }).catch(console.error);
        }
    }, [currentUser?.id]); */

        return (
            <div className="min-h-screen bg-gray-50">
                <div className="container mx-auto px-4 py-8">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold mb-2">My Dashboard</h1>
                        <p className="text-gray-600">Manage your event bookings</p>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium">Upcoming Events</CardTitle>
                                <Ticket className="h-4 w-4 text-gray-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{bookingCounts?.upcomingBookings ?? 0}</div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
                                <Calendar className="h-4 w-4 text-gray-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{bookingCounts?.totalBookings ?? 0}</div>
                            </CardContent>
                        </Card>

                        {/* <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
                                <DollarSign className="h-4 w-4 text-gray-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">${totalSpent.toFixed(2)}</div>
                            </CardContent>
                        </Card> */}
                    </div>

                    {/* Bookings List */}
                    <Card>
                        <CardHeader>
                            <CardTitle>My Bookings</CardTitle>
                            <CardDescription>View and manage your event tickets</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {myBookings.length === 0 ? (
                                <div className="text-center py-12">
                                    <Ticket className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                                    <p className="text-gray-600 mb-4">No bookings yet</p>
                                    <Button onClick={() => navigate('/events')}>Browse Events</Button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {myBookings.map((booking: UserBooking) => {
                                        // const event = events.find(e => e.eventId === booking.eventId);
                                        // if (!event) return null;
                                        return (
                                            <div key={booking.bookingId} className="flex items-start gap-4 p-4 border rounded-lg">
                                                <img
                                                    src={resolveEventImageUrl(booking.imageUrl)}
                                                    alt={booking.eventDescription}
                                                    className="w-24 h-24 object-cover rounded"
                                                    onError={(e) => {
                                                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1540317580384-e5d43867caa6?auto=format&fit=crop&w=800&q=80';
                                                    }}
                                                />
                                                <div className="flex-1">
                                                    <h3 className="font-semibold mb-1">{booking.eventName}</h3>
                                                    <p className="text-sm text-gray-600 mb-2">
                                                        {format(new Date(String(booking.eventStartInstant || '').replace('Z', '')), 'MMM dd, yyyy')} at {booking.eventStartInstant ? format(new Date(String(booking.eventStartInstant).replace('Z', '')), 'h:mm a') : ''}
                                                    </p>
                                                    <div className="flex items-center gap-4 text-sm">
                                                        <span className="text-gray-600">
                                                            {booking.quantity} {booking.quantity === 1 ? 'ticket' : 'tickets'}
                                                        </span>
                                                        <span className="font-medium">${booking.totalAmount.toFixed(2)}</span>
                                                        <Badge variant="secondary">{booking.status}</Badge>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col gap-2">
                                                    <Button
                                                        variant="outline"
                                                        onClick={() => navigate(`/booking/${booking.bookingId}`)}
                                                    >
                                                        <Eye className="h-4 w-4 mr-2" />
                                                        Booking Details
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        onClick={() => navigate(`/events/${booking.eventId}`)}
                                                    >
                                                        View Event
                                                    </Button>
                                                    <Button
                                                        variant="secondary"
                                                        className="bg-blue-50 text-blue-600 hover:bg-blue-100 border-blue-200"
                                                        disabled={
                                                            new Date(booking.eventStartInstant) < new Date() ||
                                                            String(booking.status).toLowerCase() !== 'confirmed'
                                                        }
                                                        onClick={() => window.open(createGoogleCalendarLink({
                                                            eventName: booking.eventDescription,
                                                            eventStartInstant: booking.eventStartInstant,
                                                            eventEndInstant: booking.eventEndInstant,
                                                            eventDescription: `Booking for ${booking.eventDescription}`,
                                                            eventLocation: {
                                                                locationAddress: booking.eventLocation?.locationAddress || '',
                                                                locationName: booking.eventLocation?.locationName || '',
                                                                latitude: booking.eventLocation?.latitude || null,
                                                                longitude: booking.eventLocation?.longitude || null,
                                                            },
                                                            timezone: 'America/Los_Angeles',

                                                        }), '_blank')}
                                                    >
                                                        <Calendar className="h-4 w-4 mr-2" />
                                                        Add to Google Calendar
                                                    </Button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                            {attendeeBookingsTotal > 0 && (
                                <div className="flex items-center justify-between gap-4 pt-6 border-t mt-6">
                                    <p className="text-sm text-gray-600">
                                        Page {attendeeBookingsPage + 1} of{' '}
                                        {Math.max(1, attendeeBookingsTotalPages)} ({attendeeBookingsTotal} total)
                                    </p>
                                    <div className="flex gap-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            disabled={attendeeBookingsLoading || attendeeBookingsPage <= 0}
                                            onClick={() => setAttendeeBookingsPage((p) => p - 1)}
                                        >
                                            <ChevronLeft className="h-4 w-4" />
                                            Prev
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            disabled={
                                                attendeeBookingsLoading ||
                                                attendeeBookingsPage >= attendeeBookingsTotalPages - 1
                                            }
                                            onClick={() => setAttendeeBookingsPage((p) => p + 1)}
                                        >
                                            Next
                                            <ChevronRight className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    // Admin Dashboard (separate from Admin Panel)
    if (currentUser?.role === 'ADMIN') {
        return (
            <div className="min-h-screen bg-gray-50">
                <div className="container mx-auto px-4 py-8">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
                            <p className="text-gray-600">Quick overview and shortcuts. Use Admin Panel for moderation and management.</p>
                        </div>
                        <Button onClick={() => navigate('/admin')}>
                            <Shield className="h-4 w-4 mr-2" />
                            Open Admin Panel
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                                <Users className="h-4 w-4 text-gray-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{totalUserCount}</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium">Admin Users</CardTitle>
                                <Shield className="h-4 w-4 text-gray-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{adminUserCount}</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium">Navigation</CardTitle>
                                <Eye className="h-4 w-4 text-gray-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-sm text-gray-600">Use quick actions below.</div>
                            </CardContent>
                        </Card>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Quick Actions</CardTitle>
                            <CardDescription>Go directly to key admin and profile flows</CardDescription>
                        </CardHeader>
                        <CardContent className="flex flex-wrap gap-3">
                            <Button variant="outline" onClick={() => navigate('/admin')}>Admin Panel</Button>
                            <Button variant="outline" onClick={() => navigate('/profile')}>My Profile</Button>
                            <Button variant="outline" onClick={() => navigate('/events')}>Browse Events</Button>
                            <Button onClick={() => navigate('/create-event')}>
                                <Plus className="h-4 w-4 mr-2" />
                                Create Event
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    // Organizer Dashboard
    if (currentUser?.role === 'ORGANIZER') {
        const myEvents = Array.isArray(events) ? events : [];
        const totalRevenue =
            organizerSummary != null
                ? organizerSummary.totalRevenue
                : myEvents.reduce((sum, e) => sum + (e.ticketsSold * e.ticketPrice), 0) || 0;
        const totalTicketsSold =
            organizerSummary != null ? organizerSummary.ticketsSold : myEvents.reduce((sum, e) => sum + e.ticketsSold, 0) || 0;

        const reloadOrganizer = () => {
            if (!currentUser?.id) return;
            api.getOrganizerSummary(currentUser.id).then(setOrganizerSummary).catch(console.error);
            api
                .getOrganizerEventsPaged({
                    organizerId: currentUser.id,
                    tab: orgTab,
                    page: orgPage,
                    size: 8,
                })
                .then((res) => {
                    setEvents(Array.isArray(res.content) ? res.content : []);
                    setOrgTotal(res.totalElements);
                    setOrgTotalPages(res.totalPages);
                })
                .catch(console.error);
        };

        const handleDeleteEvent = (eventId: string) => {
            if (confirm('Are you sure you want to delete this event?')) {
                api.deleteEvent(eventId).then(() => {
                    toast.success('Event deleted successfully');
                    reloadOrganizer();
                });
            }
        };

        const handleToggleStatus = (eventId: string, currentStatus: string) => {
            let newStatus = currentStatus;
            if (currentStatus.toLowerCase() == 'approved') {
                newStatus = 'published';
            }
            else if (currentStatus.toLowerCase() == 'published') {
                newStatus = 'approved';
            }
            else if (currentStatus.toLowerCase() == 'cancelled') {
                newStatus = 'published';
            }
            api.updateEventStatus(eventId, newStatus).then(() => {
                toast.success(`Event ${newStatus}`);
                reloadOrganizer();
            });
        };

        return (
            <div className="min-h-screen bg-gray-50">
                <div className="container mx-auto px-4 py-8">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h1 className="text-3xl font-bold mb-2">Organizer Dashboard</h1>
                            <p className="text-gray-600">Manage your events and track performance</p>
                        </div>
                        <Button onClick={() => navigate('/createEvent')}>
                            <Plus className="h-4 w-4 mr-2" />
                            Create Event
                        </Button>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium">Total Events</CardTitle>
                                <Calendar className="h-4 w-4 text-gray-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {organizerSummary?.eventCount ?? myEvents.length}
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium">Tickets Sold</CardTitle>
                                <Ticket className="h-4 w-4 text-gray-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{totalTicketsSold}</div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                                <DollarSign className="h-4 w-4 text-gray-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">${totalRevenue.toFixed(2)}</div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium">Avg. Fill Rate</CardTitle>
                                <TrendingUp className="h-4 w-4 text-gray-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {organizerSummary != null
                                        ? organizerSummary.averageFillPercent
                                        : myEvents.length > 0
                                            ? Math.round(
                                                (myEvents.reduce((sum, e) => sum + e.ticketsSold / e.maxCapacity, 0) /
                                                    myEvents.length) *
                                                100
                                            ) || 0
                                            : 0}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Events List */}
                    <Card>
                        <CardHeader>
                            <CardTitle>My Events</CardTitle>
                            <CardDescription>Manage your events and view bookings</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Tabs
                                value={orgTab}
                                onValueChange={(v) => {
                                    setOrgTab(v);
                                    setOrgPage(0);
                                }}
                            >
                                <TabsList className="mb-4">
                                    <TabsTrigger value="all">
                                        All Events ({organizerSummary?.eventCount ?? orgTotal})
                                    </TabsTrigger>
                                    <TabsTrigger value="published">
                                        Published {orgTab === 'published' ? '(' +orgTotal + ')' : ''}
                                    </TabsTrigger>
                                    <TabsTrigger value="submitted">
                                        Submitted {orgTab === 'submitted' ? '(' + orgTotal + ')' : ''}
                                    </TabsTrigger>
                                    <TabsTrigger value="completed">
                                        Completed {orgTab === 'completed' ? '(' + orgTotal + ')' : ''}
                                    </TabsTrigger>
                                    <TabsTrigger value="draft">
                                        Drafts {orgTab === 'draft' ? '(' + orgTotal + ')' : ''}
                                    </TabsTrigger>
                                    <TabsTrigger value="rejected">
                                        Rejected {orgTab === 'rejected' ? '('+orgTotal+')' : ''}
                                    </TabsTrigger>
                                    {/* <TabsTrigger value="cancelled">
                                        Cancelled ({myEvents.filter(e => e.status === 'CANCELLED').length})
                                    </TabsTrigger> */}
                                </TabsList>

                                <TabsContent value="all">
                                    <EventsList
                                        events={myEvents}
                                        onDelete={handleDeleteEvent}
                                        onToggleStatus={handleToggleStatus}
                                        navigate={navigate}
                                        loading={orgLoading}
                                    />
                                </TabsContent>

                                <TabsContent value="published">
                                    <EventsList
                                        events={myEvents}
                                        onDelete={handleDeleteEvent}
                                        onToggleStatus={handleToggleStatus}
                                        navigate={navigate}
                                        loading={orgLoading}
                                    />
                                </TabsContent>

                                <TabsContent value="draft">
                                    <EventsList
                                        events={myEvents}
                                        onDelete={handleDeleteEvent}
                                        onToggleStatus={handleToggleStatus}
                                        navigate={navigate}
                                        loading={orgLoading}
                                    />
                                </TabsContent>
                                <TabsContent value="submitted">
                                    <EventsList
                                        events={myEvents}
                                        onDelete={handleDeleteEvent}
                                        onToggleStatus={handleToggleStatus}
                                        navigate={navigate}
                                        loading={orgLoading}
                                    />
                                </TabsContent>
                                <TabsContent value="rejected">
                                    <EventsList
                                        events={myEvents}
                                        onDelete={handleDeleteEvent}
                                        onToggleStatus={handleToggleStatus}
                                        navigate={navigate}
                                        loading={orgLoading}
                                    />
                                </TabsContent>
                                <TabsContent value="completed">
                                    <EventsList
                                        events={myEvents}
                                        onDelete={handleDeleteEvent}
                                        onToggleStatus={handleToggleStatus}
                                        navigate={navigate}
                                        loading={orgLoading}
                                    />
                                </TabsContent>
                            </Tabs>
                            {orgTotal > 0 && (
                                <div className="flex items-center justify-between gap-4 pt-6 border-t mt-6">
                                    <p className="text-sm text-gray-600">
                                        Page {orgPage + 1} of {Math.max(1, orgTotalPages)} total pages.        
                                    </p>
                                    <div className="flex gap-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            disabled={orgLoading || orgPage <= 0}
                                            onClick={() => setOrgPage((p) => p - 1)}
                                        >
                                            <ChevronLeft className="h-4 w-4" />
                                            Prev
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            disabled={orgLoading || orgPage >= orgTotalPages - 1}
                                            onClick={() => setOrgPage((p) => p + 1)}
                                        >
                                            Next
                                            <ChevronRight className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">{orgTotal} items(s) in this tab</p>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    return null;
}



// Helper component for events list
function EventsList({
    events,
    onDelete,
    onToggleStatus,
    navigate,
    loading,
}: {
    events: any[];
    onDelete: (eventId: string) => void;
    onToggleStatus: (eventId: string, currentStatus: string) => void;
    navigate: (to: string) => void;
    loading?: boolean;
}) {
    if (loading) {
        return <div className="text-center py-12 text-gray-600">Loading events…</div>;
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
            {events.map((event: any) => {
                const revenue = (event.ticketsSold ?? 0) * (event.ticketPrice ?? 0);

                return (
                    <div key={event.eventId} className="flex items-start gap-4 p-4 border rounded-lg">
                        <img
                            src={resolveEventImageUrl(event.imageUrl)}
                            alt={event.eventName}
                            className="w-32 h-32 object-cover rounded"
                            onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1540317580384-e5d43867caa6?auto=format&fit=crop&w=800&q=80';
                            }}
                        />
                        <div className="flex-1">
                            <div className="flex items-start justify-between mb-2">
                                <div>
                                    <h3 className="font-semibold mb-1">{event.eventName}</h3>
                                    <p className="text-sm text-gray-600 mb-2">
                                        {format(new Date(String(event.eventStartInstant || event.eventStartDate || '').replace('Z', '')), 'MMM dd, yyyy')} at {event.eventStartInstant ? format(new Date(String(event.eventStartInstant).replace('Z', '')), 'h:mm a') : ''}
                                    </p>
                                </div>
                                <Badge variant={event.status === 'PUBLISHED' ? 'default' : 'secondary'}>
                                    {event.status}
                                </Badge>
                            </div>

                            <div className="grid grid-cols-3 gap-4 text-sm mb-3">
                                <div>
                                    <div className="text-gray-600">Tickets Sold</div>
                                    <div className="font-medium">{event.ticketsSold || 0} / {event.maxCapacity}</div>
                                </div>
                                <div>
                                    <div className="text-gray-600">Revenue</div>
                                    <div className="font-medium">${revenue.toFixed(2) || 0}</div>
                                </div>
                                <div>
                                    <div className="text-gray-600">Tickets sold</div>
                                    <div className="font-medium">{event.ticketsSold ?? 0}</div>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => navigate(`/events/${event.eventId}`)}
                                >
                                    <Eye className="h-4 w-4 mr-1" />
                                    View
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => navigate(`/edit-event/${event.eventId}`)}
                                >
                                    <Edit className="h-4 w-4 mr-1" />
                                    Edit
                                </Button>
                                {event.status === 'APPROVED' &&
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => onToggleStatus(event.eventId, event.status)}
                                    >
                                        Publish
                                    </Button>}
                                {event.status === 'PUBLISHED' &&
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => onToggleStatus(event.eventId, event.status)}
                                    >
                                        Unpublish
                                    </Button>}
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => navigate(`/events/${event.eventId}/attendees`)}
                                >
                                    <Users className="h-4 w-4 mr-1" />
                                    Attendees
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => onDelete(event.eventId)}
                                >
                                    <Trash2 className="h-4 w-4 mr-1" />
                                    Delete
                                </Button>
                                {/* <Button
                                    size="sm"
                                    variant="secondary"
                                    className="bg-blue-50 text-blue-600 hover:bg-blue-100 border-blue-200"
                                    onClick={() => window.open(createGoogleCalendarLink(event), '_blank')}
                                >
                                    <Calendar className="h-4 w-4 mr-1" />
                                    Google Calendar Sync
                                </Button> */}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}