import { Zap } from "lucide-react";
import { Link } from "react-router-dom";

export default function Header() {
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


                </nav>
                <div className="flex items-center gap-4">
                    <Link to="/login" className="text-gray-700 hover:text-blue-600">
                        Login
                    </Link>
                    <Link to="/register" className="text-gray-700 hover:text-blue-600">
                        Register
                    </Link>
                </div>
            </div>
        </header>

    );
}