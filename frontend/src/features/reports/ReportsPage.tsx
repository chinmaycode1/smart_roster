import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { Button } from '../../components/ui/Button';

interface FairnessMetric {
  employeeId: string;
  employeeName: string;
  totalWorkingDays: number;
  weekendDays: number;
  holidayDays: number;
  fairnessScore: number;
}

interface CoverageMetric {
  brand: string;
  process: string;
  totalWorkingDays: number;
  averageCoverage: number;
}

export function ReportsPage() {
  const [rosterId, setRosterId] = useState('');
  const [reportType, setReportType] = useState<'fairness' | 'coverage'>('fairness');

  const { data: fairnessReport } = useQuery<{ metrics: FairnessMetric[]; imbalanceLevel: string; recommendations: string[] }>({
    queryKey: ['fairness-report', rosterId],
    queryFn: async () => {
      const res = await api.get(`/reports/fairness/${rosterId}`);
      return res.data;
    },
    enabled: !!rosterId && reportType === 'fairness',
  });

  const { data: coverageReport } = useQuery<CoverageMetric[]>({
    queryKey: ['coverage-report', rosterId],
    queryFn: async () => {
      const res = await api.get(`/reports/coverage/${rosterId}`);
      return res.data;
    },
    enabled: !!rosterId && reportType === 'coverage',
  });

  const handleExport = async () => {
    if (!rosterId) return;
    window.open(`${api.defaults.baseURL}/reports/export/${rosterId}`, '_blank');
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Reports</h1>

      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <div className="flex gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Roster ID</label>
            <input
              type="text"
              value={rosterId}
              onChange={(e) => setRosterId(e.target.value)}
              placeholder="Enter roster ID"
              className="px-3 py-2 border border-gray-300 rounded-md w-80"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Report Type</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="fairness">Fairness</option>
              <option value="coverage">Coverage</option>
            </select>
          </div>
          <Button onClick={handleExport}>Export CSV</Button>
        </div>
      </div>

      {reportType === 'fairness' && fairnessReport && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold mb-4">Imbalance Level: {fairnessReport.imbalanceLevel}</h2>
            {fairnessReport.recommendations.length > 0 && (
              <div className="mb-4">
                <h3 className="font-medium mb-2">Recommendations:</h3>
                <ul className="list-disc list-inside space-y-1">
                  {fairnessReport.recommendations.map((rec, idx) => (
                    <li key={idx} className="text-sm text-gray-700">{rec}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg border border-gray-200">
            <table className="w-full">
              <thead className="border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Working Days</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Weekend Days</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Holiday Days</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Fairness Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {fairnessReport.metrics.map((metric) => (
                  <tr key={metric.employeeId}>
                    <td className="px-6 py-4 text-sm text-gray-900">{metric.employeeName}</td>
                    <td className="px-6 py-4 text-sm text-gray-500 text-right">{metric.totalWorkingDays}</td>
                    <td className="px-6 py-4 text-sm text-gray-500 text-right">{metric.weekendDays}</td>
                    <td className="px-6 py-4 text-sm text-gray-500 text-right">{metric.holidayDays}</td>
                    <td className="px-6 py-4 text-sm text-gray-900 text-right font-medium">{metric.fairnessScore}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {reportType === 'coverage' && coverageReport && (
        <div className="bg-white rounded-lg border border-gray-200">
          <table className="w-full">
            <thead className="border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Brand</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Process</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Working Days</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Avg Coverage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {coverageReport.map((metric, idx) => (
                <tr key={idx}>
                  <td className="px-6 py-4 text-sm text-gray-900">{metric.brand}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{metric.process}</td>
                  <td className="px-6 py-4 text-sm text-gray-500 text-right">{metric.totalWorkingDays}</td>
                  <td className="px-6 py-4 text-sm text-gray-900 text-right">{metric.averageCoverage.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
