import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Boxes,
  FileText,
  Calendar,
  BarChart3,
  Settings,
  CalendarDays,
  UserCog,
  AlertTriangle,
  Briefcase,
} from 'lucide-react';
import { Logo } from '../components/brand/Logo';
import { useQuery } from '@tanstack/react-query';
import { useMonth } from '../contexts/MonthContext';
import { api } from '../lib/apiClient';

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/employees', label: 'Employees', icon: Users },
  { path: '/pods', label: 'Pods', icon: Boxes },
  { path: '/processes', label: 'Processes', icon: Settings },
  { path: '/brands', label: 'Brands', icon: FileText },
  { path: '/assignments', label: 'Assignments', icon: UserCog },
  { path: '/roster', label: 'Roster', icon: Calendar },
  { path: '/availability', label: 'Availability', icon: CalendarDays },
  { path: '/conflicts', label: 'Conflicts', icon: AlertTriangle, showBadge: true },
  { path: '/working-rules', label: 'Working Rules', icon: Briefcase },
  { path: '/reports', label: 'Reports', icon: BarChart3 },
];

export function Sidebar() {
  const location = useLocation();
  const { month, year } = useMonth();

  const { data: conflictsData } = useQuery({
    queryKey: ['conflicts-count', month, year],
    queryFn: async () => {
      const roster = await api.get<Array<{ id: string }>>(`/rosters?month=${month}&year=${year}&limit=1`);
      if (!roster.data || roster.data.length === 0) return { count: 0 };
      const conflicts = await api.get<Array<{ id: string }>>(`/rosters/${roster.data[0].id}/conflicts`);
      return { count: Array.isArray(conflicts.data) ? conflicts.data.length : 0 };
    },
  });

  return (
    <aside className="w-64 bg-sidebar-bg flex flex-col">
      <div className="p-6 flex items-center space-x-3">
        <Logo size={32} />
        <div className="text-white">
          <span className="text-lg font-normal">Smart</span>
          <span className="text-lg font-semibold">Roster</span>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          const showBadge = item.showBadge && conflictsData && conflictsData.count > 0;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center justify-between px-4 py-3 text-sm rounded-lg transition-colors ${
                isActive
                  ? 'bg-sidebar-active text-white font-medium'
                  : 'text-sidebar-text hover:bg-sidebar-active/50'
              }`}
            >
              <div className="flex items-center">
                <Icon size={18} className="mr-3" />
                {item.label}
              </div>
              {showBadge && (
                <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  {conflictsData.count}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
