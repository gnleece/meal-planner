import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { Category } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('user_id', user.id)
      .order('name', { ascending: true });

    if (error) {
      throw error;
    }

    const categories: Category[] = data.map((row: any) => ({
      id: row.id,
      name: row.name,
      color: row.color || 'gray',
      userId: row.user_id,
      createdAt: row.created_at,
    }));

    return NextResponse.json(categories);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch categories' },
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

    const body: { name: string; color?: string } = await request.json();

    if (!body.name || !body.name.trim()) {
      return NextResponse.json({ error: 'Category name is required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('categories')
      .insert({
        user_id: user.id,
        name: body.name.trim(),
        color: body.color || 'gray',
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Category already exists' }, { status: 409 });
      }
      throw error;
    }

    const category: Category = {
      id: data.id,
      name: data.name,
      color: data.color || 'gray',
      userId: data.user_id,
      createdAt: data.created_at,
    };

    return NextResponse.json(category, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to create category' },
      { status: 500 }
    );
  }
}
