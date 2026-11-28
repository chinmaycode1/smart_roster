import { Bell, User } from 'lucide-react';
import { useMonth } from '../contexts/MonthContext';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { api } from '../lib/apiClient';
import { useState } from 'react';

export function Topbar() {
  const { month, year, setMonthYear } = useMonth();
  const queryClient = useQueryClient();
  const [errorMessage, setErrorMessage] = useState('');

  const { data: conflictsData } = useQuery({
    queryKey: ['conflicts-count', month, year],
    queryFn: async () => {
      const roster = await api.get<Array<{ id: string }>>(`/rosters?month=${month}&year=${year}&limit=1`);
      if (!roster.data || roster.data.length === 0) return { count: 0 };
      const conflicts = await api.get<Array<{ id: string }>>(`/rosters/${roster.data[0].id}/conflicts`);
      return { count: Array.isArray(conflicts.data) ? conflicts.data.length : 0 };
    },
  });

  const generateMutation = useMutation({
    mutationFn: async () => {
      await api.post(`/rosters/generate`, { month, year });
    },
    onSuccess: () => {
      setErrorMessage('');
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      queryClient.invalidateQueries({ queryKey: ['roster-list'] });
      queryClient.invalidateQueries({ queryKey: ['conflicts-count'] });
    },
    onError: (error: Error) => {
      setErrorMessage(error.message || 'Failed to generate roster');
    },
  });

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  return (
    <>
      <header className="bg-white border-b border-card-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div>
            <h1 className="text-2xl font-semibold text-text-primary">Dashboard</h1>
            <p className="text-sm text-text-secondary mt-0.5">Overview of roster and operations</p>
          </div>
          <div className="flex items-center space-x-2 ml-8">
            <select
              value={month}
              onChange={(e) => setMonthYear(parseInt(e.target.value), year)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              {months.map((m, idx) => (
                <option key={idx} value={idx + 1}>{m}</option>
              ))}
            </select>
            <select
              value={year}
              onChange={(e) => setMonthYear(month, parseInt(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              {years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            <button
              onClick={() => generateMutation.mutate()}
              disabled={generateMutation.isPending}
              className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 disabled:opacity-50 text-sm font-medium"
            >
              {generateMutation.isPending ? 'Generating...' : 'Generate Roster'}
            </button>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <button className="p-2 text-text-secondary hover:bg-gray-100 rounded-lg transition-colors relative">
            <Bell size={20} />
            {conflictsData && conflictsData.count > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-error rounded-full"></span>
            )}
          </button>

          <div className="flex items-center space-x-2 px-3 py-2 bg-gray-100 rounded-lg">
            <User size={18} className="text-text-secondary" />
            <span className="text-sm font-medium text-text-primary">Operations Manager</span>
          </div>
        </div>
      </header>
      {errorMessage && (
        <div className="bg-red-50 border-b border-red-200 px-6 py-3 text-sm text-red-800">
          {errorMessage}
        </div>
      )}
    </>
  );
}
