'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { Meal, Ingredient, Category } from '@/lib/types';
import { createClient } from '@/lib/supabase/client';
import { Navigation } from '@/components/Navigation';

export default function EditMealPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();
  const queryClient = useQueryClient();
  const mealId = params.id as string;
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [estimatedCookingTime, setEstimatedCookingTime] = useState(0);
  const [ingredients, setIngredients] = useState<Ingredient[]>([{ name: '' }]);
  const [instructions, setInstructions] = useState<string[]>(['']);
  const [category, setCategory] = useState('');

  // Image upload state
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

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

  // Fetch categories
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

  // Populate form when meal data is loaded
  useEffect(() => {
    if (meal) {
      setName(meal.name || '');
      setPhotoUrl(meal.photoUrl || '');
      if (meal.photoUrl) {
        setImagePreview(meal.photoUrl);
      }
      setEstimatedCookingTime(meal.estimatedCookingTime || 0);
      setIngredients(meal.ingredients && meal.ingredients.length > 0 ? meal.ingredients : [{ name: '' }]);
      setInstructions(meal.instructions && meal.instructions.length > 0 ? meal.instructions : ['']);
      setCategory(meal.category || '');
    }
  }, [meal]);

  const updateMealMutation = useMutation({
    mutationFn: async (mealData: any) => {
      const response = await fetch(`/api/meals/${mealId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mealData),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update meal');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meals', mealId] });
      queryClient.invalidateQueries({ queryKey: ['meals'] });
      router.push(`/meals/${mealId}`);
    },
  });

  const handleAddIngredient = () => {
    setIngredients([...ingredients, { name: '' }]);
  };

  const handleRemoveIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const handleIngredientChange = (index: number, field: keyof Ingredient, value: string) => {
    const updated = [...ingredients];
    updated[index] = { ...updated[index], [field]: value };
    setIngredients(updated);
  };

  const handleAddInstruction = () => {
    setInstructions([...instructions, '']);
  };

  const handleRemoveInstruction = (index: number) => {
    setInstructions(instructions.filter((_, i) => i !== index));
  };

  const handleInstructionChange = (index: number, value: string) => {
    const updated = [...instructions];
    updated[index] = value;
    setInstructions(updated);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setUploadError('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      setUploadError('Image size must be less than 5MB');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload image
    setIsUploadingImage(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload/image', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to upload image');
      }

      const { url, signedUrl } = await response.json();
      setPhotoUrl(url); // Store the storage path for database
      // Update preview with signed URL if available
      if (signedUrl) {
        setImagePreview(signedUrl);
      }
    } catch (error: any) {
      setUploadError(error.message);
      setImagePreview(null);
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleRemoveImage = () => {
    setPhotoUrl('');
    setImagePreview(null);
    setUploadError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      alert('Please enter a meal name');
      return;
    }

    setIsSubmitting(true);

    const mealData = {
      name: name.trim(),
      photoUrl: photoUrl.trim() || undefined,
      estimatedCookingTime: estimatedCookingTime || 0,
      ingredients: ingredients.filter((ing) => ing.name.trim()),
      instructions: instructions.filter((inst) => inst.trim()),
      source: meal?.source || { type: 'manual' },
      tags: meal?.tags || [],
      category: category.trim() || undefined,
    };

    updateMealMutation.mutate(mealData);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
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
          <Link href="/meals" className="text-indigo-600 hover:text-indigo-700 mt-4 inline-block">
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
        <div className="mb-6">
          <Link
            href={`/meals/${mealId}`}
            className="text-indigo-600 hover:text-indigo-700 flex items-center gap-2 text-sm"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to meal
          </Link>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6 md:p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Edit Meal</h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Meal Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Meal Photo
              </label>
              
              {imagePreview || photoUrl ? (
                <div className="mb-4">
                  <div className="relative inline-block">
                    <img
                      src={imagePreview || photoUrl}
                      alt="Meal preview"
                      className="max-w-full h-48 object-cover rounded-md border border-gray-300"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1 hover:bg-red-700"
                      aria-label="Remove image"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mb-4">
                  <label
                    htmlFor="image-upload"
                    className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                      isUploadingImage
                        ? 'border-gray-300 bg-gray-50'
                        : 'border-gray-300 hover:border-indigo-500 hover:bg-indigo-50'
                    }`}
                  >
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      {isUploadingImage ? (
                        <>
                          <svg className="w-8 h-8 mb-2 text-gray-400 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          <p className="mb-2 text-sm text-gray-500">Uploading...</p>
                        </>
                      ) : (
                        <>
                          <svg className="w-8 h-8 mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                          <p className="mb-2 text-sm text-gray-500">
                            <span className="font-semibold">Click to upload</span> or drag and drop
                          </p>
                          <p className="text-xs text-gray-500">PNG, JPG, GIF up to 5MB</p>
                        </>
                      )}
                    </div>
                    <input
                      id="image-upload"
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={isUploadingImage}
                    />
                  </label>
                </div>
              )}
              
              {uploadError && (
                <p className="mt-2 text-sm text-red-600">{uploadError}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estimated Cooking Time (minutes)
              </label>
              <input
                type="number"
                value={estimatedCookingTime || ''}
                onChange={(e) => setEstimatedCookingTime(parseInt(e.target.value) || 0)}
                min="0"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900"
              >
                <option value="">No category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Ingredients
                </label>
                <button
                  type="button"
                  onClick={handleAddIngredient}
                  className="text-sm text-indigo-600 hover:text-indigo-700"
                >
                  + Add Ingredient
                </button>
              </div>
              <div className="space-y-2">
                {ingredients.map((ingredient, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={ingredient.amount || ''}
                      onChange={(e) => handleIngredientChange(index, 'amount', e.target.value)}
                      placeholder="Amount"
                      className="w-24 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900"
                    />
                    <input
                      type="text"
                      value={ingredient.unit || ''}
                      onChange={(e) => handleIngredientChange(index, 'unit', e.target.value)}
                      placeholder="Unit"
                      className="w-24 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900"
                    />
                    <input
                      type="text"
                      value={ingredient.name}
                      onChange={(e) => handleIngredientChange(index, 'name', e.target.value)}
                      placeholder="Ingredient name"
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900"
                    />
                    {ingredients.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveIngredient(index)}
                        className="px-3 py-2 text-red-600 hover:text-red-700"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Instructions
                </label>
                <button
                  type="button"
                  onClick={handleAddInstruction}
                  className="text-sm text-indigo-600 hover:text-indigo-700"
                >
                  + Add Step
                </button>
              </div>
              <div className="space-y-2">
                {instructions.map((instruction, index) => (
                  <div key={index} className="flex gap-2">
                    <span className="flex-shrink-0 w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-semibold mt-2">
                      {index + 1}
                    </span>
                    <div className="flex-1 flex gap-2">
                      <textarea
                        value={instruction}
                        onChange={(e) => handleInstructionChange(index, e.target.value)}
                        placeholder="Instruction step"
                        rows={2}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900"
                      />
                      {instructions.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveInstruction(index)}
                          className="px-3 py-2 text-red-600 hover:text-red-700"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-indigo-600 text-white px-6 py-3 rounded-md hover:bg-indigo-700 disabled:opacity-50"
              >
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </button>
              <Link
                href={`/meals/${mealId}`}
                className="px-6 py-3 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
