import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { Meal } from '@/lib/types';
import { getImageUrl } from '@/lib/supabase/imageUtils';

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
      .from('meals')
      .select('*')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Meal not found' }, { status: 404 });
      }
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

    return NextResponse.json(meal);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch meal' },
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

    const body: Partial<Meal> = await request.json();

    const updateData: any = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.photoUrl !== undefined) updateData.photo_url = body.photoUrl;
    if (body.estimatedCookingTime !== undefined) updateData.estimated_cooking_time = body.estimatedCookingTime;
    if (body.ingredients !== undefined) updateData.ingredients = body.ingredients;
    if (body.instructions !== undefined) updateData.instructions = body.instructions;
    if (body.source !== undefined) updateData.source = body.source;
    if (body.tags !== undefined) updateData.tags = body.tags;
    if (body.selectedForWeek !== undefined) updateData.selected_for_week = body.selectedForWeek || null;

    const { data, error } = await supabase
      .from('meals')
      .update(updateData)
      .eq('id', params.id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Meal not found' }, { status: 404 });
      }
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

    return NextResponse.json(meal);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to update meal' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { error } = await supabase
      .from('meals')
      .delete()
      .eq('id', params.id)
      .eq('user_id', user.id);

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to delete meal' },
      { status: 500 }
    );
  }
}
