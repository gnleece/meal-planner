import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { Week } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('weeks')
      .select('*')
      .eq('user_id', user.id)
      .order('start_date', { ascending: false });

    if (error) {
      throw error;
    }

    const weeks: Week[] = data.map((row: any) => ({
      id: row.id,
      startDate: row.start_date,
      endDate: row.end_date,
      selectedMeals: row.selected_meals || [],
      userId: row.user_id,
    }));

    return NextResponse.json(weeks);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch weeks' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: Omit<Week, 'userId'> = await request.json();

    const { data, error } = await supabase
      .from('weeks')
      .insert({
        id: body.id,
        user_id: user.id,
        start_date: body.startDate,
        end_date: body.endDate,
        selected_meals: body.selectedMeals,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    const week: Week = {
      id: data.id,
      startDate: data.start_date,
      endDate: data.end_date,
      selectedMeals: data.selected_meals || [],
      userId: data.user_id,
    };

    return NextResponse.json(week, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to create week' },
      { status: 500 }
    );
  }
}
