import { Routes, Route } from 'react-router-dom';
import { AppShell } from './AppShell';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { MonthProvider } from '../contexts/MonthContext';
import Dashboard from '../features/dashboard/Dashboard';
import Employees from '../features/employees/Employees';
import { PodsPage } from '../features/pods/PodsPage';
import { ProcessesPage } from '../features/processes/ProcessesPage';
import { BrandsPage } from '../features/brands/BrandsPage';
import { RosterPage } from '../features/roster/RosterPage';
import { ReportsPage } from '../features/reports/ReportsPage';
import { AvailabilityPage } from '../features/availability/AvailabilityPage';
import { AssignmentsPage } from '../features/assignments/AssignmentsPage';
import { ConflictsPage } from '../features/conflicts/ConflictsPage';
import { WorkingRulesPage } from '../features/working-rules/WorkingRulesPage';

export default function App() {
  return (
    <ErrorBoundary>
      <MonthProvider>
        <AppShell>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/employees" element={<Employees />} />
            <Route path="/pods" element={<PodsPage />} />
            <Route path="/processes" element={<ProcessesPage />} />
            <Route path="/brands" element={<BrandsPage />} />
            <Route path="/assignments" element={<AssignmentsPage />} />
            <Route path="/roster" element={<RosterPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/availability" element={<AvailabilityPage />} />
            <Route path="/conflicts" element={<ConflictsPage />} />
            <Route path="/working-rules" element={<WorkingRulesPage />} />
          </Routes>
        </AppShell>
      </MonthProvider>
    </ErrorBoundary>
  );
}
