import Anthropic from '@anthropic-ai/sdk';

/*
 * Image tagging service using Claude Vision API
 * Integration: Replit Anthropic Integration (javascript_anthropic)
 * 
 * The newest Anthropic model is "claude-sonnet-4-20250514".
 * Using this model for vision-based artwork tag generation.
 * 
 * Note: Replit's Anthropic integration auto-provides the API key.
 * No manual ANTHROPIC_API_KEY configuration needed.
 */

// <important_do_not_delete>
const DEFAULT_MODEL_STR = "claude-sonnet-4-20250514";
// </important_do_not_delete>

// Replit's Anthropic integration auto-configures the API key
const anthropic = new Anthropic();

export async function generateTagsFromImage(base64Image: string, mimeType: string = 'image/jpeg'): Promise<string[]> {
  // Silently skip if API key not configured
  if (!process.env.ANTHROPIC_API_KEY) {
    return [];
  }

  try {
    const cleanBase64 = base64Image.replace(/^data:image\/\w+;base64,/, '');
    
    const response = await anthropic.messages.create({
      model: DEFAULT_MODEL_STR,
      max_tokens: 300,
      messages: [{
        role: "user",
        content: [
          {
            type: "text",
            text: `Analyze this artwork image and generate 5-10 descriptive tags. Focus on:
- Art style (e.g., abstract, minimalist, impressionist, modern art, contemporary)
- Dominant colors (e.g., beige, gold, navy, earth tones, pastels)
- Mood/atmosphere (e.g., calming, vibrant, serene, dramatic, cozy)
- Subject matter if applicable (e.g., landscape, portrait, floral, geometric)

Return ONLY a JSON array of lowercase tag strings, no explanation. Example: ["abstract", "beige", "gold", "calming", "modern art", "geometric"]`
          },
          {
            type: "image",
            source: {
              type: "base64",
              media_type: mimeType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
              data: cleanBase64
            }
          }
        ]
      }]
    });

    console.log('[ImageTagging] API Response received');
    console.log('[ImageTagging] Response content:', JSON.stringify(response.content, null, 2));

    const textContent = response.content.find(block => block.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      console.warn('[ImageTagging] No text response from AI');
      return [];
    }

    const jsonMatch = textContent.text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.warn('[ImageTagging] Could not parse tags from response:', textContent.text);
      return [];
    }

    const tags = JSON.parse(jsonMatch[0]) as string[];
    
    const cleanTags = tags
      .filter((tag): tag is string => typeof tag === 'string')
      .map(tag => tag.toLowerCase().trim())
      .filter(tag => tag.length > 0 && tag.length < 50)
      .slice(0, 10);

    console.log('[ImageTagging] Generated tags:', cleanTags);
    return cleanTags;
  } catch (error: any) {
    // Graceful fallback - don't break upload if AI fails
    console.error('[ImageTagging] Error generating tags (continuing without tags):', error.message);
    return [];
  }
}
