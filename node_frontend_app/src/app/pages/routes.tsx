import { Routes, Route } from 'react-router-dom';
import Home from './home';
import { CreateEvent } from './createEvent';
import { Login } from './Login';
import { Register } from './Register';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { Dashboard } from './dashboard';

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

        </Routes>
    );
}
