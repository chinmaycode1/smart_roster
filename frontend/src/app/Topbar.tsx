import { Bell, User } from 'lucide-react';

export function Topbar() {
  return (
    <header className="bg-white border-b border-card-border px-6 py-4 flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-semibold text-text-primary">Dashboard</h1>
        <p className="text-sm text-text-secondary mt-0.5">Overview of roster and operations</p>
      </div>

      <div className="flex items-center space-x-4">
        <button className="p-2 text-text-secondary hover:bg-gray-100 rounded-lg transition-colors relative">
          <Bell size={20} />
          <span className="absolute top-1 right-1 w-2 h-2 bg-error rounded-full"></span>
        </button>

        <div className="flex items-center space-x-2 px-3 py-2 bg-gray-100 rounded-lg">
          <User size={18} className="text-text-secondary" />
          <span className="text-sm font-medium text-text-primary">Operations Manager</span>
        </div>
      </div>
    </header>
  );
}
