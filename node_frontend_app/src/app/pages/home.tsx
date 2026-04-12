import { Search, MapPin, Calendar, Clock, ChevronRight, Music, Laptop, GraduationCap, Trophy, Badge, Utensils, Palette, Heart, Briefcase } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { runAPI } from '../api';
import { format } from 'date-fns';
import type { EventCategory } from '../types';
import { resolveEventImageUrl } from '@/lib/eventImageStorage';

export default function Home() {
    const navigate = useNavigate();
    const api = runAPI();
    const [featuredEvent, setFeaturedEvent] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [categories, setCategories] = useState<EventCategory[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.getActiveEvents().then((data: any[]) => {
            setFeaturedEvent(Array.isArray(data) ? data.slice(0, 6) : []);
        }).catch(() => setFeaturedEvent([])).finally(() => setLoading(false));

        api.getCategories().then((data) => {
            setCategories(Array.isArray(data) ? data : []);
        }).catch(() => {});
    }, []);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        navigate(`/events?search=${encodeURIComponent(searchQuery)}`);
    };

    const categoryIcons: Record<string, React.ReactNode> = {
        music: <Music size={18} />,
        tech: <Laptop size={18} />,
        workshop: <GraduationCap size={18} />,
        sports: <Trophy size={18} />,
        food: <Utensils size={18} />,
        art: <Palette size={18} />,
        health: <Heart size={18} />,
        business: <Briefcase size={18} />,
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Hero Section */}
            <section className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white py-24 overflow-hidden">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-40" />
                <div className="container mx-auto px-4 relative z-10">
                    <div className="max-w-3xl mx-auto text-center">
                        <h1 className="text-4xl md:text-6xl font-extrabold mb-6 leading-tight tracking-tight">
                            Discover Amazing Events Near You
                        </h1>
                        <p className="text-lg md:text-xl mb-10 text-blue-100 max-w-2xl mx-auto">
                            Find concerts, workshops, conferences, and more. Connect with people who share your interests.
                        </p>

                        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 max-w-2xl mx-auto">
                            <div className="relative flex-1">
                                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                <input
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search events, artists, venues..."
                                    className="w-full pl-12 pr-4 h-14 bg-white rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-300 shadow-lg"
                                    aria-label="Search events"
                                />
                            </div>
                            <button
                                type="submit"
                                className="bg-amber-500 hover:bg-amber-600 text-white px-8 h-14 rounded-xl font-semibold transition-colors shadow-lg flex items-center justify-center gap-2"
                            >
                                <Search size={18} />
                                Search
                            </button>
                        </form>

                        <div className="mt-6 flex flex-wrap justify-center gap-3 text-sm">
                            <span className="text-blue-200">Popular:</span>
                            {['Music', 'Tech', 'Food', 'Sports'].map(tag => (
                                <Link
                                    key={tag}
                                    to={`/events?category=${tag}`}
                                    className="text-white/80 hover:text-white underline-offset-2 hover:underline transition-colors"
                                >
                                    {tag}
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Stats Bar */}
            <section className="bg-white border-b">
                <div className="container mx-auto px-4 py-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                        <div>
                            <div className="text-2xl md:text-3xl font-bold text-blue-600">{featuredEvent.length}+</div>
                            <div className="text-sm text-gray-500">Active Events</div>
                        </div>
                        <div>
                            <div className="text-2xl md:text-3xl font-bold text-blue-600">{categories.length}+</div>
                            <div className="text-sm text-gray-500">Categories</div>
                        </div>
                        <div>
                            <div className="text-2xl md:text-3xl font-bold text-blue-600">1K+</div>
                            <div className="text-sm text-gray-500">Organizers</div>
                        </div>
                        <div>
                            <div className="text-2xl md:text-3xl font-bold text-blue-600">50K+</div>
                            <div className="text-sm text-gray-500">Tickets Sold</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Categories */}
            <section className="py-14 bg-white">
                <div className="container mx-auto px-4 text-center">
                    <h2 className="text-3xl font-bold mb-2 text-gray-800">Explore by Category</h2>
                    <p className="text-gray-500 mb-8">Browse events that match your interests</p>
                    <div className="flex flex-wrap justify-center gap-3">
                        {categories.length > 0 ? categories.map(cat => {
                            const iconKey = cat.categoryName?.toLowerCase() || '';
                            const icon = categoryIcons[iconKey] || <Calendar size={18} />;
                            return (
                                <Link
                                    key={cat.id || cat.categoryName}
                                    to={`/events?category=${encodeURIComponent(cat.categoryName)}`}
                                    className="flex items-center gap-2 px-6 py-3 bg-gray-50 hover:bg-blue-50 text-gray-700 hover:text-blue-600 rounded-full border border-gray-200 transition-all shadow-sm hover:shadow-md"
                                >
                                    {icon} {cat.categoryName}
                                </Link>
                            );
                        }) : (
                            <>
                                <button className="flex items-center gap-2 px-6 py-3 bg-gray-50 hover:bg-blue-50 text-gray-700 hover:text-blue-600 rounded-full border border-gray-200 transition-all shadow-sm hover:shadow-md">
                                    <Music size={18} /> Music
                                </button>
                                <button className="flex items-center gap-2 px-6 py-3 bg-gray-50 hover:bg-blue-50 text-gray-700 hover:text-blue-600 rounded-full border border-gray-200 transition-all shadow-sm hover:shadow-md">
                                    <Laptop size={18} /> Tech
                                </button>
                                <button className="flex items-center gap-2 px-6 py-3 bg-gray-50 hover:bg-blue-50 text-gray-700 hover:text-blue-600 rounded-full border border-gray-200 transition-all shadow-sm hover:shadow-md">
                                    <GraduationCap size={18} /> Workshops
                                </button>
                                <button className="flex items-center gap-2 px-6 py-3 bg-gray-50 hover:bg-blue-50 text-gray-700 hover:text-blue-600 rounded-full border border-gray-200 transition-all shadow-sm hover:shadow-md">
                                    <Trophy size={18} /> Sports
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </section>

            {/* Featured Events */}
            <section className="py-16 bg-gray-50">
                <div className="container mx-auto px-4">
                    <div className="flex items-center justify-between mb-10">
                        <div>
                            <h2 className="text-3xl font-bold text-gray-800">Featured Events</h2>
                            <p className="text-gray-500 mt-1">Don't miss out on trending events</p>
                        </div>
                        <Link to="/events" className="text-blue-600 font-medium hover:underline inline-flex items-center gap-1">
                            View all <ChevronRight size={16} />
                        </Link>
                    </div>

                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="bg-white rounded-2xl overflow-hidden border border-gray-100 animate-pulse">
                                    <div className="h-60 bg-gray-200" />
                                    <div className="p-6 space-y-3">
                                        <div className="h-5 bg-gray-200 rounded w-3/4" />
                                        <div className="h-4 bg-gray-200 rounded w-1/2" />
                                        <div className="h-4 bg-gray-200 rounded w-2/3" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : featuredEvent.length === 0 ? (
                        <div className="text-center py-12">
                            <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500 text-lg">No events available right now. Check back soon!</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
                            {featuredEvent.map(event => (
                                <Link
                                    key={event.eventId}
                                    to={`/events/${event.eventId}`}
                                    className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 group cursor-pointer flex flex-col"
                                >
                                    <div className="relative h-60 overflow-hidden">
                                        <div className="absolute top-4 right-4 flex gap-1 z-10">
                                            {event.categories && event.categories.length > 0 && event.categories.slice(0, 2).map((cat: any) => (
                                                <span key={cat.categoryId || cat.categoryName || cat} className="bg-white/90 backdrop-blur-sm px-3 py-1 rounded-lg text-xs font-semibold text-blue-600 shadow-sm">
                                                    {cat.categoryName || cat.name || cat}
                                                </span>
                                            ))}
                                        </div>
                                        {event.ticketPrice === 0 && (
                                            <span className="absolute top-4 left-4 bg-emerald-500 text-white px-3 py-1 rounded-lg text-xs font-bold z-10">
                                                FREE
                                            </span>
                                        )}
                                        <img
                                            src={resolveEventImageUrl(event.imageUrl)}
                                            alt={event.eventName}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=800&q=80';
                                            }}
                                        />
                                    </div>
                                    <div className="p-6 flex flex-col flex-grow">
                                        <h3 className="text-xl font-bold mb-3 text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2">{event.eventName}</h3>

                                        <div className="space-y-2 mb-6 text-gray-600 text-sm">
                                            <div className="flex items-center gap-2">
                                                <Calendar size={16} className="text-blue-500 shrink-0" />
                                                <span>
                                                    {(() => { try { return format(new Date(String(event.eventStartInstant || event.eventStartDate || '').replace('Z', '')), 'MMM dd, yyyy'); } catch { return 'TBD'; } })()}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Clock size={16} className="text-blue-500 shrink-0" />
                                                <span>
                                                    {(() => { try { return event.eventStartInstant ? format(new Date(String(event.eventStartInstant).replace('Z', '')), 'h:mm a') : 'TBD'; } catch { return 'TBD'; } })()}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <MapPin size={16} className="text-blue-500 shrink-0" />
                                                <span className="truncate">{event.eventLocation?.locationAddress || 'Location TBD'}</span>
                                            </div>
                                        </div>

                                        <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between">
                                            <span className="text-xl font-bold text-gray-900">
                                                {event.ticketPrice === 0 ? <span className="text-emerald-600">Free</span> : `$${event.ticketPrice}`}
                                            </span>
                                            <span className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium transition-colors shadow-md shadow-blue-500/30 text-sm">
                                                Get Tickets
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* How It Works */}
            <section className="py-16 bg-white">
                <div className="container mx-auto px-4 max-w-5xl">
                    <h2 className="text-3xl font-bold text-center mb-12 text-gray-800">How It Works</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <Search className="h-8 w-8 text-blue-600" />
                            </div>
                            <h3 className="text-lg font-semibold mb-2">Discover Events</h3>
                            <p className="text-gray-500">Browse thousands of events by category, location, or date. Find exactly what you're looking for.</p>
                        </div>
                        <div className="text-center">
                            <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <Badge className="h-8 w-8 text-amber-600" />
                            </div>
                            <h3 className="text-lg font-semibold mb-2">Book Tickets</h3>
                            <p className="text-gray-500">Secure your spot with our simple booking system. Free events and paid events supported.</p>
                        </div>
                        <div className="text-center">
                            <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <Calendar className="h-8 w-8 text-emerald-600" />
                            </div>
                            <h3 className="text-lg font-semibold mb-2">Attend & Enjoy</h3>
                            <p className="text-gray-500">Get reminders, add to your calendar, and connect with fellow attendees. Enjoy the experience!</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Call to Action */}
            <section className="py-20 bg-gradient-to-br from-indigo-600 to-blue-700 text-white">
                <div className="container mx-auto px-4 text-center max-w-4xl">
                    <h2 className="text-4xl md:text-5xl font-bold mb-4">Ready to host your own event?</h2>
                    <p className="text-xl text-blue-100 mb-8">Join thousands of organizers using Node Events to create and manage amazing experiences.</p>
                    <Link
                        to="/create-event"
                        className="inline-flex items-center gap-2 bg-white text-blue-700 hover:bg-blue-50 px-8 py-4 rounded-xl text-lg font-semibold transition-all shadow-xl"
                    >
                        Create Your Event <ChevronRight size={20} />
                    </Link>
                </div>
            </section>
        </div>
    );
}
