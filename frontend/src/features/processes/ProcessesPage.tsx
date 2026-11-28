import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/apiClient';
import { Button } from '../../components/ui/Button';
import type { Process } from '../../types/api';

export function ProcessesPage() {
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', code: '' });
  const [errorMessage, setErrorMessage] = useState('');

  const { data: processes, isLoading } = useQuery({
    queryKey: ['processes'],
    queryFn: async () => {
      const res = await api.get<Process[] | { processes: Process[] }>('/processes');
      return Array.isArray(res.data) ? res.data : res.data?.processes ?? [];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: { name: string; code: string }) => {
      await api.post('/processes', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['processes'] });
      setIsCreating(false);
      setFormData({ name: '', code: '' });
      setErrorMessage('');
    },
    onError: (error: Error) => {
      setErrorMessage(error.message || 'Failed to create process');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { name: string; code: string } }) => {
      await api.put(`/processes/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['processes'] });
      setEditingId(null);
      setFormData({ name: '', code: '' });
      setErrorMessage('');
    },
    onError: (error: Error) => {
      setErrorMessage(error.message || 'Failed to update process');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/processes/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['processes'] });
      setErrorMessage('');
    },
    onError: (error: Error) => {
      setErrorMessage(error.message || 'Failed to delete process');
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

  const handleEdit = (process: Process) => {
    setEditingId(process.id);
    setFormData({ name: process.name, code: process.code });
    setIsCreating(true);
  };

  const handleCancel = () => {
    setIsCreating(false);
    setEditingId(null);
    setFormData({ name: '', code: '' });
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Processes</h1>
        {!isCreating && (
          <Button onClick={() => setIsCreating(true)}>Create Process</Button>
        )}
      </div>

      {errorMessage && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-800">
          {errorMessage}
        </div>
      )}

      {isCreating && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-medium mb-4">{editingId ? 'Edit Process' : 'New Process'}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Code
              </label>
              <input
                type="text"
                required
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit">{editingId ? 'Update' : 'Create'}</Button>
              <Button type="button" variant="ghost" onClick={handleCancel}>
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg border border-gray-200">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : !processes || processes.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No processes found</div>
        ) : (
          <table className="w-full">
          <thead className="border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Brands</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {processes.map((process) => (
              <tr key={process.id}>
                <td className="px-6 py-4 text-sm text-gray-900">{process.code}</td>
                <td className="px-6 py-4 text-sm text-gray-900">{process.name}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{process._count?.brandProcesses || 0}</td>
                <td className="px-6 py-4 text-right text-sm space-x-2">
                  <button
                    onClick={() => handleEdit(process)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('Delete this process?')) {
                        deleteMutation.mutate(process.id);
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
