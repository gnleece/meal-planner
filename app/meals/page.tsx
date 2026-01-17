'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { Meal } from '@/lib/types';
import { MealGrid } from '@/components/MealGrid';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function MealsPage() {
  const router = useRouter();
  const supabase = createClient();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTime, setFilterTime] = useState<string>('all');

  // Check authentication
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.push('/auth/login');
      }
    });
  }, [router, supabase]);

  // Fetch meals
  const { data: meals = [], isLoading, error } = useQuery<Meal[]>({
    queryKey: ['meals'],
    queryFn: async () => {
      const response = await fetch('/api/meals');
      if (!response.ok) {
        throw new Error('Failed to fetch meals');
      }
      return response.json();
    },
  });

  // Count candidates
  const candidateCount = meals.filter(meal => meal.isCandidate).length;

  // Filter meals
  const filteredMeals = meals.filter((meal) => {
    const matchesSearch =
      searchQuery === '' ||
      meal.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      meal.ingredients.some((ing) =>
        ing.name.toLowerCase().includes(searchQuery.toLowerCase())
      );

    const matchesTime =
      filterTime === 'all' ||
      (filterTime === 'quick' && meal.estimatedCookingTime <= 30) ||
      (filterTime === 'medium' && meal.estimatedCookingTime > 30 && meal.estimatedCookingTime <= 60) ||
      (filterTime === 'long' && meal.estimatedCookingTime > 60);

    return matchesSearch && matchesTime;
  });

  // Toggle candidate status mutation
  const toggleCandidateMutation = useMutation({
    mutationFn: async ({ mealId, isCandidate }: { mealId: string; isCandidate: boolean }) => {
      const url = isCandidate 
        ? `/api/candidates/${mealId}`
        : `/api/candidates?mealId=${mealId}`;
      const method = isCandidate ? 'POST' : 'DELETE';
      
      const response = await fetch(url, { method });
      if (!response.ok) {
        throw new Error('Failed to update candidate status');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meals'] });
    },
  });

  const handleSelectMeal = (mealId: string, selected: boolean) => {
    const meal = meals.find(m => m.id === mealId);
    const isCurrentlyCandidate = meal?.isCandidate || false;
    
    // Toggle candidate status
    toggleCandidateMutation.mutate({ 
      mealId, 
      isCandidate: !isCurrentlyCandidate 
    });
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/auth/login');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading meals...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Error loading meals. Please try again.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Meal Planner</h1>
            <div className="flex items-center gap-4">
              <Link
                href="/candidates"
                className="text-gray-600 hover:text-gray-900"
              >
                Candidates
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
        {/* Search and Filters */}
        <div className="mb-6 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search meals or ingredients..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <select
              value={filterTime}
              onChange={(e) => setFilterTime(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Times</option>
              <option value="quick">Quick (≤30 min)</option>
              <option value="medium">Medium (30-60 min)</option>
              <option value="long">Long (&gt;60 min)</option>
            </select>
          </div>
          {candidateCount > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-md p-3">
              <p className="text-sm text-green-800">
                {candidateCount} meal{candidateCount !== 1 ? 's' : ''} in candidates list
              </p>
            </div>
          )}
        </div>

        {/* Meal Grid */}
        <MealGrid
          meals={filteredMeals}
          selectedMealIds={new Set(meals.filter(m => m.isCandidate).map(m => m.id))}
          onSelectMeal={handleSelectMeal}
        />
      </main>
    </div>
  );
}
