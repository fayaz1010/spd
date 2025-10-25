
'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RoofSegment, summarizeRoofAnalysis } from '@/lib/segment-analysis';
import { Sun, Compass, Triangle, Zap, TrendingUp } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface RoofSegmentDisplayProps {
  segments: RoofSegment[];
}

export function RoofSegmentDisplay({ segments }: RoofSegmentDisplayProps) {
  if (!segments || segments.length === 0) {
    return null;
  }

  const summary = summarizeRoofAnalysis(segments);

  const ratingColors = {
    excellent: 'bg-green-500',
    good: 'bg-blue-500',
    fair: 'bg-yellow-500',
    poor: 'bg-gray-500'
  };

  const ratingLabels = {
    excellent: 'Excellent',
    good: 'Good',
    fair: 'Fair',
    poor: 'Poor'
  };

  return (
    <div className="space-y-6">
      {/* Overall Summary */}
      <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border-2 border-blue-200 dark:border-blue-800">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold">Your Roof Analysis Summary</h3>
            <Badge className={`${ratingColors[summary.overallRating]} text-white border-none text-sm px-3 py-1`}>
              {ratingLabels[summary.overallRating]} Roof
            </Badge>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/50 dark:bg-black/20 rounded-lg p-3">
              <p className="text-sm text-muted-foreground mb-1">Total Area</p>
              <p className="text-2xl font-bold">{summary.totalArea.toFixed(0)}m²</p>
            </div>
            <div className="bg-white/50 dark:bg-black/20 rounded-lg p-3">
              <p className="text-sm text-muted-foreground mb-1">Max Panels</p>
              <p className="text-2xl font-bold">{summary.totalMaxPanels}</p>
            </div>
            <div className="bg-white/50 dark:bg-black/20 rounded-lg p-3">
              <p className="text-sm text-muted-foreground mb-1">Max Capacity</p>
              <p className="text-2xl font-bold">{summary.totalCapacityKw.toFixed(1)} kW</p>
            </div>
            <div className="bg-white/50 dark:bg-black/20 rounded-lg p-3">
              <p className="text-sm text-muted-foreground mb-1">Avg Sun Hours</p>
              <p className="text-2xl font-bold">{summary.avgSunshineHours.toFixed(1)}/day</p>
            </div>
          </div>

          <div className="space-y-2">
            {summary.recommendations.map((rec, idx) => (
              <div key={idx} className="flex items-start gap-2 text-sm">
                <div className="h-2 w-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                <p className="text-muted-foreground">{rec}</p>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Individual Segments */}
      <div className="space-y-2">
        <h4 className="text-lg font-semibold">Detailed Segment Analysis</h4>
        <p className="text-sm text-muted-foreground mb-4">
          Your roof has {segments.length} distinct section{segments.length > 1 ? 's' : ''} analyzed by Google's AI
        </p>

        <Accordion type="single" collapsible className="space-y-2">
          {segments.map((segment) => (
            <AccordionItem 
              key={segment.segmentIndex} 
              value={`segment-${segment.segmentIndex}`}
              className="border rounded-lg overflow-hidden"
            >
              <AccordionTrigger className="px-4 hover:no-underline hover:bg-muted/50">
                <div className="flex items-center justify-between w-full pr-4">
                  <div className="flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-full ${ratingColors[segment.productionRating]} flex items-center justify-center text-white font-bold`}>
                      {segment.segmentIndex}
                    </div>
                    <div className="text-left">
                      <p className="font-semibold">Roof Section {segment.segmentIndex}</p>
                      <p className="text-xs text-muted-foreground">
                        {segment.areaMeters2.toFixed(0)}m² • Up to {segment.maxPanels} panels
                      </p>
                    </div>
                  </div>
                  <Badge className={`${ratingColors[segment.productionRating]} text-white border-none`}>
                    {ratingLabels[segment.productionRating]}
                  </Badge>
                </div>
              </AccordionTrigger>
              
              <AccordionContent className="px-4 pb-4">
                <div className="space-y-4 pt-2">
                  {/* Key Metrics Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Compass className="h-3 w-3" />
                        <span>Orientation</span>
                      </div>
                      <p className="text-sm font-semibold">{segment.orientation}</p>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Triangle className="h-3 w-3" />
                        <span>Pitch</span>
                      </div>
                      <p className="text-sm font-semibold">{segment.pitchDegrees.toFixed(0)}°</p>
                      <p className="text-xs text-muted-foreground">{segment.pitchClassification}</p>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Sun className="h-3 w-3" />
                        <span>Sun Hours</span>
                      </div>
                      <p className="text-sm font-semibold">{segment.avgSunshineHours.toFixed(1)}/day</p>
                      <p className="text-xs text-muted-foreground">
                        {segment.minSunshineHours.toFixed(1)}-{segment.maxSunshineHours.toFixed(1)} range
                      </p>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Zap className="h-3 w-3" />
                        <span>Capacity</span>
                      </div>
                      <p className="text-sm font-semibold">{segment.panelCapacityKw.toFixed(1)} kW</p>
                      <p className="text-xs text-muted-foreground">{segment.maxPanels} panels max</p>
                    </div>
                  </div>

                  {/* Production Potential */}
                  <div className="bg-muted/50 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Production Potential</span>
                      <span className="text-sm font-bold">{segment.relativeProduction}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className={`${ratingColors[segment.productionRating]} h-2 rounded-full transition-all duration-500`}
                        style={{ width: `${segment.relativeProduction}%` }}
                      />
                    </div>
                  </div>

                  {/* Notes */}
                  <div className="space-y-2">
                    {segment.notes.map((note, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-sm">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                        <p className="text-muted-foreground">{note}</p>
                      </div>
                    ))}
                  </div>

                  {/* Recommendation Badge */}
                  {segment.recommended && (
                    <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-3">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-green-600" />
                        <p className="text-sm font-medium text-green-600">
                          Highly recommended for panel installation
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </div>
  );
}
