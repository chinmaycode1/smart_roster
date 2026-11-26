import { Routes, Route } from 'react-router-dom';
import { AppShell } from './AppShell';
import Dashboard from '../features/dashboard/Dashboard';
import Employees from '../features/employees/Employees';

export default function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/employees" element={<Employees />} />
        <Route path="/brands" element={<div className="p-6">Brands (under construction)</div>} />
        <Route path="/roster" element={<div className="p-6">Roster (under construction)</div>} />
      </Routes>
    </AppShell>
  );
}
