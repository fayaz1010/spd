/**
 * Keyword Naturalizer
 * 
 * Converts awkward keyword phrases into natural variations
 * that flow better in sentences while maintaining SEO value
 */

export interface KeywordVariation {
  original: string;
  variations: string[];
  contextExamples: string[];
}

/**
 * Generate natural variations of a keyword
 */
export function generateKeywordVariations(keyword: string): KeywordVariation {
  const words = keyword.toLowerCase().split(' ');
  const variations: string[] = [keyword]; // Include original
  const contextExamples: string[] = [];

  // Common patterns to fix
  const patterns = [
    // "solar panels perth" variations
    {
      match: /^(.+?)\s+(perth|wa|western australia)$/i,
      generate: (matches: RegExpMatchArray) => {
        const item = matches[1];
        const location = matches[2];
        return [
          `${item} in ${location}`,
          `${location} ${item}`,
          `${item} for ${location} homes`,
          `${item} across ${location}`,
          `${location}-based ${item}`,
          `${item} throughout ${location}`,
        ];
      },
      examples: (matches: RegExpMatchArray) => {
        const item = matches[1];
        const location = matches[2];
        return [
          `Looking for ${item} in ${location}?`,
          `${location} homeowners can benefit from ${item}`,
          `We install ${item} across ${location}`,
          `The best ${item} for ${location} homes`,
        ];
      },
    },
    
    // "solar installation perth" variations
    {
      match: /^(.+?)\s+installation\s+(perth|wa)$/i,
      generate: (matches: RegExpMatchArray) => {
        const item = matches[1];
        const location = matches[2];
        return [
          `${item} installation in ${location}`,
          `installing ${item} in ${location}`,
          `${location} ${item} installation`,
          `${item} installation services in ${location}`,
          `professional ${item} installation across ${location}`,
        ];
      },
      examples: (matches: RegExpMatchArray) => {
        const item = matches[1];
        const location = matches[2];
        return [
          `Our ${item} installation in ${location} is second to none`,
          `We specialize in installing ${item} in ${location}`,
          `${location} residents trust our ${item} installation services`,
        ];
      },
    },

    // "solar panels cost" variations
    {
      match: /^(.+?)\s+(cost|price|pricing)$/i,
      generate: (matches: RegExpMatchArray) => {
        const item = matches[1];
        const metric = matches[2];
        return [
          `${item} ${metric}`,
          `cost of ${item}`,
          `${item} ${metric}s`,
          `how much ${item} cost`,
          `${item} ${metric} breakdown`,
          `affordable ${item}`,
        ];
      },
      examples: (matches: RegExpMatchArray) => {
        const item = matches[1];
        return [
          `Understanding ${item} costs`,
          `How much do ${item} cost?`,
          `The cost of ${item} varies by...`,
          `Affordable ${item} options`,
        ];
      },
    },

    // "best solar panels" variations
    {
      match: /^best\s+(.+?)$/i,
      generate: (matches: RegExpMatchArray) => {
        const item = matches[1];
        return [
          `best ${item}`,
          `top ${item}`,
          `highest quality ${item}`,
          `premium ${item}`,
          `leading ${item}`,
          `top-rated ${item}`,
        ];
      },
      examples: (matches: RegExpMatchArray) => {
        const item = matches[1];
        return [
          `We offer the best ${item} available`,
          `Looking for top ${item}?`,
          `Our premium ${item} deliver exceptional performance`,
        ];
      },
    },
  ];

  // Try each pattern
  for (const pattern of patterns) {
    const match = keyword.match(pattern.match);
    if (match) {
      const generated = pattern.generate(match);
      variations.push(...generated);
      const examples = pattern.examples(match);
      contextExamples.push(...examples);
      break;
    }
  }

  // Generic variations (if no pattern matched)
  if (variations.length === 1) {
    // Add articles
    variations.push(`the ${keyword}`);
    variations.push(`your ${keyword}`);
    variations.push(`our ${keyword}`);
    
    // Add prepositions
    if (words.length > 1) {
      variations.push(`${words[0]} for ${words.slice(1).join(' ')}`);
      variations.push(`${words[0]} in ${words.slice(1).join(' ')}`);
    }

    // Generic examples
    contextExamples.push(
      `Learn about ${keyword}`,
      `Discover ${keyword} options`,
      `Expert ${keyword} solutions`
    );
  }

  return {
    original: keyword,
    variations: [...new Set(variations)], // Remove duplicates
    contextExamples: [...new Set(contextExamples)],
  };
}

/**
 * Get natural keyword instructions for AI
 */
