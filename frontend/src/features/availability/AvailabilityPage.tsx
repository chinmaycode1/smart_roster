import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/apiClient';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { useNavigate } from 'react-router-dom';

type TabType = 'leaves' | 'compoffs' | 'holidays';

interface Leave {
  id: string;
  employeeId: string;
  startDate: string;
  endDate: string;
  reason?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  employee: { id: string; code: string; name: string };
}

interface CompOff {
  id: string;
  employeeId: string;
  earnedOn: string;
  redeemOn?: string;
  status: 'EARNED' | 'REDEEMED' | 'EXPIRED';
  employee: { id: string; code: string; name: string };
}

interface Holiday {
  id: string;
  date: string;
  name: string;
  region: string;
}

interface SuggestedAction {
  type: string;
  description: string;
  employeeId?: string;
  employeeName?: string;
  date?: string;
  impact?: string;
}

interface Conflict {
  severity: 'ERROR' | 'WARNING';
  code: string;
  brandProcessId?: string;
  employeeId?: string;
  date?: Date;
  message: string;
  suggestedActions: SuggestedAction[];
}

interface RosterImpact {
  before: { errors: number; warnings: number };
  after: { errors: number; warnings: number };
  newConflicts: Conflict[];
}

interface RosterInfo {
  id: string;
  month: number;
  year: number;
  status: string;
  impact?: RosterImpact;
}

