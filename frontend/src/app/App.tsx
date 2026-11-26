import { Routes, Route } from 'react-router-dom';
import { AppShell } from './AppShell';
import Dashboard from '../features/dashboard/Dashboard';
import Employees from '../features/employees/Employees';
import { PodsPage } from '../features/pods/PodsPage';
import { ProcessesPage } from '../features/processes/ProcessesPage';
import { RosterPage } from '../features/roster/RosterPage';
import { ReportsPage } from '../features/reports/ReportsPage';

export default function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/employees" element={<Employees />} />
        <Route path="/pods" element={<PodsPage />} />
        <Route path="/processes" element={<ProcessesPage />} />
        <Route path="/brands" element={<div className="p-6">Brands (under construction)</div>} />
        <Route path="/roster" element={<RosterPage />} />
        <Route path="/reports" element={<ReportsPage />} />
      </Routes>
    </AppShell>
  );
}
