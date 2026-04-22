import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import {
    ArrowLeft,
    Users,
    Search,
    Download,
    CheckCircle,
    XCircle,
    Mail,
    Ticket,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { runAPI } from '../api';
import type { Booking, EventBookingSummary } from '../types';

export function AttendeesPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const api = runAPI();

    const [event, setEvent] = useState<any>(null);
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [bookingSummary, setBookingSummary] = useState<EventBookingSummary | null>(null);
    const [bookingsPage, setBookingsPage] = useState(0);
    const [bookingsTotal, setBookingsTotal] = useState(0);
    const [bookingsTotalPages, setBookingsTotalPages] = useState(0);
    const [bookingsLoading, setBookingsLoading] = useState(false);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        setBookingsPage(0);
    }, [id]);

    useEffect(() => {
        if (!id) return;
        setLoading(true);
        api
            .getEventById(id)
            .then((eventData) => {
                setEvent(eventData);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, [id]);

    useEffect(() => {
        if (!id) return;
        setBookingsLoading(true);
        Promise.all([
            api.getEventBookingSummary(id).catch(() => null),
            api.getEventBookingsPaged({ eventId: id, page: bookingsPage, size: 10 }),
        ])
            .then(([summaryData, paged]) => {
                setBookingSummary(summaryData);
                setBookings(Array.isArray(paged.content) ? paged.content : []);
                setBookingsTotal(paged.totalElements);
                setBookingsTotalPages(paged.totalPages);
            })
            .catch(console.error)
            .finally(() => setBookingsLoading(false));
    }, [id, bookingsPage]);

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

    if (!event) {
        return (
            <div className="container mx-auto px-4 py-16 text-center">
                <h2 className="text-2xl font-bold mb-4">Event not found</h2>
                <Button onClick={() => navigate('/dashboard')}>Back to Dashboard</Button>
            </div>
        );
    }

    const confirmed = bookings.filter((b) => b.status === 'confirmed');
    const cancelled = bookings.filter((b) => b.status === 'cancelled');
    const totalTickets =
        bookingSummary?.confirmedTicketQuantity ??
        confirmed.reduce((sum, b) => sum + b.ticketQuantity, 0);
    const totalRevenue =
        bookingSummary != null
            ? Number(bookingSummary.confirmedRevenue)
            : confirmed.reduce((sum, b) => sum + b.totalAmount, 0);

    const filtered = confirmed.filter(b =>
        b.userName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.userEmail?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleCancelBooking = async (bookingId: string) => {
        try {
            await api.cancelBooking(bookingId);
            toast.success('Booking cancelled');
            if (!id) return;
            const [summaryData, paged] = await Promise.all([
                api.getEventBookingSummary(id).catch(() => null),
                api.getEventBookingsPaged({ eventId: id, page: bookingsPage, size: 10 }),
            ]);
            setBookingSummary(summaryData);
            setBookings(Array.isArray(paged.content) ? paged.content : []);
            setBookingsTotal(paged.totalElements);
            setBookingsTotalPages(paged.totalPages);
        } catch {
            toast.error('Failed to cancel booking');
        }
    };

    const handleExportCSV = async () => {
        if (!id) return;
        setBookingsLoading(true);
        try {
            const pageSize = 100;
            let page = 0;
            let all: Booking[] = [];
            let totalPages = 1;
            while (page < totalPages) {
                const res = await api.getEventBookingsPaged({ eventId: id, page, size: pageSize });
                all = [...all, ...res.content];
                totalPages = res.totalPages;
                page++;
            }
            const rows = all.filter((b) => b.status === 'confirmed');
            const headers = ['Name', 'Email', 'Tickets', 'Amount', 'Date', 'Status'];
            const csvRows = rows.map((b) => [
                b.userName,
                b.userEmail,
                b.ticketQuantity,
                `$${b.totalAmount.toFixed(2)}`,
                b.bookingDate ? format(new Date(b.bookingDate), 'yyyy-MM-dd') : '',
                b.status,
            ]);
            const csv = [headers.join(','), ...csvRows.map((r) => r.join(','))].join('\n');
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `attendees-${event.eventName?.replace(/\s/g, '_')}.csv`;
            a.click();
            URL.revokeObjectURL(url);
            toast.success('CSV exported!');
        } catch {
            toast.error('Export failed');
        } finally {
            setBookingsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="container mx-auto px-4 py-8">
                <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                </Button>

                <div className="mb-8">
                    <h1 className="text-3xl font-bold mb-2">Attendee Management</h1>
                    <p className="text-gray-600">{event.eventName}</p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Total Attendees</CardTitle>
                            <Users className="h-4 w-4 text-gray-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {bookingSummary?.confirmedBookingCount ?? confirmed.length}
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Tickets Sold</CardTitle>
                            <Ticket className="h-4 w-4 text-gray-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{totalTickets} / {event.maxCapacity || 0}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
                            <span className="text-gray-500 text-sm">$</span>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">${totalRevenue.toFixed(2)}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Cancellations</CardTitle>
                            <XCircle className="h-4 w-4 text-gray-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {bookingSummary?.cancelledBookingCount ?? cancelled.length}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Attendees List */}
                <Card>
                    <CardHeader>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div>
                                <CardTitle>Attendees</CardTitle>
                                <CardDescription>
                                    {bookingSummary?.confirmedBookingCount ?? confirmed.length} confirmed
                                    registrations
                                    {bookingsTotal > 0 ? ` · ${bookingsTotal} total booking rows` : ''}
                                </CardDescription>
                            </div>
                            <Button variant="outline" size="sm" onClick={handleExportCSV}>
                                <Download className="h-4 w-4 mr-2" />
                                Export CSV
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="relative mb-4">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Search attendees by name or email..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10"
                            />
                        </div>

                        {filtered.length === 0 ? (
                            <div className="text-center py-12">
                                <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                                <p className="text-gray-500">No attendees found</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b text-left">
                                            <th className="pb-3 font-medium text-gray-500">Attendee</th>
                                            <th className="pb-3 font-medium text-gray-500">Tickets</th>
                                            <th className="pb-3 font-medium text-gray-500">Amount</th>
                                            <th className="pb-3 font-medium text-gray-500">Date</th>
                                            <th className="pb-3 font-medium text-gray-500">Status</th>
                                            <th className="pb-3 font-medium text-gray-500">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {filtered.map(booking => (
                                            <tr key={booking.id} className="hover:bg-gray-50">
                                                <td className="py-3">
                                                    <div className="font-medium">{booking.userName || 'Anonymous'}</div>
                                                    <div className="text-gray-500 text-xs">{booking.userEmail}</div>
                                                </td>
                                                <td className="py-3">{booking.ticketQuantity}</td>
                                                <td className="py-3">${booking.totalAmount.toFixed(2)}</td>
                                                <td className="py-3 text-gray-500">
                                                    {booking.bookingDate ? format(new Date(booking.bookingDate), 'MMM dd, yyyy') : '-'}
                                                </td>
                                                <td className="py-3">
                                                    <Badge variant={booking.status === 'confirmed' ? 'default' : 'secondary'}>
                                                        {booking.status === 'confirmed' ? (
                                                            <><CheckCircle className="h-3 w-3 mr-1" /> Confirmed</>
                                                        ) : booking.status}
                                                    </Badge>
                                                </td>
                                                <td className="py-3">
                                                    <div className="flex gap-1">
                                                        {booking.userEmail && (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => window.open(`mailto:${booking.userEmail}`)}
                                                                title="Send email"
                                                            >
                                                                <Mail className="h-3.5 w-3.5" />
                                                            </Button>
                                                        )}
                                                        {booking.status === 'confirmed' && (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => handleCancelBooking(booking.id)}
                                                                className="text-red-600 hover:text-red-700"
                                                                title="Cancel booking"
                                                            >
                                                                <XCircle className="h-3.5 w-3.5" />
                                                            </Button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                        {bookingsTotal > 0 && (
                            <div className="flex items-center justify-between gap-4 pt-8 border-t mt-8">
                                <p className="text-sm text-gray-600">
                                    Page {bookingsPage + 1} of {Math.max(1, bookingsTotalPages)} ({bookingsTotal}{' '}
                                    total)
                                </p>
                                <div className="flex gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        disabled={bookingsLoading || bookingsPage <= 0}
                                        onClick={() => setBookingsPage((p) => p - 1)}
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                        Prev
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        disabled={bookingsLoading || bookingsPage >= bookingsTotalPages - 1}
                                        onClick={() => setBookingsPage((p) => p + 1)}
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
