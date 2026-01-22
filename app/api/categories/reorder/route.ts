import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: { categoryIds: string[] } = await request.json();

    if (!body.categoryIds || !Array.isArray(body.categoryIds)) {
      return NextResponse.json({ error: 'categoryIds array is required' }, { status: 400 });
    }

    // Update each category's display_order based on its position in the array
    const updates = body.categoryIds.map((id, index) =>
      supabase
        .from('categories')
        .update({ display_order: index })
        .eq('id', id)
        .eq('user_id', user.id)
    );

    await Promise.all(updates);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to reorder categories' },
      { status: 500 }
    );
  }
}
