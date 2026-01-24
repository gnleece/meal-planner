'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { Meal, Category, getCategoryColorClasses } from '@/lib/types';
import { MealGrid } from '@/components/MealGrid';
import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Navigation } from '@/components/Navigation';

export default function CandidatesPage() {
  const router = useRouter();
  const supabase = createClient();
  const queryClient = useQueryClient();

  // Check authentication
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.push('/auth/login');
      }
    });
  }, [router, supabase]);

  // Fetch all meals and filter for candidates
  const { data: allMeals = [], isLoading: mealsLoading } = useQuery<Meal[]>({
    queryKey: ['meals'],
    queryFn: async () => {
      const response = await fetch('/api/meals');
      if (!response.ok) {
        throw new Error('Failed to fetch meals');
      }
      return response.json();
    },
  });

  // Fetch categories for color display
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await fetch('/api/categories');
      if (!response.ok) {
        throw new Error('Failed to fetch categories');
      }
      return response.json();
    },
  });

  // Filter to only show candidates
  const candidateMeals = allMeals.filter(meal => meal.isCandidate);

  // Group candidates by category, ordered by category displayOrder
  const groupedCandidates = useMemo(() => {
    // Create a map of category name to displayOrder
    const categoryOrderMap = new Map<string, number>();
    categories.forEach(cat => {
      categoryOrderMap.set(cat.name, cat.displayOrder);
    });

    // Group meals by category
    const groups = new Map<string, Meal[]>();
    const uncategorized: Meal[] = [];

    candidateMeals.forEach(meal => {
      if (meal.category) {
        const existing = groups.get(meal.category) || [];
        existing.push(meal);
        groups.set(meal.category, existing);
      } else {
        uncategorized.push(meal);
      }
    });

    // Sort groups by category displayOrder
    const sortedGroups = Array.from(groups.entries()).sort((a, b) => {
      const orderA = categoryOrderMap.get(a[0]) ?? Number.MAX_SAFE_INTEGER;
      const orderB = categoryOrderMap.get(b[0]) ?? Number.MAX_SAFE_INTEGER;
      return orderA - orderB;
    });

    // Add uncategorized at the end if there are any
    if (uncategorized.length > 0) {
      sortedGroups.push(['Uncategorized', uncategorized]);
    }

    return sortedGroups;
  }, [candidateMeals, categories]);

  // Fetch current selection
  const { data: selection } = useQuery<{ selectedMeals: string[] }>({
    queryKey: ['selection'],
    queryFn: async () => {
      const response = await fetch('/api/selection');
      if (!response.ok) {
        throw new Error('Failed to fetch selection');
      }
      return response.json();
    },
  });

  // Toggle meal selection mutation with optimistic update
  const toggleSelectionMutation = useMutation({
    mutationFn: async ({ mealId, isSelected, updatedMealIds }: { mealId: string; isSelected: boolean; updatedMealIds: string[] }) => {
      const response = await fetch('/api/selection', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          selectedMeals: updatedMealIds,
        }),
      });
      if (!response.ok) {
        throw new Error('Failed to update selection');
      }
      return response.json();
    },
    onMutate: async ({ updatedMealIds }) => {
      await queryClient.cancelQueries({ queryKey: ['selection'] });

      const previousSelection = queryClient.getQueryData<{ selectedMeals: string[] }>(['selection']);

      queryClient.setQueryData<{ selectedMeals: string[] }>(['selection'], { selectedMeals: updatedMealIds });

      return { previousSelection };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousSelection) {
        queryClient.setQueryData(['selection'], context.previousSelection);
      }
    },
  });

  // Clear all selected meals mutation with optimistic update
  const clearSelectionMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/selection', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          selectedMeals: [],
        }),
      });
      if (!response.ok) {
        throw new Error('Failed to clear selection');
      }
      return response.json();
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['selection'] });

      const previousSelection = queryClient.getQueryData<{ selectedMeals: string[] }>(['selection']);

      queryClient.setQueryData<{ selectedMeals: string[] }>(['selection'], { selectedMeals: [] });

      return { previousSelection };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousSelection) {
        queryClient.setQueryData(['selection'], context.previousSelection);
      }
    },
  });

  // Remove from candidates mutation with optimistic update
  const removeCandidateMutation = useMutation({
    mutationFn: async (mealId: string) => {
      const response = await fetch(`/api/candidates?mealId=${mealId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to remove candidate');
      }
      return { mealId };
    },
    onMutate: async (mealId) => {
      await queryClient.cancelQueries({ queryKey: ['meals'] });
      const previousMeals = queryClient.getQueryData<Meal[]>(['meals']);

      queryClient.setQueryData<Meal[]>(['meals'], (old) =>
        old?.map((meal) =>
          meal.id === mealId ? { ...meal, isCandidate: false } : meal
        )
      );

      return { previousMeals };
    },
    onError: (_err, _mealId, context) => {
      if (context?.previousMeals) {
        queryClient.setQueryData(['meals'], context.previousMeals);
      }
    },
  });

  const handleSelectMeal = (mealId: string, selected: boolean) => {
    const existingMealIds = selection?.selectedMeals || [];
    const isCurrentlySelected = existingMealIds.includes(mealId);

    const shouldBeSelected = selected;
    const needsChange = isCurrentlySelected !== shouldBeSelected;

    if (needsChange) {
      const updatedMealIds = isCurrentlySelected
        ? existingMealIds.filter(id => id !== mealId)
        : Array.from(new Set([...existingMealIds, mealId]));

      toggleSelectionMutation.mutate({
        mealId,
        isSelected: isCurrentlySelected,
        updatedMealIds,
      });
    }
  };

  const handleRemoveFromCandidates = (mealId: string) => {
    if (confirm('Remove this meal from candidates?')) {
      removeCandidateMutation.mutate(mealId);
    }
  };

  if (mealsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-aubergine-700 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading candidates...</p>
        </div>
      </div>
    );
  }

  const selectedMealIds = selection?.selectedMeals || [];
  const selectedMeals = allMeals.filter(meal => selectedMealIds.includes(meal.id));

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Currently Selected */}
        <div className="mb-6 space-y-4">
          <div className="bg-aubergine-50 border border-aubergine-200 rounded-md p-4">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h2 className="text-lg font-semibold text-aubergine-900 mb-2">
                  Currently Selected
                </h2>
                <p className="text-sm text-aubergine-700 mb-2">
                  {selectedMeals.length} meal{selectedMeals.length !== 1 ? 's' : ''} selected
                </p>
                {selectedMeals.length > 0 && (
                  <div className="mt-2">
                    <ul className="text-sm text-aubergine-600 list-disc list-inside space-y-1">
                      {selectedMeals.map((meal) => (
                        <li key={meal.id}>{meal.name}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              {selectedMeals.length > 0 && (
                <button
                  onClick={() => {
                    if (confirm('Clear all selected meals?')) {
                      clearSelectionMutation.mutate();
                    }
                  }}
                  disabled={clearSelectionMutation.isPending}
                  className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 text-sm whitespace-nowrap"
                >
                  {clearSelectionMutation.isPending ? 'Clearing...' : 'Clear All'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Candidates Grid */}
        {candidateMeals.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg mb-4">No candidates yet.</p>
            <p className="text-gray-500 mb-4">
              Browse your meals and add them to candidates to get started.
            </p>
            <Link
              href="/meals"
              className="text-aubergine-400 hover:text-aubergine-600 font-medium"
            >
              Browse All Meals →
            </Link>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                {candidateMeals.length} Candidate{candidateMeals.length !== 1 ? 's' : ''}
              </h2>
            </div>
            <div className="space-y-8">
              {groupedCandidates.map(([categoryName, meals]) => {
                const category = categories.find(c => c.name === categoryName);
                const colorClasses = category
                  ? getCategoryColorClasses(category.color)
                  : getCategoryColorClasses('gray');

                return (
                  <div key={categoryName}>
                    <div className="flex items-center gap-2 mb-4">
                      <h3 className={`px-3 py-1 rounded-md text-sm font-semibold ${colorClasses.bg} ${colorClasses.text}`}>
                        {categoryName}
                      </h3>
                      <span className="text-sm text-gray-500">
                        ({meals.length} meal{meals.length !== 1 ? 's' : ''})
                      </span>
                    </div>
                    <MealGrid
                      meals={meals}
                      selectedMealIds={new Set(selectedMealIds)}
                      onSelectMeal={handleSelectMeal}
                      categories={categories}
                      hideCandidateBadge
                    />
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
