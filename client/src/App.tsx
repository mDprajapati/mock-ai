import { Routes, Route, Navigate } from 'react-router-dom';
import { SessionProvider } from './context/SessionContext';
import Landing from './pages/Landing';
import Intake from './pages/Intake';
import DeviceCheck from './pages/DeviceCheck';
import Interview from './pages/Interview';
import Report from './pages/Report';

export default function App() {
  return (
    <SessionProvider>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/intake" element={<Intake />} />
        <Route path="/device-check" element={<DeviceCheck />} />
        <Route path="/interview" element={<Interview />} />
        <Route path="/report" element={<Report />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </SessionProvider>
  );
}
