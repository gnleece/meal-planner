'use client';

import { useRealtimeMeals } from '@/hooks/useRealtimeMeals';

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  useRealtimeMeals();
  return <>{children}</>;
}
