import { Routes, Route } from 'react-router-dom';
import Home from './home';
import CreateEvent from './createEvent';

export default function AppRoutes() {
    return (
        <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/create-event" element={<CreateEvent />} />
        </Routes>
    );
}
