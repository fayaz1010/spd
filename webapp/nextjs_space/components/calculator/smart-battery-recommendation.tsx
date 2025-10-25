
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { BatteryRecommendation } from '@/lib/battery-recommendation';
import { CheckCircle2, Battery, Zap, Home, Car, Info } from 'lucide-react';
import { formatCurrency } from '@/lib/calculations';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface SmartBatteryRecommendationProps {
  recommendation: BatteryRecommendation;
  onSelectSize: (size: number) => void;
  selectedSize?: number;
}

export function SmartBatteryRecommendation({
  recommendation,
  onSelectSize,
  selectedSize
}: SmartBatteryRecommendationProps) {
  const { recommendedSize, reasoning, alternatives } = recommendation;

  return (
    <div className="space-y-6">
      {/* Main Recommendation Card */}
      <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-white">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-orange-500 flex items-center justify-center">
              <Battery className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl">
                Smart Recommendation: {recommendedSize}kWh
              </CardTitle>
              <CardDescription className="text-base">
                {reasoning.message}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Coverage Indicator */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Overnight Coverage</span>
              <span className="text-lg font-bold text-orange-600">
                {reasoning.coverage}
              </span>
            </div>
            <Progress 
              value={parseFloat(reasoning.coverage)} 
              className="h-3"
            />
          </div>

          {/* Energy Needs Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Home className="h-8 w-8 text-blue-500" />
                  <div>
                    <p className="text-xs text-gray-500">Home Overnight</p>
                    <p className="text-lg font-bold">
                      {reasoning.overnightNeeds.toFixed(1)} kWh
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {reasoning.evNeeds > 0 && (
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <Car className="h-8 w-8 text-green-500" />
                    <div>
                      <p className="text-xs text-gray-500">EV Charging</p>
                      <p className="text-lg font-bold">
                        {reasoning.evNeeds.toFixed(1)} kWh
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="border-orange-200 bg-orange-50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Zap className="h-8 w-8 text-orange-500" />
                  <div>
                    <p className="text-xs text-gray-500">Total Needs</p>
                    <p className="text-lg font-bold">
                      {reasoning.totalNeeds.toFixed(1)} kWh
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Solar Production Info */}
          <Card className="bg-gradient-to-r from-yellow-50 to-orange-50">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-600 mb-1">
                    Daily Solar Production
                  </p>
                  <p className="text-xl font-bold text-orange-600">
                    {reasoning.dailySolarProduction.toFixed(1)} kWh
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1 flex items-center gap-1">
                    Available for Battery
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="h-3 w-3" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs text-xs">
                            This is the excess solar energy after covering your daytime usage,
                            which can be stored in your battery for overnight use.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </p>
                  <p className="text-xl font-bold text-green-600">
                    {reasoning.excessSolar.toFixed(1)} kWh
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>

      {/* Alternative Sizes */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Compare Battery Sizes</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {alternatives.map((alt) => (
            <Card 
              key={alt.size}
              className={`cursor-pointer transition-all ${
                alt.isRecommended 
                  ? 'border-orange-500 border-2 shadow-lg' 
                  : selectedSize === alt.size
                  ? 'border-blue-500 border-2'
                  : 'hover:border-gray-400'
              }`}
              onClick={() => onSelectSize(alt.size)}
            >
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-xl">
                    {alt.size} kWh
                  </CardTitle>
                  {alt.isRecommended && (
                    <div className="flex items-center gap-1 text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full">
                      <CheckCircle2 className="h-3 w-3" />
                      Recommended
                    </div>
                  )}
                  {selectedSize === alt.size && !alt.isRecommended && (
                    <div className="flex items-center gap-1 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                      <CheckCircle2 className="h-3 w-3" />
                      Selected
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-500">Coverage</span>
                    <span className="font-medium">
                      {alt.coverage.toFixed(0)}%
                    </span>
                  </div>
                  <Progress value={alt.coverage} className="h-2" />
                </div>
                
                <div className="pt-2 border-t">
                  <p className="text-sm text-gray-600 mb-2">
                    {alt.message}
                  </p>
                  <p className="text-lg font-bold text-orange-600">
                    {formatCurrency(alt.cost)}
                  </p>
                </div>

                <Button
                  variant={selectedSize === alt.size ? "default" : "outline"}
                  className="w-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectSize(alt.size);
                  }}
                >
                  {selectedSize === alt.size ? 'Selected' : 'Select'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Info Box */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="space-y-2 text-sm text-gray-700">
              <p className="font-medium text-gray-900">
                How We Calculate Your Recommendation
              </p>
              <ul className="space-y-1 list-disc list-inside">
                <li>Analyze your usage patterns (day/night split)</li>
                <li>Calculate overnight energy needs</li>
                <li>Factor in EV charging requirements</li>
                <li>Match with available excess solar energy</li>
                <li>Optimize for maximum independence and value</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
