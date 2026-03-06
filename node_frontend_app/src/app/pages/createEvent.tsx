import React, { useState } from 'react';
import { useNavigate } from 'react-router';

import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { ArrowLeft, Plus, X } from 'lucide-react';
import { categories } from '../mockData';
import { toast } from 'sonner';
import { Badge } from '../components/ui/badge';
import { runAPI } from '../api';

export function CreateEvent() {
  const navigate = useNavigate();
  const api = runAPI();


  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    date: '',
    time: '',
    location: '',
    venue: '',
    price: 0,
    capacity: 100,
    image: '',
    tags: [] as string[],
  });

  const [tagInput, setTagInput] = useState('');


  const handleSubmit = (e: React.FormEvent, status: 'draft' | 'published') => {
    e.preventDefault();

    if (!formData.title || !formData.category || !formData.date || !formData.time || !formData.location) {
      toast.error('Please fill in all required fields');
      return;
    }

    const newEvent = {
      id: `evt-${Date.now()}`,
      ...formData,
      organizerId: "123",
      organizerName: "admin",
      ticketsSold: 0,
      status,
      createdAt: new Date().toISOString(),
    };

    api.addEvent(newEvent);
    toast.success(`Event ${status === 'draft' ? 'saved as draft' : 'published'} successfully!`);
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
                    <Label htmlFor="title">Event Title *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Enter event title"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description *</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Describe your event..."
                      rows={6}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category">Category *</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map(cat => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Date & Time */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="date">Date *</Label>
                    <Input
                      id="date"
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="time">Time *</Label>
                    <Input
                      id="time"
                      type="time"
                      value={formData.time}
                      onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                {/* Location */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="location">Location *</Label>
                    <Input
                      id="location"
                      value={formData.location}
                      onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                      placeholder="City, State"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="venue">Venue *</Label>
                    <Input
                      id="venue"
                      value={formData.venue}
                      onChange={(e) => setFormData(prev => ({ ...prev, venue: e.target.value }))}
                      placeholder="Venue name"
                      required
                    />
                  </div>
                </div>

                {/* Pricing & Capacity */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    <Label htmlFor="capacity">Capacity *</Label>
                    <Input
                      id="capacity"
                      type="number"
                      min="1"
                      value={formData.capacity}
                      onChange={(e) => setFormData(prev => ({ ...prev, capacity: Number(e.target.value) }))}
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
                    onClick={(e) => handleSubmit(e, 'published')}
                    className="flex-1"
                  >
                    Publish Event
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
