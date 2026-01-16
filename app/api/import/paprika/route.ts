import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'File is required' }, { status: 400 });
    }

    // Read file content
    const text = await file.text();
    
    // Try to parse as JSON first (newer Paprika format)
    let recipes: any[] = [];
    try {
      const jsonData = JSON.parse(text);
      if (Array.isArray(jsonData)) {
        recipes = jsonData;
      } else if (jsonData.recipes && Array.isArray(jsonData.recipes)) {
        recipes = jsonData.recipes;
      } else {
        return NextResponse.json(
          { error: 'Invalid Paprika export format' },
          { status: 400 }
        );
      }
    } catch {
      // Try to parse as XML (older Paprika format)
      try {
        recipes = parsePaprikaXML(text);
      } catch (error: any) {
        return NextResponse.json(
          { error: `Failed to parse Paprika file: ${error.message}` },
          { status: 400 }
        );
      }
    }

    // Transform Paprika recipes to our format
    const meals = recipes.map((recipe: any) => ({
      name: recipe.name || recipe.Name || 'Untitled Recipe',
      photoUrl: recipe.image_url || recipe.image || recipe.Image || '',
      estimatedCookingTime: parsePaprikaTime(recipe.total_time || recipe.TotalTime || recipe.cook_time || recipe.CookTime),
      ingredients: parsePaprikaIngredients(recipe.ingredients || recipe.Ingredients),
      instructions: parsePaprikaInstructions(recipe.directions || recipe.Directions || recipe.instructions || recipe.Instructions),
      source: {
        type: 'paprika' as const,
        originalData: recipe,
      },
      tags: recipe.categories ? (Array.isArray(recipe.categories) ? recipe.categories : [recipe.categories]) : [],
    }));

    return NextResponse.json({ meals });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to import Paprika recipes' },
      { status: 500 }
    );
  }
}

function parsePaprikaXML(xml: string): any[] {
  // Basic XML parsing - in production, use a proper XML parser
  // This is a simplified version
  const recipeMatches = xml.match(/<recipe[^>]*>[\s\S]*?<\/recipe>/gi);
  if (!recipeMatches) {
    throw new Error('No recipes found in XML');
  }

  return recipeMatches.map((recipeXml) => {
    const getValue = (tag: string) => {
      const match = recipeXml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'));
      return match ? match[1].trim() : '';
    };

    return {
      name: getValue('name'),
      image: getValue('image'),
      total_time: getValue('total_time'),
      ingredients: getValue('ingredients'),
      directions: getValue('directions'),
      categories: getValue('categories'),
    };
  });
}

function parsePaprikaTime(timeString: string | number | undefined): number {
  if (!timeString) return 0;
  if (typeof timeString === 'number') return timeString;
  
  // Paprika stores time in various formats
  const hourMatch = String(timeString).match(/(\d+)\s*h/i);
  const minuteMatch = String(timeString).match(/(\d+)\s*m/i);
  
  const hours = hourMatch ? parseInt(hourMatch[1], 10) : 0;
  const minutes = minuteMatch ? parseInt(minuteMatch[1], 10) : 0;
  
  return hours * 60 + minutes;
}

function parsePaprikaIngredients(ingredients: string | any[] | undefined): any[] {
  if (!ingredients) return [];
  
  if (Array.isArray(ingredients)) {
    return ingredients.map((ing) => ({
      name: typeof ing === 'string' ? ing : ing.name || ing.text || String(ing),
    }));
  }
  
  if (typeof ingredients === 'string') {
    // Split by newlines or bullets
    return ingredients
      .split(/\n|•|[-*]/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .map((line) => ({ name: line }));
  }
  
  return [];
}

function parsePaprikaInstructions(instructions: string | any[] | undefined): string[] {
  if (!instructions) return [];
  
  if (Array.isArray(instructions)) {
    return instructions.map((inst) => String(inst));
  }
  
  if (typeof instructions === 'string') {
    // Split by newlines or numbered steps
    return instructions
      .split(/\n|\d+\./)
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
  }
  
  return [];
}
