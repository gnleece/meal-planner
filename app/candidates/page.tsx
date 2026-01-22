'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { Meal, Week, Category } from '@/lib/types';
import { MealGrid } from '@/components/MealGrid';
import { useState, useEffect } from 'react';
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

  // Toggle meal assignment to selected week mutation
  const toggleWeekAssignmentMutation = useMutation({
    mutationFn: async ({ mealId, isAssigned }: { mealId: string; isAssigned: boolean }) => {
      // Get fresh selected week data from cache to avoid stale data
      const cachedWeek = queryClient.getQueryData<Week>(['weeks', selectedWeekId]);
      const existingMealIds = cachedWeek?.selectedMeals || [];
      
      let updatedMealIds: string[];
      if (isAssigned) {
        // Remove meal from week
        updatedMealIds = existingMealIds.filter(id => id !== mealId);
      } else {
        // Add meal to week
        updatedMealIds = Array.from(new Set([...existingMealIds, mealId]));
      }
      
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
      const updatedWeek = await response.json();
      
      // Update the cache immediately with the response
      queryClient.setQueryData(['weeks', selectedWeekId], updatedWeek);
      
      return updatedWeek;
    },
    onSuccess: () => {
      // Invalidate queries to ensure all components have fresh data
      queryClient.invalidateQueries({ queryKey: ['weeks', selectedWeekId] });
      queryClient.invalidateQueries({ queryKey: ['weeks'] });
    },
  });

  // Clear all meals from selected week mutation
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
      const updatedWeek = await response.json();
      
      // Update the cache immediately with the response
      queryClient.setQueryData(['weeks', selectedWeekId], updatedWeek);
      
      return updatedWeek;
    },
    onSuccess: () => {
      // Invalidate queries to ensure all components have fresh data
      queryClient.invalidateQueries({ queryKey: ['weeks', selectedWeekId] });
      queryClient.invalidateQueries({ queryKey: ['weeks'] });
    },
  });

  // Remove from candidates mutation
  const removeCandidateMutation = useMutation({
    mutationFn: async (mealId: string) => {
      const response = await fetch(`/api/candidates?mealId=${mealId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to remove candidate');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meals'] });
    },
  });

  const handleSelectMeal = (mealId: string, selected: boolean) => {
    // Check if meal is currently assigned to the selected week
    const assignedMealIds = new Set(selectedWeek?.selectedMeals || []);
    const isCurrentlyAssigned = assignedMealIds.has(mealId);
    
    // Toggle assignment: if selected is true, we want to assign it (if not already assigned)
    // if selected is false, we want to remove it (if currently assigned)
    const shouldBeAssigned = selected;
    const needsChange = isCurrentlyAssigned !== shouldBeAssigned;
    
    if (needsChange) {
      toggleWeekAssignmentMutation.mutate({ 
        mealId, 
        isAssigned: isCurrentlyAssigned 
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
            <MealGrid
              meals={candidateMeals}
              selectedMealIds={new Set(selectedWeek?.selectedMeals || [])}
              onSelectMeal={handleSelectMeal}
              categories={categories}
            />
          </div>
        )}
      </main>
    </div>
  );
}
