'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Category, CATEGORY_COLORS, getCategoryColorClasses } from '@/lib/types';
import { createClient } from '@/lib/supabase/client';
import { Navigation } from '@/components/Navigation';

export default function CategoriesPage() {
  const router = useRouter();
  const supabase = createClient();
  const queryClient = useQueryClient();
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState('gray');
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [editingColor, setEditingColor] = useState('gray');

  // Check authentication
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.push('/auth/login');
      }
    });
  }, [router, supabase]);

  // Fetch categories
  const { data: categories = [], isLoading } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await fetch('/api/categories');
      if (!response.ok) {
        throw new Error('Failed to fetch categories');
      }
      return response.json();
    },
  });

  // Create category mutation
  const createMutation = useMutation({
    mutationFn: async ({ name, color }: { name: string; color: string }) => {
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, color }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create category');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setNewCategoryName('');
      setNewCategoryColor('gray');
      setError(null);
    },
    onError: (error: Error) => {
      setError(error.message);
    },
  });

  // Delete category mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/categories/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete category');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
    onError: (error: Error) => {
      setError(error.message);
    },
  });

  // Update category mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, name, color }: { id: string; name: string; color: string }) => {
      const response = await fetch(`/api/categories/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, color }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update category');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['meals'] });
      setEditingId(null);
      setEditingName('');
      setEditingColor('gray');
      setError(null);
    },
    onError: (error: Error) => {
      setError(error.message);
    },
  });

  // Reorder categories mutation
  const reorderMutation = useMutation({
    mutationFn: async (categoryIds: string[]) => {
      const response = await fetch('/api/categories/reorder', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categoryIds }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to reorder categories');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
    onError: (error: Error) => {
      setError(error.message);
    },
  });

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newOrder = [...categories];
    [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
    reorderMutation.mutate(newOrder.map(c => c.id));
  };

  const handleMoveDown = (index: number) => {
    if (index === categories.length - 1) return;
    const newOrder = [...categories];
    [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
    reorderMutation.mutate(newOrder.map(c => c.id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newCategoryName.trim()) {
      createMutation.mutate({ name: newCategoryName.trim(), color: newCategoryColor });
    }
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete "${name}"? This will remove the category from all meals that use it.`)) {
      deleteMutation.mutate(id);
    }
  };

  const handleEditStart = (category: Category) => {
    setEditingId(category.id);
    setEditingName(category.name);
    setEditingColor(category.color || 'gray');
    setError(null);
  };

  const handleEditCancel = () => {
    setEditingId(null);
    setEditingName('');
    setEditingColor('gray');
    setError(null);
  };

  const handleEditSave = (id: string) => {
    if (editingName.trim()) {
      updateMutation.mutate({ id, name: editingName.trim(), color: editingColor });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-md p-6 md:p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Manage Categories</h1>

          {/* Add new category form */}
          <form onSubmit={handleSubmit} className="mb-8">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Add New Category
            </label>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="e.g., Breakfast, Dinner, Dessert"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900"
              />
              <button
                type="submit"
                disabled={createMutation.isPending || !newCategoryName.trim()}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {createMutation.isPending ? 'Adding...' : 'Add'}
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {CATEGORY_COLORS.map((color) => {
                const colorClasses = getCategoryColorClasses(color.value);
                return (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => setNewCategoryColor(color.value)}
                    className={`w-8 h-8 rounded-full ${colorClasses.bg} ${
                      newCategoryColor === color.value ? 'ring-2 ring-offset-2 ' + colorClasses.ring : ''
                    } hover:scale-110 transition-transform`}
                    title={color.name}
                  />
                );
              })}
            </div>
            {error && (
              <p className="mt-2 text-sm text-red-600">{error}</p>
            )}
          </form>

          {/* Categories list */}
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-4">Your Categories</h2>

            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading categories...</p>
              </div>
            ) : categories.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No categories yet. Add your first category above.
              </p>
            ) : (
              <ul className="divide-y divide-gray-200">
                {categories.map((category, index) => {
                  const colorClasses = getCategoryColorClasses(category.color);
                  return (
                    <li key={category.id} className="py-4">
                      {editingId === category.id ? (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={editingName}
                              onChange={(e) => setEditingName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleEditSave(category.id);
                                if (e.key === 'Escape') handleEditCancel();
                              }}
                              className="flex-1 px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900"
                              autoFocus
                            />
                            <button
                              onClick={() => handleEditSave(category.id)}
                              disabled={updateMutation.isPending || !editingName.trim()}
                              className="text-green-600 hover:text-green-700 text-sm disabled:opacity-50"
                            >
                              {updateMutation.isPending ? 'Saving...' : 'Save'}
                            </button>
                            <button
                              onClick={handleEditCancel}
                              disabled={updateMutation.isPending}
                              className="text-gray-600 hover:text-gray-700 text-sm disabled:opacity-50"
                            >
                              Cancel
                            </button>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {CATEGORY_COLORS.map((color) => {
                              const editColorClasses = getCategoryColorClasses(color.value);
                              return (
                                <button
                                  key={color.value}
                                  type="button"
                                  onClick={() => setEditingColor(color.value)}
                                  className={`w-6 h-6 rounded-full ${editColorClasses.bg} ${
                                    editingColor === color.value ? 'ring-2 ring-offset-1 ' + editColorClasses.ring : ''
                                  } hover:scale-110 transition-transform`}
                                  title={color.name}
                                />
                              );
                            })}
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex flex-col gap-0.5">
                              <button
                                onClick={() => handleMoveUp(index)}
                                disabled={index === 0 || reorderMutation.isPending}
                                className="text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed p-0.5"
                                title="Move up"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleMoveDown(index)}
                                disabled={index === categories.length - 1 || reorderMutation.isPending}
                                className="text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed p-0.5"
                                title="Move down"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                              </button>
                            </div>
                            <span className={`px-2.5 py-1 rounded text-sm font-medium ${colorClasses.bg} ${colorClasses.text}`}>
                              {category.name}
                            </span>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEditStart(category)}
                              className="text-indigo-600 hover:text-indigo-700 text-sm"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(category.id, category.name)}
                              disabled={deleteMutation.isPending}
                              className="text-red-600 hover:text-red-700 text-sm disabled:opacity-50"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
