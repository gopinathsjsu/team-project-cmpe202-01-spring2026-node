import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
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
    AlertTriangle
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import { runAPI } from '../api';
import { resolveEventImageUrl } from '@/lib/eventImageStorage';

export function AdminPanel() {
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const api = runAPI();
    //const { events, bookings, updateEvent, deleteEvent } = useEvents();

    const [events, setEvents] = useState<any[]>([]);
    const [bookings, setBookings] = useState<any[]>([]);

    useEffect(() => {

        api.getEvents().then((data) => {
            setEvents(Array.isArray(data) ? data : []);
        }).catch(console.error);

        setBookings([]);
        api.getAllBookings().then((data) => {
            setBookings(Array.isArray(data) ? data : []);
        }).catch(console.error);

    }, []);

    const [searchQuery, setSearchQuery] = useState('');

    if (currentUser?.role !== 'ADMIN') {
        return (
            <div className="container mx-auto px-4 py-16 text-center">
                <h2 className="text-2xl font-bold mb-4">Access Denied</h2>
                <p className="text-gray-600 mb-6">Only administrators can access this panel</p>
                <Button onClick={() => navigate('/')}>Go Home</Button>
            </div>
        );
    }

    const totalEvents = events.length;
    const publishedEvents = events.filter(e => e.status?.toUpperCase() === 'PUBLISHED').length;
    const totalRevenue = events.reduce((sum, e) => sum + ((e.ticketsSold || 0) * (e.ticketPrice || 0)), 0);
    const totalTicketsSold = events.reduce((sum, e) => sum + (e.ticketsSold || 0), 0);
    const totalBookings = bookings.length;
    const confirmedBookings = bookings.filter(b => b.status === 'confirmed').length;

    const refreshEvents = () => {
        api.getEvents().then((data) => {
            setEvents(Array.isArray(data) ? data : []);
        }).catch(console.error);
    };

    const handleApproveEvent = (eventId: string) => {
        api.approveEvent(eventId, currentUser?.id).then(() => {
            toast.success('Event approved');
            refreshEvents();
        }).catch(() => toast.error('Failed to approve event'));
    };

    const handleRejectEvent = (eventId: string) => {
        if (confirm('Are you sure you want to reject this event?')) {
            api.rejectEvent(eventId, currentUser?.id, "Rejected by admin").then(() => {
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

    const filteredEvents = events.filter(event =>
        event?.eventName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event?.eventOwnerName?.toLowerCase().includes(searchQuery.toLowerCase())
    );

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

                {/* Overview Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
                            <Calendar className="h-4 w-4 text-gray-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{totalEvents}</div>
                            <p className="text-xs text-gray-500 mt-1">
                                {publishedEvents} published
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
                            <Users className="h-4 w-4 text-gray-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{totalBookings}</div>
                            <p className="text-xs text-gray-500 mt-1">
                                {confirmedBookings} confirmed
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Tickets Sold</CardTitle>
                            <TrendingUp className="h-4 w-4 text-gray-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{totalTicketsSold}</div>
                            <p className="text-xs text-gray-500 mt-1">
                                Across all events
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Platform Revenue</CardTitle>
                            <DollarSign className="h-4 w-4 text-gray-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">${totalRevenue.toFixed(2)}</div>
                            <p className="text-xs text-gray-500 mt-1">
                                Total transactions
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Event Management */}
                <Card className="mb-8">
                    <CardHeader>
                        <CardTitle>Event Management</CardTitle>
                        <CardDescription>Review and moderate platform events</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {/* Search */}
                        <div className="relative mb-6">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Search events or organizers..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10"
                            />
                        </div>

                        <Tabs defaultValue="all">
                            <TabsList className="mb-4">
                                <TabsTrigger value="all">All Events ({events.length})</TabsTrigger>
                                <TabsTrigger value="published">
                                    Published ({events.filter(e => e.status.toLowerCase() === 'published').length})
                                </TabsTrigger>
                                <TabsTrigger value="approved">
                                    Approved ({events.filter(e => e.status.toLowerCase() === 'approved').length})
                                </TabsTrigger>
                                <TabsTrigger value="cancelled">
                                    Suspended ({events.filter(e => e.status.toLowerCase() === 'cancelled').length})
                                </TabsTrigger>
                                <TabsTrigger value="submitted">
                                    Submitted ({events.filter(e => e.status.toLowerCase() === 'submitted').length})
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="all">
                                <EventManagementList
                                    events={filteredEvents}
                                    onApprove={handleApproveEvent}
                                    onReject={handleRejectEvent}
                                    onSuspend={handleSuspendEvent}
                                    navigate={navigate}
                                    onCancel={handleCancelEvent}
                                    onToSubmit={handleToSubmitEvent}
                                />
                            </TabsContent>

                            <TabsContent value="published">
                                <EventManagementList
                                    events={filteredEvents.filter(e => e.status?.toUpperCase() === 'PUBLISHED')}
                                    onApprove={handleApproveEvent}
                                    onReject={handleRejectEvent}
                                    onSuspend={handleSuspendEvent}
                                    navigate={navigate}
                                    onCancel={handleCancelEvent}
                                    onToSubmit={handleToSubmitEvent}
                                />
                            </TabsContent>

                            <TabsContent value="approved">
                                <EventManagementList
                                    events={filteredEvents.filter(e => e.status.toLowerCase() === 'approved')}
                                    onApprove={handleApproveEvent}
                                    onReject={handleRejectEvent}
                                    onSuspend={handleSuspendEvent}
                                    navigate={navigate}
                                    onCancel={handleCancelEvent}
                                    onToSubmit={handleToSubmitEvent}
                                />
                            </TabsContent>

                            <TabsContent value="cancelled">
                                <EventManagementList
                                    events={filteredEvents.filter(e => e.status.toLowerCase() === 'cancelled')}
                                    onApprove={handleApproveEvent}
                                    onReject={handleRejectEvent}
                                    onSuspend={handleSuspendEvent}
                                    navigate={navigate}
                                    onCancel={handleCancelEvent}
                                    onToSubmit={handleToSubmitEvent}
                                />
                            </TabsContent>

                            <TabsContent value="submitted">
                                <EventManagementList
                                    events={filteredEvents.filter(e => e.status.toLowerCase() === 'submitted')}
                                    onApprove={handleApproveEvent}
                                    onReject={handleRejectEvent}
                                    onSuspend={handleSuspendEvent}
                                    navigate={navigate}
                                    onCancel={handleCancelEvent}
                                    onToSubmit={handleToSubmitEvent}
                                />
                            </TabsContent>
                        </Tabs>
                    </CardContent>
                </Card>

                {/* Recent Bookings */}
                <Card>
                    <CardHeader>
                        <CardTitle>Recent Bookings</CardTitle>
                        <CardDescription>Latest ticket purchases on the platform</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {bookings.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                No bookings yet
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {bookings.slice(0, 10).map(booking => {
                                    console.log(booking, events);
                                    const event = events.find(e => e.eventId == booking.eventId);
                                    console.log(event + " - we found ? ");
                                    if (!event) return null;

                                    return (
                                        <div key={booking.id} className="flex items-center justify-between p-3 border rounded-lg">
                                            <div className="flex-1">
                                                <div className="font-medium">{booking.userName || booking.bookingReference || booking.userId}</div>
                                                <div className="text-sm text-gray-600">{event.eventName}</div>
                                            </div>
                                            <div className="text-right">
                                                <div className="font-medium">${booking.totalAmount.toFixed(2)}</div>
                                                <div className="text-sm text-gray-600">
                                                    {booking.ticketQuantity} {booking.ticketQuantity === 1 ? 'ticket' : 'tickets'}
                                                </div>
                                            </div>
                                            <Badge
                                                variant={booking.status === 'confirmed' ? 'default' : 'secondary'}
                                                className="ml-4"
                                            >
                                                {booking.status}
                                            </Badge>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

function EventManagementList({ events, onApprove, onReject, onSuspend, onCancel, onToSubmit, navigate }: any) {
    console.log(events + " in event management list");
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
            {events.map((event: any, index: number) => (
                <div key={event.eventId || event.id || index} className="flex items-start gap-4 p-4 border rounded-lg">
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
                                    {format(new Date(String(event.eventStartInstant || event.eventStartDate || event.startDate || '').replace('Z', '')), 'MMM dd, yyyy')} at {event.eventStartInstant ? format(new Date(String(event.eventStartInstant).replace('Z', '')), 'h:mm a') : ''}
                                </p>
                            </div>
                            <Badge
                                variant={
                                    event.status.toLowerCase() === 'published' ? 'default' :
                                        event.status.toLowerCase() === 'cancelled' ? 'destructive' :
                                            'secondary'
                                }
                            >
                                {event.status}
                            </Badge>
                        </div>

                        <div className="flex items-center gap-4 text-sm mb-3">
                            <span className="text-gray-600">
                                {event.ticketsSold} / {event.capacity || event.maxCapacity || 0} tickets sold
                            </span>
                            <span className="font-medium">${((event.ticketsSold || 0) * (event.ticketPrice || event.price || 0)).toFixed(2)} revenue</span>
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

                            {event.status.toLowerCase() === 'submitted' && (
                                <>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => onApprove(event.eventId)}
                                        className="text-green-600 border-green-600 hover:bg-green-50"
                                    >
                                        <CheckCircle className="h-4 w-4 mr-1" />
                                        Approve
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => onReject(event.eventId)}
                                        className="text-red-600 border-red-600 hover:bg-red-50"
                                    >
                                        <Ban className="h-4 w-4 mr-1" />
                                        Reject
                                    </Button>
                                </>
                            )}

                            {event.status.toLowerCase() === 'published' && (
                                <>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => onToSubmit(event.eventId)}
                                        className="text-orange-600 border-orange-600 hover:bg-orange-50"
                                    >
                                        <AlertTriangle className="h-4 w-4 mr-1" />
                                        To Submit
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => onSuspend(event.eventId)}
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
                                onClick={() => onCancel(event.eventId)}
                                className="text-red-600 border-red-600 hover:bg-red-50"
                            >
                                <Ban className="h-4 w-4 mr-1" />
                                Remove
                            </Button>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
