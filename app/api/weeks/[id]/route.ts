import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { Week } from '@/lib/types';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('weeks')
      .select('*')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Week not found' }, { status: 404 });
      }
      throw error;
    }

    const week: Week = {
      id: data.id,
      startDate: data.start_date,
      endDate: data.end_date,
      selectedMeals: data.selected_meals || [],
      userId: data.user_id,
    };

    return NextResponse.json(week);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch week' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: Partial<Week> = await request.json();

    const updateData: any = {};
    if (body.startDate !== undefined) updateData.start_date = body.startDate;
    if (body.endDate !== undefined) updateData.end_date = body.endDate;
    if (body.selectedMeals !== undefined) updateData.selected_meals = body.selectedMeals;

    const { data, error } = await supabase
      .from('weeks')
      .update(updateData)
      .eq('id', params.id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Week not found' }, { status: 404 });
      }
      throw error;
    }

    const week: Week = {
      id: data.id,
      startDate: data.start_date,
      endDate: data.end_date,
      selectedMeals: data.selected_meals || [],
      userId: data.user_id,
    };

    return NextResponse.json(week);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to update week' },
      { status: 500 }
    );
  }
}
