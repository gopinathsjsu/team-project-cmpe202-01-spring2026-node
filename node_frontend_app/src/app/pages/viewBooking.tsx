import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import {
    ArrowLeft,
    Mail,
    CalendarPlus,
    HelpCircle,
    MapPin,
    User,
    Clock,
    Globe,
    Info,
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { runAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import type { Event, UserBooking } from '../types';

const createGoogleCalendarLink = (event: { eventName: string; eventDescription: string; eventStartInstant: string; eventEndInstant: string; eventLocation?: { locationAddress: string; locationName: string } }) => {
    const title = encodeURIComponent(event.eventName || 'Event');
    const details = encodeURIComponent(event.eventDescription || '');
    const location = encodeURIComponent(event.eventLocation?.locationAddress || event.eventLocation?.locationName || '');
    const start = new Date(String(event.eventStartInstant)).toISOString().replace(/-|:|\.\d\d\d/g, '');
    const end = new Date(String(event.eventEndInstant)).toISOString().replace(/-|:|\.\d\d\d/g, '');
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${start}/${end}&details=${details}&location=${location}`;
};

export function ViewBooking() {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const { currentUser } = useAuth();
    const api = runAPI();

    const [booking, setBooking] = useState<UserBooking | null>(null);
    const [event, setEvent] = useState<Event | null>(null);
    const [loading, setLoading] = useState(true);
    const [recipientEmail, setRecipientEmail] = useState('');
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [canceling, setCanceling] = useState(false);

    useEffect(() => {
        if (!id || !currentUser) {
            setLoading(false);
            return;
        }

        setLoading(true);
        api.getUserBookingByBookingId(id)
            .then((booking) => {
                
                setBooking(booking);
                if (!booking) {
                    return null;
                }

                setRecipientEmail(booking.userEmail || currentUser.email || '');
                const formattedDate = booking.eventStartInstant
                    ? format(new Date(String(booking.eventStartInstant).replace('Z', '')), 'MMM dd, yyyy h:mm a')
                    : 'TBD';
                setSubject(`Booking update for ${booking.eventName}`);
                setMessage(`Hi ${booking.userName || currentUser.name},\n\nHere are the details for your booking: \nBooking Reference No: ${booking.bookingReference}\nEvent: ${booking.eventName}\nDate: ${formattedDate}\nTickets: ${booking.quantity}\nTotal: $${booking.totalAmount.toFixed(2)}\n\nIf you need help, visit the contact/help page.\n\nThanks,\nNode Events Team`);

                return api.getEventById(booking.eventId).catch(() => null);
            })
            .then((eventData) => {
                if (eventData) {
                    setEvent(eventData);
                }
            })
            .catch(() => {
                toast.error('Unable to load booking details.');
            })
            .finally(() => setLoading(false));
    }, [id, currentUser]);

    const handleSendEmail = () => {
        if (!recipientEmail.trim()) {
            toast.error('Enter an email address to send to.');
            //Todo:api to send email directly from the backend instead of opening mail client

            return;
        }

        const mailto = `mailto:${recipientEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
        window.open(mailto, '_blank');
    };

    const handleCancelBooking = async () => {
        if (!booking) return;
        setCanceling(true);
        try {
            await api.cancelBooking(booking.bookingId);
            setBooking({ ...booking, status: 'cancelled' });
            toast.success('Booking cancelled successfully.');
        } catch (error) {
            toast.error('Failed to cancel booking.');
        } finally {
            setCanceling(false);
        }
    };

    if (loading) {
        return (
            <div className="container mx-auto px-4 py-16 text-center">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 bg-gray-200 rounded w-1/3 mx-auto" />
                    <div className="h-4 bg-gray-200 rounded w-1/4 mx-auto" />
                </div>
            </div>
        );
    }

    if (!booking) {
        return (
            <div className="container mx-auto px-4 py-16 text-center">
                <h1 className="text-3xl font-bold mb-4">Booking Not Found</h1>
                <p className="text-gray-600 mb-6">We could not locate that booking. Check your dashboard or try again.</p>
                <Button onClick={() => navigate('/dashboard')}>Back to Dashboard</Button>
            </div>
        );
    }

    const eventDate = booking.eventStartInstant
        ? format(new Date(String(booking.eventStartInstant).replace('Z', '')), 'MMM dd, yyyy')
        : 'TBD';
    const eventTime = booking.eventStartInstant
        ? format(new Date(String(booking.eventStartInstant).replace('Z', '')), 'h:mm a')
        : 'TBD';

    const calendarUrl = booking.eventStartInstant && booking.eventEndInstant
        ? createGoogleCalendarLink({
            eventName: booking.eventName,
            eventDescription: booking.eventDescription,
            eventStartInstant: booking.eventStartInstant,
            eventEndInstant: booking.eventEndInstant,
            eventLocation: booking.eventLocation,
        })
        : '#';

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="container mx-auto px-4 py-10">
                <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                </Button>

                <div className="grid gap-6 lg:grid-cols-3">
                    <div className="lg:col-span-2">
                        <Card className="mb-6">
                            <CardHeader>
                                <CardTitle>Booking Details</CardTitle>
                                <CardDescription>View and manage your booking information.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between gap-3">
                                        <div>
                                            <h2 className="text-2xl font-semibold">{booking.eventName}</h2>
                                            <p className="text-sm text-gray-600 mt-1">{booking.eventDescription}</p>
                                        </div>
                                        <Badge variant={booking.status === 'confirmed' ? 'default' : 'destructive'}>
                                            {booking.status}
                                        </Badge>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="rounded-lg border p-4 bg-white">
                                            <p className="text-xs uppercase tracking-wide text-gray-500">Booking</p>
                                            <p className="mt-2 text-lg font-semibold">{booking.bookingReference}</p>
                                            <p className="text-sm text-gray-600">{format(new Date(String(booking.createdAt).replace('Z', '')), 'MMM dd, yyyy h:mm a')}</p>
                                        </div>
                                        <div className="rounded-lg border p-4 bg-white">
                                            <p className="text-xs uppercase tracking-wide text-gray-500">Tickets</p>
                                            <p className="mt-2 text-lg font-semibold">{booking.quantity}</p>
                                            <p className="text-sm text-gray-600">paid: ${booking.totalAmount.toFixed(2) ? booking.totalAmount.toFixed(2) : 'Free'}</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="rounded-lg border p-4 bg-white">
                                            <div className="flex items-center gap-2 text-gray-600 mb-2">
                                                <Clock className="h-4 w-4" />
                                                <span className="text-xs uppercase tracking-wide">Event time</span>
                                            </div>
                                            <p className="font-semibold">{eventDate}</p>
                                            <p className="text-sm text-gray-600">{eventTime}</p>
                                        </div>
                                        <div className="rounded-lg border p-4 bg-white">
                                            <div className="flex items-center gap-2 text-gray-600 mb-2">
                                                <MapPin className="h-4 w-4" />
                                                <span className="text-xs uppercase tracking-wide">Location</span>
                                            </div>
                                            <p className="font-semibold">{booking.eventLocation?.locationName || 'TBD'}</p>
                                            <p className="text-sm text-gray-600">{booking.eventLocation?.locationAddress || 'Address not available'}</p>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap gap-3">
                                        <Button onClick={() => navigate(`/events/${booking.eventId}`)}>
                                            View Event
                                        </Button>
                                        <Button variant="secondary" onClick={() => window.open(calendarUrl, '_blank')}>
                                            <CalendarPlus className="h-4 w-4 mr-2" />
                                            Add to Google Calendar
                                        </Button>
                                        <Button variant="outline" onClick={() => navigate('/contact')}>
                                            <HelpCircle className="h-4 w-4 mr-2" />
                                            Contact Support
                                        </Button>
                                        <Button
                                            variant="destructive"
                                            disabled={booking.status !== 'CONFIRMED' || canceling}
                                            onClick={handleCancelBooking}
                                        >
                                            {booking.status === 'CONFIRMED' ? 'Cancel Booking' : 'Already Cancelled'}
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Send an email</CardTitle>
                                <CardDescription>Message the booking holder or a custom address.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                                    <Input
                                        type="email"
                                        value={recipientEmail}
                                        onChange={(event) => setRecipientEmail(event.target.value)}
                                        placeholder="recipient@example.com"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                                    <Input
                                        value={subject}
                                        onChange={(event) => setSubject(event.target.value)}
                                        placeholder="Booking update subject"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                                    <Textarea
                                        disabled = {true}
                                        value={message}
                                        onChange={(event) => setMessage(event.target.value)}
                                        rows={6}
                                        placeholder="Write your message here..."
                                    />
                                </div>
                                <div className="flex flex-wrap gap-3">
                                    <Button onClick={handleSendEmail}>
                                        <Mail className="h-4 w-4 mr-2" />
                                        Send Email
                                    </Button>
                                    <Button variant="outline" onClick={() => navigate('/contact')}>
                                        <Info className="h-4 w-4 mr-2" />
                                        Help / Contact
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* {(currentUser && ( currentUser.role === 'ORGANIZER' || currentUser.role === 'ADMIN') ) &&( */}

                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Attendee</CardTitle>
                                <CardDescription>Booking holder information.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 text-gray-600">
                                        <User className="h-4 w-4" />
                                        <span>{booking.userName || (currentUser && currentUser.name) || 'User'}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-gray-600">
                                        <Mail className="h-4 w-4" />
                                        <span>{booking.userEmail}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-gray-600">
                                        <Globe className="h-4 w-4" />
                                        <span>{booking.eventTimeZone || 'PST'}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {event && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Event Summary</CardTitle>
                                    <CardDescription>Details from the event record.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div>
                                        <p className="text-xs uppercase tracking-wide text-gray-500">Organizer</p>
                                        <p className="font-medium">{event.eventOwnerName || 'Organizer'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs uppercase tracking-wide text-gray-500">Seats</p>
                                        <p className="font-medium">{event.ticketsSold} sold of {event.maxCapacity}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs uppercase tracking-wide text-gray-500">Status</p>
                                        <Badge variant={event.status === 'CANCELLED' ? 'destructive' : 'secondary'}>{event.status}</Badge>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                    
                </div>
            </div>
        </div>
    );
}
