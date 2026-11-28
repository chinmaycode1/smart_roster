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
} from 'lucide-react';
import { Logo } from '../components/brand/Logo';

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/employees', label: 'Employees', icon: Users },
  { path: '/pods', label: 'Pods', icon: Boxes },
  { path: '/processes', label: 'Processes', icon: Settings },
  { path: '/brands', label: 'Brands', icon: FileText },
  { path: '/assignments', label: 'Assignments', icon: UserCog },
  { path: '/roster', label: 'Roster', icon: Calendar },
  { path: '/availability', label: 'Availability', icon: CalendarDays },
  { path: '/reports', label: 'Reports', icon: BarChart3 },
];

export function Sidebar() {
  const location = useLocation();

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

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center px-4 py-3 text-sm rounded-lg transition-colors ${
                isActive
                  ? 'bg-sidebar-active text-white font-medium'
                  : 'text-sidebar-text hover:bg-sidebar-active/50'
              }`}
            >
              <Icon size={18} className="mr-3" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
