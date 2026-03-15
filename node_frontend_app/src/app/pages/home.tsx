import { Search, MapPin, Calendar, Clock, ChevronRight, Music, Laptop, GraduationCap, Trophy, Badge } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { runAPI } from '../api';
import { format } from 'date-fns';

export default function Home() {

    const api = runAPI();
    const [featuredEvent, setFeaturedEvent] = useState<any[]>([]);
    useState(() => {
        api.getEvents().then((data: any[]) => {
            setFeaturedEvent(data);
        })
    })

    return (

        <div className="min-h-screen bg-grey-50">
            {/* Hero Section */}
            <section className="bg-blue-500 text-white py-20">
                <div className="container mx-auto px-4">
                    <div className="max-w-3xl mx-auto text-center">
                        <h1 className="text-4xl md:text-5xl font-bold mb-6">
                            Discover Amazing Events Near You
                        </h1>
                        <p className="text-xl mb-8 text-blue-100">
                            Find concerts, workshops, conferences, and more. Connect with people who share your interests.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-3 max-w-2xl mx-auto">
                            <div className="relative flex-1">
                                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                <input
                                    placeholder="Search events, artists, venues..."
                                    className="w-full pl-12 pr-4 h-14 bg-white rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-300 shadow-sm"
                                />
                            </div>
                            <button className="bg-blue-800 text-white px-8 py-3 h-14 rounded-xl font-semibold hover:bg-gray-600 transition-colors shadow-sm flex items-center justify-center">
                                <Link style={{ color: "white" }} to="/events">Search</Link>
                            </button>
                        </div>
                    </div>
                </div>
            </section>




            {/* Categories */}
            <section className="py-12 bg-white">
                <div className="container mx-auto px-4 text-center">
                    <h2 className="text-3xl font-bold mb-8 text-gray-800">Explore by Category</h2>
                    <div className="flex flex-wrap justify-center gap-4">
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
                    </div>
                </div>
            </section>

            {/* Featured Events */}
            <section className="py-16 bg-gray-50">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold text-gray-800 mb-4">Featured Events Near You</h2>
                        <a href="#" className="text-blue-600 font-medium hover:underline inline-flex items-center gap-1">View all events <ChevronRight size={16} /></a>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
                        {featuredEvent.map(event => (
                            <div key={event.eventId} className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 group cursor-pointer flex flex-col">
                                <div className="relative h-60 overflow-hidden">
                                    <span className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-lg text-sm font-semibold text-blue-600 z-10 shadow-sm">
                                        {event.categories && event.categories.length > 0 && event.categories.map((cat: any) => (
                                            <Badge key={cat.categoryId || cat.categoryName || cat}>{cat.categoryName || cat.name || cat}</Badge>
                                        ))}
                                    </span>
                                    <img src={event.imageUrl} alt={event.eventName} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                </div>
                                <div className="p-6 flex flex-col flex-grow">
                                    <h3 className="text-xl font-bold mb-3 text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2">{event.eventName}</h3>

                                    <div className="space-y-2 mb-6 text-gray-600 text-sm">
                                        {/* Add  date and time */}
                                        <div className="flex items-center gap-2">
                                            <Calendar size={16} className="text-gray-400" />
                                            <span>
                                                {format(new Date(String(event.eventStartInstant || event.eventStartDate || event.startDate || '').replace('Z', '')), 'MMMM dd, yyyy ')}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Clock size={16} className="text-gray-400" />
                                            <span>
                                                {event.eventStartInstant ? format(new Date(String(event.eventStartInstant).replace('Z', '')), 'h:mm a') : ''}
                                            </span>
                                        </div>


                                        <div className="flex items-center gap-2">
                                            <MapPin size={16} className="text-gray-400" />
                                            <span> {event.eventLocation.locationAddress}</span>
                                        </div>
                                    </div>

                                    <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between">
                                        <span className="text-xl font-bold text-gray-900">{event.ticketPrice}</span>
                                        <button className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium transition-colors shadow-md shadow-blue-500/30">
                                            Get Tickets
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Call to Action */}
            <section className="py-20 bg-white border-t border-gray-100">
                <div className="container mx-auto px-4 text-center max-w-4xl">
                    <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">Ready to host your own event?</h2>
                    <p className="text-xl text-gray-600 mb-8">Join thousands of organizers using NodeEvents to manage and sell out their experiences.</p>
                    <button className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl text-lg font-semibold transition-all shadow-xl shadow-blue-500/30 mx-auto">
                        <Link style={{ color: "white" }} to="/create-event">Create Event</Link>  <ChevronRight size={20} />
                    </button>
                </div>
            </section>
        </div>
    );
}
