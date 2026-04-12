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
import { AllEvents } from './pages/events';
import { Profile } from './pages/profile';
import { AttendeesPage } from './pages/attendees';

export default function AppRoutes() {
    return (
        <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
                path="/dashboard"
                element={
                    <ProtectedRoute allowedRoles={['USER', 'ORGANIZER', 'ADMIN']}>
                        <Dashboard />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/profile"
                element={
                    <ProtectedRoute allowedRoles={['USER', 'ORGANIZER', 'ADMIN']}>
                        <Profile />
                    </ProtectedRoute>
                }
            />
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
            <Route
                path="/admin"
                element={
                    <ProtectedRoute allowedRoles={['ADMIN']}>
                        <AdminPanel />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/events/:id/attendees"
                element={
                    <ProtectedRoute allowedRoles={['ORGANIZER', 'ADMIN']}>
                        <AttendeesPage />
                    </ProtectedRoute>
                }
            />
            <Route path="/events/:id" element={<EventDetail />} />
            <Route path="/events" element={<AllEvents />} />
        </Routes>
    );
}
