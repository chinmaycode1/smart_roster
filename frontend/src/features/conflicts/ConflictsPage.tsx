import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/apiClient';
import { useMonth } from '../../contexts/MonthContext';
import { AlertTriangle, AlertCircle } from 'lucide-react';

interface Conflict {
  id: string;
  severity: 'ERROR' | 'WARNING';
  code: string;
  message: string;
  date?: string;
  employeeId?: string;
  brandProcessId?: string;
  suggestedActions: Array<{ type: string; description: string }>;
}

export function ConflictsPage() {
  const { month, year } = useMonth();
  const [severityFilter, setSeverityFilter] = useState<'ALL' | 'ERROR' | 'WARNING'>('ALL');
  
  
  const [dateFilter, setDateFilter] = useState('');

  const { data: roster } = useQuery({
    queryKey: ['roster-latest', month, year],
    queryFn: async () => {
      const res = await api.get<Array<{ id: string }>>(`/rosters?month=${month}&year=${year}&limit=1`);
      return res.data && res.data.length > 0 ? res.data[0] : null;
    },
  });

  const { data: conflicts, isLoading } = useQuery({
    queryKey: ['conflicts', roster?.id],
    queryFn: async () => {
      if (!roster) return [];
      const res = await api.get<Conflict[]>(`/rosters/${roster.id}/conflicts`);
      return Array.isArray(res.data) ? res.data : [];
    },
    enabled: !!roster,
  });

  const filteredConflicts = (conflicts || []).filter((c) => {
    if (severityFilter !== 'ALL' && c.severity !== severityFilter) return false;
    if (dateFilter && (!c.date || !c.date.startsWith(dateFilter))) return false;
    return true;
  });

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">Loading conflicts...</div>
      </div>
    );
  }

  if (!roster) {
    return (
      <div className="p-6">
        <div className="bg-white rounded-xl p-12 border border-card-border text-center">
          <h3 className="text-lg font-semibold mb-2">No Roster Found</h3>
          <p className="text-text-secondary">Generate a roster to view conflicts.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Conflicts</h1>
        <div className="flex items-center space-x-3">
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value as 'ALL' | 'ERROR' | 'WARNING')}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="ALL">All Severities</option>
            <option value="ERROR">Errors Only</option>
            <option value="WARNING">Warnings Only</option>
          </select>
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            placeholder="Filter by date"
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-card-border">
        {filteredConflicts.length === 0 ? (
          <div className="p-12 text-center text-text-secondary">
            No conflicts found
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredConflicts.map((conflict) => (
              <div key={conflict.id} className="p-6">
                <div className="flex items-start space-x-3">
                  <div className={`mt-0.5 ${conflict.severity === 'ERROR' ? 'text-red-500' : 'text-amber-500'}`}>
                    {conflict.severity === 'ERROR' ? <AlertCircle size={20} /> : <AlertTriangle size={20} />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className={`text-xs font-semibold px-2 py-1 rounded ${
                          conflict.severity === 'ERROR' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {conflict.severity}
                        </span>
                        <span className="text-xs text-text-secondary">{conflict.code}</span>
                      </div>
                      {conflict.date && (
                        <span className="text-sm text-text-secondary">{new Date(conflict.date).toLocaleDateString()}</span>
                      )}
                    </div>
                    <p className="text-text-primary mb-3">{conflict.message}</p>
                    {conflict.suggestedActions && Array.isArray(conflict.suggestedActions) && conflict.suggestedActions.length > 0 && (
                      <div className="mt-3 bg-gray-50 rounded-md p-3">
                        <p className="text-sm font-medium text-text-primary mb-2">Suggested Actions:</p>
                        <ul className="space-y-1">
                          {conflict.suggestedActions.map((action, idx) => (
                            <li key={idx} className="text-sm text-text-secondary flex items-start">
                              <span className="mr-2">•</span>
                              <span>{action.description || action.type}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