export function AvailabilityPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('leaves');
  const [showAddLeave, setShowAddLeave] = useState(false);
  const [showAddCompOff, setShowAddCompOff] = useState(false);
  const [showAddHoliday, setShowAddHoliday] = useState(false);
  const [impactData, setImpactData] = useState<{ rosters: RosterInfo[] } | null>(null);
  const [isLoadingImpact, setIsLoadingImpact] = useState(false);
  const [repairSuccess, setRepairSuccess] = useState<string>('');

  const { data: leaves } = useQuery({
    queryKey: ['leaves'],
    queryFn: async () => {
      const res = await api.get<Leave[]>('/leaves');
      return res.data;
    },
  });

  const { data: compOffs } = useQuery({
    queryKey: ['comp-offs'],
    queryFn: async () => {
      const res = await api.get<CompOff[]>('/comp-offs');
      return res.data;
    },
  });

  const { data: holidays } = useQuery({
    queryKey: ['holidays'],
    queryFn: async () => {
      const res = await api.get<Holiday[]>('/holidays');
      return res.data;
    },
  });

  const { data: employees } = useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      const res = await api.get<Array<{ id: string; code: string; name: string }>>('/employees');
      return res.data;
    },
  });

  const deleteLeave = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/leaves/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaves'] });
    },
  });

  const updateLeaveStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const response = await fetch(`${api.defaults.baseURL}/leaves/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error('Failed to update leave');
      return response.json();
    },
    onSuccess: async (result) => {
      queryClient.invalidateQueries({ queryKey: ['leaves'] });
      
      // If leave was approved and has affected rosters, check impact
      if (result.affectedRosterIds && result.affectedRosterIds.length > 0) {
        setIsLoadingImpact(true);
        try {
          const rostersWithImpact: RosterInfo[] = [];
          
          for (const rosterId of result.affectedRosterIds) {
            // Get roster info
            const rosterResponse = await api.get<{ id: string; month: number; year: number; status: string }>(`/rosters/${rosterId}`);
            const roster = rosterResponse.data;
            
            // Get impact
            const impactResponse = await api.post<RosterImpact>(`/rosters/${rosterId}/revalidate`, {});
            const impact = impactResponse.data;
            
            rostersWithImpact.push({
              ...roster,
              impact,
            });
          }
          
          setImpactData({ rosters: rostersWithImpact });
        } catch {
          // Failed to fetch impact - silently continue
        } finally {
          setIsLoadingImpact(false);
        }
      }
    },
  });

  const deleteCompOff = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/comp-offs/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comp-offs'] });
    },
  });

  const deleteHoliday = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/holidays/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['holidays'] });
    },
  });

  const createLeave = useMutation({
    mutationFn: async (data: { employeeId: string; startDate: string; endDate: string; reason: string }) => {
      await api.post('/leaves', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaves'] });
      setShowAddLeave(false);
    },
  });

  const createCompOff = useMutation({
    mutationFn: async (data: { employeeId: string; earnedOn: string }) => {
      await api.post('/comp-offs', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comp-offs'] });
      setShowAddCompOff(false);
    },
  });

  const createHoliday = useMutation({
    mutationFn: async (data: { date: string; name: string }) => {
      await api.post('/holidays', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['holidays'] });
      setShowAddHoliday(false);
    },
  });

  const repairRoster = useMutation({
    mutationFn: async (rosterId: string) => {
      await api.post(`/rosters/${rosterId}/repair`, {});
    },
    onSuccess: () => {
      setImpactData(null);
      setRepairSuccess('Roster repaired successfully!');
      setTimeout(() => setRepairSuccess(''), 3000);
    },
  });

  const handleAddLeave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    createLeave.mutate({
      employeeId: formData.get('employeeId') as string,
      startDate: formData.get('startDate') as string,
      endDate: formData.get('endDate') as string,
      reason: formData.get('reason') as string,
    });
  };

  const handleAddCompOff = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    createCompOff.mutate({
      employeeId: formData.get('employeeId') as string,
      earnedOn: formData.get('earnedOn') as string,
    });
  };

  const handleAddHoliday = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    createHoliday.mutate({
      date: formData.get('date') as string,
      name: formData.get('name') as string,
    });
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Availability</h1>
      </div>

      {/* Impact Panel */}
      {repairSuccess && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-800">{repairSuccess}</p>
        </div>
      )}

      {isLoadingImpact && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-blue-800">Analyzing roster impact...</p>
        </div>
      )}

      {impactData && impactData.rosters.length > 0 && (
        <div className="mb-6 p-6 bg-yellow-50 border border-yellow-300 rounded-lg">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Impact of this change</h2>
              <p className="text-sm text-gray-600 mt-1">
                This leave affects {impactData.rosters.length} roster{impactData.rosters.length > 1 ? 's' : ''}
              </p>
            </div>
            <button
              onClick={() => setImpactData(null)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>

          {impactData.rosters.map((roster) => (
            <div key={roster.id} className="mb-6 last:mb-0">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-gray-900">
                  Roster: {new Date(roster.year, roster.month - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  {roster.status === 'PUBLISHED' && (
                    <Badge variant="working" className="ml-2">Published</Badge>
                  )}
                </h3>
                <div className="flex gap-2">
                  {roster.status !== 'PUBLISHED' && roster.impact && roster.impact.newConflicts.length > 0 && (
                    <Button
                      size="sm"
                      onClick={() => repairRoster.mutate(roster.id)}
                      disabled={repairRoster.isPending}
                    >
                      Auto Repair
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => navigate(`/roster?rosterId=${roster.id}`)}
                  >
                    Open Roster
                  </Button>
                </div>
              </div>

              {roster.impact && (
                <>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-white p-3 rounded border">
                      <p className="text-xs text-gray-500 uppercase">Before</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {roster.impact.before.errors} errors, {roster.impact.before.warnings} warnings
                      </p>
                    </div>
                    <div className="bg-white p-3 rounded border">
                      <p className="text-xs text-gray-500 uppercase">After</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {roster.impact.after.errors} errors, {roster.impact.after.warnings} warnings
                      </p>
                    </div>
                  </div>

                  {roster.status === 'PUBLISHED' && roster.impact.newConflicts.length > 0 && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded">
                      <p className="text-sm font-medium text-red-800">
                        ⚠️ This roster is PUBLISHED and cannot be modified. Please generate a new version.
                      </p>
                    </div>
                  )}

                  {roster.impact.newConflicts.length > 0 ? (
                    <div>
                      <p className="text-sm font-medium text-gray-900 mb-2">
                        {roster.impact.newConflicts.length} new conflict{roster.impact.newConflicts.length > 1 ? 's' : ''}:
                      </p>
                      <div className="space-y-3">
                        {roster.impact.newConflicts.map((conflict, idx) => (
                          <div
                            key={idx}
                            className={`p-3 rounded border ${
                              conflict.severity === 'ERROR'
                                ? 'bg-red-50 border-red-200'
                                : 'bg-yellow-50 border-yellow-200'
                            }`}
                          >
                            <div className="flex items-start gap-2 mb-2">
                              <Badge variant={conflict.severity === 'ERROR' ? 'error' : 'default'}>
                                {conflict.severity}
                              </Badge>
                              <p className="text-sm text-gray-900 flex-1">{conflict.message}</p>
                            </div>

                            {conflict.suggestedActions.length > 0 && (
                              <div className="mt-2 pl-4 border-l-2 border-gray-300">
                                <p className="text-xs font-medium text-gray-700 mb-1">Suggested actions:</p>
                                <ul className="text-xs text-gray-600 space-y-1">
                                  {conflict.suggestedActions.map((action, actionIdx) => (
                                    <li key={actionIdx}>
                                      • {action.description}
                                      {action.impact && (
                                        <span className="text-gray-500 italic"> ({action.impact})</span>
                                      )}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-green-700 font-medium">
                      ✓ No new conflicts detected
                    </p>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="mb-6 flex gap-2">
        {(['leaves', 'compoffs', 'holidays'] as TabType[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              activeTab === tab
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {tab === 'leaves' && 'Leaves'}
            {tab === 'compoffs' && 'Comp-Offs'}
            {tab === 'holidays' && 'Public Holidays'}
          </button>
        ))}
      </div>

      {activeTab === 'leaves' && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-lg font-semibold">Leaves</h2>
            <Button onClick={() => setShowAddLeave(!showAddLeave)}>
              {showAddLeave ? 'Cancel' : 'Add Leave'}
            </Button>
          </div>

          {showAddLeave && (
            <form onSubmit={handleAddLeave} className="p-6 border-b border-gray-200 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Employee</label>
                <select name="employeeId" required className="w-full px-3 py-2 border border-gray-300 rounded-md">
                  <option value="">Select employee</option>
                  {employees?.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.code} - {emp.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input type="date" name="startDate" required className="w-full px-3 py-2 border border-gray-300 rounded-md" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <input type="date" name="endDate" required className="w-full px-3 py-2 border border-gray-300 rounded-md" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                <input type="text" name="reason" className="w-full px-3 py-2 border border-gray-300 rounded-md" />
              </div>
              <Button type="submit">Create Leave</Button>
            </form>
          )}

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Start Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">End Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {leaves?.map((leave) => (
                  <tr key={leave.id}>
                    <td className="px-6 py-4 text-sm text-gray-900">{leave.employee.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{new Date(leave.startDate).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{new Date(leave.endDate).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{leave.reason || '-'}</td>
                    <td className="px-6 py-4">
                      <Badge
                        variant={
                          leave.status === 'APPROVED' ? 'working' : leave.status === 'REJECTED' ? 'error' : 'default'
                        }
                      >
                        {leave.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      {leave.status === 'PENDING' && (
                        <>
                          <button
                            onClick={() => updateLeaveStatus.mutate({ id: leave.id, status: 'APPROVED' })}
                            className="text-green-600 hover:text-green-800 text-sm"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => updateLeaveStatus.mutate({ id: leave.id, status: 'REJECTED' })}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            Reject
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => deleteLeave.mutate(leave.id)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
                {(!leaves || leaves.length === 0) && (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                      No leaves found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'compoffs' && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-lg font-semibold">Comp-Offs</h2>
            <Button onClick={() => setShowAddCompOff(!showAddCompOff)}>
              {showAddCompOff ? 'Cancel' : 'Add Comp-Off'}
            </Button>
          </div>

          {showAddCompOff && (
            <form onSubmit={handleAddCompOff} className="p-6 border-b border-gray-200 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Employee</label>
                <select name="employeeId" required className="w-full px-3 py-2 border border-gray-300 rounded-md">
                  <option value="">Select employee</option>
                  {employees?.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.code} - {emp.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Earned On</label>
                <input type="date" name="earnedOn" required className="w-full px-3 py-2 border border-gray-300 rounded-md" />
              </div>
              <Button type="submit">Create Comp-Off</Button>
            </form>
          )}

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Earned On</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Redeem On</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {compOffs?.map((compOff) => (
                  <tr key={compOff.id}>
                    <td className="px-6 py-4 text-sm text-gray-900">{compOff.employee.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{new Date(compOff.earnedOn).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {compOff.redeemOn ? new Date(compOff.redeemOn).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={compOff.status === 'REDEEMED' ? 'working' : 'default'}>{compOff.status}</Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => deleteCompOff.mutate(compOff.id)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
                {(!compOffs || compOffs.length === 0) && (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                      No comp-offs found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'holidays' && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-lg font-semibold">Public Holidays</h2>
            <Button onClick={() => setShowAddHoliday(!showAddHoliday)}>
              {showAddHoliday ? 'Cancel' : 'Add Holiday'}
            </Button>
          </div>

          {showAddHoliday && (
            <form onSubmit={handleAddHoliday} className="p-6 border-b border-gray-200 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input type="date" name="date" required className="w-full px-3 py-2 border border-gray-300 rounded-md" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input type="text" name="name" required className="w-full px-3 py-2 border border-gray-300 rounded-md" />
              </div>
              <Button type="submit">Create Holiday</Button>
            </form>
          )}

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Region</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {holidays?.map((holiday) => (
                  <tr key={holiday.id}>
                    <td className="px-6 py-4 text-sm text-gray-900">{new Date(holiday.date).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{holiday.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{holiday.region}</td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => deleteHoliday.mutate(holiday.id)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
                {(!holidays || holidays.length === 0) && (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                      No holidays found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
