import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, Building2, Briefcase, AlertCircle } from 'lucide-react';
import { api } from '../../lib/apiClient';
import { useMonth } from '../../contexts/MonthContext';
import type { DashboardSummary } from '../../types/api';
import { useState } from 'react';

function StatCard({ icon: Icon, label, value, loading, link }: { 
  icon: typeof Users; 
  label: string; 
  value: number | string; 
  loading?: boolean;
  link?: string;
}) {
  const content = (
    <div className="bg-white rounded-xl p-6 border border-card-border">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-primary/10 rounded-lg">
            <Icon size={24} className="text-primary" />
          </div>
          <div>
            <p className="text-sm text-text-secondary">{label}</p>
            {loading ? (
              <div className="h-8 w-16 bg-gray-200 animate-pulse rounded mt-1"></div>
            ) : (
              <p className="text-3xl font-bold text-text-primary mt-1">{value}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return link ? <a href={link}>{content}</a> : content;
}

export default function Dashboard() {
  const { month, year } = useMonth();
  const queryClient = useQueryClient();
  const [errorMessage, setErrorMessage] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard-summary', month, year],
    queryFn: async () => {
      const res = await api.get<DashboardSummary>(`/dashboard/summary?month=${month}&year=${year}`);
      return res.data;
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
    },
    onError: (error: Error) => {
      setErrorMessage(error.message || 'Failed to generate roster');
    },
  });

  const statusShort: Record<string, string> = {
    WORKING: 'W',
    WEEKLY_OFF: 'O',
    LEAVE: 'L',
    HOLIDAY: 'H',
    COMP_OFF: 'C',
  };

  const statusColors: Record<string, string> = {
    WORKING: 'bg-green-100 text-green-800',
    WEEKLY_OFF: 'bg-blue-100 text-blue-800',
    LEAVE: 'bg-yellow-100 text-yellow-800',
    HOLIDAY: 'bg-purple-100 text-purple-800',
    COMP_OFF: 'bg-orange-100 text-orange-800',
  };

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-md p-4 text-red-800">
          Error loading dashboard: {(error as Error).message}
        </div>
      </div>
    );
  }

  const hasRoster = data && data.preview.length > 0;

  return (
    <div className="p-6 space-y-6">
      {errorMessage && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3 text-sm text-red-800">
          {errorMessage}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={Users}
          label="Total Employees"
          value={data?.totalEmployees ?? 0}
          loading={isLoading}
        />
        <StatCard
          icon={Building2}
          label="Brands"
          value={data?.totalBrands ?? 0}
          loading={isLoading}
        />
        <StatCard
          icon={Briefcase}
          label="Processes"
          value={data?.totalProcesses ?? 0}
          loading={isLoading}
        />
        <StatCard
          icon={AlertCircle}
          label="Open Conflicts"
          value={data?.openConflicts ?? 0}
          loading={isLoading}
          link="/conflicts"
        />
      </div>

      {!hasRoster && !isLoading && (
        <div className="bg-white rounded-xl p-12 border border-card-border text-center">
          <h3 className="text-lg font-semibold text-text-primary mb-2">No Roster Generated</h3>
          <p className="text-text-secondary mb-4">Generate a roster for {new Date(year, month - 1).toLocaleString('default', { month: 'long', year: 'numeric' })} to view the dashboard.</p>
          <button
            onClick={() => generateMutation.mutate()}
            disabled={generateMutation.isPending}
            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 disabled:opacity-50"
          >
            {generateMutation.isPending ? 'Generating...' : 'Generate Roster'}
          </button>
        </div>
      )}

      {hasRoster && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl p-6 border border-card-border">
              <h2 className="text-lg font-semibold text-text-primary mb-4">Roster Coverage</h2>
              <div className="flex flex-col items-center">
                <div className="relative w-32 h-32">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="64" cy="64" r="56" stroke="#E3E8F0" strokeWidth="12" fill="none" />
                    <circle
                      cx="64" cy="64" r="56" stroke="#2F6DB5" strokeWidth="12" fill="none"
                      strokeDasharray={`${2 * Math.PI * 56}`}
                      strokeDashoffset={`${2 * Math.PI * 56 * (1 - (data?.coverage.percentage ?? 0) / 100)}`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-bold text-text-primary">{data?.coverage.percentage ?? 0}%</span>
                  </div>
                </div>
                <div className="mt-4 space-y-2 text-sm w-full">
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Covered</span>
                    <span className="font-medium">{data?.coverage.covered ?? 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Off / Leave</span>
                    <span className="font-medium">{data?.coverage.offLeave ?? 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Uncovered</span>
                    <span className="font-medium">{data?.coverage.uncovered ?? 0}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 border border-card-border">
              <h2 className="text-lg font-semibold text-text-primary mb-4">
                Today's Overview
                {data?.todayOverview && <span className="text-sm font-normal text-text-secondary ml-2">{new Date(data.todayOverview.date).toLocaleDateString()}</span>}
              </h2>
              {data?.todayOverview ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between py-2 border-b border-card-border">
                    <span className="text-sm text-text-secondary">Working</span>
                    <span className="font-medium">{data.todayOverview.working}</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-card-border">
                    <span className="text-sm text-text-secondary">On Leave</span>
                    <span className="font-medium">{data.todayOverview.onLeave}</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-card-border">
                    <span className="text-sm text-text-secondary">Weekly Off</span>
                    <span className="font-medium">{data.todayOverview.weeklyOff}</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-card-border">
                    <span className="text-sm text-text-secondary">Holiday</span>
                    <span className="font-medium">{data.todayOverview.holiday}</span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm text-text-secondary">Coverage Gaps</span>
                    <span className="font-medium">{data.todayOverview.coverageGaps}</span>
                  </div>
                </div>
              ) : (
                <div className="text-center text-text-secondary py-8">No data available</div>
              )}
            </div>

            <div className="bg-white rounded-xl p-6 border border-card-border">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-text-primary">Brand Coverage</h2>
                <a href="/reports" className="text-sm text-primary hover:underline">View All</a>
              </div>
              {data?.brandCoverage && data.brandCoverage.length > 0 ? (
                <div className="space-y-3">
                  {data.brandCoverage.slice(0, 5).map((brand, idx) => (
                    <div key={idx}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-text-secondary truncate">{brand.brandName}</span>
                        <span className={`font-medium ${brand.percentage < 90 ? 'text-red-600' : brand.percentage < 95 ? 'text-amber-600' : 'text-green-600'}`}>
                          {brand.percentage}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${brand.percentage < 90 ? 'bg-red-500' : brand.percentage < 95 ? 'bg-amber-500' : 'bg-green-500'}`}
                          style={{ width: `${brand.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-text-secondary py-8">No brand coverage data</div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-card-border">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-text-primary">Monthly Roster Preview</h2>
              <span className="text-sm text-text-secondary">{new Date(year, month - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}</span>
            </div>
            {data?.preview && data.preview.length > 0 ? (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-2 text-text-secondary font-medium">Employee</th>
                        <th className="text-left py-2 px-2 text-text-secondary font-medium">Pod</th>
                        {Array.from({ length: 15 }, (_, i) => i + 1).map((day) => (
                          <th key={day} className="text-center py-2 px-1 text-text-secondary font-medium">{day}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {data.preview.map((emp) => (
                        <tr key={emp.employeeId} className="border-b">
                          <td className="py-2 px-2 font-medium">{emp.employeeName}</td>
                          <td className="py-2 px-2 text-text-secondary text-xs">{emp.podName}</td>
                          {Array.from({ length: 15 }, (_, i) => i + 1).map((day) => {
                            const status = emp.statuses[day] || 'WEEKLY_OFF';
                            return (
                              <td key={day} className="text-center py-2 px-1">
                                <span className={`inline-block px-1 py-0.5 rounded text-xs font-medium ${statusColors[status]}`}>
                                  {statusShort[status]}
                                </span>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-4 text-center">
                  <a href="/roster" className="text-sm text-primary hover:underline">Open full roster</a>
                </div>
              </>
            ) : (
              <div className="text-center text-text-secondary py-12">No preview data available</div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
