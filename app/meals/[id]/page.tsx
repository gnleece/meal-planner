'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { Meal, Category, getCategoryColorClasses } from '@/lib/types';
import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Navigation } from '@/components/Navigation';

export default function MealDetailPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();
  const queryClient = useQueryClient();
  const mealId = params.id as string;
  const [isDeleting, setIsDeleting] = useState(false);

  // Check authentication
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.push('/auth/login');
      }
    });
  }, [router, supabase]);

  // Fetch meal
  const { data: meal, isLoading, error } = useQuery<Meal>({
    queryKey: ['meals', mealId],
    queryFn: async () => {
      const response = await fetch(`/api/meals/${mealId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch meal');
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

  // Get category color
  const category = categories.find(c => c.name === meal?.category);
  const categoryColor = category ? getCategoryColorClasses(category.color) : getCategoryColorClasses('gray');

  // Toggle candidate mutation
  const toggleCandidateMutation = useMutation({
    mutationFn: async (isCandidate: boolean) => {
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
      queryClient.invalidateQueries({ queryKey: ['meals', mealId] });
      queryClient.invalidateQueries({ queryKey: ['meals'] });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/meals/${mealId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete meal');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meals'] });
      router.push('/meals');
    },
  });

  const handleToggleCandidate = () => {
    const isCurrentlyCandidate = meal?.isCandidate || false;
    toggleCandidateMutation.mutate(!isCurrentlyCandidate);
  };

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this meal?')) {
      setIsDeleting(true);
      deleteMutation.mutate();
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-aubergine-700 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading meal...</p>
        </div>
      </div>
    );
  }

  if (error || !meal) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Meal not found or error loading meal.</p>
          <Link href="/meals" className="text-aubergine-400 hover:text-aubergine-600 mt-4 inline-block">
            Back to meals
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/meals"
            className="text-aubergine-400 hover:text-aubergine-600 flex items-center gap-2 text-sm"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to meals
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href={`/meals/${mealId}/edit`}
              className="text-gray-600 hover:text-gray-900 text-sm"
            >
              Edit
            </Link>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="text-red-600 hover:text-red-700 disabled:opacity-50 text-sm"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Image */}
          <div className="relative w-full h-64 md:h-96 bg-gray-200">
            {meal.photoUrl ? (
              <Image
                src={meal.photoUrl}
                alt={meal.name}
                fill
                className="object-cover"
                sizes="100vw"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <svg className="w-24 h-24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}
          </div>

          <div className="p-6 md:p-8">
            {/* Title and Meta */}
            <div className="mb-6">
              <div className="flex items-start justify-between mb-2">
                <h1 className="text-3xl font-bold text-gray-900">{meal.name}</h1>
                <button
                  onClick={handleToggleCandidate}
                  disabled={toggleCandidateMutation.isPending}
                  className={`px-4 py-2 rounded-md font-medium transition-colors ${
                    meal.isCandidate
                      ? 'bg-green-100 text-green-800 hover:bg-green-200'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  } disabled:opacity-50`}
                >
                  {toggleCandidateMutation.isPending
                    ? 'Updating...'
                    : meal.isCandidate
                    ? 'Remove from Candidates'
                    : 'Add to Candidates'}
                </button>
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                {meal.category && (
                  <span className={`px-2.5 py-1 rounded text-sm font-medium ${categoryColor.bg} ${categoryColor.text}`}>
                    {meal.category}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {meal.estimatedCookingTime > 0 ? `${meal.estimatedCookingTime} minutes` : 'Time not set'}
                </span>
                {meal.isCandidate && (
                  <span className="flex items-center gap-1 text-green-600 font-medium">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Candidate
                  </span>
                )}
                {meal.source.url && (
                  <a
                    href={meal.source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-aubergine-400 hover:text-aubergine-600"
                  >
                    View original recipe
                  </a>
                )}
              </div>
            </div>

            {/* Ingredients */}
            {meal.ingredients.length > 0 && (
              <div className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Ingredients</h2>
                <ul className="space-y-2">
                  {meal.ingredients.map((ingredient, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-aubergine-400 mt-1">•</span>
                      <span className="text-gray-700">
                        {ingredient.amount && `${ingredient.amount} `}
                        {ingredient.unit && `${ingredient.unit} `}
                        {ingredient.name}
                        {ingredient.notes && ` (${ingredient.notes})`}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Instructions */}
            {meal.instructions.length > 0 && (
              <div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Instructions</h2>
                <ol className="space-y-4">
                  {meal.instructions.map((instruction, index) => (
                    <li key={index} className="flex gap-4">
                      <span className="flex-shrink-0 w-8 h-8 bg-aubergine-700 text-white rounded-full flex items-center justify-center font-semibold">
                        {index + 1}
                      </span>
                      <p className="text-gray-700 flex-1 pt-1">{instruction}</p>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {meal.ingredients.length === 0 && meal.instructions.length === 0 && (
              <p className="text-gray-500">No ingredients or instructions available for this meal.</p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
