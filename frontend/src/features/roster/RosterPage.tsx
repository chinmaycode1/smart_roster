import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/apiClient';
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
  brandProcessId?: string;
  suggestedActions: Array<{ type: string; description: string }>;
}

interface Roster {
  id: string;
  month: number;
  year: number;
  version: number;
  status: 'DRAFT' | 'PENDING_APPROVAL' | 'PUBLISHED';
}

interface ViewEmployee {
  id: string;
  code: string;
  name: string;
  podId: string;
  podName: string;
  isPodLead: boolean;
}

interface ViewBrandProcess {
  id: string;
  brandId: string;
  brandName: string;
  processId: string;
  processName: string;
  defaultMinCoverage: number;
  assignedEmployeeIds: string[];
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
  const [viewMode, setViewMode] = useState<ViewMode>('company');
  const [showConflicts, setShowConflicts] = useState(false);
  const [editingCell, setEditingCell] = useState<{ entryId: string; x: number; y: number } | null>(null);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [selectedPod, setSelectedPod] = useState<string>('');
  const [selectedBrand, setSelectedBrand] = useState<string>('');
  const [selectedProcess, setSelectedProcess] = useState<string>('');
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const { data: roster } = useQuery({
    queryKey: ['roster', currentRosterId],
    queryFn: async () => {
      if (!currentRosterId) throw new Error('No roster selected');
      const res = await api.get<Roster>(`/rosters/${currentRosterId}`);
      return res.data;
    },
    enabled: !!currentRosterId,
  });

  const { data: entries } = useQuery({
    queryKey: ['roster-entries', currentRosterId],
    queryFn: async () => {
      if (!currentRosterId) return [];
      const res = await api.get<RosterEntry[]>(`/rosters/${currentRosterId}/entries`);
      return res.data;
    },
    enabled: !!currentRosterId,
  });

  const { data: viewData } = useQuery({
    queryKey: ['roster-view-data', currentRosterId],
    queryFn: async () => {
      if (!currentRosterId) return null;
      const res = await api.get<{
        employees: ViewEmployee[];
        brandProcesses: ViewBrandProcess[];
        holidays: Array<{ date: string }>;
      }>(`/rosters/${currentRosterId}/view-data`);
      return res.data;
    },
    enabled: !!currentRosterId,
  });

  const { data: conflicts } = useQuery({
    queryKey: ['roster-conflicts', currentRosterId],
    queryFn: async () => {
      if (!currentRosterId) return [];
      const res = await api.get<Conflict[]>(`/rosters/${currentRosterId}/conflicts`);
      return res.data;
    },
    enabled: !!currentRosterId,
  });

