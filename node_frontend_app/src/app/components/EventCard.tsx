import { Link } from 'react-router-dom';
import { Card, CardContent, CardFooter } from './ui/card';
import { Badge } from './ui/badge';
import { Calendar, MapPin, Users, Clock } from 'lucide-react';
import { format } from 'date-fns';
import type { Event } from '../types';
import { resolveEventImageUrl } from '@/lib/eventImageStorage';

interface EventCardProps {
    event: Event;
}

function safeFormatDate(dateStr: string | undefined | null, fmt: string, fallback = 'TBD') {
    if (!dateStr) return fallback;
    try {
        return format(new Date(String(dateStr).replace('Z', '')), fmt);
    } catch {
        return fallback;
    }
}

export function EventCard({ event }: EventCardProps) {
    const availableTickets = Math.max(0, event.maxCapacity - (event.ticketsSold || 0));
    const percentageSold = event.maxCapacity > 0 ? ((event.ticketsSold || 0) / event.maxCapacity) * 100 : 0;

    const categories = Array.isArray(event.categories) ? event.categories : [];

    return (
        <Link to={`/events/${event.eventId}`}>
            <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer h-full group">
                <div className="aspect-video overflow-hidden bg-gray-200 relative">
                    {event.ticketPrice === 0 && (
                        <span className="absolute top-3 left-3 bg-emerald-500 text-white px-2.5 py-0.5 rounded-md text-xs font-bold z-10">
                            FREE
                        </span>
                    )}
                    {percentageSold > 80 && availableTickets > 0 && (
                        <span className="absolute top-3 right-3 bg-orange-500 text-white px-2.5 py-0.5 rounded-md text-xs font-bold z-10">
                            Selling Fast
                        </span>
                    )}
                    {availableTickets === 0 && (
                        <span className="absolute top-3 right-3 bg-red-500 text-white px-2.5 py-0.5 rounded-md text-xs font-bold z-10">
                            Sold Out
                        </span>
                    )}
                    <img
                        src={resolveEventImageUrl(event.imageUrl)}
                        alt={event.eventName}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=800&q=80';
                        }}
                    />
                </div>
                <CardContent className="p-4">
                    <div className="flex flex-wrap gap-1.5 mb-2">
                        {categories.slice(0, 2).map((cat: any) => (
                            <Badge key={cat.categoryId || cat.categoryName || cat} variant="secondary" className="text-xs">
                                {cat.categoryName || cat.name || cat}
                            </Badge>
                        ))}
                        {event.status === 'SUBMITTED' && (
                            <Badge variant="outline" className="text-xs">Pending</Badge>
                        )}
                        {event.status === 'CANCELLED' && (
                            <Badge variant="destructive" className="text-xs">Cancelled</Badge>
                        )}
                    </div>

                    <h3 className="font-semibold text-lg mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                        {event.eventName}
                    </h3>

                    <div className="space-y-1.5 text-sm text-gray-600 mb-3">
                        <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 shrink-0 text-blue-500" />
                            <span>{safeFormatDate(event.eventStartInstant || event.eventStartDate, 'MMM dd, yyyy')}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 shrink-0 text-blue-500" />
                            <span>{safeFormatDate(event.eventStartInstant, 'h:mm a')}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 shrink-0 text-blue-500" />
                            <span className="truncate">
                                {event.eventLocation?.locationName || event.eventLocation?.locationAddress || 'Location TBD'}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 shrink-0 text-blue-500" />
                            <span>
                                {availableTickets > 0
                                    ? `${availableTickets} tickets left`
                                    : 'Sold out'}
                            </span>
                        </div>
                    </div>

                    {percentageSold > 70 && availableTickets > 0 && (
                        <div className="mb-2">
                            <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-orange-500 rounded-full transition-all"
                                    style={{ width: `${Math.min(percentageSold, 100)}%` }}
                                />
                            </div>
                            <p className="text-xs text-orange-600 mt-1 font-medium">{Math.round(percentageSold)}% sold</p>
                        </div>
                    )}
                </CardContent>

                <CardFooter className="p-4 pt-0 flex items-center justify-between">
                    <div>
                        {event.ticketPrice === 0 ? (
                            <span className="font-bold text-lg text-emerald-600">Free</span>
                        ) : (
                            <span className="font-bold text-lg">${event.ticketPrice}</span>
                        )}
                    </div>
                    <span className="text-xs text-gray-400">by {event?.eventOwnerName || 'Unknown'}</span>
                </CardFooter>
            </Card>
        </Link>
    );
}
