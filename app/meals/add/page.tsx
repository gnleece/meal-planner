'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { Ingredient } from '@/lib/types';
import { createClient } from '@/lib/supabase/client';
import { useEffect } from 'react';
import { PaprikaImport } from '@/components/PaprikaImport';
import { PhotoOCRImport } from '@/components/PhotoOCRImport';
import { parseOCRText } from '@/lib/ocrParser';

export default function AddMealPage() {
  const router = useRouter();
  const supabase = createClient();
  const queryClient = useQueryClient();
  const [importMethod, setImportMethod] = useState<'manual' | 'url' | 'paprika' | 'photo'>('manual');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [estimatedCookingTime, setEstimatedCookingTime] = useState(0);
  const [ingredients, setIngredients] = useState<Ingredient[]>([{ name: '' }]);
  const [instructions, setInstructions] = useState<string[]>(['']);

  // Image upload state
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Import state
  const [url, setUrl] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  // Check authentication
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.push('/auth/login');
      }
    });
  }, [router, supabase]);

  const createMealMutation = useMutation({
    mutationFn: async (mealData: any) => {
      const response = await fetch('/api/meals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mealData),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create meal');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meals'] });
      router.push('/meals');
    },
  });

  const handleImportUrl = async () => {
    if (!url.trim()) {
      setImportError('Please enter a URL');
      return;
    }

    setIsImporting(true);
    setImportError(null);

    try {
      const response = await fetch('/api/import/url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to import recipe');
      }

      const mealData = await response.json();
      
      // Populate form with imported data
      setName(mealData.name || '');
      const importedPhotoUrl = mealData.photoUrl || '';
      setPhotoUrl(importedPhotoUrl);
      if (importedPhotoUrl) {
        setImagePreview(importedPhotoUrl);
      }
      setEstimatedCookingTime(mealData.estimatedCookingTime || 0);
      setIngredients(mealData.ingredients || [{ name: '' }]);
      setInstructions(mealData.instructions || ['']);
      
      setImportMethod('manual'); // Switch to manual to show the form
    } catch (error: any) {
      setImportError(error.message);
    } finally {
      setIsImporting(false);
    }
  };

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
      source: {
        type: importMethod === 'url' ? 'url' : 'manual',
        url: importMethod === 'url' ? url : undefined,
      },
      tags: [],
    };

    createMealMutation.mutate(mealData);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link
              href="/meals"
              className="text-indigo-600 hover:text-indigo-700 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to meals
            </Link>
            <div className="flex items-center gap-4">
              <Link
                href="/weeks"
                className="text-gray-600 hover:text-gray-900"
              >
                Week Planning
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-md p-6 md:p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Add Meal</h1>

          {/* Import Method Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Import Method
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {(['manual', 'url', 'paprika', 'photo'] as const).map((method) => (
                <button
                  key={method}
                  type="button"
                  onClick={() => {
                    setImportMethod(method);
                    setImportError(null);
                  }}
                  className={`px-4 py-2 rounded-md border transition-colors ${
                    importMethod === method
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  {method.charAt(0).toUpperCase() + method.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* URL Import */}
          {importMethod === 'url' && (
            <div className="mb-6 p-4 bg-gray-50 rounded-md">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Recipe URL
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com/recipe"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  type="button"
                  onClick={handleImportUrl}
                  disabled={isImporting}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
                >
                  {isImporting ? 'Importing...' : 'Import'}
                </button>
              </div>
              {importError && (
                <p className="mt-2 text-sm text-red-600">{importError}</p>
              )}
            </div>
          )}

          {/* Manual Form */}
          {(importMethod === 'manual' || importMethod === 'url') && (
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
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
                        value={ingredient.name}
                        onChange={(e) => handleIngredientChange(index, 'name', e.target.value)}
                        placeholder="Ingredient name"
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                  {isSubmitting ? 'Saving...' : 'Save Meal'}
                </button>
                <Link
                  href="/meals"
                  className="px-6 py-3 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </Link>
              </div>
            </form>
          )}

          {/* Paprika Import */}
          {importMethod === 'paprika' && (
            <PaprikaImport
              onClose={() => {
                queryClient.invalidateQueries({ queryKey: ['meals'] });
                router.push('/meals');
              }}
            />
          )}

          {/* Photo OCR Import */}
          {importMethod === 'photo' && (
            <PhotoOCRImport
              onExtract={(text) => {
                const parsed = parseOCRText(text);
                setName(parsed.name);
                setIngredients(parsed.ingredients.map((ing) => ({ name: ing })));
                setInstructions(parsed.instructions);
                setEstimatedCookingTime(parsed.estimatedCookingTime);
                setImportMethod('manual'); // Switch to manual to show the form
              }}
              onClose={() => setImportMethod('manual')}
            />
          )}
        </div>
      </main>
    </div>
  );
}
