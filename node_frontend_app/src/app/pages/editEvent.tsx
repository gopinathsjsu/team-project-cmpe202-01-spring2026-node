import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { ArrowLeft, Save, Trash2, MapPin, X } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import { runAPI } from '../api';
import type { EventCategory } from '../types';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';

import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});


export function EditEvent() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const api = runAPI();
    const { currentUser } = useAuth();

    const [event, setEvent] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [selectKey, setSelectKey] = useState(0);

    const [mapPosition, setMapPosition] = useState<[number, number] | null>(null);
    const [categories, setCategories] = useState<EventCategory[]>([]);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const cats = await api.getCategories();
                setCategories(cats);
            } catch (err) {
                console.error('Failed to load categories', err);
            }
        };
        fetchCategories();
    }, []);

    useEffect(() => {
        if (id) {
            api.getEventById(id).then((data) => {
                setEvent(data);
                setLoading(false);
            }).catch((err) => {
                console.error(err);
                setLoading(false);
            });
        }
    }, [id]);

    const [formData, setFormData] = useState({
        eventName: '',
        eventDescription: '',
        categories: [] as string[],
        startDate: '',
        startTime: '',
        endDate: '',
        endTime: '',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        location: '',
        venue: '',
        ticketPrice: 0,
        image: '',
        tags: '',
        waitlistCapacity: 0,
        maxCapacity: 100,

    });

    useEffect(() => {
        if (event) {
            setFormData({
                eventName: event.eventName || '',
                eventDescription: event.eventDescription || '',
                categories: Array.isArray(event.categories)
                    ? event.categories.map((c: any) => typeof c === 'string' ? c : String(c.categoryId || c.id))
                    : [],
                startDate: event.eventStartInstant ? event.eventStartInstant.split('T')[0] : '',
                startTime: event.eventStartInstant && event.eventStartInstant.includes('T') ? event.eventStartInstant.split('T')[1].substring(0, 5) : '',
                endDate: event.eventEndInstant ? event.eventEndInstant.split('T')[0] : '',
                endTime: event.eventEndInstant && event.eventEndInstant.includes('T') ? event.eventEndInstant.split('T')[1].substring(0, 5) : '',
                timezone: event.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
                location: event.eventLocation?.locationAddress || '',
                venue: event.eventLocation?.locationName || '',
                ticketPrice: event.ticketPrice || 0,
                maxCapacity: event.maxCapacity || 100,
                waitlistCapacity: event.waitlistCapacity || 0,
                image: event.imageUrl || '',
                tags: event.tags ? event.tags.join(', ') : '',

            });
        }
    }, [event]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-xl font-semibold text-gray-500">Loading map and event data...</div>
            </div>
        );
    }

    if (!event) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold mb-4">Event not found</h1>
                    <Button onClick={() => navigate('/dashboard')}>
                        Back to Dashboard
                    </Button>
                </div>
            </div>
        );
    }

    if (String(event.eventOwnerId) !== String(currentUser?.id) && currentUser?.role !== 'ADMIN') {
        return (
            <div className="min-h-screen bg-gray-50 py-8">
                <div className="container mx-auto px-4 text-center">
                    <h1 className="text-2xl font-bold mb-4">Unauthorized</h1>
                    <p className="text-gray-600 mb-4">You don't have permission to edit this event.</p>
                    <Button onClick={() => navigate('/dashboard')}>
                        Back to Dashboard
                    </Button>
                </div>
            </div>
        );
    }

    const handleChange = (field: string, value: string | number) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const updatedEvent = {
            ...event,
            ...formData,
            ticketPrice: Number(formData.ticketPrice),
            maxCapacity: Number(formData.maxCapacity),
            eventStartInstant: `${formData.startDate}T${formData.startTime}:00Z`,
            eventEndInstant: `${formData.endDate}T${formData.endTime}:00Z`,
            eventStartDate: `${formData.startDate}T${formData.startTime}:00Z`,
            eventEndDate: `${formData.endDate}T${formData.endTime}:00Z`,
            tags: typeof formData.tags === 'string' ? formData.tags.split(',').map(tag => tag.trim()).filter(Boolean) : [],
        };

        api.updateEvent(event.eventId, updatedEvent);
        toast.success('Event updated successfully!');
        navigate('/dashboard');
    };

    const handleDelete = () => {
        if (window.confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
            api.deleteEvent(id!);
            toast.success('Event deleted successfully');
            navigate('/dashboard');
        }
    };

    // Map state


    // Map click handler component
    function LocationMarker() {
        useMapEvents({
            click(e) {
                setMapPosition([e.latlng.lat, e.latlng.lng]);
                reverseGeocode(e.latlng.lat, e.latlng.lng);
            },
        });

        return mapPosition === null ? null : (
            <Marker position={mapPosition} />
        );
    }

    const reverseGeocode = async (lat: number, lng: number) => {
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`);
            const data = await response.json();

            if (data && data.address) {
                // Construct a readable address
                const addr = data.address;
                const venue = addr.amenity || addr.building || addr.shop || addr.leisure || '';
                const street = addr.road ? `${addr.house_number || ''} ${addr.road}`.trim() : '';
                const cityContext = addr.city || addr.town || addr.village || addr.suburb || '';
                const stateContext = addr.state || '';

                const fullAddress = [street, cityContext, stateContext].filter(Boolean).join(', ');

                setFormData(prev => ({
                    ...prev,
                    venue: venue || (street ? street : 'Selected Location'),
                    location: fullAddress || data.display_name
                }));

                toast.success(`Location identified: ${venue || cityContext}`);
            }
        } catch (error) {
            console.error("Geocoding error: ", error);
            toast.error("Failed to reverse-geocode location");
        }
    };

    const forwardGeocode = async () => {
        const query = `${formData.venue} ${formData.location}`.trim();
        if (!query) {
            toast.error("Please enter a location or venue to search");
            return;
        }

        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`);
            const data = await response.json();

            if (data && data.length > 0) {
                const lat = parseFloat(data[0].lat);
                const lng = parseFloat(data[0].lon);
                setMapPosition([lat, lng]);
                toast.success("Location found on map!");
            } else {
                toast.error("Could not find this location on the map.");
            }
        } catch (error) {
            console.error("Geocoding error: ", error);
            toast.error("Search failed");
        }
    };

    const getCurrentLocation = () => {
        if (!navigator.geolocation) {
            toast.error('Geolocation is not supported by your browser');
            return;
        }

        toast.loading('Fetching current location...', { id: 'location-toast' });
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                setMapPosition([latitude, longitude]);
                reverseGeocode(latitude, longitude);
                toast.success('Location found!', { id: 'location-toast' });
            },
            (error) => {
                console.error("Error getting location:", error);
                toast.error('Unable to retrieve your location. Please check browser permissions.', { id: 'location-toast' });
            }
        );
    };

    // Component to update map center when mapPosition changes from outside
    function MapUpdater({ center }: { center: [number, number] | null }) {
        const map = useMap();
        useEffect(() => {
            if (center) {
                map.flyTo(center, 15);
            }
        }, [center, map]);
        return null;
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="container mx-auto px-4 py-8">
                <Button
                    variant="ghost"
                    className="mb-6"
                    onClick={() => navigate('/dashboard')}
                >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Dashboard
                </Button>

                <Card className="max-w-4xl mx-auto">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-3xl">Edit Event</CardTitle>
                            <CardDescription>Update your event details</CardDescription>
                        </div>
                        <Button
                            variant="destructive"
                            onClick={handleDelete}
                        >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Event
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Basic Information */}
                            <div className="space-y-4">
                                <h2 className="text-xl font-semibold">Basic Information</h2>

                                <div>
                                    <Label htmlFor="eventName">Event Title *</Label>
                                    <Input
                                        id="eventName"
                                        value={formData.eventName}
                                        onChange={(e) => handleChange('eventName', e.target.value)}
                                        placeholder="Enter event title"
                                        required
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="description">Description *</Label>
                                    <Textarea
                                        id="description"
                                        value={formData.eventDescription}
                                        onChange={(e) => handleChange('eventDescription', e.target.value)}
                                        placeholder="Describe your event"
                                        rows={6}
                                        required
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="category">Category *</Label>
                                    <Select
                                        key={selectKey}
                                        onValueChange={(value) => {
                                            if (!formData.categories.includes(value)) {
                                                setFormData(prev => ({ ...prev, categories: [...prev.categories, value] }));
                                            }
                                            setSelectKey(prev => prev + 1);
                                        }}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Add categories..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {categories.map((cat: any) => {
                                                const catId = String(cat.categoryId || cat.id);
                                                return (
                                                    <SelectItem key={catId} value={catId}>
                                                        {cat.categoryName}
                                                    </SelectItem>
                                                );
                                            })}
                                        </SelectContent>
                                    </Select>

                                    {formData.categories.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            {formData.categories.map(catId => {
                                                const category: any = categories.find((c: any) => String(c.categoryId || c.id) === String(catId));
                                                return category ? (
                                                    <Badge key={catId} variant="secondary" className="gap-1 px-3 py-1">
                                                        {category.categoryName}
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setFormData(prev => ({
                                                                    ...prev,
                                                                    categories: prev.categories.filter(c => c !== catId)
                                                                }));
                                                            }}
                                                            className="ml-1 hover:bg-gray-200 rounded-full p-0.5 focus:outline-none focus:ring-2 focus:ring-gray-400"
                                                        >
                                                            <X size={12} className="text-gray-500 hover:text-gray-700" />
                                                        </button>
                                                    </Badge>
                                                ) : null;
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>


                            {/* Date & Time */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Start Date & Time *</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            type="date"
                                            value={formData.startDate}
                                            onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                                            required
                                            className="flex-1"
                                        />
                                        <Input
                                            type="time"
                                            value={formData.startTime}
                                            onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                                            required
                                            className="flex-1"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label>End Date & Time *</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            type="date"
                                            value={formData.endDate}
                                            onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                                            required
                                            className="flex-1"
                                        />
                                        <Input
                                            type="time"
                                            value={formData.endTime}
                                            onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                                            required
                                            className="flex-1"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor="timezone">Timezone *</Label>
                                    <Select
                                        value={formData.timezone}
                                        onValueChange={(value) => setFormData(prev => ({ ...prev, timezone: value }))}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select Timezone" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="America/Los_Angeles">Pacific Time (PT) - Los Angeles</SelectItem>
                                            <SelectItem value="America/Denver">Mountain Time (MT) - Denver</SelectItem>
                                            <SelectItem value="America/Chicago">Central Time (CT) - Chicago</SelectItem>
                                            <SelectItem value="America/New_York">Eastern Time (ET) - New York</SelectItem>
                                            <SelectItem value="UTC">UTC</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Map Picker */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <Label>Pin Event Location on Map</Label>
                                    <span className="text-xs text-muted-foreground">Click anywhere to drop a pin</span>
                                </div>
                                <div className="h-64 w-full rounded-lg overflow-hidden border">
                                    <MapContainer
                                        center={[37.3352, -121.8811]}
                                        zoom={13}
                                        scrollWheelZoom={true}
                                        style={{ height: '100%', width: '100%' }}
                                    >
                                        <TileLayer
                                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                        />
                                        <LocationMarker />
                                        <MapUpdater center={mapPosition} />
                                    </MapContainer>
                                </div>
                            </div>

                            {/* Location */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="location">Location Address *</Label>
                                    <Input
                                        id="location"
                                        value={formData.location}
                                        onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                                        placeholder="City, State"
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="venue">Venue Name *</Label>
                                    <Input
                                        id="venue"
                                        value={formData.venue}
                                        onChange={(e) => setFormData(prev => ({ ...prev, venue: e.target.value }))}
                                        placeholder="Venue name"
                                        required
                                    />
                                </div>

                                <div className="md:col-span-2 mt-2 flex gap-2 flex-wrap">
                                    <Button type="button" variant="secondary" className="flex-1" onClick={forwardGeocode}>
                                        Find Typed Address on Map
                                    </Button>
                                    <Button type="button" variant="outline" className="flex-1 border-blue-200 text-blue-600 hover:bg-blue-50" onClick={getCurrentLocation}>
                                        <MapPin className="h-4 w-4 mr-2" />
                                        Use Current Location
                                    </Button>
                                </div>
                            </div>

                            {/* Pricing & Capacity */}
                            <div className="space-y-4">
                                <h2 className="text-xl font-semibold">Pricing & Capacity</h2>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="price">Ticket Price ($) *</Label>
                                        <Input
                                            id="price"
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={formData.ticketPrice}
                                            onChange={(e) => handleChange('ticketPrice', parseFloat(e.target.value) || 0)}
                                            required
                                        />
                                        <p className="text-sm text-gray-500 mt-1">Enter 0 for free events</p>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="maxCapacity">Max Capacity *</Label>
                                        <Input
                                            id="maxCapacity"
                                            type="number"
                                            min="1"
                                            value={formData.maxCapacity}
                                            onChange={(e) => setFormData(prev => ({ ...prev, maxCapacity: Number(e.target.value) }))}
                                            required
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="waitlistCapacity">Waitlist Capacity *</Label>
                                        <Input
                                            id="waitlistCapacity"
                                            type="number"
                                            min="0"
                                            value={formData.waitlistCapacity}
                                            onChange={(e) => setFormData(prev => ({ ...prev, waitlistCapacity: Number(e.target.value) }))}
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Additional Details */}
                            <div className="space-y-4">
                                <h2 className="text-xl font-semibold">Additional Details</h2>

                                <div>
                                    <Label htmlFor="image">Event Image URL</Label>
                                    <Input
                                        id="image"
                                        type="url"
                                        value={formData.image}
                                        onChange={(e) => handleChange('image', e.target.value)}
                                        placeholder="https://example.com/image.jpg"
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="tags">Tags (comma-separated)</Label>
                                    <Input
                                        id="tags"
                                        value={formData.tags}
                                        onChange={(e) => handleChange('tags', e.target.value)}
                                        placeholder="e.g., networking, outdoor, family-friendly"
                                    />
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 pt-6 border-t">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => navigate('/dashboard')}
                                    className="flex-1"
                                >
                                    Cancel
                                </Button>
                                <Button type="submit" className="flex-1">
                                    <Save className="h-4 w-4 mr-2" />
                                    Save Changes
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div >
    );
}