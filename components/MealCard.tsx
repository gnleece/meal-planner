'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Meal } from '@/lib/types';

interface MealCardProps {
  meal: Meal;
  isSelected?: boolean;
  onSelect?: (mealId: string, selected: boolean) => void;
}

export function MealCard({ meal, isSelected = false, onSelect }: MealCardProps) {
  const handleCardClick = () => {
    if (onSelect) {
      onSelect(meal.id, !isSelected);
    }
  };

  const handleInfoClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Navigation will be handled by the Link component
  };

  const cardContent = (
    <>
      {/* Info/Details button - only show when selection is available */}
      {onSelect && (
        <Link
          href={`/meals/${meal.id}`}
          onClick={handleInfoClick}
          className="absolute top-2 right-2 z-10 bg-white/90 hover:bg-white text-gray-700 hover:text-indigo-600 rounded-full p-1.5 shadow-sm transition-colors"
          aria-label="View meal details"
          title="View details"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </Link>
      )}
      
      {/* Selection indicator */}
      {isSelected && (
        <div className="absolute top-2 left-2 z-10 bg-indigo-600 text-white rounded-full p-1.5">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </div>
      )}
      
      {/* Candidate badge */}
      {meal.isCandidate && !isSelected && (
        <div className="absolute top-2 left-2 z-10 bg-green-500 text-white text-xs font-semibold px-2 py-1 rounded">
          Candidate
        </div>
      )}
      
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
        <h3 className="font-semibold text-lg text-gray-900 mb-2 line-clamp-2">{meal.name}</h3>
        {meal.category && (
          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
            {meal.category}
          </span>
        )}
      </div>
    </>
  );

  // If onSelect is provided, make the card clickable for selection
  // Otherwise, wrap in Link to make entire card clickable for navigation
  if (onSelect) {
    return (
      <div 
        onClick={handleCardClick}
        className={`rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-all relative cursor-pointer ${
          isSelected 
            ? 'bg-indigo-50 border-2 border-indigo-500' 
            : 'bg-white border-2 border-transparent'
        }`}
      >
        {cardContent}
      </div>
    );
  }

  // When selection is not available, wrap entire card in Link
  return (
    <Link href={`/meals/${meal.id}`} className="block">
      <div className={`rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-all relative ${
        isSelected 
          ? 'bg-indigo-50 border-2 border-indigo-500' 
          : 'bg-white border-2 border-transparent'
      }`}>
        {cardContent}
      </div>
    </Link>
  );
}
