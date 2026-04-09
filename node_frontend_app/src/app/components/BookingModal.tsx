import { useState } from 'react';
import type { Event } from '../types';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "./ui/dialog";
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { AddToCalendar } from './AddToCalender';
import { toast } from 'sonner';
import { CalendarPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { runAPI } from '../api';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

interface BookingModalProps {
    event: Event;
    open: boolean;
    onClose: () => void;
}

export function BookingModal({ event, open, onClose }: BookingModalProps) {
    const { currentUser } = useAuth();
    const [quantity, setQuantity] = useState(1);
    const [email, setEmail] = useState(currentUser?.email);
    const [name, setName] = useState(currentUser?.name);
    const [bookingConfirmed, setBookingConfirmed] = useState(false);
    const [ticketType, setTicketType] = useState('general');

    const api = runAPI();

    const ticketsSold = typeof event.ticketsSold === 'number' ? event.ticketsSold : 0;
    const maxCap = typeof event.maxCapacity === 'number' ? event.maxCapacity : 0;
    const availableTickets = Math.max(0, maxCap - ticketsSold);
    const totalAmount = (typeof event.ticketPrice === 'number' ? event.ticketPrice : 0) * quantity;

    const handleBooking = async () => {
        if (!currentUser?.id) {
            toast.error('Please log in to book tickets');
            return;
        }
        if (quantity > availableTickets) {
            toast.error('Not enough tickets available');
            return;
        }
        if (quantity < 1) {
            toast.error('Please select at least 1 ticket');
            return;
        }

        const eventId = event.eventId ?? (event as any).id ?? '';
        if (!eventId) {
            toast.error('Invalid event');
            return;
        }

        const booking = {
            id: '',
            eventId: String(eventId),
            userId: String(currentUser.id),
            userName: name || currentUser.name || '',
            userEmail: email || currentUser.email || '',
            ticketQuantity: quantity,
            totalAmount,
            bookingDate: new Date().toISOString(),
            status: 'confirmed' as const,
        };

        try {
            await api.addBooking(booking);
            setBookingConfirmed(true);
            toast.success(`Successfully booked ${quantity} ticket(s)!`);
        } catch (err: any) {
            const msg = err.response?.data?.message ?? err.message ?? 'Booking failed';
            toast.error(msg);
        }
    };

    const handleClose = () => {
        setBookingConfirmed(false);
        setQuantity(1);
        onClose();
    };

    if (bookingConfirmed) {
        return (
            <Dialog open={open} onOpenChange={handleClose}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>✓ Booking Confirmed!</DialogTitle>
                        <DialogDescription>
                            Your tickets have been successfully booked for {event.eventName}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-6 space-y-4">
                        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4 text-center">
                            <p className="text-emerald-600 dark:text-emerald-400 font-medium mb-2">
                                {quantity} {quantity === 1 ? 'Ticket' : 'Tickets'} Confirmed
                            </p>
                            <p className="text-sm text-emerald-600/80 dark:text-emerald-400/80">
                                A confirmation email has been sent to {email}
                            </p>
                        </div>

                        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                            <div className="flex items-start gap-3">
                                <CalendarPlus className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                                <div className="flex-1">
                                    <p className="font-medium text-blue-700 dark:text-blue-300 mb-1">
                                        Don't forget to add this to your calendar!
                                    </p>
                                    <p className="text-sm text-blue-600/80 dark:text-blue-400/80 mb-3">
                                        Get reminders before the event starts
                                    </p>
                                    <AddToCalendar event={event} size="sm" />
                                </div>
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button onClick={handleClose} className="w-full">
                            Done
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Book Tickets</DialogTitle>
                    <DialogDescription>{event.eventName}</DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Enter your name"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Enter your email"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="ticketType">Ticket Type</Label>
                        {/* TODO: Add ticket type selection */}
                        <Select
                            value={ticketType}
                            onValueChange={(value) => setTicketType(value)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select ticket type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="general">General</SelectItem>
                                <SelectItem value="vip">VIP</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* <div className="space-y-2">
                        <Label htmlFor="quantity">Number of Tickets</Label>
                        <Input
                            id="quantity"
                            type="number"
                            min="1"
                            max={availableTickets}
                            value={quantity}
                            onChange={(e) => setQuantity(Number(e.target.value))}
                        />
                        <p className="text-sm text-muted-foreground">
                            {availableTickets} tickets available
                        </p>
                    </div> */}

                    <div className="border-t pt-4">
                        <div className="flex justify-between mb-2">
                            <span className="text-sm">Price per ticket:</span>
                            <span className="font-medium">
                                {event.ticketPrice === 0 ? 'Free' : `$${event.ticketPrice}`}
                            </span>
                        </div>
                        <div className="flex justify-between mb-2">
                            <span className="text-sm">Quantity:</span>
                            <span className="font-medium">{quantity}</span>
                        </div>
                        <div className="flex justify-between text-lg font-bold">
                            <span>Total:</span>
                            <span>
                                {totalAmount === 0 ? 'Free' : `$${totalAmount}`}
                            </span>
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button onClick={handleBooking} disabled={availableTickets === 0}>
                        {availableTickets === 0 ? 'Sold Out' : 'Confirm Booking'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}