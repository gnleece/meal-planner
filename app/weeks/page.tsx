'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { Week, Meal } from '@/lib/types';
import { getWeekId, formatWeekId, getWeekDates } from '@/lib/weekUtils';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { MealGrid } from '@/components/MealGrid';
import { format } from 'date-fns';

export default function WeeksPage() {
  const router = useRouter();
  const supabase = createClient();
  const queryClient = useQueryClient();
  const currentWeekId = getWeekId();
  const [selectedWeekId, setSelectedWeekId] = useState(currentWeekId);
  const [selectedMealIds, setSelectedMealIds] = useState<Set<string>>(new Set());

  // Check authentication
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.push('/auth/login');
      }
    });
  }, [router, supabase]);

  // Fetch weeks
  const { data: weeks = [] } = useQuery<Week[]>({
    queryKey: ['weeks'],
    queryFn: async () => {
      const response = await fetch('/api/weeks');
      if (!response.ok) {
        throw new Error('Failed to fetch weeks');
      }
      return response.json();
    },
  });

  // Fetch current week or create it
  const { data: currentWeek } = useQuery<Week>({
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

  // Fetch all meals
  const { data: meals = [] } = useQuery<Meal[]>({
    queryKey: ['meals'],
    queryFn: async () => {
      const response = await fetch('/api/meals');
      if (!response.ok) {
        throw new Error('Failed to fetch meals');
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

  // Update week mutation
  const updateWeekMutation = useMutation({
    mutationFn: async (mealIds: string[]) => {
      const response = await fetch(`/api/weeks/${selectedWeekId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          selectedMeals: mealIds,
        }),
      });
      if (!response.ok) {
        throw new Error('Failed to update week');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weeks', selectedWeekId] });
      queryClient.invalidateQueries({ queryKey: ['weeks'] });
    },
  });

  const handleSelectMeal = async (mealId: string, selected: boolean) => {
    const newSelected = new Set(selectedMealIds);
    if (selected) {
      newSelected.add(mealId);
    } else {
      newSelected.delete(mealId);
    }
    setSelectedMealIds(newSelected);
    
    // Update week immediately
    updateWeekMutation.mutate(Array.from(newSelected));
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/auth/login');
  };

  // Get weeks to display (current week and next few)
  const weeksToShow = [];
  const today = new Date();
  for (let i = 0; i < 4; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + i * 7);
    weeksToShow.push(getWeekId(date));
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Week Planning</h1>
            <div className="flex items-center gap-4">
              <Link
                href="/meals"
                className="text-gray-600 hover:text-gray-900"
              >
                All Meals
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
        {/* Week Selector */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Week
          </label>
          <div className="flex gap-2 flex-wrap">
            {weeksToShow.map((weekId) => {
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
            })}
          </div>
        </div>

        {/* Selected Meals Summary */}
        {currentWeek && (
          <div className="mb-6 bg-indigo-50 border border-indigo-200 rounded-md p-4">
            <h2 className="text-lg font-semibold text-indigo-900 mb-2">
              {formatWeekId(selectedWeekId)}
            </h2>
            <p className="text-sm text-indigo-800">
              {selectedMealIds.size} meal{selectedMealIds.size !== 1 ? 's' : ''} selected for this week
            </p>
          </div>
        )}

        {/* Meal Grid */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Select Meals</h2>
          <MealGrid
            meals={meals}
            selectedMealIds={selectedMealIds}
            onSelectMeal={handleSelectMeal}
          />
        </div>
      </main>
    </div>
  );
}
