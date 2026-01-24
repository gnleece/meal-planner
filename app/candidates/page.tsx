'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { Meal, Week, Category, getCategoryColorClasses } from '@/lib/types';
import { MealGrid } from '@/components/MealGrid';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getWeekId, formatWeekId, getWeekDates } from '@/lib/weekUtils';
import { Navigation } from '@/components/Navigation';

export default function CandidatesPage() {
  const router = useRouter();
  const supabase = createClient();
  const queryClient = useQueryClient();
  const currentWeekId = getWeekId();
  const [selectedWeekId, setSelectedWeekId] = useState(currentWeekId);

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

  // Fetch or create selected week
  const { data: selectedWeek } = useQuery<Week>({
    queryKey: ['weeks', selectedWeekId],
    queryFn: async () => {
      const response = await fetch(`/api/weeks/${selectedWeekId}`);
      if (response.status === 404) {
        // Week doesn't exist, create it
        const { startDate, endDate } = getWeekDates(selectedWeekId);
        const createResponse = await fetch('/api/weeks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: selectedWeekId,
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            selectedMeals: [],
          }),
        });
        if (!createResponse.ok) {
          throw new Error('Failed to create week');
        }
        return createResponse.json();
      }
      if (!response.ok) {
        throw new Error('Failed to fetch week');
      }
      return response.json();
    },
  });

  // Toggle meal assignment to selected week mutation with optimistic update
  const toggleWeekAssignmentMutation = useMutation({
    mutationFn: async ({ mealId, isAssigned, updatedMealIds }: { mealId: string; isAssigned: boolean; updatedMealIds: string[] }) => {
      const response = await fetch(`/api/weeks/${selectedWeekId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          selectedMeals: updatedMealIds,
        }),
      });
      if (!response.ok) {
        throw new Error('Failed to update week assignment');
      }
      return response.json();
    },
    onMutate: async ({ mealId, isAssigned, updatedMealIds }) => {
      await queryClient.cancelQueries({ queryKey: ['weeks', selectedWeekId] });

      const previousWeek = queryClient.getQueryData<Week>(['weeks', selectedWeekId]);

      // Optimistically update the week's selectedMeals
      queryClient.setQueryData<Week>(['weeks', selectedWeekId], (old) =>
        old ? { ...old, selectedMeals: updatedMealIds } : old
      );

      return { previousWeek };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousWeek) {
        queryClient.setQueryData(['weeks', selectedWeekId], context.previousWeek);
      }
    },
  });

  // Clear all meals from selected week mutation with optimistic update
  const clearWeekMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/weeks/${selectedWeekId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          selectedMeals: [],
        }),
      });
      if (!response.ok) {
        throw new Error('Failed to clear week');
      }
      return response.json();
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['weeks', selectedWeekId] });

      const previousWeek = queryClient.getQueryData<Week>(['weeks', selectedWeekId]);

      queryClient.setQueryData<Week>(['weeks', selectedWeekId], (old) =>
        old ? { ...old, selectedMeals: [] } : old
      );

      return { previousWeek };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousWeek) {
        queryClient.setQueryData(['weeks', selectedWeekId], context.previousWeek);
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
    const existingMealIds = selectedWeek?.selectedMeals || [];
    const isCurrentlyAssigned = existingMealIds.includes(mealId);

    // Toggle assignment: if selected is true, we want to assign it (if not already assigned)
    // if selected is false, we want to remove it (if currently assigned)
    const shouldBeAssigned = selected;
    const needsChange = isCurrentlyAssigned !== shouldBeAssigned;

    if (needsChange) {
      const updatedMealIds = isCurrentlyAssigned
        ? existingMealIds.filter(id => id !== mealId)
        : Array.from(new Set([...existingMealIds, mealId]));

      toggleWeekAssignmentMutation.mutate({
        mealId,
        isAssigned: isCurrentlyAssigned,
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading candidates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Week Selector */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Week
          </label>
          <div className="flex gap-2 flex-wrap">
            {(() => {
              const weeksToShow = [];
              const today = new Date();
              for (let i = 0; i < 4; i++) {
                const date = new Date(today);
                date.setDate(date.getDate() + i * 7);
                weeksToShow.push(getWeekId(date));
              }
              return weeksToShow.map((weekId) => {
                const isCurrent = weekId === currentWeekId;
                return (
                  <button
                    key={weekId}
                    onClick={() => setSelectedWeekId(weekId)}
                    className={`px-4 py-2 rounded-md border transition-colors ${
                      selectedWeekId === weekId
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                        : 'border-gray-300 hover:border-gray-400'
                    } ${isCurrent ? 'font-semibold' : ''}`}
                  >
                    {formatWeekId(weekId)}
                    {isCurrent && ' (Current)'}
                  </button>
                );
              });
            })()}
          </div>
        </div>

        {/* Info */}
        <div className="mb-6 space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h2 className="text-lg font-semibold text-blue-900 mb-2">
                  {formatWeekId(selectedWeekId)}
                </h2>
                {(() => {
                  const assignedMealIds = selectedWeek?.selectedMeals || [];
                  const assignedMeals = allMeals.filter(meal => assignedMealIds.includes(meal.id));
                  
                  return (
                    <div>
                      <p className="text-sm text-blue-800 mb-2">
                        {assignedMeals.length} meal{assignedMeals.length !== 1 ? 's' : ''} assigned to this week
                      </p>
                      {assignedMeals.length > 0 && (
                        <div className="mt-2">
                          <ul className="text-sm text-blue-700 list-disc list-inside space-y-1">
                            {assignedMeals.map((meal) => (
                              <li key={meal.id}>{meal.name}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
              {selectedWeek && selectedWeek.selectedMeals.length > 0 && (
                <button
                  onClick={() => {
                    if (confirm('Clear all meals from this week?')) {
                      clearWeekMutation.mutate();
                    }
                  }}
                  disabled={clearWeekMutation.isPending}
                  className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 text-sm whitespace-nowrap"
                >
                  {clearWeekMutation.isPending ? 'Clearing...' : 'Clear All'}
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
              className="text-indigo-600 hover:text-indigo-700 font-medium"
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
                      selectedMealIds={new Set(selectedWeek?.selectedMeals || [])}
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
