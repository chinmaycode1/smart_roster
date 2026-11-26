import { useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { fetchEmployees } from '../../lib/apiClient';
import { Badge } from '../../components/ui/Badge';
import type { Employee } from '../../types/api';

export default function Employees() {
  const { data: employees, isLoading } = useQuery({
    queryKey: ['employees'],
    queryFn: fetchEmployees,
  });

  return (
    <div className="p-6 space-y-6">
      <div className="bg-white rounded-xl border border-card-border">
        <div className="p-6 border-b border-card-border">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-text-primary">Employees</h2>
              <p className="text-sm text-text-secondary mt-1">
                {employees?.length || 0} employees
              </p>
            </div>

            <div className="flex items-center space-x-3">
              <div className="relative">
                <Search
                  size={18}
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary"
                />
                <input
                  type="text"
                  placeholder="Search employees..."
                  className="pl-10 pr-4 py-2 border border-card-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-card-border">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                  Code
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                  Pod
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                  Assignments
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-card-border">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-text-secondary">
                    Loading...
                  </td>
                </tr>
              ) : employees && employees.length > 0 ? (
                employees.map((emp: Employee) => (
                  <tr key={emp.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-text-primary">
                      {emp.code}
                    </td>
                    <td className="px-6 py-4 text-sm text-text-primary">{emp.name}</td>
                    <td className="px-6 py-4 text-sm text-text-secondary">
                      {emp.pod?.name || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <Badge variant={emp.role === 'POD_LEAD' ? 'default' : 'default'}>
                        {emp.role === 'POD_LEAD' ? 'Pod Lead' : 'Employee'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <Badge variant={emp.isActive ? 'working' : 'default'}>
                        {emp.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-sm text-text-secondary">
                      {emp.assignments?.length || 0}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-text-secondary">
                    No employees found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
