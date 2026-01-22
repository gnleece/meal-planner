import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { Category } from '@/lib/types';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body: { name?: string; color?: string } = await request.json();

    if (!body.name?.trim() && !body.color) {
      return NextResponse.json({ error: 'Category name or color is required' }, { status: 400 });
    }

    // Get the current category to find its old name
    const { data: category, error: fetchError } = await supabase
      .from('categories')
      .select('name')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    const oldName = category.name;
    const updateData: { name?: string; color?: string } = {};

    if (body.name?.trim()) {
      updateData.name = body.name.trim();
    }
    if (body.color) {
      updateData.color = body.color;
    }

    // Update the category
    const { data, error } = await supabase
      .from('categories')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Category already exists' }, { status: 409 });
      }
      throw error;
    }

    // Update all meals that use this category if name changed
    if (updateData.name && oldName !== updateData.name) {
      await supabase
        .from('meals')
        .update({ category: updateData.name })
        .eq('user_id', user.id)
        .eq('category', oldName);
    }

    const updatedCategory: Category = {
      id: data.id,
      name: data.name,
      color: data.color || 'gray',
      userId: data.user_id,
      createdAt: data.created_at,
      displayOrder: data.display_order ?? 0,
    };

    return NextResponse.json(updatedCategory);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to update category' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // First, get the category to find its name
    const { data: category, error: fetchError } = await supabase
      .from('categories')
      .select('name')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    // Clear the category from all meals that use it
    await supabase
      .from('meals')
      .update({ category: null })
      .eq('user_id', user.id)
      .eq('category', category.name);

    // Delete the category
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to delete category' },
      { status: 500 }
    );
  }
}
