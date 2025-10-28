import { NextRequest, NextResponse } from 'next/server';
import { generateAIResponse } from '@/lib/ai';

/**
 * Bulk AI Content Generation API
 * Generates multiple FAQs, Case Studies, or Testimonials from scratch
 * with intelligent context about Perth solar market
 */
export async function POST(request: NextRequest) {
  try {
    const { type, count = 10, instructions } = await request.json();

    if (!type || !['faq', 'case-study', 'testimonial'].includes(type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid type. Must be faq, case-study, or testimonial' },
        { status: 400 }
      );
    }

    let prompt = '';
    let systemContext = `You are a content generator for Sun Direct Power, a premium solar installation company in Perth, Western Australia.

COMPANY CONTEXT:
- Location: Perth, WA (Zone 3 solar rating)
- Services: Residential & commercial solar, battery storage, maintenance
- Service Areas: Perth metro, Joondalup, Fremantle, Rockingham, Mandurah
- Typical Systems: 6.6kW, 10kW, 13.2kW solar + 10-20kWh batteries
- Brands: Tier 1 panels (Trina, Jinko, Canadian Solar), Premium inverters (Fronius, SolarEdge, Huawei)
- Current Rebates (2025):
  * Federal SRES: ~$2,500-4,000 (varies by system size)
  * Federal Battery: $330/kWh usable (max 50kWh)
  * WA State Battery: $130/kWh usable (min 5kWh, combined cap $5,000)
- Installation Time: 1-2 days typical
- Warranty: 25 years panels, 10 years inverter, 10 years battery
- Average Payback: 3-5 years
- Electricity Rates: $0.28-0.32/kWh (peak), $0.08/kWh (feed-in tariff)

${instructions ? `\nADDITIONAL INSTRUCTIONS:\n${instructions}` : ''}`;

    switch (type) {
      case 'faq':
        prompt = `Generate ${count} realistic, market-relevant FAQs for a Perth solar company.

REQUIREMENTS:
1. Cover diverse topics: pricing, rebates, installation, technology, maintenance, ROI
2. Use Perth-specific information (suburbs, climate, regulations)
3. Include actual 2025 pricing ranges and rebate amounts
4. Answer common objections and concerns
5. Be specific and actionable

Return as JSON array:
[
  {
    "question": "How much do solar panels cost in Perth in 2025?",
    "answer": "Detailed answer with Perth-specific pricing...",
    "category": "pricing",
    "tags": ["cost", "perth", "2025"]
  }
]

Categories: solar, battery, installation, pricing, rebates, maintenance
Generate ${count} FAQs now:`;
        break;

      case 'case-study':
        prompt = `Generate ${count} realistic case studies for Perth solar installations.

REQUIREMENTS:
1. Use real Perth suburbs (Joondalup, Fremantle, Rockingham, Mandurah, Scarborough, etc.)
2. Realistic customer names (Australian names)
3. Common system sizes: 6.6kW, 10kW, 13.2kW + batteries (10-20kWh)
4. Real challenges: high bills, roof orientation, shading, old switchboard
5. Specific results: savings amounts, payback periods, CO2 reduction
6. Mix of residential and commercial (80/20 split)

Return as JSON array:
[
  {
    "title": "10kW Solar System Slashes Bills by 85% in Joondalup",
    "customerName": "Sarah Thompson",
    "location": "Joondalup, WA",
    "systemSize": 10,
    "panelCount": 26,
    "batterySize": 13.5,
    "description": "Brief overview...",
    "challenge": "What problem they faced...",
    "solution": "How we solved it...",
    "results": "Specific outcomes with numbers...",
    "category": "residential",
    "installDate": "2024-08-15"
  }
]

Generate ${count} case studies now:`;
        break;

      case 'testimonial':
        prompt = `Generate ${count} authentic-sounding customer testimonials for Perth solar installations.

REQUIREMENTS:
1. Sound natural and genuine (not overly promotional)
2. Mix of detailed and brief reviews
3. Include specific details: suburb, system size, installer experience
4. Mention real benefits: bill savings, environmental impact, service quality
5. Vary ratings (mostly 5-star, some 4-star with constructive feedback)
6. Use Australian English and local references

Return as JSON array:
[
  {
    "customerName": "Michael Chen",
    "rating": 5,
    "title": "Excellent service and great savings",
    "review": "Natural, authentic review text...",
    "location": "Fremantle, WA",
    "systemSize": 6.6
  }
]

Generate ${count} testimonials now:`;
        break;
    }

    console.log(`[Bulk Generate] Generating ${count} ${type}s...`);

    const response = await generateAIResponse([
      {
        role: 'system',
        content: systemContext,
      },
      {
        role: 'user',
        content: prompt,
      },
    ]);
    
    // Parse JSON from response
    let generatedContent;
    try {
      // Try to extract JSON from markdown code blocks
      const jsonMatch = response.content.match(/```json\n([\s\S]*?)\n```/) || 
                       response.content.match(/```\n([\s\S]*?)\n```/) ||
                       response.content.match(/\[[\s\S]*\]/);
      
      const jsonString = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : response.content;
      generatedContent = JSON.parse(jsonString);
    } catch (parseError) {
      console.error('[Bulk Generate] JSON parse error:', parseError);
      return NextResponse.json(
        { success: false, error: 'Failed to parse AI response as JSON', rawResponse: response.content },
        { status: 500 }
      );
    }

    if (!Array.isArray(generatedContent)) {
      return NextResponse.json(
        { success: false, error: 'AI response is not an array', data: generatedContent },
        { status: 500 }
      );
    }

    console.log(`[Bulk Generate] Successfully generated ${generatedContent.length} ${type}s`);

    return NextResponse.json({
      success: true,
      type,
      count: generatedContent.length,
      data: generatedContent,
    });

  } catch (error: any) {
    console.error('[Bulk Generate] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate content' },
      { status: 500 }
    );
  }
}
