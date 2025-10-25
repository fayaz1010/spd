'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Sparkles, 
  Home, 
  Zap, 
  Battery, 
  Lightbulb,
  DollarSign,
  TrendingUp,
  Clock
} from 'lucide-react';

interface AIInsightsProps {
  analysis: {
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
  };
}

export function AIInsights({ analysis }: AIInsightsProps) {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* AI Badge */}
      <div className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-purple-600" />
        <h3 className="text-lg font-semibold">AI-Powered Insights</h3>
        <Badge variant="secondary" className="bg-purple-100 text-purple-800">
          Powered by AI
        </Badge>
      </div>

      {/* Summary */}
      <Card className="p-6 bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200">
        <p className="text-gray-800 leading-relaxed">{analysis.summary}</p>
      </Card>

      {/* Household Type */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-blue-100 rounded-full p-3">
            <Home className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h4 className="font-semibold">Household Type</h4>
            <p className="text-lg text-blue-600">{analysis.householdType}</p>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">Key Characteristics:</p>
          <ul className="space-y-1">
            {analysis.householdCharacteristics.map((char, index) => (
              <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                <span className="text-blue-600 mt-1">•</span>
                <span>{char}</span>
              </li>
            ))}
          </ul>
        </div>
      </Card>

      {/* System Recommendations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Solar System */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-orange-100 rounded-full p-3">
              <Zap className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <h4 className="font-semibold">Solar System</h4>
              <p className="text-2xl font-bold text-orange-600">
                {analysis.systemSizeRecommendation.recommended}kW
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Range:</span>
              <span className="font-medium">
                {analysis.systemSizeRecommendation.minKw}kW - {analysis.systemSizeRecommendation.maxKw}kW
              </span>
            </div>

            <div className="pt-3 border-t border-gray-200">
              <p className="text-sm text-gray-700">
                {analysis.systemSizeRecommendation.reasoning}
              </p>
            </div>
          </div>
        </Card>

        {/* Battery */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-green-100 rounded-full p-3">
              <Battery className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h4 className="font-semibold">Battery Storage</h4>
              <p className="text-2xl font-bold text-green-600">
                {analysis.batterySizeRecommendation.recommended}kWh
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Range:</span>
              <span className="font-medium">
                {analysis.batterySizeRecommendation.minKwh}kWh - {analysis.batterySizeRecommendation.maxKwh}kWh
              </span>
            </div>

            <div className="pt-3 border-t border-gray-200">
              <p className="text-sm text-gray-700">
                {analysis.batterySizeRecommendation.reasoning}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Energy Saving Opportunities */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Lightbulb className="h-5 w-5 text-yellow-600" />
          <h4 className="font-semibold">Energy Saving Opportunities</h4>
        </div>

        <div className="space-y-3">
          {analysis.energySavingOpportunities.map((opportunity, index) => (
            <div
              key={index}
              className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
            >
              <Badge className={getPriorityColor(opportunity.priority)}>
                {opportunity.priority.toUpperCase()}
              </Badge>
              <div className="flex-1">
                <p className="font-medium text-gray-900">{opportunity.opportunity}</p>
                <div className="flex items-center gap-1 mt-1">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  <p className="text-sm text-green-600 font-medium">
                    {opportunity.potentialSaving}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Time-of-Use Tariff */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="h-5 w-5 text-blue-600" />
          <h4 className="font-semibold">Time-of-Use Tariff</h4>
          {analysis.timeOfUseTariff.recommended && (
            <Badge className="bg-green-100 text-green-800">Recommended</Badge>
          )}
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-green-600" />
            <p className="text-lg font-semibold text-green-600">
              {analysis.timeOfUseTariff.estimatedSaving}
            </p>
          </div>

          <p className="text-sm text-gray-700">
            {analysis.timeOfUseTariff.reasoning}
          </p>
        </div>
      </Card>

      {/* Self-Consumption Potential */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="h-5 w-5 text-purple-600" />
          <h4 className="font-semibold">Self-Consumption Potential</h4>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="text-4xl font-bold text-purple-600">
              {analysis.selfConsumptionPotential.percentage}%
            </div>
            <div className="flex-1">
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-purple-600 h-3 rounded-full"
                  style={{ width: `${analysis.selfConsumptionPotential.percentage}%` }}
                />
              </div>
            </div>
          </div>

          <p className="text-sm text-gray-700">
            {analysis.selfConsumptionPotential.reasoning}
          </p>
        </div>
      </Card>
    </div>
  );
}
