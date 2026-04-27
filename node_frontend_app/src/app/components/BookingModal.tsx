import { useState, useEffect, useMemo } from 'react';
import type { Event, TicketTypeApi } from '../types';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from './ui/dialog';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { AddToCalendar } from './AddToCalender';
import { toast } from 'sonner';
import { CalendarPlus, CreditCard, Lock, CheckCircle2, Minus, Plus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { runAPI } from '../api';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

interface BookingModalProps {
    event: Event;
    open: boolean;
    onClose: () => void;
}

type BookingStep = 'details' | 'payment' | 'confirmed';

export function BookingModal({ event, open, onClose }: BookingModalProps) {
    const { currentUser } = useAuth();
    const [quantity, setQuantity] = useState(1);
    const [email, setEmail] = useState(currentUser?.email || '');
    const [name, setName] = useState(currentUser?.name || '');
    const [step, setStep] = useState<BookingStep>('details');
    const [ticketTypes, setTicketTypes] = useState<TicketTypeApi[]>([]);
    const [selectedTicketTypeName, setSelectedTicketTypeName] = useState('');
    const [processing, setProcessing] = useState(false);

    const [cardNumber, setCardNumber] = useState('');
    const [cardExpiry, setCardExpiry] = useState('');
    const [cardCvc, setCardCvc] = useState('');

    const api = runAPI();

    const eventIdStr = String(event.eventId ?? '');

    // If the auth state changes while the modal is open (login from another tab,
    // token refresh, profile update), keep the prefilled name/email in sync with
    // the new identity instead of holding the values captured at first render.
    useEffect(() => {
        setName(currentUser?.name ?? '');
        setEmail(currentUser?.email ?? '');
    }, [currentUser?.id, currentUser?.email, currentUser?.name]);

    useEffect(() => {
        if (!open || !eventIdStr) return;
        setStep('details');
        setQuantity(1);
        // Guard against setState-after-unmount and against a stale response
        // overwriting state if the user closes and reopens the modal quickly.
        let cancelled = false;
        api.getTicketTypesForEvent(eventIdStr)
            .then((list) => {
                if (cancelled) return;
                setTicketTypes(list);
                if (list.length > 0) {
                    setSelectedTicketTypeName(list[0].ticketType);
                } else {
                    setSelectedTicketTypeName('General');
                }
            })
            .catch((err: unknown) => {
                if (cancelled) return;
                console.error(err);
                const msg =
                    (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
                    'Could not load ticket types. Please try again or contact support.';
                toast.error(msg);
                setTicketTypes([]);
                setSelectedTicketTypeName('General');
            });
        return () => {
            cancelled = true;
        };
    }, [open, eventIdStr]);

    const ticketsSold = typeof event.ticketsSold === 'number' ? event.ticketsSold : 0;
    const maxCap = typeof event.maxCapacity === 'number' ? event.maxCapacity : 0;
    const availableTicketsEvent = Math.max(0, maxCap - ticketsSold);

    const selectedTypeRow = useMemo(
        () => ticketTypes.find((t) => t.ticketType === selectedTicketTypeName),
        [ticketTypes, selectedTicketTypeName]
    );

    const unitPrice =
        selectedTypeRow != null
            ? Number(selectedTypeRow.price)
            : typeof event.ticketPrice === 'number'
              ? event.ticketPrice
              : 0;

    const availableTickets =
        selectedTypeRow != null
            ? Math.max(0, selectedTypeRow.availableQuantity ?? 0)
            : availableTicketsEvent;

    const totalAmount = unitPrice * quantity;
    const isFree = unitPrice === 0;

    useEffect(() => {
        if (availableTickets < 1) return;
        setQuantity((q) => Math.min(q, availableTickets));
    }, [availableTickets]);

    const handleProceedToPayment = () => {
        if (!name || !email) {
            toast.error('Please fill in your name and email');
            return;
        }
        if (quantity < 1 || quantity > availableTickets) {
            toast.error('Invalid ticket quantity');
            return;
        }
        if (isFree) {
            handleConfirmBooking();
        } else {
            setStep('payment');
        }
    };

    const handleConfirmBooking = async () => {
        if (!currentUser?.id) {
            toast.error('Please log in to book tickets');
            return;
        }

        setProcessing(true);
        const eventId = event.eventId ?? '';
        if (!eventId) {
            toast.error('Invalid event');
            setProcessing(false);
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
            await api.addBooking(booking, selectedTicketTypeName || undefined);
            setStep('confirmed');
            toast.success(`Successfully booked ${quantity} ticket(s)!`);
        } catch (err: unknown) {
            const msg =
                (err as { response?: { data?: { message?: string } }; message?: string })
                    ?.response?.data?.message ??
                (err as { message?: string })?.message ??
                'Booking failed';
            toast.error(msg);
        } finally {
            setProcessing(false);
        }
    };

    const handleClose = () => {
        setStep('details');
        setQuantity(1);
        setCardNumber('');
        setCardExpiry('');
        setCardCvc('');
        onClose();
    };

    const formatCardNumber = (value: string) => {
        const v = value.replace(/\D/g, '').slice(0, 16);
        return v.replace(/(.{4})/g, '$1 ').trim();
    };

    const formatExpiry = (value: string) => {
        const v = value.replace(/\D/g, '').slice(0, 4);
        if (v.length >= 3) return v.slice(0, 2) + '/' + v.slice(2);
        return v;
    };

    if (step === 'confirmed') {
        return (
            <Dialog open={open} onOpenChange={handleClose}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                            Booking Confirmed!
                        </DialogTitle>
                        <DialogDescription>
                            Your tickets for {event.eventName} have been confirmed
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-6 space-y-4">
                        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 text-center">
                            <p className="text-emerald-700 font-semibold mb-1">
                                {quantity} {quantity === 1 ? 'Ticket' : 'Tickets'} Confirmed
                            </p>
                            <p className="text-sm text-emerald-600">
                                {isFree ? 'Free event' : `Total: $${totalAmount.toFixed(2)}`}
                            </p>
                            <p className="text-xs text-emerald-500 mt-2">
                                A confirmation email has been sent to {email}
                            </p>
                        </div>

                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <div className="flex items-start gap-3">
                                <CalendarPlus className="h-5 w-5 text-blue-600 mt-0.5" />
                                <div className="flex-1">
                                    <p className="font-medium text-blue-700 mb-1">
                                        Add this event to your calendar
                                    </p>
                                    <p className="text-sm text-blue-600 mb-3">
                                        Get reminders before the event starts
                                    </p>
                                    <AddToCalendar event={event} size="sm" />
                                </div>
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button onClick={handleClose} className="w-full">Done</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        );
    }

    if (step === 'payment') {
        return (
            <Dialog open={open} onOpenChange={handleClose}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <CreditCard className="h-5 w-5" />
                            Payment
                        </DialogTitle>
                        <DialogDescription>
                            Complete your purchase for {event.eventName}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">{quantity}x {selectedTicketTypeName || 'ticket'}</span>
                                <span>${(unitPrice * quantity).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Service fee</span>
                                <span>$0.00</span>
                            </div>
                            <div className="border-t pt-2 flex justify-between font-bold">
                                <span>Total</span>
                                <span>${totalAmount.toFixed(2)}</span>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="space-y-2">
                                <Label htmlFor="cardNumber">Card Number</Label>
                                <div className="relative">
                                    <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <Input
                                        id="cardNumber"
                                        value={cardNumber}
                                        onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                                        placeholder="4242 4242 4242 4242"
                                        className="pl-10"
                                        maxLength={19}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-2">
                                    <Label htmlFor="expiry">Expiry</Label>
                                    <Input
                                        id="expiry"
                                        value={cardExpiry}
                                        onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                                        placeholder="MM/YY"
                                        maxLength={5}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="cvc">CVC</Label>
                                    <Input
                                        id="cvc"
                                        value={cardCvc}
                                        onChange={(e) => setCardCvc(e.target.value.replace(/\D/g, '').slice(0, 4))}
                                        placeholder="123"
                                        maxLength={4}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 text-xs text-gray-500">
                            <Lock className="h-3 w-3" />
                            <span>This is a demo. No real payment will be processed.</span>
                        </div>
                    </div>

                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => setStep('details')}>Back</Button>
                        <Button
                            onClick={handleConfirmBooking}
                            disabled={processing}
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            {processing ? 'Processing...' : `Pay $${totalAmount.toFixed(2)}`}
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
                            required
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
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="ticketType">Ticket Type</Label>
                        {ticketTypes.length > 0 ? (
                            <Select value={selectedTicketTypeName} onValueChange={setSelectedTicketTypeName}>
                                <SelectTrigger id="ticketType" className="text-left">
                                    <SelectValue placeholder="Select ticket type" />
                                </SelectTrigger>
                                <SelectContent>
                                    {ticketTypes.map((tt) => (
                                        <SelectItem key={tt.id} value={tt.ticketType}>
                                            {tt.ticketType} —{' '}
                                            {Number(tt.price) === 0 ? 'Free' : `$${Number(tt.price).toFixed(2)}`}{' '}
                                            ({Math.max(0, tt.availableQuantity ?? 0)} left)
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        ) : (
                            <p className="text-sm text-muted-foreground rounded-md border border-input bg-muted/30 px-3 py-2">
                                No ticket tiers loaded from the server. Using event display price and{' '}
                                <span className="font-medium">General</span> for booking. If booking fails,
                                ensure ticket types exist for this event (create/edit event form).
                            </p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label>Number of Tickets</Label>
                        <div className="flex items-center gap-3">
                            <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                disabled={quantity <= 1}
                            >
                                <Minus className="h-4 w-4" />
                            </Button>
                            <span className="text-xl font-bold w-8 text-center">{quantity}</span>
                            <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                onClick={() => setQuantity(Math.min(availableTickets, quantity + 1))}
                                disabled={quantity >= availableTickets}
                            >
                                <Plus className="h-4 w-4" />
                            </Button>
                            <span className="text-sm text-gray-500 ml-2">{availableTickets} available</span>
                        </div>
                    </div>

                    <div className="border-t pt-4 space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Price per ticket</span>
                            <span className="font-medium">{isFree ? 'Free' : `$${unitPrice.toFixed(2)}`}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Quantity</span>
                            <span className="font-medium">{quantity}</span>
                        </div>
                        <div className="flex justify-between text-lg font-bold pt-2 border-t">
                            <span>Total</span>
                            <span>{isFree ? 'Free' : `$${totalAmount.toFixed(2)}`}</span>
                        </div>
                    </div>
                </div>

                <DialogFooter className="gap-2">
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button
                        onClick={handleProceedToPayment}
                        disabled={availableTickets === 0}
                        className="bg-blue-600 hover:bg-blue-700"
                    >
                        {availableTickets === 0 ? 'Sold Out' : isFree ? 'Confirm RSVP' : 'Proceed to Payment'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
