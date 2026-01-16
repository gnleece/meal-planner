'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

export function useRealtimeMeals() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  useEffect(() => {
    // Get current user
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;

      // Subscribe to meals changes
      const mealsChannel = supabase
        .channel('meals-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'meals',
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            console.log('Meal change received:', payload);
            
            // Invalidate queries to refetch
            queryClient.invalidateQueries({ queryKey: ['meals'] });
            
            // If a specific meal was updated, invalidate that too
            if (payload.new && 'id' in payload.new) {
              queryClient.invalidateQueries({ queryKey: ['meals', payload.new.id] });
            }
          }
        )
        .subscribe();

      // Subscribe to weeks changes
      const weeksChannel = supabase
        .channel('weeks-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'weeks',
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            console.log('Week change received:', payload);
            
            // Invalidate queries to refetch
            queryClient.invalidateQueries({ queryKey: ['weeks'] });
            
            // If a specific week was updated, invalidate that too
            if (payload.new && 'id' in payload.new) {
              queryClient.invalidateQueries({ queryKey: ['weeks', payload.new.id] });
            }
          }
        )
        .subscribe();

      // Cleanup function
      return () => {
        supabase.removeChannel(mealsChannel);
        supabase.removeChannel(weeksChannel);
      };
    });
  }, [queryClient, supabase]);
}
