import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'sk-dummy-key-for-build',
});

export interface NEM12AIAnalysis {
  householdType: string;
  householdCharacteristics: string[];
  systemSizeRecommendation: {
    minKw: number;
    maxKw: number;
    recommended: number;
    reasoning: string;
  };
  batterySizeRecommendation: {
    minKwh: number;
    maxKwh: number;
    recommended: number;
    reasoning: string;
  };
  energySavingOpportunities: Array<{
    opportunity: string;
    potentialSaving: string;
    priority: 'high' | 'medium' | 'low';
  }>;
  timeOfUseTariff: {
    recommended: boolean;
    estimatedSaving: string;
    reasoning: string;
  };
  selfConsumptionPotential: {
    percentage: number;
    reasoning: string;
  };
  summary: string;
}

export async function analyzeNEM12WithAI(data: {
  averageDaily: number;
  peakDemand: number;
  hourlyPattern: number[];
  dailyPattern: number[];
  peakUsage?: number;
  shoulderUsage?: number;
  offPeakUsage?: number;
  totalConsumption: number;
  totalDays: number;
}): Promise<NEM12AIAnalysis> {
  try {
    // Find peak consumption hours
    const peakHours = data.hourlyPattern
      .map((value, hour) => ({ hour, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 3)
      .map(h => h.hour);

    // Calculate weekend vs weekday usage
    const weekdayAvg = (data.dailyPattern.slice(1, 6).reduce((a, b) => a + b, 0) / 5);
    const weekendAvg = ((data.dailyPattern[0] + data.dailyPattern[6]) / 2);

    const prompt = `You are an expert solar energy consultant analyzing electricity consumption data from an Australian household's smart meter (NEM12 data).

Consumption Data:
- Average daily consumption: ${data.averageDaily.toFixed(2)} kWh/day
- Peak demand: ${data.peakDemand.toFixed(2)} kW
- Total consumption over ${data.totalDays} days: ${data.totalConsumption.toFixed(2)} kWh
- Peak consumption hours: ${peakHours.join(', ')}:00
- Weekday average: ${weekdayAvg.toFixed(2)} kWh/day
- Weekend average: ${weekendAvg.toFixed(2)} kWh/day
${data.peakUsage ? `- Peak time usage: ${data.peakUsage.toFixed(2)} kWh` : ''}
${data.shoulderUsage ? `- Shoulder time usage: ${data.shoulderUsage.toFixed(2)} kWh` : ''}
${data.offPeakUsage ? `- Off-peak time usage: ${data.offPeakUsage.toFixed(2)} kWh` : ''}

Hourly consumption pattern (kWh per 30-min interval):
${data.hourlyPattern.map((v, i) => `${i}:00 - ${v.toFixed(3)}`).join(', ')}

Please analyze this data and provide:

1. Household Type Classification:
   - What type of household is this? (e.g., "Family with kids", "Retirees", "Work from home", "Shift workers")
   - Key characteristics that led to this classification

2. Solar System Size Recommendation:
   - Minimum, maximum, and recommended system size in kW
   - Detailed reasoning based on consumption patterns

3. Battery Size Recommendation:
   - Minimum, maximum, and recommended battery size in kWh
   - Reasoning based on overnight usage and peak demand

4. Energy Saving Opportunities:
   - List 3-5 specific opportunities to reduce consumption
   - Estimate potential savings for each
   - Priority level (high/medium/low)

5. Time-of-Use Tariff Analysis:
   - Should they switch to time-of-use tariff?
   - Estimated annual savings
   - Reasoning

6. Self-Consumption Potential:
   - Estimated percentage of solar that could be self-consumed
   - Reasoning based on daytime usage

7. Summary:
   - 2-3 sentence plain English summary for the customer

Respond in JSON format matching this structure:
{
  "householdType": "string",
  "householdCharacteristics": ["string"],
  "systemSizeRecommendation": {
    "minKw": number,
    "maxKw": number,
    "recommended": number,
    "reasoning": "string"
  },
  "batterySizeRecommendation": {
    "minKwh": number,
    "maxKwh": number,
    "recommended": number,
    "reasoning": "string"
  },
  "energySavingOpportunities": [
    {
      "opportunity": "string",
      "potentialSaving": "string",
      "priority": "high|medium|low"
    }
  ],
  "timeOfUseTariff": {
    "recommended": boolean,
    "estimatedSaving": "string",
    "reasoning": "string"
  },
  "selfConsumptionPotential": {
    "percentage": number,
    "reasoning": "string"
  },
  "summary": "string"
}`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are an expert solar energy consultant specializing in analyzing electricity consumption data and providing personalized solar system recommendations for Australian households.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    });

    const analysis = JSON.parse(response.choices[0].message.content || '{}');
    return analysis as NEM12AIAnalysis;
  } catch (error) {
    console.error('AI analysis error:', error);
    throw new Error('Failed to generate AI analysis');
  }
}

/**
 * Generate a plain English explanation of consumption patterns
 */
export async function generateConsumptionExplanation(data: {
  averageDaily: number;
  peakDemand: number;
  peakHour: number;
  householdType?: string;
}): Promise<string> {
  try {
    const prompt = `Generate a friendly, plain English explanation (2-3 sentences) of this household's electricity consumption pattern:

- Average daily usage: ${data.averageDaily} kWh
- Peak demand: ${data.peakDemand} kW
- Peak usage time: ${data.peakHour}:00
${data.householdType ? `- Household type: ${data.householdType}` : ''}

Make it conversational and easy to understand for a non-technical customer.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.8,
      max_tokens: 150,
    });

    return response.choices[0].message.content || '';
  } catch (error) {
    console.error('Explanation generation error:', error);
    return 'Your household uses an average of ' + data.averageDaily + ' kWh per day, with peak usage around ' + data.peakHour + ':00.';
  }
}
