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
  createdAt: string;
  updatedAt: string;
  selectedForWeek?: string; // week identifier (e.g., "2024-W15")
  userId: string;
}

export interface Week {
  id: string; // format: "YYYY-Www" (e.g., "2024-W15")
  startDate: string;
  endDate: string;
  selectedMeals: string[]; // meal IDs
  userId: string;
}
