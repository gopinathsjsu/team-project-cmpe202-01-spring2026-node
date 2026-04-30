import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Calendar, MapPin, Users, Tag, ArrowLeft, Share2, Heart } from 'lucide-react';
import { toast } from 'sonner';
import { formatInZone } from '../context/CalenderUtils';
import { useAuth } from '../context/AuthContext';
import { runAPI } from '../api';
import { EventMap } from '../components/EventMap';
import { AddToCalendar } from '../components/AddToCalender';
import { BookingModal } from '../components/BookingModal';
import { resolveEventImageUrl } from '@/lib/eventImageStorage';

export function EventDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    //const { events, getEventBookings } = useEvents();
    const { currentUser } = useAuth();
    const [bookingModalOpen, setBookingModalOpen] = useState(false);
    const api = runAPI();
    const [event, setEvent] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [bookings, setBookings] = useState<any[]>([]);

    useEffect(() => {
        if (!id) return;
        let cancelled = false;
        setLoading(true);
        Promise.all([
            api.getEventById(id).catch(() => null),
            api.getEventBookings(id).catch(() => [])
        ]).then(([eventData, bookings]) => {
            if (cancelled) return;
            setEvent(eventData);
            setBookings(bookings);
            setLoading(false);
        });
        return () => {
            cancelled = true;
        };
    }, [id]);

    //const attendeeCount = bookings.reduce((sum, b) => sum + b.ticketQuantity, 0) || 0;

    if (loading) {
        return (
            <div className="container mx-auto px-4 py-16 text-center">
                <p>Loading event details...</p>
            </div>
        );
    }

    if (!event) {
        return (
            <div className="container mx-auto px-4 py-16 text-center">
                <h2 className="text-2xl font-bold mb-4">Event not found</h2>
                <Button onClick={() => navigate('/events')}>Browse Events</Button>
            </div>
        );
    }

    // Backend may not return ticketsSold; derive from bookings (ticket list) when missing.
    // Note: eventStartInstant is an absolute UTC ISO string — parse it as-is so the
    // comparison against `new Date()` is done in real wall-clock terms.
    const startDate = new Date(String(event.eventStartInstant || event.eventStartDate || event.startDate || ''));
    const eventTz = event.eventTimeZone || Intl.DateTimeFormat().resolvedOptions().timeZone;
    const ticketsSold = typeof event.ticketsSold === 'number'
        ? event.ticketsSold
        : bookings.reduce((sum, b) => sum + (b.ticketQuantity ?? 0), 0);
    const maxCapacity = event.maxCapacity ?? event.capacity ?? 0;
    const availableTickets = Math.max(0, maxCapacity - ticketsSold);
    const percentageSold = maxCapacity > 0 ? (ticketsSold / maxCapacity) * 100 : 0;
    const isBookable = event.status === 'PUBLISHED' || event.status === 'APPROVED' || startDate > new Date();

    const isAlreadyBookedByUser = bookings.some(b => String(b.userId) === String(currentUser?.id) && b.status === 'CONFIRMED');
    const handleShare = () => {
        navigator.clipboard.writeText(window.location.href);
        toast.success('Link copied to clipboard!');
    };

    const cancelBookingByUserIdAndEventId = (userId: string, eventId: string) => {
        api.cancelBookingByUserIdAndEventId(userId, eventId).then(() => {
            toast.success('Booking cancelled successfully!');
            // Refresh bookings to instantly update the UI switch
            api.getEventBookings(eventId).then(setBookings).catch(console.error);
        }).catch((err) => {
            console.error(err);
            toast.error('Failed to cancel booking.');
        });
    };

    return (
        <div className="min-h-screen bg-background text-foreground">
            <div className="container mx-auto px-4 py-8">
                <Button
                    variant="ghost"
                    onClick={() => navigate(-1)}
                    className="mb-6"
                >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                </Button>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-card text-card-foreground border rounded-lg overflow-hidden shadow-sm">
                            <div className="aspect-video overflow-hidden bg-muted">
                                <img
                                    src={resolveEventImageUrl(event.imageUrl)}
                                    alt={event.eventName}
                                    className="w-full h-full object-cover"
                                />
                            </div>

                            <div className="p-6">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex-1">
                                        <div className="flex gap-2 mb-3">
                                            {event.categories && event.categories.length > 0 && event.categories.map((cat: any) => (
                                                <Badge key={cat.categoryId || cat.categoryName || cat}>{cat.categoryName || cat.name || cat}</Badge>
                                            ))}
                                        </div>
                                        <h1 className="text-3xl font-bold mb-2">{event.eventName}</h1>
                                        <p className="text-muted-foreground">Organized by {event.eventOwnerName || 'Organizer'}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button variant="outline" size="icon" onClick={handleShare}>
                                            <Share2 className="h-4 w-4" />
                                        </Button>
                                        <Button variant="outline" size="icon">
                                            <Heart className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-6 border-y border-border">
                                    <div className="flex items-start gap-3">
                                        <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                                        <div>
                                            <div className="font-medium">Date & Time</div>
                                            <div className="text-muted-foreground">
                                                {formatInZone(event.eventStartInstant || event.eventStartDate || event.startDate, eventTz, 'MMMM dd, yyyy h:mm a')}
                                            </div>
                                            <div className="text-muted-foreground">
                                                {event.eventEndInstant
                                                    ? formatInZone(event.eventEndInstant, eventTz, 'MMMM dd, yyyy h:mm a')
                                                    : ''}
                                            </div>
                                            {event.eventTimeZone ? (
                                                <div className="text-xs text-muted-foreground/80 mt-1">
                                                    Timezone: {event.eventTimeZone}
                                                </div>
                                            ) : null}
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3">
                                        <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                                        <div>
                                            <div className="font-medium">Location</div>
                                            <div className="text-muted-foreground">{event.eventLocation?.locationName || (event.location as any)?.name || ''}</div>
                                            <div className="text-muted-foreground">{event.eventLocation?.locationAddress || (event.location as any)?.address || (typeof event.location === 'string' ? event.location : '') || ''}</div>
                                        </div>
                                    </div>
                                </div>

                                <div className="py-6">
                                    <h2 className="text-xl font-bold mb-4">About this event</h2>
                                    <p className="text-foreground/80 whitespace-pre-line leading-relaxed">
                                        {event.eventDescription}
                                    </p>
                                </div>

                                {event.tags && event.tags.length > 0 && (
                                    <div className="py-6 border-t border-border">
                                        <div className="flex items-center gap-2 mb-3">
                                            <Tag className="h-5 w-5 text-muted-foreground" />
                                            <h3 className="font-medium">Tags</h3>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {event.tags.map((tag: any) => (
                                                <Badge key={tag} variant="secondary">
                                                    {tag}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="bg-card text-card-foreground border rounded-lg shadow-sm p-6">
                            <h2 className="text-xl font-bold mb-4">Event Location</h2>
                            <EventMap
                                location={event.eventLocation?.locationAddress || (event.location as any)?.address || (typeof event.location === 'string' ? event.location : '') || ''}
                                venue={event.eventLocation?.locationName || event.venue || (event.location as any)?.name || ''}
                            />
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="lg:col-span-1">
                        <div className="bg-card text-card-foreground border rounded-lg shadow-sm p-6 sticky top-24">
                            <div className="mb-6">
                                {event.ticketPrice === 0 ? (
                                    <div className="text-3xl font-bold text-emerald-500">Free</div>
                                ) : (
                                    <div className="text-3xl font-bold">${event.ticketPrice}</div>
                                )}
                                <div className="text-sm text-muted-foreground">per ticket</div>
                            </div>

                            <div className="space-y-4 mb-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <Users className="h-4 w-4" />
                                        <span className="text-sm">Tickets Available</span>
                                    </div>
                                    <span className="font-medium">{availableTickets}</span>
                                </div>

                                {percentageSold > 0 && (
                                    <div>
                                        <div className="flex items-center justify-between mb-2 text-sm">
                                            <span className="text-muted-foreground">Tickets Sold</span>
                                            <span className="font-medium">{Math.round(percentageSold)}%</span>
                                        </div>
                                        <div className="h-2 bg-secondary rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-primary rounded-full transition-all"
                                                style={{ width: `${percentageSold}%` }}
                                            />
                                        </div>
                                    </div>
                                )}

                                {percentageSold > 70 && availableTickets > 0 && (
                                    <Badge variant="destructive" className="w-full justify-center">
                                        Selling Fast!
                                    </Badge>
                                )}
                            </div>

                            {isBookable && currentUser?.role === 'ATTENDEE' && availableTickets > 0 ? (
                                <>
                                    {isAlreadyBookedByUser ? (<Button className="w-full" size="lg" onClick={() => cancelBookingByUserIdAndEventId(currentUser.id, event.eventId)}>
                                        Cancel Booking</Button>)
                                        : <Button className="w-full" size="lg" onClick={() => setBookingModalOpen(true)}>
                                            Get Tickets</Button>
                                    }

                                </>
                            ) : event.status === 'cancelled' || event.status === 'CANCELLED' ? (
                                <Button className="w-full" size="lg" disabled>
                                    Event Cancelled
                                </Button>
                            ) : ((availableTickets === 0) ? (
                                <Button className="w-full" size="lg" disabled>
                                    Sold Out
                                </Button>
                            ) : (<></>
                                // <Button className="w-full" size="lg" disabled>
                                //     Sold Out
                                // </Button>
                            )
                            )}

                            {currentUser?.role === 'ORGANIZER' && event.organizerId === currentUser.id && (
                                <Button
                                    variant="outline"
                                    className="w-full mt-3"
                                    onClick={() => navigate(`/dashboard`)}
                                >
                                    Manage Event
                                </Button>
                            )}

                            {/* Add to Calendar */}
                            <div className="mt-3 mb-6">
                                <AddToCalendar event={event} variant="outline" className="w-full" />
                            </div>

                            {(currentUser?.role === 'ADMIN' || (currentUser?.role === 'ORGANIZER' && event.eventOwnerId === currentUser?.id)) && (
                                <div className="mt-6 pt-6 border-t border-border">
                                    <h3 className="font-medium mb-3">Organizer Details</h3>
                                    <div className="space-y-3 text-sm">
                                        <div className="flex items-center justify-between">
                                            <span className="text-muted-foreground">Capacity</span>
                                            <span className="font-medium">{event.maxCapacity || event.capacity || 0}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-muted-foreground">Attendees</span>
                                            <span className="font-medium">{bookings.length}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-muted-foreground">Revenue</span>
                                            <span className="font-medium">${(bookings.length * (event.ticketPrice || event.price || 0)).toFixed(2)}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-muted-foreground">Status</span>
                                            <Badge variant={event.status?.toLowerCase() === 'published' ? 'default' : 'secondary'}>
                                                {event.status}
                                            </Badge>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {currentUser?.role === 'ADMIN' && (
                                <div className="mt-6 pt-6 border-t border-border">
                                    <h3 className="font-medium mb-3">Admin Actions</h3>
                                    <div className="space-y-2">
                                        {event.status?.toLowerCase() !== 'published' && (
                                            <Button
                                                variant="outline"
                                                className="w-full text-green-600 border-green-600 hover:bg-green-50"
                                                onClick={() => {
                                                    api.updateEventStatus(event.eventId || id || '', 'published').then(() => {
                                                        toast.success('Event published');
                                                        setEvent({ ...event, status: 'published' });
                                                    });
                                                }}
                                            >
                                                Publish Event
                                            </Button>
                                        )}
                                        {event.status?.toLowerCase() === 'published' && (
                                            <Button
                                                variant="outline"
                                                className="w-full text-red-600 border-red-600 hover:bg-red-50"
                                                onClick={() => {
                                                    api.updateEventStatus(event.eventId || id || '', 'SUBMITTED').then(() => {
                                                        toast.success('Event unpublished and set to submitted');
                                                        setEvent({ ...event, status: 'SUBMITTED' });
                                                    });
                                                }}
                                            >
                                                Unpublish Event
                                            </Button>
                                        )}
                                        {event.status?.toLowerCase() !== 'CANCELLED' && (
                                            <Button
                                                variant="outline"
                                                className="w-full text-red-600 border-red-600 hover:bg-red-50"
                                                onClick={() => {
                                                    api.updateEventStatus(event.eventId || id || '', 'CANCELLED').then(() => {
                                                        toast.success('Event cancelled');
                                                        setEvent({ ...event, status: 'CANCELLED' });
                                                    });
                                                }}
                                            >
                                                Cancel Event
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <BookingModal
                event={{ ...event, ticketsSold, maxCapacity: maxCapacity || event.maxCapacity }}
                open={bookingModalOpen}
                onClose={() => setBookingModalOpen(false)}
            />
        </div>
    );
}