import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';

interface RosterEntry {
  id: string;
  employeeId: string;
  date: string;
  status: 'WORKING' | 'WEEKLY_OFF' | 'LEAVE' | 'HOLIDAY' | 'COMP_OFF';
  isLocked: boolean;
  note?: string;
  employee: {
    id: string;
    code: string;
    name: string;
    pod: { name: string; code: string };
  };
}

interface Conflict {
  id: string;
  severity: 'ERROR' | 'WARNING';
  code: string;
  message: string;
  date?: string;
  employeeId?: string;
}

type ViewMode = 'employee' | 'pod' | 'brand' | 'process' | 'company';

const statusColors = {
  WORKING: 'bg-green-100 text-green-800',
  WEEKLY_OFF: 'bg-blue-100 text-blue-800',
  LEAVE: 'bg-yellow-100 text-yellow-800',
  HOLIDAY: 'bg-purple-100 text-purple-800',
  COMP_OFF: 'bg-orange-100 text-orange-800',
};

const statusShort = {
  WORKING: 'W',
  WEEKLY_OFF: 'O',
  LEAVE: 'L',
  HOLIDAY: 'H',
  COMP_OFF: 'C',
};

export function RosterPage() {
  const queryClient = useQueryClient();
  const [currentRosterId, setCurrentRosterId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('employee');
  const [showConflicts, setShowConflicts] = useState(false);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());

  const { data: entries = [] } = useQuery<RosterEntry[]>({
    queryKey: ['roster-entries', currentRosterId],
    queryFn: async () => {
      if (!currentRosterId) return [];
      const res = await api.get(`/rosters/${currentRosterId}/entries`);
      return res.data;
    },
    enabled: !!currentRosterId,
  });

  const { data: conflicts = [] } = useQuery<Conflict[]>({
    queryKey: ['roster-conflicts', currentRosterId],
    queryFn: async () => {
      if (!currentRosterId) return [];
      const res = await api.get(`/rosters/${currentRosterId}/conflicts`);
      return res.data;
    },
    enabled: !!currentRosterId,
  });

  const generateMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post('/rosters/generate', { month, year });
      return res.data;
    },
    onSuccess: (data) => {
      setCurrentRosterId(data.roster.id);
      queryClient.invalidateQueries({ queryKey: ['roster-entries'] });
      queryClient.invalidateQueries({ queryKey: ['roster-conflicts'] });
    },
  });

  const updateEntryMutation = useMutation({
    mutationFn: async ({ entryId, status }: { entryId: string; status: string }) => {
      await api.put(`/rosters/${currentRosterId}/entries/${entryId}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roster-entries', currentRosterId] });
      queryClient.invalidateQueries({ queryKey: ['roster-conflicts', currentRosterId] });
    },
  });

  const publishMutation = useMutation({
    mutationFn: async () => {
      await api.post(`/rosters/${currentRosterId}/publish`);
    },
    onSuccess: () => {
      alert('Roster published successfully');
    },
  });

  const getDaysInMonth = () => {
    const daysInMonth = new Date(year, month, 0).getDate();
    return Array.from({ length: daysInMonth }, (_, i) => i + 1);
  };

  const getEntriesGrouped = () => {
    const grouped = new Map<string, Map<number, RosterEntry>>();
    entries.forEach((entry) => {
      const day = new Date(entry.date).getDate();
      if (!grouped.has(entry.employeeId)) {
        grouped.set(entry.employeeId, new Map());
      }
      grouped.get(entry.employeeId)!.set(day, entry);
    });
    return grouped;
  };

  const employees = Array.from(new Set(entries.map((e) => e.employee))).sort((a, b) =>
    a.name.localeCompare(b.name)
  );
  const days = getDaysInMonth();
  const entriesGrouped = getEntriesGrouped();

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Roster</h1>
        <div className="flex gap-3">
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-md"
          >
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                {new Date(2000, i).toLocaleString('default', { month: 'long' })}
              </option>
            ))}
          </select>
          <input
            type="number"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="w-24 px-3 py-2 border border-gray-300 rounded-md"
          />
          <Button onClick={() => generateMutation.mutate()}>
            {generateMutation.isPending ? 'Generating...' : 'Generate Roster'}
          </Button>
          {currentRosterId && (
            <>
              <Button variant="secondary" onClick={() => setShowConflicts(!showConflicts)}>
                Conflicts ({conflicts.length})
              </Button>
              <Button variant="ghost" onClick={() => publishMutation.mutate()}>
                Publish
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="mb-4 flex gap-2">
        {(['employee', 'pod', 'brand', 'process', 'company'] as ViewMode[]).map((mode) => (
          <button
            key={mode}
            onClick={() => setViewMode(mode)}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              viewMode === mode
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {mode.charAt(0).toUpperCase() + mode.slice(1)}
          </button>
        ))}
      </div>

      {showConflicts && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Conflicts</h2>
          <div className="space-y-2">
            {conflicts.map((conflict) => (
              <div
                key={conflict.id}
                className={`p-3 rounded-md ${
                  conflict.severity === 'ERROR' ? 'bg-red-50 border-red-200' : 'bg-yellow-50 border-yellow-200'
                } border`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <Badge variant={conflict.severity === 'ERROR' ? 'error' : 'warning'}>
                      {conflict.severity}
                    </Badge>
                    <span className="ml-2 font-mono text-sm text-gray-600">{conflict.code}</span>
                  </div>
                </div>
                <p className="mt-2 text-sm text-gray-700">{conflict.message}</p>
              </div>
            ))}
            {conflicts.length === 0 && (
              <p className="text-gray-500 text-center py-4">No conflicts found</p>
            )}
          </div>
        </div>
      )}

      {currentRosterId && entries.length > 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="sticky left-0 bg-white px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase border-r">
                  Employee
                </th>
                {days.map((day) => (
                  <th key={day} className="px-2 py-3 text-center text-xs font-medium text-gray-500">
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {employees.map((employee) => (
                <tr key={employee.id}>
                  <td className="sticky left-0 bg-white px-4 py-3 text-sm font-medium text-gray-900 border-r">
                    {employee.name}
                  </td>
                  {days.map((day) => {
                    const entry = entriesGrouped.get(employee.id)?.get(day);
                    if (!entry) return <td key={day} className="px-2 py-3"></td>;
                    return (
                      <td key={day} className="px-2 py-3 text-center">
                        <button
                          onClick={() => {
                            const newStatus = prompt('Enter new status (W/O/L/H/C):', statusShort[entry.status]);
                            if (newStatus) {
                              const statusMap: Record<string, string> = {
                                W: 'WORKING',
                                O: 'WEEKLY_OFF',
                                L: 'LEAVE',
                                H: 'HOLIDAY',
                                C: 'COMP_OFF',
                              };
                              const fullStatus = statusMap[newStatus.toUpperCase()];
                              if (fullStatus) {
                                updateEntryMutation.mutate({ entryId: entry.id, status: fullStatus });
                              }
                            }
                          }}
                          className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                            statusColors[entry.status]
                          } hover:opacity-75 ${entry.isLocked ? 'ring-2 ring-gray-400' : ''}`}
                        >
                          {statusShort[entry.status]}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <p className="text-gray-500">No roster generated. Click "Generate Roster" to create one.</p>
        </div>
      )}
    </div>
  );
}
