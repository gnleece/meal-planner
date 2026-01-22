import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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
