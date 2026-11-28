import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/apiClient';
import { Button } from '../../components/ui/Button';

interface OperatingRule {
  id: string;
  name: string;
  type: string;
  workingWeekdays: number[];
  worksOnHolidays: boolean;
}

export function WorkingRulesPage() {
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'ALL_365',
    workingWeekdays: [] as number[],
    worksOnHolidays: false,
  });
  const [errorMessage, setErrorMessage] = useState('');

  const { data: rules, isLoading } = useQuery({
    queryKey: ['operating-rules'],
    queryFn: async () => {
      const res = await api.get<OperatingRule[]>('/operating-rules');
      return Array.isArray(res.data) ? res.data : [];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      await api.post('/operating-rules', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['operating-rules'] });
      setIsCreating(false);
      setFormData({ name: '', type: 'ALL_365', workingWeekdays: [], worksOnHolidays: false });
      setErrorMessage('');
    },
    onError: (error: Error) => {
      setErrorMessage(error.message || 'Failed to create rule');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      await api.put(`/operating-rules/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['operating-rules'] });
      setEditingId(null);
      setFormData({ name: '', type: 'ALL_365', workingWeekdays: [], worksOnHolidays: false });
      setErrorMessage('');
    },
    onError: (error: Error) => {
      setErrorMessage(error.message || 'Failed to update rule');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/operating-rules/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['operating-rules'] });
      setErrorMessage('');
    },
    onError: (error: Error) => {
      setErrorMessage(error.message || 'Failed to delete rule');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (rule: OperatingRule) => {
    setEditingId(rule.id);
    setFormData({
      name: rule.name,
      type: rule.type,
      workingWeekdays: rule.workingWeekdays,
      worksOnHolidays: rule.worksOnHolidays,
    });
    setIsCreating(true);
  };

  const handleCancel = () => {
    setIsCreating(false);
    setEditingId(null);
    setFormData({ name: '', type: 'ALL_365', workingWeekdays: [], worksOnHolidays: false });
  };

  const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Working Rules</h1>
        {!isCreating && <Button onClick={() => setIsCreating(true)}>Create Rule</Button>}
      </div>

      {errorMessage && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-800">
          {errorMessage}
        </div>
      )}

      {isCreating && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-medium mb-4">{editingId ? 'Edit Rule' : 'New Rule'}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="ALL_365">All Days (365)</option>
                <option value="DAILY_EXCEPT_HOLIDAYS">Daily Except Holidays</option>
                <option value="EXCEPT_SUNDAYS_AND_HOLIDAYS">Except Sundays and Holidays</option>
                <option value="CUSTOM_WEEKDAYS">Custom Weekdays</option>
              </select>
            </div>
            {formData.type === 'CUSTOM_WEEKDAYS' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Working Weekdays</label>
                <div className="space-y-2">
                  {weekdays.map((day, idx) => (
                    <label key={idx} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.workingWeekdays.includes(idx)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({ ...formData, workingWeekdays: [...formData.workingWeekdays, idx] });
                          } else {
                            setFormData({ ...formData, workingWeekdays: formData.workingWeekdays.filter((d) => d !== idx) });
                          }
                        }}
                        className="mr-2"
                      />
                      {day}
                    </label>
                  ))}
                </div>
              </div>
            )}
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.worksOnHolidays}
                  onChange={(e) => setFormData({ ...formData, worksOnHolidays: e.target.checked })}
                  className="mr-2"
                />
                Works on Holidays
              </label>
            </div>
            <div className="flex gap-2">
              <Button type="submit">{editingId ? 'Update' : 'Create'}</Button>
              <Button type="button" variant="ghost" onClick={handleCancel}>Cancel</Button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg border border-gray-200">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : !rules || rules.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No rules found</div>
        ) : (
          <table className="w-full">
            <thead className="border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Holidays</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {rules.map((rule) => (
                <tr key={rule.id}>
                  <td className="px-6 py-4 text-sm text-gray-900">{rule.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{rule.type}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{rule.worksOnHolidays ? 'Yes' : 'No'}</td>
                  <td className="px-6 py-4 text-right text-sm space-x-2">
                    <button onClick={() => handleEdit(rule)} className="text-blue-600 hover:text-blue-800">Edit</button>
                    <button
                      onClick={() => {
                        if (confirm('Delete this rule?')) {
                          deleteMutation.mutate(rule.id);
                        }
                      }}
                      className="text-red-600 hover:text-red-800"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
