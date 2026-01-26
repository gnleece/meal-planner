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
  photoStoragePath?: string; // Raw storage path for preserving on updates
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
  { name: 'Gray', value: 'gray', bg: 'bg-gray-200', text: 'text-gray-800', ring: 'ring-gray-500' },
  { name: 'Red', value: 'red', bg: 'bg-red-200', text: 'text-red-900', ring: 'ring-red-500' },
  { name: 'Orange', value: 'orange', bg: 'bg-orange-200', text: 'text-orange-900', ring: 'ring-orange-500' },
  { name: 'Amber', value: 'amber', bg: 'bg-amber-200', text: 'text-amber-900', ring: 'ring-amber-500' },
  { name: 'Yellow', value: 'yellow', bg: 'bg-yellow-200', text: 'text-yellow-900', ring: 'ring-yellow-500' },
  { name: 'Lime', value: 'lime', bg: 'bg-lime-200', text: 'text-lime-900', ring: 'ring-lime-500' },
  { name: 'Green', value: 'green', bg: 'bg-green-200', text: 'text-green-900', ring: 'ring-green-500' },
  { name: 'Teal', value: 'teal', bg: 'bg-teal-200', text: 'text-teal-900', ring: 'ring-teal-500' },
  { name: 'Cyan', value: 'cyan', bg: 'bg-cyan-200', text: 'text-cyan-900', ring: 'ring-cyan-500' },
  { name: 'Sky', value: 'sky', bg: 'bg-sky-200', text: 'text-sky-900', ring: 'ring-sky-500' },
  { name: 'Blue', value: 'blue', bg: 'bg-blue-200', text: 'text-blue-900', ring: 'ring-blue-500' },
  { name: 'Indigo', value: 'indigo', bg: 'bg-indigo-200', text: 'text-indigo-900', ring: 'ring-indigo-500' },
  { name: 'Violet', value: 'violet', bg: 'bg-violet-200', text: 'text-violet-900', ring: 'ring-violet-500' },
  { name: 'Purple', value: 'purple', bg: 'bg-purple-200', text: 'text-purple-900', ring: 'ring-purple-500' },
  { name: 'Pink', value: 'pink', bg: 'bg-pink-200', text: 'text-pink-900', ring: 'ring-pink-500' },
  { name: 'Rose', value: 'rose', bg: 'bg-rose-200', text: 'text-rose-900', ring: 'ring-rose-500' },
] as const;

export type CategoryColor = typeof CATEGORY_COLORS[number]['value'];

export function getCategoryColorClasses(colorValue: string) {
  const color = CATEGORY_COLORS.find(c => c.value === colorValue);
  return color || CATEGORY_COLORS[0]; // Default to gray
}
