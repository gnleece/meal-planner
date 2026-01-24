'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Meal } from '@/lib/types';

interface PaprikaImportProps {
  onClose: () => void;
}

export function PaprikaImport({ onClose }: PaprikaImportProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importedMeals, setImportedMeals] = useState<Partial<Meal>[]>([]);
  const [selectedMeals, setSelectedMeals] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
    }
  };

  const handleParse = async () => {
    if (!file) {
      setError('Please select a file');
      return;
    }

    setIsImporting(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/import/paprika', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to parse Paprika file');
      }

      const data = await response.json();
      setImportedMeals(data.meals || []);
      
      // Select all by default
      setSelectedMeals(new Set(data.meals?.map((_: any, i: number) => i) || []));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsImporting(false);
    }
  };

  const createMealMutation = useMutation({
    mutationFn: async (mealData: Partial<Meal>) => {
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
  });

  const handleImportSelected = async () => {
    if (selectedMeals.size === 0) {
      setError('Please select at least one meal to import');
      return;
    }

    setIsImporting(true);
    setError(null);

    try {
      const mealsToImport = Array.from(selectedMeals).map((index) => importedMeals[index]);
      
      // Import meals sequentially
      for (const meal of mealsToImport) {
        await createMealMutation.mutateAsync(meal as Partial<Meal>);
      }

      queryClient.invalidateQueries({ queryKey: ['meals'] });
      onClose();
      router.push('/meals');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsImporting(false);
    }
  };

  const toggleMeal = (index: number) => {
    const newSelected = new Set(selectedMeals);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedMeals(newSelected);
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Upload Paprika Export File
        </label>
        <input
          type="file"
          accept=".paprikarecipes,.json,.xml"
          onChange={handleFileChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-aubergine-400"
        />
        <p className="mt-1 text-sm text-gray-500">
          Select your Paprika export file (.paprikarecipes, .json, or .xml)
        </p>
      </div>

      {file && importedMeals.length === 0 && (
        <button
          type="button"
          onClick={handleParse}
          disabled={isImporting}
          className="w-full bg-aubergine-700 text-white px-4 py-2 rounded-md hover:bg-aubergine-800 disabled:opacity-50"
        >
          {isImporting ? 'Parsing...' : 'Parse File'}
        </button>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {importedMeals.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">
              Found {importedMeals.length} recipe{importedMeals.length !== 1 ? 's' : ''}
            </h3>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setSelectedMeals(new Set(importedMeals.map((_, i) => i)))}
                className="text-sm text-aubergine-400 hover:text-aubergine-600"
              >
                Select All
              </button>
              <button
                type="button"
                onClick={() => setSelectedMeals(new Set())}
                className="text-sm text-aubergine-400 hover:text-aubergine-600"
              >
                Deselect All
              </button>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto space-y-2 border border-gray-200 rounded-md p-4">
            {importedMeals.map((meal, index) => (
              <label
                key={index}
                className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedMeals.has(index)}
                  onChange={() => toggleMeal(index)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <p className="font-medium">{meal.name || 'Untitled Recipe'}</p>
                  {meal.estimatedCookingTime && (
                    <p className="text-sm text-gray-500">
                      {meal.estimatedCookingTime} minutes
                    </p>
                  )}
                </div>
              </label>
            ))}
          </div>

          <button
            type="button"
            onClick={handleImportSelected}
            disabled={isImporting || selectedMeals.size === 0}
            className="w-full bg-aubergine-700 text-white px-4 py-2 rounded-md hover:bg-aubergine-800 disabled:opacity-50"
          >
            {isImporting
              ? `Importing ${selectedMeals.size} meal${selectedMeals.size !== 1 ? 's' : ''}...`
              : `Import ${selectedMeals.size} Selected Meal${selectedMeals.size !== 1 ? 's' : ''}`}
          </button>
        </div>
      )}
    </div>
  );
}
