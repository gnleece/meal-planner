import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const SELECTION_ID = 'current-selection';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('weeks')
      .select('selected_meals')
      .eq('id', SELECTION_ID)
      .eq('user_id', user.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Selection doesn't exist yet, return empty array
        return NextResponse.json({ selectedMeals: [] });
      }
      throw error;
    }

    return NextResponse.json({ selectedMeals: data.selected_meals || [] });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch selection' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: { selectedMeals: string[] } = await request.json();

    // Try to update first
    const { data: existingData } = await supabase
      .from('weeks')
      .select('id')
      .eq('id', SELECTION_ID)
      .eq('user_id', user.id)
      .single();

    if (existingData) {
      // Update existing
      const { data, error } = await supabase
        .from('weeks')
        .update({ selected_meals: body.selectedMeals })
        .eq('id', SELECTION_ID)
        .eq('user_id', user.id)
        .select('selected_meals')
        .single();

      if (error) throw error;
      return NextResponse.json({ selectedMeals: data.selected_meals || [] });
    } else {
      // Create new
      const { data, error } = await supabase
        .from('weeks')
        .insert({
          id: SELECTION_ID,
          user_id: user.id,
          start_date: new Date().toISOString(),
          end_date: new Date().toISOString(),
          selected_meals: body.selectedMeals,
        })
        .select('selected_meals')
        .single();

      if (error) throw error;
      return NextResponse.json({ selectedMeals: data.selected_meals || [] });
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to update selection' },
      { status: 500 }
    );
  }
}
