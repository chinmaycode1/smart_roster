import { useQuery } from '@tanstack/react-query';
import { Users, Building2, Briefcase, AlertCircle } from 'lucide-react';
import { fetchDashboardSummary } from '../../lib/apiClient';
import { Badge } from '../../components/ui/Badge';

function StatCard({ icon: Icon, label, value, loading }: { icon: typeof Users; label: string; value: number | string; loading?: boolean }) {
  return (
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
}

export default function Dashboard() {
  const month = 12;
  const year = 2026;

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-summary', month, year],
    queryFn: () => fetchDashboardSummary(month, year),
  });

  return (
    <div className="p-6 space-y-6">
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
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-6 border border-card-border">
          <h2 className="text-lg font-semibold text-text-primary mb-4">Roster Coverage</h2>
          {isLoading ? (
            <div className="h-48 flex items-center justify-center">
              <div className="text-text-secondary">Loading...</div>
            </div>
          ) : data?.coverageData ? (
            <div className="flex flex-col items-center">
              <div className="relative w-32 h-32">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="#E3E8F0"
                    strokeWidth="12"
                    fill="none"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="#2F6DB5"
                    strokeWidth="12"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 56}`}
                    strokeDashoffset={`${2 * Math.PI * 56 * (1 - data.coverageData.percentage / 100)}`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-bold text-text-primary">
                    {data.coverageData.percentage}%
                  </span>
                </div>
              </div>
              <p className="text-sm text-text-secondary mt-4">
                {data.coverageData.working} working days out of {data.coverageData.totalDays}
              </p>
            </div>
          ) : (
            <div className="text-center text-text-secondary py-8">No roster data available</div>
          )}
        </div>

        <div className="lg:col-span-2 bg-white rounded-xl p-6 border border-card-border">
          <h2 className="text-lg font-semibold text-text-primary mb-4">Today's Overview</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-3 border-b border-card-border">
              <span className="text-sm text-text-secondary">Employees Working</span>
              <Badge variant="working">24</Badge>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-card-border">
              <span className="text-sm text-text-secondary">On Leave</span>
              <Badge variant="leave">3</Badge>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-card-border">
              <span className="text-sm text-text-secondary">Weekly Off</span>
              <Badge variant="weekly-off">5</Badge>
            </div>
            <div className="flex items-center justify-between py-3">
              <span className="text-sm text-text-secondary">Coverage Gaps</span>
              <Badge variant="error">0</Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 border border-card-border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-text-primary">Monthly Roster Preview</h2>
          <span className="text-sm text-text-secondary">December 2026</span>
        </div>
        <div className="text-center text-text-secondary py-12">
          Roster grid will be shown here once generated
        </div>
      </div>
    </div>
  );
}
