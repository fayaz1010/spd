/**
 * AI Image Generator using Gemini 2.5 Flash
 * 
 * Generates images and infographics for blog articles
 * Includes detailed prompts with location context
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

export interface ImageRequirement {
  type: 'hero' | 'infographic' | 'comparison' | 'diagram' | 'location';
  topic: string;
  placement: 'INTRO' | 'SECTION_1' | 'SECTION_2' | 'SECTION_3' | 'CONCLUSION';
  prompt: string;
  altText: string;
  caption?: string;
  filename: string;
  location?: string; // Perth-specific context
}

export interface GeneratedImage {
  url: string;
  base64?: string;
  altText: string;
  caption?: string;
  filename: string;
  width: number;
  height: number;
}

/**
 * Generate image requirements during strategy planning
 */
export async function generateImageRequirements(
  articleTitle: string,
  articleType: 'PILLAR' | 'CLUSTER',
  sections: Array<{ heading: string; keyPoints: string[] }>,
  keywords: string[],
  location: string = 'Perth, Western Australia'
): Promise<ImageRequirement[]> {
  const requirements: ImageRequirement[] = [];

  // 1. Hero Image (always)
  requirements.push({
    type: 'hero',
    topic: articleTitle,
    placement: 'INTRO',
    prompt: generateHeroImagePrompt(articleTitle, keywords, location),
    altText: generateAltText('hero', articleTitle, keywords, location),
    caption: `${articleTitle} - ${location}`,
    filename: `hero-${slugify(articleTitle)}.jpg`,
    location,
  });

  // 2. Infographic (for data/statistics sections)
  const dataSection = sections.find(s => 
    s.heading.toLowerCase().includes('cost') ||
    s.heading.toLowerCase().includes('saving') ||
    s.heading.toLowerCase().includes('benefit') ||
    s.heading.toLowerCase().includes('comparison')
  );

  if (dataSection) {
    requirements.push({
      type: 'infographic',
      topic: dataSection.heading,
      placement: 'SECTION_2',
      prompt: generateInfographicPrompt(dataSection, keywords, location),
      altText: generateAltText('infographic', dataSection.heading, keywords, location),
      caption: dataSection.heading,
      filename: `infographic-${slugify(dataSection.heading)}.jpg`,
      location,
    });
  }

  // 3. Location-specific image (Perth context)
  if (articleType === 'PILLAR') {
    requirements.push({
      type: 'location',
      topic: `Solar installation in ${location}`,
      placement: 'SECTION_1',
      prompt: generateLocationImagePrompt(articleTitle, location),
      altText: generateAltText('location', articleTitle, keywords, location),
      caption: `Professional solar installation in ${location}`,
      filename: `location-${slugify(location)}.jpg`,
      location,
    });
  }

  // 4. Comparison diagram (if applicable)
  const comparisonSection = sections.find(s =>
    s.heading.toLowerCase().includes('vs') ||
    s.heading.toLowerCase().includes('comparison') ||
    s.heading.toLowerCase().includes('types')
  );

  if (comparisonSection) {
    requirements.push({
      type: 'comparison',
      topic: comparisonSection.heading,
      placement: 'SECTION_3',
      prompt: generateComparisonPrompt(comparisonSection, keywords),
      altText: generateAltText('comparison', comparisonSection.heading, keywords, location),
      caption: comparisonSection.heading,
      filename: `comparison-${slugify(comparisonSection.heading)}.jpg`,
    });
  }

  // 5. Process diagram (for pillar articles)
  if (articleType === 'PILLAR') {
    requirements.push({
      type: 'diagram',
      topic: 'Installation process',
      placement: 'CONCLUSION',
      prompt: generateProcessDiagramPrompt(articleTitle, location),
      altText: generateAltText('diagram', 'installation process', keywords, location),
      caption: 'Step-by-step installation process',
      filename: `process-${slugify(articleTitle)}.jpg`,
      location,
    });
  }

  return requirements;
}

