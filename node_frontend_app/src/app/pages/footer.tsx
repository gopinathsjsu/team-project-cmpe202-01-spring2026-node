import { Link } from 'react-router-dom';
import { Zap } from 'lucide-react';

export default function Footer() {
    return (
        <footer className="bg-gray-900 text-gray-300">
            <div className="container mx-auto px-4 py-12">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    <div className="md:col-span-1">
                        <Link to="/" className="flex items-center gap-2 mb-4">
                            <Zap className="h-7 w-7 text-blue-400" />
                            <span className="font-bold text-xl text-white">Node Events</span>
                        </Link>
                        <p className="text-sm text-gray-400 leading-relaxed">
                            Discover, create, and manage events. Connect with people who share your interests.
                        </p>
                    </div>

                    <div>
                        <h3 className="font-semibold text-white mb-4">Explore</h3>
                        <ul className="space-y-2 text-sm">
                            <li><Link to="/events" className="hover:text-white transition-colors">Browse Events</Link></li>
                            <li><Link to="/events?price=free" className="hover:text-white transition-colors">Free Events</Link></li>
                            <li><Link to="/events?sort=popular" className="hover:text-white transition-colors">Popular Events</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="font-semibold text-white mb-4">Organizers</h3>
                        <ul className="space-y-2 text-sm">
                            <li><Link to="/create-event" className="hover:text-white transition-colors">Create Event</Link></li>
                            <li><Link to="/dashboard" className="hover:text-white transition-colors">Dashboard</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="font-semibold text-white mb-4">Support</h3>
                        <ul className="space-y-2 text-sm">
                            <li><span className="hover:text-white transition-colors cursor-pointer">Help Center</span></li>
                            <li><span className="hover:text-white transition-colors cursor-pointer">Contact Us</span></li>
                            <li><span className="hover:text-white transition-colors cursor-pointer">Privacy Policy</span></li>
                            <li><span className="hover:text-white transition-colors cursor-pointer">Terms of Service</span></li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-gray-800 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="text-sm text-gray-500">
                        &copy; {new Date().getFullYear()} Node Events. All rights reserved.
                    </p>
                    <div className="flex gap-4">
                        <span className="text-gray-500 hover:text-white transition-colors cursor-pointer text-sm">Twitter</span>
                        <span className="text-gray-500 hover:text-white transition-colors cursor-pointer text-sm">LinkedIn</span>
                        <span className="text-gray-500 hover:text-white transition-colors cursor-pointer text-sm">Instagram</span>
                    </div>
                </div>
            </div>
        </footer>
    );
}
