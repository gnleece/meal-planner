import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { Meal } from '@/lib/types';
import { getImageUrl } from '@/lib/supabase/imageUtils';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('meals')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    // Transform database format to Meal type and convert image URLs
    const meals: Meal[] = await Promise.all(
      data.map(async (row: any) => {
        const photoUrl = row.photo_url ? await getImageUrl(row.photo_url) : '';
        return {
          id: row.id,
          name: row.name,
          photoUrl,
          estimatedCookingTime: row.estimated_cooking_time,
          ingredients: row.ingredients || [],
          instructions: row.instructions || [],
          source: row.source || { type: 'manual' },
          tags: row.tags || [],
          createdAt: row.created_at,
          updatedAt: row.updated_at,
          selectedForWeek: row.selected_for_week || undefined,
          userId: row.user_id,
        };
      })
    );

    return NextResponse.json(meals);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch meals' },
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

    const body: Omit<Meal, 'id' | 'userId' | 'createdAt' | 'updatedAt'> = await request.json();

    const { data, error } = await supabase
      .from('meals')
      .insert({
        user_id: user.id,
        name: body.name,
        photo_url: body.photoUrl,
        estimated_cooking_time: body.estimatedCookingTime,
        ingredients: body.ingredients,
        instructions: body.instructions,
        source: body.source,
        tags: body.tags || [],
        selected_for_week: body.selectedForWeek || null,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    const photoUrl = data.photo_url ? await getImageUrl(data.photo_url) : '';

    const meal: Meal = {
      id: data.id,
      name: data.name,
      photoUrl,
      estimatedCookingTime: data.estimated_cooking_time,
      ingredients: data.ingredients || [],
      instructions: data.instructions || [],
      source: data.source || { type: 'manual' },
      tags: data.tags || [],
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      selectedForWeek: data.selected_for_week || undefined,
      userId: data.user_id,
    };

    return NextResponse.json(meal, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to create meal' },
      { status: 500 }
    );
  }
}