/**
 * Generate hero image prompt
 */
function generateHeroImagePrompt(title: string, keywords: string[], location: string): string {
  return `Create a professional, high-quality hero image for a blog article about "${title}".

STYLE: Modern, clean, professional photography style
SUBJECT: Solar panels installed on a residential rooftop in ${location}
SETTING: Bright sunny day with clear blue sky, typical ${location} suburban home
COMPOSITION: Wide angle shot showing solar panels, roof, and partial house view
LIGHTING: Natural sunlight, golden hour lighting, vibrant colors
MOOD: Optimistic, clean energy, modern technology
QUALITY: Ultra high resolution, sharp focus, professional photography

SPECIFIC ELEMENTS:
- Modern black-framed solar panels (monocrystalline)
- Red tile or Colorbond roof (typical ${location} architecture)
- Clear blue sky with few white clouds
- Partial view of modern Australian home
- Professional installation (neat cable management)
- ${location} landscape visible in background

KEYWORDS TO EMPHASIZE: ${keywords.join(', ')}

DO NOT INCLUDE: Text, logos, watermarks, people, or brand names
ASPECT RATIO: 16:9 (1200x675px)`;
}

/**
 * Generate infographic prompt
 */
function generateInfographicPrompt(
  section: { heading: string; keyPoints: string[] },
  keywords: string[],
  location: string
): string {
  return `Create a clean, modern infographic for "${section.heading}".

STYLE: Flat design, minimalist, professional business infographic
COLOR SCHEME: 
- Primary: Coral/Orange (#FF6B6B) - Sun Direct Power brand
- Secondary: Blue (#4A90E2) - Trust and energy
- Accent: Green (#4CAF50) - Savings and environment
- Background: White with subtle gradients

LAYOUT: Vertical infographic, easy to read, clear hierarchy

CONTENT TO VISUALIZE:
${section.keyPoints.map((point, i) => `${i + 1}. ${point}`).join('\n')}

ELEMENTS TO INCLUDE:
- Clear title at top: "${section.heading}"
- Icons for each key point (solar panel, money, house, battery, etc.)
- Statistics/numbers in large, bold fonts
- Progress bars or comparison charts
- Location reference: "${location}"
- Clean section dividers

DESIGN REQUIREMENTS:
- Professional business style
- Easy to scan and understand
- Mobile-friendly layout
- High contrast for readability
- Modern sans-serif fonts
- Consistent spacing and alignment

DO NOT INCLUDE: Stock photos, complex backgrounds, cluttered design
ASPECT RATIO: 9:16 (675x1200px) - Vertical infographic`;
}

/**
 * Generate location-specific image prompt
 */
function generateLocationImagePrompt(title: string, location: string): string {
  return `Create a professional image showing solar installation in ${location}.

STYLE: Professional photography, documentary style
SUBJECT: Solar installation team working on a ${location} home
SETTING: Typical ${location} residential area, sunny day
COMPOSITION: Medium shot showing installers, solar panels, and home

SPECIFIC ${location.toUpperCase()} ELEMENTS:
- Typical Perth/WA architecture (brick, tile roof, or Colorbond)
- Clear blue sky (Perth has 3,200+ sunshine hours/year)
- Native Australian vegetation in background
- Modern suburban setting
- Professional installation crew in branded uniforms
- Safety equipment (harnesses, helmets)

MOOD: Professional, trustworthy, local expertise
QUALITY: High resolution, natural lighting, authentic

CONTEXT: This is for an article about "${title}" specifically for ${location} residents

DO NOT INCLUDE: Fake-looking stock photos, generic locations, text overlays
ASPECT RATIO: 4:3 (1200x900px)`;
}

/**
 * Generate comparison diagram prompt
 */
