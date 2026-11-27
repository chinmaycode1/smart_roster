import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/apiClient';
import { Button } from '../../components/ui/Button';

interface Brand {
  id: string;
  name: string;
  code: string;
  _count: { brandProcesses: number };
}

export function BrandsPage() {
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', code: '' });

  const { data: brands, isLoading } = useQuery({
    queryKey: ['brands'],
    queryFn: async () => {
      const res = await api.get<Brand[]>('/brands');
      return res.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: { name: string; code: string }) => {
      await api.post('/brands', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brands'] });
      setIsCreating(false);
      setFormData({ name: '', code: '' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { name: string; code: string } }) => {
      await api.put(`/brands/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brands'] });
      setEditingId(null);
      setFormData({ name: '', code: '' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/brands/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brands'] });
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

  const handleEdit = (brand: Brand) => {
    setEditingId(brand.id);
    setFormData({ name: brand.name, code: brand.code });
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
        <h1 className="text-2xl font-semibold text-gray-900">Brands</h1>
        {!isCreating && (
          <Button onClick={() => setIsCreating(true)}>Create Brand</Button>
        )}
      </div>

      {isCreating && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-medium mb-4">{editingId ? 'Edit Brand' : 'New Brand'}</h2>
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
        ) : !brands || brands.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No brands found</div>
        ) : (
          <table className="w-full">
          <thead className="border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Processes</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {brands.map((brand) => (
              <tr key={brand.id}>
                <td className="px-6 py-4 text-sm text-gray-900">{brand.code}</td>
                <td className="px-6 py-4 text-sm text-gray-900">{brand.name}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{brand._count.brandProcesses}</td>
                <td className="px-6 py-4 text-right text-sm space-x-2">
                  <button
                    onClick={() => handleEdit(brand)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('Delete this brand?')) {
                        deleteMutation.mutate(brand.id);
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