export function getKeywordInstructions(keywords: string[]): string {
  const keywordData = keywords.map(k => generateKeywordVariations(k));
  
  let instructions = `KEYWORD USAGE GUIDELINES:

Target keywords: ${keywords.join(', ')}

CRITICAL: Use keywords NATURALLY. Never force awkward phrases.

Natural variations to use:
`;

  keywordData.forEach((kw, index) => {
    instructions += `\n${index + 1}. "${kw.original}" can be written as:
   - ${kw.variations.slice(0, 5).join('\n   - ')}
   
   Examples:
   - ${kw.contextExamples.slice(0, 3).join('\n   - ')}
`;
  });

  instructions += `\nRULES:
1. NEVER use awkward keyword phrases like "solar panels perth" directly
2. ALWAYS use natural variations like "solar panels in Perth" or "Perth solar panels"
3. Distribute keyword variations throughout the content
4. Prioritize readability over keyword density
5. Use synonyms and related terms naturally
6. Keywords should feel invisible to the reader

GOOD: "Looking for solar panels in Perth? Our team installs..."
BAD: "Solar panels perth are available from our solar panels perth team..."`;

  return instructions;
}

/**
 * Smooth awkward keywords in existing content
 */
export function smoothKeywords(content: string, keywords: string[]): string {
  let smoothed = content;

  keywords.forEach(keyword => {
    const variations = generateKeywordVariations(keyword);
    
    // Find awkward uses of the keyword
    const awkwardPatterns = [
      // "solar panels perth" without preposition
      new RegExp(`\\b${keyword}\\b(?!\\s+(in|for|across|throughout|of))`, 'gi'),
    ];

    awkwardPatterns.forEach(pattern => {
      const matches = [...smoothed.matchAll(pattern)];
      
      matches.forEach(match => {
        const original = match[0];
        const index = match.index!;
        
        // Check context - don't replace if already natural
        const before = smoothed.substring(Math.max(0, index - 20), index);
        const after = smoothed.substring(index + original.length, index + original.length + 20);
        
        // If it's in a heading or at start of sentence, use "Perth solar panels"
        if (before.match(/<h[1-6]>|^\s*|<p>\s*$/i)) {
          const words = keyword.split(' ');
          if (words.length === 2 && words[1].toLowerCase() === 'perth') {
            const replacement = `Perth ${words[0]}`;
            smoothed = smoothed.substring(0, index) + replacement + smoothed.substring(index + original.length);
          }
        }
        // If mid-sentence, add preposition
        else if (!before.match(/\b(in|for|across|of|the|our|your)\s*$/i)) {
          const words = keyword.split(' ');
          if (words.length === 2 && words[1].toLowerCase() === 'perth') {
            const replacement = `${words[0]} in Perth`;
            smoothed = smoothed.substring(0, index) + replacement + smoothed.substring(index + original.length);
          }
        }
      });
    });
  });

  return smoothed;
}

/**
 * Analyze keyword usage in content
 */
export function analyzeKeywordUsage(content: string, keywords: string[]): {
  keyword: string;
  count: number;
  awkwardCount: number;
  naturalCount: number;
  suggestions: string[];
} [] {
  const results: any[] = [];

  keywords.forEach(keyword => {
    const variations = generateKeywordVariations(keyword);
    
    // Count total occurrences
    const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
    const matches = content.match(regex) || [];
    const count = matches.length;

    // Count awkward uses (keyword without preposition/article)
    const awkwardRegex = new RegExp(`\\b${keyword}\\b(?!\\s+(in|for|across|throughout|of|the))`, 'gi');
    const awkwardMatches = content.match(awkwardRegex) || [];
    const awkwardCount = awkwardMatches.length;

    const naturalCount = count - awkwardCount;

    const suggestions: string[] = [];
    if (awkwardCount > 0) {
      suggestions.push(`Replace ${awkwardCount} awkward uses with natural variations`);
      suggestions.push(`Try: ${variations.variations.slice(1, 4).join(', ')}`);
    }
    if (count === 0) {
      suggestions.push(`Keyword not found - consider adding naturally`);
    }
    if (count > 10) {
      suggestions.push(`Keyword used ${count} times - may be over-optimized`);
    }

    results.push({
      keyword,
      count,
      awkwardCount,
      naturalCount,
      suggestions,
    });
  });

  return results;
}

/**
 * Get keyword density (percentage)
 */
export function getKeywordDensity(content: string, keyword: string): number {
  const words = content.split(/\s+/).length;
  const keywordCount = (content.match(new RegExp(`\\b${keyword}\\b`, 'gi')) || []).length;
  return (keywordCount / words) * 100;
}
