import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import * as cheerio from 'cheerio';

// Scrape recipe from URL using Schema.org/JSON-LD structured data
async function scrapeRecipe(url: string) {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.statusText}`);
    }
    
    const html = await response.text();
    const $ = cheerio.load(html);
    
    // Try to find JSON-LD structured data (Schema.org Recipe)
    let recipeData: any = null;
    
    $('script[type="application/ld+json"]').each((_, el) => {
      try {
        const json = JSON.parse($(el).html() || '{}');
        if (json['@type'] === 'Recipe' || json['@graph']) {
          // Handle @graph array
          if (json['@graph']) {
            recipeData = json['@graph'].find((item: any) => item['@type'] === 'Recipe') || json;
          } else {
            recipeData = json;
          }
          return false; // Break loop
        }
      } catch {
        // Invalid JSON, continue
      }
    });
    
    // If no structured data, try to extract from common HTML patterns
    if (!recipeData) {
      recipeData = {
        name: $('h1').first().text().trim() || $('title').text().trim(),
        image: $('meta[property="og:image"]').attr('content') || $('img').first().attr('src') || '',
        description: $('meta[property="og:description"]').attr('content') || '',
      };
    }
    
    // Extract ingredients
    let ingredients: string[] = [];
    if (recipeData.recipeIngredient) {
      ingredients = Array.isArray(recipeData.recipeIngredient)
        ? recipeData.recipeIngredient
        : [recipeData.recipeIngredient];
    } else {
      // Try to find ingredients in HTML
      $('[itemprop="recipeIngredient"], .ingredient, .ingredients li').each((_, el) => {
        const text = $(el).text().trim();
        if (text) ingredients.push(text);
      });
    }
    
    // Extract instructions
    let instructions: string[] = [];
    if (recipeData.recipeInstructions) {
      if (Array.isArray(recipeData.recipeInstructions)) {
        instructions = recipeData.recipeInstructions.map((inst: any) => {
          if (typeof inst === 'string') return inst;
          if (inst.text) return inst.text;
          if (inst['@type'] === 'HowToStep' && inst.text) return inst.text;
          return String(inst);
        });
      } else {
        instructions = [String(recipeData.recipeInstructions)];
      }
    } else {
      // Try to find instructions in HTML
      $('[itemprop="recipeInstructions"] li, .instructions li, .steps li').each((_, el) => {
        const text = $(el).text().trim();
        if (text) instructions.push(text);
      });
    }
    
    // Extract time
    let totalTime = '';
    if (recipeData.totalTime) {
      totalTime = recipeData.totalTime;
    } else if (recipeData.prepTime || recipeData.cookTime) {
      totalTime = recipeData.totalTime || `${recipeData.prepTime || ''} ${recipeData.cookTime || ''}`.trim();
    }
    
    return {
      name: recipeData.name || $('h1').first().text().trim() || 'Untitled Recipe',
      image: recipeData.image || $('meta[property="og:image"]').attr('content') || '',
      totalTime: totalTime,
      ingredients: ingredients,
      instructions: instructions,
    };
  } catch (error: any) {
    throw new Error(`Failed to scrape recipe: ${error.message}`);
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { url } = await request.json();

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // Try to scrape the recipe
    let recipe;
    try {
      recipe = await scrapeRecipe(url);
    } catch (error: any) {
      return NextResponse.json(
        { error: `Failed to scrape recipe: ${error.message}` },
        { status: 400 }
      );
    }

    if (!recipe) {
      return NextResponse.json(
        { error: 'Could not extract recipe from URL' },
        { status: 400 }
      );
    }

    // Transform scraped recipe to our format
    const mealData = {
      name: recipe.name || 'Untitled Recipe',
      photoUrl: recipe.image || '',
      estimatedCookingTime: recipe.totalTime ? parseTimeToMinutes(recipe.totalTime) : 0,
      ingredients: (recipe.ingredients || []).map((ing: string) => ({
        name: ing,
      })),
      instructions: recipe.instructions || [],
      source: {
        type: 'url' as const,
        url: url,
        originalData: recipe,
      },
      tags: [],
    };

    return NextResponse.json(mealData);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to import recipe from URL' },
      { status: 500 }
    );
  }
}

function parseTimeToMinutes(timeString: string): number {
  // Try to parse time strings like "1 hour 30 minutes", "45 min", etc.
  const hourMatch = timeString.match(/(\d+)\s*h/i);
  const minuteMatch = timeString.match(/(\d+)\s*m/i);
  
  const hours = hourMatch ? parseInt(hourMatch[1], 10) : 0;
  const minutes = minuteMatch ? parseInt(minuteMatch[1], 10) : 0;
  
  return hours * 60 + minutes;
}
