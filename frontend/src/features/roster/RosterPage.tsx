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
  suggestedActions: Array<{ type: string; description: string }>;
}

interface Roster {
  id: string;
  month: number;
  year: number;
  version: number;
  status: 'DRAFT' | 'PENDING_APPROVAL' | 'PUBLISHED';
}

type ViewMode = 'employee' | 'pod' | 'brand' | 'process' | 'company';

const statusColors = {
  WORKING: 'bg-green-100 text-green-800 border-green-300',
  WEEKLY_OFF: 'bg-blue-100 text-blue-800 border-blue-300',
  LEAVE: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  HOLIDAY: 'bg-purple-100 text-purple-800 border-purple-300',
  COMP_OFF: 'bg-orange-100 text-orange-800 border-orange-300',
};

const statusShort = {
  WORKING: 'W',
  WEEKLY_OFF: 'O',
  LEAVE: 'L',
  HOLIDAY: 'H',
  COMP_OFF: 'C',
};

const statusOptions = [
  { value: 'WORKING', label: 'Working', short: 'W' },
  { value: 'WEEKLY_OFF', label: 'Weekly Off', short: 'O' },
  { value: 'LEAVE', label: 'Leave', short: 'L' },
  { value: 'HOLIDAY', label: 'Holiday', short: 'H' },
  { value: 'COMP_OFF', label: 'Comp Off', short: 'C' },
];

