import { useState } from 'react';
import { Zap, Menu, X, User, LogOut, LayoutDashboard, Shield, ChevronDown, Plus, Search } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import { Button } from '../components/ui/button';

export default function Header() {
    const { isAuthenticated, currentUser, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const isActive = (path: string) => location.pathname === path;

    const navLinkClass = (path: string) =>
        `text-sm font-medium transition-colors ${isActive(path) ? 'text-blue-600' : 'text-gray-700 hover:text-blue-600'}`;

    const handleLogout = () => {
        logout();
        setMobileMenuOpen(false);
        navigate('/');
    };

    return (
        <header className="border-b bg-white/95 backdrop-blur-sm sticky top-0 z-50">
            <div className="container mx-auto px-4">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-2 shrink-0" onClick={() => setMobileMenuOpen(false)}>
                        <Zap className="h-7 w-7 text-blue-600" />
                        <span className="font-bold text-xl">Node Events</span>
                    </Link>

                    {/* Desktop Nav */}
                    <nav className="hidden md:flex items-center gap-6" aria-label="Main navigation">
                        <Link to="/events" className={navLinkClass('/events')}>
                            <span className="flex items-center gap-1.5"><Search className="h-4 w-4" /> Browse Events</span>
                        </Link>

                        {isAuthenticated && (
                            <Link to="/dashboard" className={navLinkClass('/dashboard')}>
                                <span className="flex items-center gap-1.5"><LayoutDashboard className="h-4 w-4" /> Dashboard</span>
                            </Link>
                        )}

                        {isAuthenticated && (currentUser?.role === 'ORGANIZER' || currentUser?.role === 'ADMIN') && (
                            <Link to="/createEvent" className={navLinkClass('/createEvent')}>
                                <span className="flex items-center gap-1.5"><Plus className="h-4 w-4" /> Create Event</span>
                            </Link>
                        )}

                        {isAuthenticated && currentUser?.role === 'ADMIN' && (
                            <Link to="/admin" className={navLinkClass('/admin')}>
                                <span className="flex items-center gap-1.5"><Shield className="h-4 w-4" /> Admin</span>
                            </Link>
                        )}
                    </nav>

                    {/* Desktop Auth / Profile */}
                    <div className="hidden md:flex items-center gap-3">
                        {isAuthenticated ? (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="flex items-center gap-2 px-3">
                                        <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-semibold">
                                            {currentUser?.name?.charAt(0)?.toUpperCase() || 'U'}
                                        </div>
                                        <span className="text-sm font-medium max-w-[120px] truncate">{currentUser?.name}</span>
                                        <ChevronDown className="h-4 w-4 text-gray-400" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-56">
                                    <DropdownMenuLabel>
                                        <div className="flex flex-col">
                                            <span>{currentUser?.name}</span>
                                            <span className="text-xs text-gray-500 font-normal">{currentUser?.email}</span>
                                            <span className="text-xs text-blue-600 capitalize mt-1">{currentUser?.role?.toLowerCase()}</span>
                                        </div>
                                    </DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => navigate('/profile')}>
                                        <User className="h-4 w-4 mr-2" /> Profile
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => navigate('/dashboard')}>
                                        <LayoutDashboard className="h-4 w-4 mr-2" /> Dashboard
                                    </DropdownMenuItem>
                                    {currentUser?.role === 'ADMIN' && (
                                        <DropdownMenuItem onClick={() => navigate('/admin')}>
                                            <Shield className="h-4 w-4 mr-2" /> Admin Panel
                                        </DropdownMenuItem>
                                    )}
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600">
                                        <LogOut className="h-4 w-4 mr-2" /> Logout
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        ) : (
                            <>
                                <Link to="/login">
                                    <Button variant="ghost" size="sm">Sign in</Button>
                                </Link>
                                <Link to="/register">
                                    <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                                        Get Started
                                    </Button>
                                </Link>
                            </>
                        )}
                    </div>

                    {/* Mobile Menu Toggle */}
                    <button
                        className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        aria-label="Toggle navigation menu"
                        aria-expanded={mobileMenuOpen}
                    >
                        {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                    </button>
                </div>

                {/* Mobile Menu */}
                {mobileMenuOpen && (
                    <div className="md:hidden border-t py-4 space-y-1 animate-in slide-in-from-top-2">
                        <Link
                            to="/events"
                            className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 text-gray-700"
                            onClick={() => setMobileMenuOpen(false)}
                        >
                            <Search className="h-5 w-5" /> Browse Events
                        </Link>

                        {isAuthenticated && (
                            <Link
                                to="/dashboard"
                                className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 text-gray-700"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                <LayoutDashboard className="h-5 w-5" /> Dashboard
                            </Link>
                        )}

                        {isAuthenticated && (currentUser?.role === 'ORGANIZER' || currentUser?.role === 'ADMIN') && (
                            <Link
                                to="/createEvent"
                                className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 text-gray-700"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                <Plus className="h-5 w-5" /> Create Event
                            </Link>
                        )}

                        {isAuthenticated && currentUser?.role === 'ADMIN' && (
                            <Link
                                to="/admin"
                                className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 text-gray-700"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                <Shield className="h-5 w-5" /> Admin Panel
                            </Link>
                        )}

                        <div className="border-t my-2" />

                        {isAuthenticated ? (
                            <>
                                <Link
                                    to="/profile"
                                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 text-gray-700"
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    <User className="h-5 w-5" /> Profile
                                </Link>
                                <div className="px-3 py-2 text-sm text-gray-500">
                                    Signed in as <strong>{currentUser?.name}</strong>
                                    <span className="text-xs text-blue-600 ml-2 capitalize">({currentUser?.role?.toLowerCase()})</span>
                                </div>
                                <button
                                    onClick={handleLogout}
                                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-red-50 text-red-600 w-full text-left"
                                >
                                    <LogOut className="h-5 w-5" /> Logout
                                </button>
                            </>
                        ) : (
                            <div className="flex gap-3 px-3 pt-2">
                                <Link to="/login" className="flex-1" onClick={() => setMobileMenuOpen(false)}>
                                    <Button variant="outline" className="w-full">Sign in</Button>
                                </Link>
                                <Link to="/register" className="flex-1" onClick={() => setMobileMenuOpen(false)}>
                                    <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">Get Started</Button>
                                </Link>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </header>
    );
}
