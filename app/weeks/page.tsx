'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { Week, Meal } from '@/lib/types';
import { getWeekId, formatWeekId, getWeekDates } from '@/lib/weekUtils';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Navigation } from '@/components/Navigation';

export default function WeeksPage() {
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

  // Remove meal from week mutation
  const removeMealFromWeekMutation = useMutation({
    mutationFn: async (mealId: string) => {
      const currentMealIds = currentWeek?.selectedMeals || [];
      const updatedMealIds = currentMealIds.filter(id => id !== mealId);
      
      const response = await fetch(`/api/weeks/${selectedWeekId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          selectedMeals: updatedMealIds,
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

  const handleRemoveMeal = (mealId: string) => {
    if (confirm('Remove this meal from the week?')) {
      removeMealFromWeekMutation.mutate(mealId);
    }
  };

  // Get meals assigned to the selected week
  const assignedMealIds = currentWeek?.selectedMeals || [];
  const assignedMeals = meals.filter(meal => assignedMealIds.includes(meal.id));

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
      <Navigation />

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
                      ? 'border-aubergine-700 bg-aubergine-100 text-aubergine-700'
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

        {/* Week Summary */}
        {currentWeek && (
          <div className="mb-6 bg-aubergine-50 border border-aubergine-200 rounded-md p-4">
            <h2 className="text-lg font-semibold text-aubergine-900 mb-2">
              {formatWeekId(selectedWeekId)}
            </h2>
            <p className="text-sm text-aubergine-700 mb-2">
              {assignedMeals.length} meal{assignedMeals.length !== 1 ? 's' : ''} assigned to this week
            </p>
            <p className="text-xs text-aubergine-600">
              To assign meals to this week, go to the{' '}
              <Link href="/candidates" className="underline font-medium">
                Candidates page
              </Link>
              .
            </p>
          </div>
        )}

        {/* Assigned Meals */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Assigned Meals
          </h2>
          {assignedMeals.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
              <p className="text-gray-500 text-lg mb-2">No meals assigned to this week yet.</p>
              <p className="text-gray-500 mb-4">
                Go to the{' '}
                <Link href="/candidates" className="text-aubergine-400 hover:text-aubergine-600 font-medium">
                  Candidates page
                </Link>
                {' '}to assign meals.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {assignedMeals.map((meal) => (
                <div key={meal.id} className="bg-white rounded-lg shadow-md overflow-hidden relative">
                  <Link href={`/meals/${meal.id}`} className="block">
                    <div className="relative w-full h-48 bg-gray-200">
                      {meal.photoUrl ? (
                        <Image
                          src={meal.photoUrl}
                          alt={meal.name}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-lg mb-2 line-clamp-2">{meal.name}</h3>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {meal.estimatedCookingTime > 0 ? `${meal.estimatedCookingTime} min` : 'Time not set'}
                        </span>
                      </div>
                    </div>
                  </Link>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleRemoveMeal(meal.id);
                    }}
                    disabled={removeMealFromWeekMutation.isPending}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition-colors disabled:opacity-50 z-10"
                    aria-label="Remove from week"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