  const generateMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post<{ roster: { id: string } }>('/rosters/generate', { month, year });
      return res.data;
    },
    onSuccess: (data) => {
      setCurrentRosterId(data.roster.id);
      queryClient.invalidateQueries({ queryKey: ['roster'] });
      queryClient.invalidateQueries({ queryKey: ['roster-entries'] });
      queryClient.invalidateQueries({ queryKey: ['roster-conflicts'] });
      queryClient.invalidateQueries({ queryKey: ['roster-view-data'] });
    },
  });

  const [editConflictMessage, setEditConflictMessage] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const updateEntryMutation = useMutation({
    mutationFn: async ({ entryId, status }: { entryId: string; status: string }) => {
      const res = await api.put<{ entry: RosterEntry; conflictCount: number; errorCount: number; conflictDelta: number }>(`/rosters/${currentRosterId}/entries/${entryId}`, { status });
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['roster-entries', currentRosterId] });
      queryClient.invalidateQueries({ queryKey: ['roster-conflicts', currentRosterId] });
      setEditingCell(null);

      const oldCount = data.conflictCount - data.conflictDelta;
      if (data.conflictDelta !== 0) {
        setEditConflictMessage(`Conflicts: ${oldCount} → ${data.conflictCount} (${data.conflictDelta > 0 ? '+' : ''}${data.conflictDelta})`);
        setTimeout(() => setEditConflictMessage(null), 5000);
      }
    },
    onError: (error: Error) => {
      setEditConflictMessage(error.message || 'Failed to update entry');
      setTimeout(() => setEditConflictMessage(null), 5000);
    },
  });

  const repairMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post<{ applied: boolean; changes?: Array<Record<string, unknown>>; reason?: string }>(`/rosters/${currentRosterId}/repair`);
      return res.data;
    },
    onSuccess: (data) => {
      if (data.applied) {
        setStatusMessage(`Repair applied: ${data.changes?.length || 0} changes made`);
        queryClient.invalidateQueries({ queryKey: ['roster-entries', currentRosterId] });
        queryClient.invalidateQueries({ queryKey: ['roster-conflicts', currentRosterId] });
      } else {
        setStatusMessage(`Repair not applied: ${data.reason}`);
      }
      setTimeout(() => setStatusMessage(null), 5000);
    },
  });

  const requestApprovalMutation = useMutation({
    mutationFn: async () => {
      await api.post(`/rosters/${currentRosterId}/request-approval`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roster', currentRosterId] });
      setStatusMessage('Approval requested');
      setTimeout(() => setStatusMessage(null), 5000);
    },
  });

  const approveMutation = useMutation({
    mutationFn: async () => {
      await api.post(`/rosters/${currentRosterId}/approve`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roster', currentRosterId] });
      setStatusMessage('Roster approved and published');
      setTimeout(() => setStatusMessage(null), 5000);
    },
  });

  const exportCSVMutation = useMutation({
    mutationFn: async () => {
      const res = await api.get<Blob>(`/rosters/${currentRosterId}/export/csv`, { responseType: 'blob' });
      return res.data;
    },
    onSuccess: (blob) => {
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
    (entries || []).forEach((entry) => {
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
    if (viewMode !== 'company' && viewMode !== 'pod') return;
    setEditingCell({ entryId: entry.id, x: day, y: empIndex });
  };

  const handleStatusChange = (entryId: string, newStatus: string) => {
    updateEntryMutation.mutate({ entryId, status: newStatus });
  };

  const handleDayClick = (day: number) => {
    setSelectedDay(selectedDay === day ? null : day);
  };

  const uniqueEmployees = new Map<string, RosterEntry['employee']>();
  (entries || []).forEach((e) => {
    if (!uniqueEmployees.has(e.employee.id)) {
      uniqueEmployees.set(e.employee.id, e.employee);
    }
  });
  const allEmployees = Array.from(uniqueEmployees.values()).sort((a, b) => a.name.localeCompare(b.name));
  const days = getDaysInMonth();
  const entriesGrouped = getEntriesGrouped();
  const errorConflicts = (conflicts || []).filter((c) => c.severity === 'ERROR');
  const warningConflicts = (conflicts || []).filter((c) => c.severity === 'WARNING');

  const pods = Array.from(new Set(viewData?.employees.map((e) => e.podName) || [])).sort();
  const brands = Array.from(new Set(viewData?.brandProcesses.map((bp) => bp.brandName) || [])).sort();
  const processes = Array.from(new Set(viewData?.brandProcesses.map((bp) => bp.processName) || [])).sort();

  if (!selectedPod && pods.length > 0) setSelectedPod(pods[0]);
  if (!selectedBrand && brands.length > 0) setSelectedBrand(brands[0]);
  if (!selectedProcess && processes.length > 0) setSelectedProcess(processes[0]);
  if (!selectedEmployee && allEmployees.length > 0) setSelectedEmployee(allEmployees[0].id);

  const getEmployeesForView = () => {
    if (viewMode === 'company') return allEmployees;
    if (viewMode === 'pod') {
      const podEmployees = allEmployees.filter((e) => e.pod.name === selectedPod);
      return podEmployees.sort((a, b) => {
        const aLead = viewData?.employees.find((ve) => ve.id === a.id)?.isPodLead;
        const bLead = viewData?.employees.find((ve) => ve.id === b.id)?.isPodLead;
        if (aLead && !bLead) return -1;
        if (!aLead && bLead) return 1;
        return a.name.localeCompare(b.name);
      });
    }
    if (viewMode === 'brand') {
      const bpIds = viewData?.brandProcesses.filter((bp) => bp.brandName === selectedBrand).map((bp) => bp.id) || [];
      const empIds = new Set<string>();
      bpIds.forEach((bpId) => {
        const bp = viewData?.brandProcesses.find((b) => b.id === bpId);
        bp?.assignedEmployeeIds.forEach((id) => empIds.add(id));
      });
      return allEmployees.filter((e) => empIds.has(e.id));
    }
    if (viewMode === 'process') {
      const bpIds = viewData?.brandProcesses.filter((bp) => bp.processName === selectedProcess).map((bp) => bp.id) || [];
      const empIds = new Set<string>();
      bpIds.forEach((bpId) => {
        const bp = viewData?.brandProcesses.find((b) => b.id === bpId);
        bp?.assignedEmployeeIds.forEach((id) => empIds.add(id));
      });
      return allEmployees.filter((e) => empIds.has(e.id));
    }
    return allEmployees;
  };

  const getWorkingCountForDay = (emps: RosterEntry['employee'][], day: number) => {
    return emps.filter((e) => entriesGrouped.get(e.id)?.get(day)?.status === 'WORKING').length;
  };

  const getEmployeeStatusCounts = (empId: string) => {
    const empEntries = entriesGrouped.get(empId);
    if (!empEntries) return { WORKING: 0, WEEKLY_OFF: 0, LEAVE: 0, HOLIDAY: 0, COMP_OFF: 0 };
    const counts = { WORKING: 0, WEEKLY_OFF: 0, LEAVE: 0, HOLIDAY: 0, COMP_OFF: 0 };
    empEntries.forEach((entry) => {
      counts[entry.status]++;
    });
    return counts;
  };

  const getDayConflicts = (day: number) => {
    const dateStr = new Date(year, month - 1, day).toISOString().split('T')[0];
    return (conflicts || []).filter((c) => c.date && c.date.startsWith(dateStr));
  };

  const getDayWorkingEmployees = (day: number) => {
    const working: string[] = [];
    entriesGrouped.forEach((dayMap, empId) => {
      if (dayMap.get(day)?.status === 'WORKING') {
        const emp = allEmployees.find((e) => e.id === empId);
        if (emp) working.push(emp.name);
      }
    });
    return working;
  };

  const renderEmployeeView = () => {
    if (!selectedEmployee) return null;
    const emp = allEmployees.find((e) => e.id === selectedEmployee);
    if (!emp) return null;
    const empEntries = entriesGrouped.get(selectedEmployee);
    const counts = getEmployeeStatusCounts(selectedEmployee);
    const empBPs = viewData?.brandProcesses.filter((bp) => bp.assignedEmployeeIds.includes(selectedEmployee)) || [];

    return (
      <div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Select Employee:</label>
          <select
            value={selectedEmployee}
            onChange={(e) => setSelectedEmployee(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md"
          >
            {allEmployees.map((e) => (
              <option key={e.id} value={e.id}>
                {e.code} - {e.name}
              </option>
            ))}
          </select>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold">{emp.name}</h3>
            <p className="text-sm text-gray-500">Pod: {emp.pod.name}</p>
          </div>
          <div className="mb-4 flex gap-4">
            <div className="text-sm"><span className="font-medium">Working:</span> {counts.WORKING}</div>
            <div className="text-sm"><span className="font-medium">Weekly Off:</span> {counts.WEEKLY_OFF}</div>
            <div className="text-sm"><span className="font-medium">Leave:</span> {counts.LEAVE}</div>
            <div className="text-sm"><span className="font-medium">Holiday:</span> {counts.HOLIDAY}</div>
            <div className="text-sm"><span className="font-medium">Comp Off:</span> {counts.COMP_OFF}</div>
          </div>
          <div className="mb-4">
            <h4 className="text-sm font-medium mb-2">Assigned Brand-Processes:</h4>
            <div className="text-sm text-gray-600">
              {empBPs.length > 0 ? empBPs.map((bp) => `${bp.brandName} - ${bp.processName}`).join(', ') : 'None'}
            </div>
          </div>
          <div className="grid grid-cols-7 gap-2">
            {days.map((day) => {
              const entry = empEntries?.get(day);
              return (
                <div key={day} className="text-center border rounded p-2">
                  <div className="text-xs font-medium text-gray-500 mb-1">{day}</div>
                  {entry && (
                    <div className={`text-xs px-2 py-1 rounded ${statusColors[entry.status]}`}>
                      {statusShort[entry.status]}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const renderCompanyOrPodView = () => {
    const empsToShow = getEmployeesForView();

    return (
      <div>
        {viewMode === 'pod' && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Pod:</label>
            <select
              value={selectedPod}
              onChange={(e) => setSelectedPod(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md"
            >
              {pods.map((pod) => (
                <option key={pod} value={pod}>
                  {pod}
                </option>
              ))}
            </select>
          </div>
        )}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="sticky left-0 bg-gray-50 z-10 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase border-r w-48">
                    Employee
                  </th>
                  {days.map((day) => (
                    <th
                      key={day}
                      onClick={() => handleDayClick(day)}
                      className={`px-2 py-3 text-center text-xs font-medium min-w-[40px] cursor-pointer hover:bg-gray-100 ${
                        selectedDay === day ? 'bg-blue-100 text-blue-700' : 'text-gray-500'
                      }`}
                    >
                      {day}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {empsToShow.map((employee, empIdx) => (
                  <tr key={employee.id} className="hover:bg-gray-50">
                    <td className="sticky left-0 bg-white z-10 px-4 py-3 text-sm font-medium text-gray-900 border-r">
                      <div className="text-sm font-medium text-gray-900">{employee.name}</div>
                      <div className="text-xs text-gray-500">{employee.pod?.name || 'No Pod'}</div>
                    </td>
                    {days.map((day) => {
                      const entry = entriesGrouped.get(employee.id)?.get(day);
                      if (!entry) return <td key={day} className="px-2 py-3"></td>;
                      
                      const isEditing = editingCell?.entryId === entry.id;
                      
                      return (
                        <td key={day} className={`px-1 py-2 text-center relative ${selectedDay === day ? 'bg-blue-50' : ''}`}>
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
                <tr className="bg-gray-50 font-medium">
                  <td className="sticky left-0 bg-gray-50 z-10 px-4 py-3 text-sm border-r">Working Count</td>
                  {days.map((day) => (
                    <td key={day} className={`px-2 py-3 text-center text-sm ${selectedDay === day ? 'bg-blue-100' : ''}`}>
                      {getWorkingCountForDay(empsToShow, day)}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderBrandOrProcessView = () => {
    const isBrand = viewMode === 'brand';
    const selectedValue = isBrand ? selectedBrand : selectedProcess;
    const options = isBrand ? brands : processes;
    const bpsForSelection = viewData?.brandProcesses.filter((bp) =>
      isBrand ? bp.brandName === selectedValue : bp.processName === selectedValue
    ) || [];

    return (
      <div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select {isBrand ? 'Brand' : 'Process'}:
          </label>
          <select
            value={selectedValue}
            onChange={(e) => (isBrand ? setSelectedBrand(e.target.value) : setSelectedProcess(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-md"
          >
            {options.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-6">
          {bpsForSelection.map((bp) => {
            const emps = allEmployees.filter((e) => bp.assignedEmployeeIds.includes(e.id));
            const groupLabel = isBrand ? bp.processName : bp.brandName;

            return (
              <div key={bp.id} className="bg-white rounded-lg border border-gray-200 p-4">
                <h3 className="text-md font-semibold mb-2">{groupLabel}</h3>
                <p className="text-sm text-gray-600 mb-3">Min Coverage: {bp.defaultMinCoverage}</p>
                <div className="mb-3 text-sm text-gray-700">
                  <strong>Assigned:</strong> {emps.map((e) => e.name).join(', ') || 'None'}
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-2">Day</th>
                        {days.map((day) => (
                          <th key={day} className="text-center py-2 px-1">{day}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="py-2 px-2 font-medium">Coverage</td>
                        {days.map((day) => {
                          const working = emps.filter((e) => entriesGrouped.get(e.id)?.get(day)?.status === 'WORKING').length;
                          const isUnder = working < bp.defaultMinCoverage;
                          return (
                            <td key={day} className={`text-center py-2 px-1 ${isUnder ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                              {working}/{bp.defaultMinCoverage}
                            </td>
                          );
                        })}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

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
                Conflicts ({errorConflicts.length}/{(conflicts || []).length})
              </Button>
              {(conflicts || []).length > 0 && (
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

      {editConflictMessage && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md text-sm text-blue-800">
          {editConflictMessage}
        </div>
      )}

      {statusMessage && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md text-sm text-green-800">
          {statusMessage}
        </div>
      )}

      <div className="mb-4 flex gap-2">
        {(['company', 'pod', 'brand', 'process', 'employee'] as ViewMode[]).map((mode) => (
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
            {(conflicts || []).map((conflict) => (
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
                      {conflict.suggestedActions.map((action, idx) => (
                        <li key={idx}>{action.description}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
            {(conflicts || []).length === 0 && (
              <p className="text-gray-500 text-center py-8">No conflicts found</p>
            )}
          </div>
        </div>
      )}

      {selectedDay !== null && viewMode === 'company' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-semibold">Day {selectedDay} Details</h3>
            <button onClick={() => setSelectedDay(null)} className="text-blue-600 hover:text-blue-800 text-sm">
              Close
            </button>
          </div>
          <div className="text-sm mb-2">
            <strong>Working:</strong> {getDayWorkingEmployees(selectedDay).join(', ') || 'None'}
          </div>
          <div className="text-sm">
            <strong>Under-covered brand-processes:</strong>
            {getDayConflicts(selectedDay).filter((c) => c.code.includes('COVERAGE')).length > 0
              ? getDayConflicts(selectedDay)
                  .filter((c) => c.code.includes('COVERAGE'))
                  .map((c, i) => <div key={i} className="text-xs text-red-700 mt-1">{c.message}</div>)
              : ' None'}
          </div>
        </div>
      )}

      {currentRosterId && entries && entries.length > 0 ? (
        <div>
          {viewMode === 'employee' && renderEmployeeView()}
          {(viewMode === 'company' || viewMode === 'pod') && renderCompanyOrPodView()}
          {(viewMode === 'brand' || viewMode === 'process') && renderBrandOrProcessView()}
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <p className="text-gray-500">No roster generated. Select month/year and click "Generate".</p>
        </div>
      )}
    </div>
  );
}
