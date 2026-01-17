'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { Meal, Week } from '@/lib/types';
import { MealGrid } from '@/components/MealGrid';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getWeekId, formatWeekId, getWeekDates } from '@/lib/weekUtils';

export default function CandidatesPage() {
  const router = useRouter();
  const supabase = createClient();
  const queryClient = useQueryClient();
  const currentWeekId = getWeekId();
  const [selectedMealIds, setSelectedMealIds] = useState<Set<string>>(new Set());

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

  // Filter to only show candidates
  const candidateMeals = allMeals.filter(meal => meal.isCandidate);

  // Fetch or create current week
  const { data: currentWeek } = useQuery<Week>({
    queryKey: ['weeks', currentWeekId],
    queryFn: async () => {
      const response = await fetch(`/api/weeks/${currentWeekId}`);
      if (response.status === 404) {
        // Week doesn't exist, create it
        const { startDate, endDate } = getWeekDates(currentWeekId);
        const createResponse = await fetch('/api/weeks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: currentWeekId,
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

  // Update selected meals when week changes
  useEffect(() => {
    if (currentWeek) {
      setSelectedMealIds(new Set(currentWeek.selectedMeals));
    }
  }, [currentWeek]);

  // Assign meals to current week mutation
  const assignToWeekMutation = useMutation({
    mutationFn: async (mealIds: string[]) => {
      // Get current week's meals and merge with new ones
      const existingMealIds = currentWeek?.selectedMeals || [];
      const allMealIds = Array.from(new Set([...existingMealIds, ...mealIds]));
      
      const response = await fetch(`/api/weeks/${currentWeekId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          selectedMeals: allMealIds,
        }),
      });
      if (!response.ok) {
        throw new Error('Failed to assign meals to week');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weeks', currentWeekId] });
      queryClient.invalidateQueries({ queryKey: ['weeks'] });
      setSelectedMealIds(new Set());
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
    const newSelected = new Set(selectedMealIds);
    if (selected) {
      newSelected.add(mealId);
    } else {
      newSelected.delete(mealId);
    }
    setSelectedMealIds(newSelected);
  };

  const handleAssignToWeek = () => {
    if (selectedMealIds.size === 0) {
      alert('Please select at least one meal to assign to the week');
      return;
    }
    assignToWeekMutation.mutate(Array.from(selectedMealIds));
  };

  const handleRemoveFromCandidates = (mealId: string) => {
    if (confirm('Remove this meal from candidates?')) {
      removeCandidateMutation.mutate(mealId);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/auth/login');
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
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Meal Candidates</h1>
            <div className="flex items-center gap-4">
              <Link
                href="/meals"
                className="text-gray-600 hover:text-gray-900"
              >
                All Meals
              </Link>
              <Link
                href="/weeks"
                className="text-gray-600 hover:text-gray-900"
              >
                Week Planning
              </Link>
              <Link
                href="/meals/add"
                className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors"
              >
                Add Meal
              </Link>
              <button
                onClick={handleSignOut}
                className="text-gray-600 hover:text-gray-900"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Info and Actions */}
        <div className="mb-6 space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <h2 className="text-lg font-semibold text-blue-900 mb-2">
              {formatWeekId(currentWeekId)}
            </h2>
            <p className="text-sm text-blue-800 mb-4">
              Select meals from your candidates list to assign them to the current week.
            </p>
            {selectedMealIds.size > 0 && (
              <div className="flex items-center gap-4">
                <p className="text-sm text-blue-800">
                  {selectedMealIds.size} meal{selectedMealIds.size !== 1 ? 's' : ''} selected
                </p>
                <button
                  onClick={handleAssignToWeek}
                  disabled={assignToWeekMutation.isPending}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50"
                >
                  {assignToWeekMutation.isPending
                    ? 'Assigning...'
                    : `Assign to Current Week`}
                </button>
                <button
                  onClick={() => setSelectedMealIds(new Set())}
                  className="text-gray-600 hover:text-gray-800 text-sm"
                >
                  Clear Selection
                </button>
              </div>
            )}
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
              selectedMealIds={selectedMealIds}
              onSelectMeal={handleSelectMeal}
            />
          </div>
        )}
      </main>
    </div>
  );
}