function generateComparisonPrompt(
  section: { heading: string; keyPoints: string[] },
  keywords: string[]
): string {
  return `Create a clean comparison diagram for "${section.heading}".

STYLE: Modern comparison chart, side-by-side layout
COLOR SCHEME: 
- Option A: Blue (#4A90E2)
- Option B: Orange (#FF6B6B)
- Background: Light gray (#F5F5F5)

LAYOUT: Two-column comparison with clear visual separation

COMPARISON POINTS:
${section.keyPoints.map((point, i) => `${i + 1}. ${point}`).join('\n')}

VISUAL ELEMENTS:
- Clear headers for each option
- Icons or images representing each option
- Checkmarks (✓) for advantages
- Cross marks (✗) for disadvantages
- Rating stars or progress bars
- Price comparison if applicable
- Summary boxes at bottom

DESIGN REQUIREMENTS:
- Easy to scan left-to-right
- Clear visual hierarchy
- Consistent spacing
- Professional business style
- Mobile-friendly

DO NOT INCLUDE: Complex charts, too much text, cluttered design
ASPECT RATIO: 16:9 (1200x675px)`;
}

/**
 * Generate process diagram prompt
 */
function generateProcessDiagramPrompt(title: string, location: string): string {
  return `Create a step-by-step process diagram for solar installation in ${location}.

STYLE: Clean flowchart, modern process diagram
COLOR SCHEME: Coral (#FF6B6B) primary, Blue (#4A90E2) secondary

STEPS TO SHOW:
1. Free Consultation & Quote
2. Site Assessment
3. System Design
4. Approvals & Permits
5. Installation (1-2 days)
6. Inspection & Connection
7. Monitoring & Support

VISUAL ELEMENTS:
- Numbered circles for each step
- Arrows connecting steps (left-to-right or top-to-bottom)
- Icons for each step (phone, house, blueprint, document, tools, checkmark, chart)
- Timeline indicator (e.g., "Week 1", "Week 2")
- Brief description under each step (5-10 words)

DESIGN REQUIREMENTS:
- Clear progression flow
- Professional business style
- Easy to understand at a glance
- Consistent spacing
- Modern, clean design

CONTEXT: ${location} specific solar installation process

DO NOT INCLUDE: Complex flowcharts, too much text, confusing layouts
ASPECT RATIO: 16:9 (1200x675px)`;
}

/**
 * Generate SEO-optimized alt text
 */
function generateAltText(
  imageType: string,
  topic: string,
  keywords: string[],
  location: string
): string {
  const primaryKeyword = keywords[0] || 'solar panels';
  
  const templates: Record<string, string> = {
    hero: `${primaryKeyword} installed on ${location} home with clear blue sky`,
    infographic: `Infographic showing ${topic} for ${location} residents`,
    location: `Professional solar installation team working on ${location} residential property`,
    comparison: `Comparison chart of ${topic} for ${location} homeowners`,
    diagram: `Step-by-step ${topic} process diagram for ${location}`,
  };

  return templates[imageType] || `${topic} - ${location}`;
}

/**
 * Slugify text for filenames
 */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 50);
}

/**
 * Generate images using Gemini 2.5 Flash
 */
export async function generateImagesWithGemini(
  requirements: ImageRequirement[],
  apiKey: string
): Promise<GeneratedImage[]> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  const generatedImages: GeneratedImage[] = [];

  for (const req of requirements) {
    try {
      console.log(`Generating ${req.type} image: ${req.filename}`);

      // Generate image using Gemini
      const result = await model.generateContent({
        contents: [{
          role: 'user',
          parts: [{
            text: `Generate an image based on this prompt:\n\n${req.prompt}\n\nReturn the image in base64 format.`
          }]
        }]
      });

      const response = await result.response;
      const imageData = response.text(); // This would contain base64 image data

      // In production, you'd save this to cloud storage (S3, Cloudinary, etc.)
      // For now, we'll create a placeholder URL
      const imageUrl = `/api/images/${req.filename}`;

      generatedImages.push({
        url: imageUrl,
        base64: imageData,
        altText: req.altText,
        caption: req.caption,
        filename: req.filename,
        width: req.type === 'infographic' ? 675 : 1200,
        height: req.type === 'infographic' ? 1200 : 675,
      });

      console.log(`✓ Generated ${req.type} image: ${req.filename}`);
    } catch (error) {
      console.error(`Failed to generate ${req.type} image:`, error);
      // Continue with other images even if one fails
    }
  }

  return generatedImages;
}

