import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';

import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { ArrowLeft, Plus, X, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '../components/ui/badge';
import { runAPI } from '../api';
import type { Event, EventCategory } from '../types';

import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icon in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

export function CreateEvent() {
  const navigate = useNavigate();
  const api = runAPI();
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  const [categories, setCategories] = useState<EventCategory[]>([]);

  useEffect(() => {
    const fetchCategories = async () => {
      const categories = await runAPI().getCategories();
      setCategories(categories);
    };
    fetchCategories();
  }, []);


  const [formData, setFormData] = useState({
    eventName: '',
    eventDescription: '',
    categories: [] as string[],
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: '',
    eventStartInstant: "",
    eventEndInstant: "",
    eventTimeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    location: '',
    venue: '',
    price: 0,
    maxCapacity: 100,
    waitlistCapacity: 0,
    image: '',
    tags: [] as string[],
  });

  const [tagInput, setTagInput] = useState('');
  const [selectKey, setSelectKey] = useState(0);

  // Map state
  const [mapPosition, setMapPosition] = useState<[number, number] | null>(null);

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
        toast.error('Unable to retrieve your location', { id: 'location-toast' });
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

  const handleSubmit = (e: React.FormEvent, status: 'draft' | 'submitted') => {
    e.preventDefault();

    if (!formData.eventName || formData.categories.length === 0 || !formData.startDate || !formData.startTime || !formData.endDate || !formData.endTime || !formData.eventTimeZone || !formData.location) {
      toast.error('Please fill in all required fields');
      return;
    }
    if (!currentUser?.id) {
      toast.error('Please login to create an event');
      return;
    }

    const newEvent: Event = {
      eventId: null,
      eventName: formData.eventName,
      eventDescription: formData.eventDescription,
      categories: formData.categories, //formData.categories all categories info with selected categories  ,
      maxCapacity: formData.maxCapacity,
      waitlistCapacity: formData.waitlistCapacity,
      eventLocation: {
        locationName: formData.venue,
        locationAddress: formData.location,
        latitude: mapPosition?.[0] || null,
        longitude: mapPosition?.[1] || null
      },
      ticketPrice: formData.price,
      imageUrl: formData.image,
      eventStartDate: `${formData.startDate}T${formData.startTime}:00Z`,
      eventEndDate: `${formData.endDate}T${formData.endTime}:00Z`,
      eventStartInstant: `${formData.startDate}T${formData.startTime}:00Z`,
      eventEndInstant: `${formData.endDate}T${formData.endTime}:00Z`,
      eventTimeZone: formData.eventTimeZone,
      eventPublishDate: new Date().toISOString(),
      eventOwnerId: currentUser?.id,
      ticketsSold: 0,
      status,
      createdAt: new Date().toISOString(),
      approverId: null,
      updatedAt: null,
      tags: formData.tags
    };

    api.addEvent(newEvent);
    toast.success(`Event ${status === 'draft' ? 'saved as draft' : 'submitted'} successfully!`);
    navigate('/dashboard');
  };

  const addTag = () => {
    if (tagInput && !formData.tags.includes(tagInput)) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput]
      }));
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  };

  const handleImageSearch = () => {
    // Placeholder for image selection
    const sampleImages = [
      'https://images.unsplash.com/photo-1492684223066-81342ee5ff30',
      'https://images.unsplash.com/photo-1505373877841-8d25f7d46678',
      'https://images.unsplash.com/photo-1511795409834-ef04bbd61622',
    ];
    const randomImage = sampleImages[Math.floor(Math.random() * sampleImages.length)];
    setFormData(prev => ({ ...prev, image: randomImage }));
    toast.success('Sample image added');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <div className="max-w-3xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Create New Event</CardTitle>
              <CardDescription>
                Fill in the details below to create your event
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="eventName">Event Title *</Label>
                    <Input
                      id="eventName"
                      value={formData.eventName}
                      onChange={(e) => setFormData(prev => ({ ...prev, eventName: e.target.value }))}
                      placeholder="Enter event title"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description *</Label>
                    <Textarea
                      id="description"
                      value={formData.eventDescription}
                      onChange={(e) => setFormData(prev => ({ ...prev, eventDescription: e.target.value }))}
                      placeholder="Describe your event..."
                      rows={6}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category">Categories *</Label>
                    <Select
                      key={selectKey}
                      onValueChange={(value) => {
                        if (!formData.categories.includes(value)) {
                          setFormData(prev => ({ ...prev, categories: [...prev.categories, value] }));
                        }
                        // Reset the select component so the same option can be re-selected if removed
                        setSelectKey(prev => prev + 1);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select categories" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map(cat => {
                          const catId = String((cat as any).categoryId || cat.id);
                          return (
                            <SelectItem key={catId} value={catId}>{cat.categoryName}</SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                    {formData.categories.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {formData.categories.map(catId => {
                          const category = categories.find(c => String((c as any).categoryId || c.id) === catId);
                          return category ? (
                            <Badge key={catId} variant="secondary" className="gap-1">
                              {category.categoryName}
                              <button
                                type="button"
                                onClick={() => setFormData(prev => ({
                                  ...prev,
                                  categories: prev.categories.filter(id => id !== catId)
                                }))}
                                className="ml-1 hover:text-red-600"
                              >
                                <X className="h-3 w-3" />
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
                    <Label htmlFor="eventTimeZone">Timezone *</Label>
                    <Select
                      value={formData.eventTimeZone}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, eventTimeZone: value }))}
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price">Ticket Price ($)</Label>
                    <Input
                      id="price"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => setFormData(prev => ({ ...prev, price: Number(e.target.value) }))}
                      placeholder="0.00"
                    />
                    <p className="text-xs text-gray-500">Set to 0 for free events</p>
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

                {/* Image */}
                <div className="space-y-2">
                  <Label>Event Image</Label>
                  {formData.image ? (
                    <div className="relative">
                      <img
                        src={formData.image}
                        alt="Event preview"
                        className="w-full h-48 object-cover rounded-lg"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={() => setFormData(prev => ({ ...prev, image: '' }))}
                      >
                        Remove
                      </Button>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed rounded-lg p-8 text-center">
                      <p className="text-gray-600 mb-4">Add an image for your event</p>
                      <Button type="button" variant="outline" onClick={handleImageSearch}>
                        Add Sample Image
                      </Button>
                    </div>
                  )}
                </div>

                {/* Tags */}
                <div className="space-y-2">
                  <Label htmlFor="tags">Tags</Label>
                  <div className="flex gap-2">
                    <Input
                      id="tags"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                      placeholder="Add tags..."
                    />
                    <Button type="button" variant="outline" onClick={addTag}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  {formData.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {formData.tags.map(tag => (
                        <Badge key={tag} variant="secondary" className="gap-1">
                          {tag}
                          <button
                            type="button"
                            onClick={() => removeTag(tag)}
                            className="ml-1 hover:text-red-600"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-6 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={(e) => handleSubmit(e, 'draft')}
                    className="flex-1"
                  >
                    Save as Draft
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={(e) => handleSubmit(e, 'submitted')}
                    className="flex-1"
                  >
                    Submit for Review
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
