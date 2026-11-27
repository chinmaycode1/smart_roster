import { Routes, Route } from 'react-router-dom';
import { AppShell } from './AppShell';
import { ErrorBoundary } from '../components/ErrorBoundary';
import Dashboard from '../features/dashboard/Dashboard';
import Employees from '../features/employees/Employees';
import { PodsPage } from '../features/pods/PodsPage';
import { ProcessesPage } from '../features/processes/ProcessesPage';
import { BrandsPage } from '../features/brands/BrandsPage';
import { RosterPage } from '../features/roster/RosterPage';
import { ReportsPage } from '../features/reports/ReportsPage';

export default function App() {
  return (
    <ErrorBoundary>
      <AppShell>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/employees" element={<Employees />} />
          <Route path="/pods" element={<PodsPage />} />
          <Route path="/processes" element={<ProcessesPage />} />
          <Route path="/brands" element={<BrandsPage />} />
          <Route path="/roster" element={<RosterPage />} />
          <Route path="/reports" element={<ReportsPage />} />
        </Routes>
      </AppShell>
    </ErrorBoundary>
  );
}
