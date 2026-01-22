export interface Ingredient {
  name: string;
  amount?: string;
  unit?: string;
  notes?: string;
}

export interface Meal {
  id: string;
  name: string;
  photoUrl: string;
  estimatedCookingTime: number; // in minutes
  ingredients: Ingredient[];
  instructions: string[];
  source: {
    type: 'url' | 'paprika' | 'manual' | 'photo';
    url?: string;
    originalData?: any;
  };
  tags?: string[];
  category?: string;
  createdAt: string;
  updatedAt: string;
  selectedForWeek?: string; // week identifier (e.g., "2024-W15") - deprecated, kept for backward compatibility
  userId: string;
  isCandidate?: boolean; // UI state: whether this meal is in the candidates list
}

export interface Week {
  id: string; // format: "YYYY-Www" (e.g., "2024-W15")
  startDate: string;
  endDate: string;
  selectedMeals: string[]; // meal IDs
  userId: string;
}

export interface Category {
  id: string;
  name: string;
  color: string;
  userId: string;
  createdAt: string;
  displayOrder: number;
}

// Preset colors for categories that fit the app's color palette
export const CATEGORY_COLORS = [
  { name: 'Gray', value: 'gray', bg: 'bg-gray-100', text: 'text-gray-800', ring: 'ring-gray-400' },
  { name: 'Red', value: 'red', bg: 'bg-red-100', text: 'text-red-800', ring: 'ring-red-400' },
  { name: 'Orange', value: 'orange', bg: 'bg-orange-100', text: 'text-orange-800', ring: 'ring-orange-400' },
  { name: 'Amber', value: 'amber', bg: 'bg-amber-100', text: 'text-amber-800', ring: 'ring-amber-400' },
  { name: 'Yellow', value: 'yellow', bg: 'bg-yellow-100', text: 'text-yellow-800', ring: 'ring-yellow-400' },
  { name: 'Lime', value: 'lime', bg: 'bg-lime-100', text: 'text-lime-800', ring: 'ring-lime-400' },
  { name: 'Green', value: 'green', bg: 'bg-green-100', text: 'text-green-800', ring: 'ring-green-400' },
  { name: 'Teal', value: 'teal', bg: 'bg-teal-100', text: 'text-teal-800', ring: 'ring-teal-400' },
  { name: 'Cyan', value: 'cyan', bg: 'bg-cyan-100', text: 'text-cyan-800', ring: 'ring-cyan-400' },
  { name: 'Sky', value: 'sky', bg: 'bg-sky-100', text: 'text-sky-800', ring: 'ring-sky-400' },
  { name: 'Blue', value: 'blue', bg: 'bg-blue-100', text: 'text-blue-800', ring: 'ring-blue-400' },
  { name: 'Indigo', value: 'indigo', bg: 'bg-indigo-100', text: 'text-indigo-800', ring: 'ring-indigo-400' },
  { name: 'Violet', value: 'violet', bg: 'bg-violet-100', text: 'text-violet-800', ring: 'ring-violet-400' },
  { name: 'Purple', value: 'purple', bg: 'bg-purple-100', text: 'text-purple-800', ring: 'ring-purple-400' },
  { name: 'Pink', value: 'pink', bg: 'bg-pink-100', text: 'text-pink-800', ring: 'ring-pink-400' },
  { name: 'Rose', value: 'rose', bg: 'bg-rose-100', text: 'text-rose-800', ring: 'ring-rose-400' },
] as const;

export type CategoryColor = typeof CATEGORY_COLORS[number]['value'];

export function getCategoryColorClasses(colorValue: string) {
  const color = CATEGORY_COLORS.find(c => c.value === colorValue);
  return color || CATEGORY_COLORS[0]; // Default to gray
}
