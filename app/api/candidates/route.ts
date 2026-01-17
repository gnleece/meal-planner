import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('meal_candidates')
      .select('meal_id')
      .eq('user_id', user.id);

    if (error) {
      throw error;
    }

    const candidateMealIds = data.map((row: any) => row.meal_id);

    return NextResponse.json({ mealIds: candidateMealIds });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch candidates' },
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

    const body = await request.json();
    const { mealId } = body;

    if (!mealId) {
      return NextResponse.json({ error: 'mealId is required' }, { status: 400 });
    }

    // Verify the meal belongs to the user
    const { data: meal, error: mealError } = await supabase
      .from('meals')
      .select('id')
      .eq('id', mealId)
      .eq('user_id', user.id)
      .single();

    if (mealError || !meal) {
      return NextResponse.json({ error: 'Meal not found' }, { status: 404 });
    }

    // Insert candidate (idempotent - will ignore if already exists due to primary key)
    const { error: insertError } = await supabase
      .from('meal_candidates')
      .insert({
        user_id: user.id,
        meal_id: mealId,
      })
      .select()
      .single();

    // Ignore duplicate key errors (idempotent operation)
    if (insertError && insertError.code !== '23505') {
      throw insertError;
    }

    return NextResponse.json({ success: true, mealId });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to add candidate' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const mealId = searchParams.get('mealId');

    if (!mealId) {
      return NextResponse.json({ error: 'mealId is required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('meal_candidates')
      .delete()
      .eq('user_id', user.id)
      .eq('meal_id', mealId);

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true, mealId });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to remove candidate' },
      { status: 500 }
    );
  }
}
