import { Link } from 'react-router-dom';
import { Card, CardContent, CardFooter } from './ui/card';
import { Badge } from './ui/badge';
import { Calendar, MapPin, Users } from 'lucide-react';
import { format } from 'date-fns';
import type { Event } from '../types';

interface EventCardProps {
    event: Event;
}

export function EventCard({ event }: EventCardProps) {
    const availableTickets = event.maxCapacity - event.ticketsSold;
    const percentageSold = (event.ticketsSold / event.maxCapacity) * 100;

    return (
        <Link to={`/events/${event.eventId}`}>
            <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer h-full">
                <div className="aspect-video overflow-hidden bg-gray-200">
                    <img
                        src={event.imageUrl}
                        alt={event.eventName}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                </div>
                <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                        <Badge variant="secondary">{event.categories}</Badge>
                        {event.status === 'SUBMITTED' && (
                            <Badge variant="outline">Coming Soon</Badge>
                        )}
                        {event.status === 'CANCELLED' && (
                            <Badge variant="destructive">Cancelled</Badge>
                        )}
                    </div>

                    <h3 className="font-semibold text-lg mb-2 line-clamp-2">{event.eventName}</h3>

                    <div className="space-y-1 text-sm text-gray-600 mb-3">
                        <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <span>{format(new Date(event.eventStartInstant), 'MMM dd, yyyy')} at {event.eventStartInstant}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            <span className="truncate"> {event.eventLocation.locationName} {event.eventLocation.locationAddress}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
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
                                    className="h-full bg-orange-500 rounded-full"
                                    style={{ width: `${percentageSold}%` }}
                                />
                            </div>
                            <p className="text-xs text-orange-600 mt-1">Selling fast!</p>
                        </div>
                    )}
                </CardContent>

                <CardFooter className="p-4 pt-0 flex items-center justify-between">
                    <div>
                        {event.ticketPrice === 0 ? (
                            <span className="font-bold text-lg text-green-600">Free</span>
                        ) : (
                            <span className="font-bold text-lg">${event.ticketPrice}</span>
                        )}
                    </div>
                    <span className="text-sm text-gray-500">by {event?.eventOwnerName || 'Unknown'}</span>
                </CardFooter>
            </Card>
        </Link>
    );
}
