'use client';

import { Meal } from '@/lib/types';
import { MealCard } from './MealCard';

interface MealGridProps {
  meals: Meal[];
  selectedMealIds?: Set<string>;
  onSelectMeal?: (mealId: string, selected: boolean) => void;
}

export function MealGrid({ meals, selectedMealIds, onSelectMeal }: MealGridProps) {
  if (meals.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">No meals yet. Add your first meal to get started!</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {meals.map((meal) => (
        <MealCard
          key={meal.id}
          meal={meal}
          isSelected={selectedMealIds?.has(meal.id)}
          onSelect={onSelectMeal}
        />
      ))}
    </div>
  );
}
