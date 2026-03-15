import { Routes, Route } from 'react-router-dom';
import Home from './pages/home';
import { CreateEvent } from './pages/createEvent';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Dashboard } from './pages/dashboard';
import { AdminPanel } from './pages/admin';
import { EditEvent } from './pages/editEvent';
import { EventDetail } from './pages/viewEventDetails';

export default function AppRoutes() {
    return (
        <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/dashboard" element={<ProtectedRoute allowedRoles={['ORGANIZER', 'ADMIN']}><Dashboard /></ProtectedRoute>} />
            <Route
                path="/create-event"
                element={
                    <ProtectedRoute allowedRoles={['ORGANIZER', 'ADMIN']}>
                        <CreateEvent />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/edit-event/:id"
                element={
                    <ProtectedRoute allowedRoles={['ORGANIZER', 'ADMIN']}>
                        <EditEvent />
                    </ProtectedRoute>
                }
            />
            <Route path="/admin" element={<AdminPanel />} />
            <Route path="/events/:id" element={<EventDetail />} />

        </Routes>
    );
}
