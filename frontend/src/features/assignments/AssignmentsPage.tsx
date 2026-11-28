import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/apiClient';
import { Button } from '../../components/ui/Button';
import type { BrandProcess, OperatingRule, Employee, CoverageOverride, WeeklyOffPattern } from '../../types/api';
import { Plus, X, Edit2, Calendar } from 'lucide-react';

const WEEKDAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function AssignmentsPage() {
  const queryClient = useQueryClient();
  const [selectedBpId, setSelectedBpId] = useState<string | null>(null);
  const [showAddEmployee, setShowAddEmployee] = useState(false);
  const [showWeeklyOff, setShowWeeklyOff] = useState(false);
  const [showCoverageOverride, setShowCoverageOverride] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [weeklyOffData, setWeeklyOffData] = useState<WeeklyOffPattern | null>(null);
  const [coverageForm, setCoverageForm] = useState({ date: '', weekday: '', minCoverage: '', reason: '' });

  const { data: brandProcesses, isLoading } = useQuery({
    queryKey: ['brand-processes'],
    queryFn: async () => {
      const res = await api.get<BrandProcess[]>('/brand-processes');
      return res.data;
    },
  });

  const { data: operatingRules } = useQuery({
    queryKey: ['operating-rules'],
    queryFn: async () => {
      const res = await api.get<OperatingRule[]>('/operating-rules');
      return res.data;
    },
  });

  const { data: employees } = useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      const res = await api.get<Employee[]>('/employees');
      return res.data;
    },
  });

  const { data: coverageOverrides } = useQuery({
    queryKey: ['coverage-overrides', selectedBpId],
    queryFn: async () => {
      if (!selectedBpId) return [];
      const res = await api.get<CoverageOverride[]>(`/coverage-overrides?brandProcessId=${selectedBpId}`);
      return res.data;
    },
    enabled: !!selectedBpId,
  });

  const updateBpMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { operatingRuleId?: string; defaultMinCoverage?: number } }) => {
      await api.put(`/brand-processes/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brand-processes'] });
    },
  });

  const addAssignmentMutation = useMutation({
    mutationFn: async (data: { employeeId: string; brandProcessId: string; allocationPercent: number; isPrimary: boolean }) => {
      await api.post('/assignments', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brand-processes'] });
      setShowAddEmployee(false);
      setSelectedEmployeeId('');
    },
  });

  const removeAssignmentMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/assignments/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brand-processes'] });
    },
  });

  const addCoverageOverrideMutation = useMutation({
    mutationFn: async (data: { brandProcessId: string; date?: string; weekday?: number; minCoverage: number; reason?: string }) => {
      await api.post('/coverage-overrides', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coverage-overrides'] });
      setShowCoverageOverride(false);
      setCoverageForm({ date: '', weekday: '', minCoverage: '', reason: '' });
    },
  });

  const removeCoverageOverrideMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/coverage-overrides/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coverage-overrides'] });
    },
  });

  const updateWeeklyOffMutation = useMutation({
    mutationFn: async ({ employeeId, data }: { employeeId: string; data: { preferredOffDays: number[]; fixedOffDays: number[]; isFixed: boolean } }) => {
      await api.put(`/employees/${employeeId}/weekly-off`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      setShowWeeklyOff(false);
      setWeeklyOffData(null);
    },
  });

  const handleEditWeeklyOff = async (employee: Employee) => {
    const res = await api.get<WeeklyOffPattern>(`/employees/${employee.id}/weekly-off`);
    setWeeklyOffData(res.data || {
      id: '',
      employeeId: employee.id,
      preferredOffDays: [],
      fixedOffDays: [],
      isFixed: false,
    });
    setShowWeeklyOff(true);
  };

  const [errorMsg, setErrorMsg] = useState<string>('');

  const handleAddCoverageOverride = () => {
    if (!selectedBpId) return;
    if (!coverageForm.date && !coverageForm.weekday) {
      setErrorMsg('Please specify either a date or weekday');
      return;
    }
    setErrorMsg('');
    const payload: { brandProcessId: string; minCoverage: number; reason?: string; date?: string; weekday?: number } = {
      brandProcessId: selectedBpId,
      minCoverage: parseInt(coverageForm.minCoverage),
      reason: coverageForm.reason || undefined,
    };
    if (coverageForm.date) {
      payload.date = new Date(coverageForm.date).toISOString();
    } else if (coverageForm.weekday) {
      payload.weekday = parseInt(coverageForm.weekday);
    }
    addCoverageOverrideMutation.mutate(payload);
  };

  const toggleWeekday = (day: number, field: 'preferredOffDays' | 'fixedOffDays') => {
    if (!weeklyOffData) return;
    const current = weeklyOffData[field];
    const updated = current.includes(day) ? current.filter(d => d !== day) : [...current, day];
    setWeeklyOffData({ ...weeklyOffData, [field]: updated });
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Assignments & Rules</h1>
      </div>

      {isLoading ? (
        <div className="text-center text-gray-500">Loading...</div>
      ) : !brandProcesses || brandProcesses.length === 0 ? (
        <div className="text-center text-gray-500">No brand-processes found</div>
      ) : (
        <div className="space-y-4">
          {brandProcesses.map((bp) => (
            <div key={bp.id} className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="grid grid-cols-5 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Brand</label>
                  <div className="text-sm font-medium">{bp.brand?.name || bp.brandId}</div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Process</label>
                  <div className="text-sm font-medium">{bp.process?.name || bp.processId}</div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Operating Rule</label>
                  <select
                    value={bp.operatingRuleId}
                    onChange={(e) => updateBpMutation.mutate({ id: bp.id, data: { operatingRuleId: e.target.value } })}
                    className="w-full text-sm px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    {operatingRules?.map((rule) => (
                      <option key={rule.id} value={rule.id}>{rule.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Min Coverage</label>
                  <input
                    type="number"
                    min="1"
                    value={bp.defaultMinCoverage}
                    onChange={(e) => updateBpMutation.mutate({ id: bp.id, data: { defaultMinCoverage: parseInt(e.target.value) } })}
                    className="w-full text-sm px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div className="flex items-end gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelectedBpId(bp.id);
                      setShowCoverageOverride(true);
                    }}
                  >
                    <Calendar size={14} className="mr-1" /> Override
                  </Button>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-medium text-gray-500 uppercase">Assigned Employees</label>
                  {!showAddEmployee && (
                    <button
                      onClick={() => {
                        setSelectedBpId(bp.id);
                        setShowAddEmployee(true);
                      }}
                      className="text-xs text-blue-600 hover:text-blue-800 flex items-center"
                    >
                      <Plus size={14} className="mr-1" /> Add Employee
                    </button>
                  )}
                </div>

                {showAddEmployee && selectedBpId === bp.id && (
                  <div className="bg-gray-50 p-3 rounded mb-2 flex gap-2">
                    <select
                      value={selectedEmployeeId}
                      onChange={(e) => setSelectedEmployeeId(e.target.value)}
                      className="flex-1 text-sm px-2 py-1 border border-gray-300 rounded"
                    >
                      <option value="">Select employee...</option>
                      {employees?.filter(e => e.isActive).map((emp) => (
                        <option key={emp.id} value={emp.id}>{emp.name} ({emp.code})</option>
                      ))}
                    </select>
                    <Button
                      size="sm"
                      onClick={() => {
                        if (selectedEmployeeId) {
                          addAssignmentMutation.mutate({
                            employeeId: selectedEmployeeId,
                            brandProcessId: bp.id,
                            allocationPercent: 100,
                            isPrimary: true,
                          });
                        }
                      }}
                    >
                      Add
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setShowAddEmployee(false);
                        setSelectedEmployeeId('');
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                )}

                <div className="space-y-1">
                  {bp.assignments && bp.assignments.length > 0 ? (
                    bp.assignments.map((asg) => (
                      <div key={asg.id} className="flex items-center justify-between py-1 text-sm">
                        <div className="flex items-center gap-4">
                          <span className="font-medium">{asg.employee?.name || 'Unknown'}</span>
                          <span className="text-gray-500">({asg.employee?.code || '-'})</span>
                          <span className="text-gray-500">{asg.allocationPercent}%</span>
                          {asg.isPrimary && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">Primary</span>}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditWeeklyOff(asg.employee!)}
                            className="text-gray-600 hover:text-gray-800"
                            title="Edit weekly off"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm('Remove this assignment?')) {
                                removeAssignmentMutation.mutate(asg.id);
                              }
                            }}
                            className="text-red-600 hover:text-red-800"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-gray-500">No employees assigned</div>
                  )}
                </div>
              </div>

              {selectedBpId === bp.id && coverageOverrides && coverageOverrides.length > 0 && (
                <div className="border-t border-gray-200 pt-4 mt-4">
                  <label className="block text-xs font-medium text-gray-500 uppercase mb-2">Coverage Overrides</label>
                  <div className="space-y-1">
                    {coverageOverrides.map((ov) => (
                      <div key={ov.id} className="flex items-center justify-between py-1 text-sm bg-yellow-50 px-3 rounded">
                        <div className="flex gap-4">
                          <span>
                            {ov.date ? new Date(ov.date).toLocaleDateString() : `Every ${WEEKDAY_NAMES[ov.weekday!]}`}
                          </span>
                          <span className="font-medium">Min: {ov.minCoverage}</span>
                          {ov.reason && <span className="text-gray-600">{ov.reason}</span>}
                        </div>
                        <button
                          onClick={() => {
                            if (confirm('Delete this override?')) {
                              removeCoverageOverrideMutation.mutate(ov.id);
                            }
                          }}
                          className="text-red-600 hover:text-red-800"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showCoverageOverride && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-medium mb-4">Add Coverage Override</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date (specific)</label>
                <input
                  type="date"
                  value={coverageForm.date}
                  onChange={(e) => setCoverageForm({ ...coverageForm, date: e.target.value, weekday: '' })}
                  className="w-full px-2 py-1 border border-gray-300 rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">OR Weekday (recurring)</label>
                <select
                  value={coverageForm.weekday}
                  onChange={(e) => setCoverageForm({ ...coverageForm, weekday: e.target.value, date: '' })}
                  className="w-full px-2 py-1 border border-gray-300 rounded"
                >
                  <option value="">Select weekday...</option>
                  {WEEKDAY_NAMES.map((name, idx) => (
                    <option key={idx} value={idx}>{name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Min Coverage</label>
                <input
                  type="number"
                  min="0"
                  value={coverageForm.minCoverage}
                  onChange={(e) => setCoverageForm({ ...coverageForm, minCoverage: e.target.value })}
                  className="w-full px-2 py-1 border border-gray-300 rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason (optional)</label>
                <input
                  type="text"
                  value={coverageForm.reason}
                  onChange={(e) => setCoverageForm({ ...coverageForm, reason: e.target.value })}
                  className="w-full px-2 py-1 border border-gray-300 rounded"
                />
              </div>
            </div>
            {errorMsg && (
              <div className="mt-2 text-sm text-red-600">{errorMsg}</div>
            )}
            <div className="flex gap-2 mt-4">
              <Button onClick={handleAddCoverageOverride}>Add</Button>
              <Button variant="ghost" onClick={() => {
                setShowCoverageOverride(false);
                setCoverageForm({ date: '', weekday: '', minCoverage: '', reason: '' });
                setErrorMsg('');
              }}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {showWeeklyOff && weeklyOffData && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-medium mb-4">Edit Weekly Off Pattern</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Off Days</label>
                <div className="flex gap-2">
                  {WEEKDAY_NAMES.map((name, idx) => (
                    <button
                      key={idx}
                      onClick={() => toggleWeekday(idx, 'preferredOffDays')}
                      className={`px-2 py-1 text-xs rounded ${
                        weeklyOffData.preferredOffDays.includes(idx)
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-200 text-gray-700'
                      }`}
                    >
                      {name}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Fixed Off Days</label>
                <div className="flex gap-2">
                  {WEEKDAY_NAMES.map((name, idx) => (
                    <button
                      key={idx}
                      onClick={() => toggleWeekday(idx, 'fixedOffDays')}
                      className={`px-2 py-1 text-xs rounded ${
                        weeklyOffData.fixedOffDays.includes(idx)
                          ? 'bg-red-500 text-white'
                          : 'bg-gray-200 text-gray-700'
                      }`}
                    >
                      {name}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={weeklyOffData.isFixed}
                    onChange={(e) => setWeeklyOffData({ ...weeklyOffData, isFixed: e.target.checked })}
                  />
                  <span>Fixed pattern (no flexibility)</span>
                </label>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button onClick={() => {
                updateWeeklyOffMutation.mutate({
                  employeeId: weeklyOffData.employeeId,
                  data: {
                    preferredOffDays: weeklyOffData.preferredOffDays,
                    fixedOffDays: weeklyOffData.fixedOffDays,
                    isFixed: weeklyOffData.isFixed,
                  },
                });
              }}>
                Save
              </Button>
              <Button variant="ghost" onClick={() => {
                setShowWeeklyOff(false);
                setWeeklyOffData(null);
              }}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