export function RosterPage() {
  const queryClient = useQueryClient();
  const [currentRosterId, setCurrentRosterId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('employee');
  const [showConflicts, setShowConflicts] = useState(false);
  const [editingCell, setEditingCell] = useState<{ entryId: string; x: number; y: number } | null>(null);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());

  const { data: roster } = useQuery<Roster>({
    queryKey: ['roster', currentRosterId],
    queryFn: async () => {
      if (!currentRosterId) throw new Error('No roster selected');
      const res = await api.get(`/rosters/${currentRosterId}`);
      return res.data;
    },
    enabled: !!currentRosterId,
  });

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
    onSuccess: (data: { roster: { id: string } }) => {
      setCurrentRosterId(data.roster.id);
      queryClient.invalidateQueries({ queryKey: ['roster'] });
      queryClient.invalidateQueries({ queryKey: ['roster-entries'] });
      queryClient.invalidateQueries({ queryKey: ['roster-conflicts'] });
    },
  });

  const updateEntryMutation = useMutation({
    mutationFn: async ({ entryId, status, isLocked, note }: { entryId: string; status: string; isLocked?: boolean; note?: string }) => {
      await api.put(`/rosters/${currentRosterId}/entries/${entryId}`, { status, isLocked, note });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roster-entries', currentRosterId] });
      queryClient.invalidateQueries({ queryKey: ['roster-conflicts', currentRosterId] });
      setEditingCell(null);
    },
  });

  const repairMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post(`/rosters/${currentRosterId}/repair`);
      return res.data;
    },
    onSuccess: (data: { applied: boolean; changes?: any[]; reason?: string }) => {
      if (data.applied) {
        alert(`Repair applied: ${data.changes?.length || 0} changes made`);
        queryClient.invalidateQueries({ queryKey: ['roster-entries', currentRosterId] });
        queryClient.invalidateQueries({ queryKey: ['roster-conflicts', currentRosterId] });
      } else {
        alert(`Repair not applied: ${data.reason}`);
      }
    },
  });

  const requestApprovalMutation = useMutation({
    mutationFn: async () => {
      await api.post(`/rosters/${currentRosterId}/request-approval`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roster', currentRosterId] });
      alert('Approval requested');
    },
  });

  const approveMutation = useMutation({
    mutationFn: async () => {
      await api.post(`/rosters/${currentRosterId}/approve`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roster', currentRosterId] });
      alert('Roster approved and published');
    },
  });

  const exportCSVMutation = useMutation({
    mutationFn: async () => {
      const res = await api.get(`/rosters/${currentRosterId}/export/csv`, { responseType: 'blob' });
      return res.data;
    },
    onSuccess: (blob: Blob) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `roster-${month}-${year}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    },
  });

  const getDaysInMonth = () => {
    const daysInMonth = new Date(year, month, 0).getDate();
    return Array.from({ length: daysInMonth }, (_, i) => i + 1);
  };

  const getEntriesGrouped = () => {
    const grouped = new Map<string, Map<number, RosterEntry>>();
    entries.forEach((entry: RosterEntry) => {
      const day = new Date(entry.date).getDate();
      if (!grouped.has(entry.employeeId)) {
        grouped.set(entry.employeeId, new Map());
      }
      grouped.get(entry.employeeId)!.set(day, entry);
    });
    return grouped;
  };

  const handleCellClick = (entry: RosterEntry, day: number, empIndex: number) => {
    if (entry.isLocked) return;
    setEditingCell({ entryId: entry.id, x: day, y: empIndex });
  };

  const handleStatusChange = (entryId: string, newStatus: string) => {
    updateEntryMutation.mutate({ entryId, status: newStatus });
  };

  const uniqueEmployees = new Map<string, RosterEntry['employee']>();
  entries.forEach((e: RosterEntry) => {
    if (!uniqueEmployees.has(e.employee.id)) {
      uniqueEmployees.set(e.employee.id, e.employee);
    }
  });
  const employees = Array.from(uniqueEmployees.values()).sort(
    (a, b) => a.name.localeCompare(b.name)
  );
  const days = getDaysInMonth();
  const entriesGrouped = getEntriesGrouped();
  const errorConflicts = conflicts.filter((c: Conflict) => c.severity === 'ERROR');
  const warningConflicts = conflicts.filter((c: Conflict) => c.severity === 'WARNING');

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Roster</h1>
          {roster && (
            <p className="text-sm text-gray-500 mt-1">
              Version {roster.version} - {roster.status}
            </p>
          )}
        </div>
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
          <Button onClick={() => generateMutation.mutate()} disabled={generateMutation.isPending}>
            {generateMutation.isPending ? 'Generating...' : 'Generate'}
          </Button>
          {currentRosterId && (
            <>
              <Button variant="secondary" onClick={() => setShowConflicts(!showConflicts)}>
                Conflicts ({errorConflicts.length}/{conflicts.length})
              </Button>
              {conflicts.length > 0 && (
                <Button variant="secondary" onClick={() => repairMutation.mutate()}>
                  Auto Repair
                </Button>
              )}
              {roster?.status === 'DRAFT' && (
                <Button variant="ghost" onClick={() => requestApprovalMutation.mutate()}>
                  Request Approval
                </Button>
              )}
              {roster?.status === 'PENDING_APPROVAL' && (
                <Button variant="ghost" onClick={() => approveMutation.mutate()}>
                  Approve & Publish
                </Button>
              )}
              <Button variant="ghost" onClick={() => exportCSVMutation.mutate()}>
                Export CSV
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
        <div className="bg-white rounded-lg border border-gray-200 mb-6 max-h-96 overflow-y-auto">
          <div className="sticky top-0 bg-white px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                Conflicts ({errorConflicts.length} errors, {warningConflicts.length} warnings)
              </h2>
              <button onClick={() => setShowConflicts(false)} className="text-gray-400 hover:text-gray-600">
                ✕
              </button>
            </div>
          </div>
          <div className="p-6 space-y-3">
            {conflicts.map((conflict: Conflict) => (
              <div
                key={conflict.id}
                className={`p-4 rounded-md border ${
                  conflict.severity === 'ERROR'
                    ? 'bg-red-50 border-red-200'
                    : 'bg-yellow-50 border-yellow-200'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Badge variant={conflict.severity === 'ERROR' ? 'error' : 'warning'}>
                      {conflict.severity}
                    </Badge>
                    <span className="font-mono text-xs text-gray-600">{conflict.code}</span>
                  </div>
                  {conflict.date && (
                    <span className="text-xs text-gray-500">
                      {new Date(conflict.date).toLocaleDateString()}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-700 mb-2">{conflict.message}</p>
                {conflict.suggestedActions && conflict.suggestedActions.length > 0 && (
                  <div className="mt-2 text-xs text-gray-600">
                    <strong>Suggestions:</strong>
                    <ul className="list-disc list-inside ml-2 mt-1">
                      {conflict.suggestedActions.map((action: { description: string }, idx: number) => (
                        <li key={idx}>{action.description}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
            {conflicts.length === 0 && (
              <p className="text-gray-500 text-center py-8">No conflicts found</p>
            )}
          </div>
        </div>
      )}

      {currentRosterId && entries.length > 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="sticky left-0 bg-gray-50 z-10 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase border-r w-48">
                    Employee
                  </th>
                  {days.map((day) => (
                    <th key={day} className="px-2 py-3 text-center text-xs font-medium text-gray-500 min-w-[40px]">
                      {day}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {employees.map((employee: RosterEntry['employee'], empIdx: number) => (
                  <tr key={employee.id} className="hover:bg-gray-50">
                    <td className="sticky left-0 bg-white z-10 px-4 py-3 text-sm font-medium text-gray-900 border-r">
                      <div className="text-sm font-medium text-gray-900">{employee.name}</div>
                      <div className="text-xs text-gray-500">{employee.pod.name}</div>
                    </td>
                    {days.map((day) => {
                      const entry = entriesGrouped.get(employee.id)?.get(day);
                      if (!entry) return <td key={day} className="px-2 py-3"></td>;
                      
                      const isEditing = editingCell?.entryId === entry.id;
                      
                      return (
                        <td key={day} className="px-1 py-2 text-center relative">
                          {isEditing ? (
                            <select
                              autoFocus
                              value={entry.status}
                              onChange={(e) => handleStatusChange(entry.id, e.target.value)}
                              onBlur={() => setEditingCell(null)}
                              className="w-full px-1 py-1 text-xs border border-blue-500 rounded"
                            >
                              {statusOptions.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                  {opt.label}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <button
                              onClick={() => handleCellClick(entry, day, empIdx)}
                              disabled={entry.isLocked}
                              className={`w-full px-2 py-1 rounded text-xs font-medium border transition-colors ${
                                statusColors[entry.status]
                              } ${entry.isLocked ? 'opacity-50 cursor-not-allowed ring-2 ring-gray-400' : 'hover:opacity-80 cursor-pointer'}`}
                              title={entry.note || `${entry.status}${entry.isLocked ? ' (locked)' : ''}`}
                            >
                              {statusShort[entry.status]}
                            </button>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <p className="text-gray-500">No roster generated. Select month/year and click "Generate".</p>
        </div>
      )}
    </div>
  );
}