/**
 * Insert images into article content at specified placements
 */
export function insertImagesIntoContent(
  content: string,
  images: GeneratedImage[],
  placements: ImageRequirement[]
): string {
  let updatedContent = content;

  // Split content into sections
  const sections = splitContentBySections(content);

  placements.forEach((placement, index) => {
    const image = images[index];
    if (!image) return;

    const imageHtml = generateImageHTML(image);
    
    // Insert at specified placement
    switch (placement.placement) {
      case 'INTRO':
        // Insert after first paragraph
        updatedContent = insertAfterFirstParagraph(updatedContent, imageHtml);
        break;
      case 'SECTION_1':
        updatedContent = insertAfterSection(updatedContent, 1, imageHtml);
        break;
      case 'SECTION_2':
        updatedContent = insertAfterSection(updatedContent, 2, imageHtml);
        break;
      case 'SECTION_3':
        updatedContent = insertAfterSection(updatedContent, 3, imageHtml);
        break;
      case 'CONCLUSION':
        updatedContent = insertBeforeConclusion(updatedContent, imageHtml);
        break;
    }
  });

  return updatedContent;
}

/**
 * Generate responsive image HTML with SEO optimization
 */
function generateImageHTML(image: GeneratedImage): string {
  return `
<figure class="article-image" style="margin: 2em 0; text-align: center;">
  <img 
    src="${image.url}" 
    alt="${image.altText}"
    width="${image.width}"
    height="${image.height}"
    loading="lazy"
    style="max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);"
  />
  ${image.caption ? `<figcaption style="margin-top: 0.5em; font-size: 0.9em; color: #666; font-style: italic;">${image.caption}</figcaption>` : ''}
</figure>
`;
}

/**
 * Helper: Split content by sections
 */
function splitContentBySections(content: string): string[] {
  return content.split(/<h2[^>]*>/gi);
}

/**
 * Helper: Insert after first paragraph
 */
function insertAfterFirstParagraph(content: string, html: string): string {
  const firstPEnd = content.indexOf('</p>');
  if (firstPEnd === -1) return content;
  return content.slice(0, firstPEnd + 4) + '\n\n' + html + '\n\n' + content.slice(firstPEnd + 4);
}

/**
 * Helper: Insert after specific section
 */
function insertAfterSection(content: string, sectionNumber: number, html: string): string {
  const h2Tags = content.match(/<h2[^>]*>.*?<\/h2>/gi) || [];
  if (h2Tags.length < sectionNumber) return content;

  const targetH2 = h2Tags[sectionNumber - 1];
  const h2Index = content.indexOf(targetH2);
  
  // Find next paragraph after this h2
  const nextPEnd = content.indexOf('</p>', h2Index);
  if (nextPEnd === -1) return content;

  return content.slice(0, nextPEnd + 4) + '\n\n' + html + '\n\n' + content.slice(nextPEnd + 4);
}

/**
 * Helper: Insert before conclusion
 */
function insertBeforeConclusion(content: string, html: string): string {
  // Find last h2 (usually conclusion)
  const h2Tags = content.match(/<h2[^>]*>.*?<\/h2>/gi) || [];
  if (h2Tags.length === 0) return content;

  const lastH2 = h2Tags[h2Tags.length - 1];
  const lastH2Index = content.lastIndexOf(lastH2);

  return content.slice(0, lastH2Index) + '\n\n' + html + '\n\n' + content.slice(lastH2Index);
}
