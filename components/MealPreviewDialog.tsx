'use client';

import { useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import Link from 'next/link';
import { Meal, Category, getCategoryColorClasses } from '@/lib/types';
import { ImageLightbox } from './ImageLightbox';

interface MealPreviewDialogProps {
  meal: Meal;
  categories: Category[];
  onClose: () => void;
}

export function MealPreviewDialog({ meal, categories, onClose }: MealPreviewDialogProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const category = categories.find(c => c.name === meal.category);
  const categoryColor = category ? getCategoryColorClasses(category.color) : getCategoryColorClasses('gray');
  const recipeUrl = meal.recipeLink || meal.source.url;

  const handleEscape = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape' && !lightboxOpen) {
      onClose();
    }
  }, [onClose, lightboxOpen]);

  useEffect(() => {
    document.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [handleEscape]);

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-4 border-b">
          <h2 className="text-xl font-bold text-gray-900 pr-4">{meal.name}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 flex-shrink-0"
            aria-label="Close preview"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-3">
          {/* Recipe link */}
          {recipeUrl && (
            <a
              href={recipeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-aubergine-100 text-aubergine-700 rounded-md hover:bg-aubergine-200 transition-colors text-sm font-medium"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              View Recipe
            </a>
          )}

          {/* Cookbook photo thumbnail */}
          {meal.cookbookPhotoUrl && (
            <div>
              <button
                onClick={() => setLightboxOpen(true)}
                className="block cursor-zoom-in"
              >
                <Image
                  src={meal.cookbookPhotoUrl}
                  alt={`${meal.name} cookbook photo`}
                  width={200}
                  height={267}
                  className="rounded-md border border-gray-300 hover:border-gray-400 transition-colors"
                />
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t">
          <Link
            href={`/meals/${meal.id}`}
            className="text-aubergine-400 hover:text-aubergine-600 text-sm font-medium"
          >
            View full details &rarr;
          </Link>
        </div>
      </div>

      {lightboxOpen && meal.cookbookPhotoUrl && (
        <ImageLightbox
          src={meal.cookbookPhotoUrl}
          alt={`${meal.name} cookbook photo`}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </div>,
    document.body
  );
}
