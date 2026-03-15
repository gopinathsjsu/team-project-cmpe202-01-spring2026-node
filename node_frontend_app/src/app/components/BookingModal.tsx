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

    const api = runAPI();

    const availableTickets = event.maxCapacity - event.ticketsSold || 0;
    const totalAmount = event.ticketPrice * quantity || 0;

    const handleBooking = () => {
        if (quantity > availableTickets) {
            toast.error('Not enough tickets available');
            return;
        }

        if (quantity < 1) {
            toast.error('Please select at least 1 ticket');
            return;
        }

        const booking = {
            id: `booking-${Date.now()}`,
            eventId: event.eventId || (event as any).id || '',
            userId: currentUser?.id || '',
            userName: name || '',
            userEmail: email || '',
            ticketQuantity: quantity,
            totalAmount,
            bookingDate: new Date().toISOString(),
            status: 'confirmed' as const,
        };

        api.addBooking(booking);
        setBookingConfirmed(true);
        toast.success(`Successfully booked ${quantity} ticket(s)!`);
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
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                            <p className="text-green-800 font-medium mb-2">
                                {quantity} {quantity === 1 ? 'Ticket' : 'Tickets'} Confirmed
                            </p>
                            <p className="text-sm text-green-700">
                                A confirmation email has been sent to {email}
                            </p>
                        </div>

                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <div className="flex items-start gap-3">
                                <CalendarPlus className="h-5 w-5 text-blue-600 mt-0.5" />
                                <div className="flex-1">
                                    <p className="font-medium text-blue-900 mb-1">
                                        Don't forget to add this to your calendar!
                                    </p>
                                    <p className="text-sm text-blue-700 mb-3">
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
                        <Label htmlFor="quantity">Number of Tickets</Label>
                        <Input
                            id="quantity"
                            type="number"
                            min="1"
                            max={availableTickets}
                            value={quantity}
                            onChange={(e) => setQuantity(Number(e.target.value))}
                        />
                        <p className="text-sm text-gray-500">
                            {availableTickets} tickets available
                        </p>
                    </div>

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