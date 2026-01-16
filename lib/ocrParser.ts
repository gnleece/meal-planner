/**
 * Attempts to parse OCR-extracted text into a structured recipe format
 */
export function parseOCRText(text: string): {
  name: string;
  ingredients: string[];
  instructions: string[];
  estimatedCookingTime: number;
} {
  const lines = text.split('\n').map((line) => line.trim()).filter((line) => line.length > 0);
  
  let name = '';
  let ingredients: string[] = [];
  let instructions: string[] = [];
  let estimatedCookingTime = 0;

  // Try to find recipe name (usually at the top, might be in all caps or have special formatting)
  if (lines.length > 0) {
    // First line might be the name if it's short and doesn't look like an ingredient
    const firstLine = lines[0];
    if (firstLine.length < 100 && !firstLine.match(/^\d+[\/\.]/)) {
      name = firstLine;
    }
  }

  // Look for common section headers
  const ingredientsStart = lines.findIndex((line) =>
    /ingredients?/i.test(line)
  );
  const instructionsStart = lines.findIndex((line) =>
    /(instructions?|directions?|method|steps?)/i.test(line)
  );
  const timeMatch = text.match(/(\d+)\s*(?:min|minute|hour|hr)/i);
  if (timeMatch) {
    estimatedCookingTime = parseInt(timeMatch[1], 10);
    if (/hour|hr/i.test(text.substring(timeMatch.index || 0))) {
      estimatedCookingTime *= 60;
    }
  }

  // Extract ingredients
  if (ingredientsStart !== -1) {
    const endIndex = instructionsStart !== -1 ? instructionsStart : lines.length;
    ingredients = lines
      .slice(ingredientsStart + 1, endIndex)
      .filter((line) => {
        // Filter out lines that look like section headers
        return !/(instructions?|directions?|method|steps?|preparation|cooking)/i.test(line);
      })
      .map((line) => {
        // Remove common bullet points and numbering
        return line.replace(/^[•\-\*\d+\.\)]\s*/, '').trim();
      })
      .filter((line) => line.length > 0);
  } else {
    // Try to guess ingredients (lines that look like ingredient lists)
    // Usually have numbers, fractions, or units
    ingredients = lines
      .filter((line) => {
        return (
          /^\d+/.test(line) ||
          /cup|tbsp|tsp|oz|lb|gram|kg|ml|l|pound|ounce|teaspoon|tablespoon/i.test(line)
        );
      })
      .slice(0, 20) // Limit to first 20 potential ingredients
      .map((line) => line.replace(/^[•\-\*\d+\.\)]\s*/, '').trim());
  }

  // Extract instructions
  if (instructionsStart !== -1) {
    instructions = lines
      .slice(instructionsStart + 1)
      .filter((line) => {
        // Filter out lines that look like section headers
        return !/(ingredients?|nutrition|serves|prep|cook)/i.test(line);
      })
      .map((line) => {
        // Remove common numbering
        return line.replace(/^\d+[\.\)]\s*/, '').trim();
      })
      .filter((line) => line.length > 0);
  } else {
    // Try to find numbered steps
    instructions = lines
      .filter((line) => {
        return /^\d+[\.\)]/.test(line) || /^step\s+\d+/i.test(line);
      })
      .map((line) => {
        return line.replace(/^\d+[\.\)]\s*|^step\s+\d+:\s*/i, '').trim();
      })
      .filter((line) => line.length > 0);
  }

  // If we couldn't find structured sections, try to split by common patterns
  if (ingredients.length === 0 && instructions.length === 0 && lines.length > 0) {
    // Assume first half might be ingredients, second half instructions
    const midpoint = Math.floor(lines.length / 2);
    ingredients = lines.slice(0, midpoint).filter((line) => line.length < 100);
    instructions = lines.slice(midpoint).filter((line) => line.length > 10);
  }

  return {
    name: name || 'Untitled Recipe',
    ingredients,
    instructions,
    estimatedCookingTime,
  };
}
