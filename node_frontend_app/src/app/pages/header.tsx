import { Zap } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Header() {
    const { isAuthenticated, currentUser, logout } = useAuth();
    const navigate = useNavigate();

    return (
        <header className="border-b bg-white sticky top-0 z-50">
            <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                <Link to="/" className="flex items-center gap-2">
                    <Zap className="h-8 w-8 text-blue-600" />
                    <span className="font-bold text-xl">Node</span>
                </Link>

                <nav className="hidden md:flex items-center gap-6">
                    <Link to="/events" className="text-gray-700 hover:text-blue-600">
                        Browse Events
                    </Link>
                    <Link to="/dashboard" className="text-gray-700 hover:text-blue-600">
                        Dashboard
                    </Link>
                    {isAuthenticated && currentUser?.role === 'ORGANIZER' && (
                        <>
                            <Link to="/create-event" className="text-gray-700 hover:text-blue-600">
                                Create Event
                            </Link>

                        </>
                    )}

                </nav>
                <div className="flex items-center gap-4">
                    {isAuthenticated ? (
                        <>
                            <span className="text-gray-700">Hi, {currentUser?.name}</span>
                            <button
                                onClick={() => {
                                    logout();
                                    navigate('/');
                                }}
                                className="text-gray-700 hover:text-red-600"
                            >
                                Logout
                            </button>
                        </>
                    ) : (
                        <>
                            <Link to="/login" className="text-gray-700 hover:text-blue-600">
                                Login
                            </Link>
                            <Link to="/register" className="text-gray-700 hover:text-blue-600">
                                Register
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </header>

    );
}