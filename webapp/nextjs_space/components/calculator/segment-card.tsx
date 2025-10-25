
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Home, Sun, Compass, TrendingUp } from 'lucide-react';

interface SegmentCardProps {
  number: number;
  area: number;
  orientation: string;
  pitch: number;
  sunHours: number;
  recommendedPanels: number;
  pitchRating?: string;
}

export function SegmentCard({
  number,
  area,
  orientation,
  pitch,
  sunHours,
  recommendedPanels,
  pitchRating
}: SegmentCardProps) {
  // Extract star rating from orientation
  const getStarCount = (orientation: string) => {
    if (orientation.includes('⭐⭐⭐')) return 3;
    if (orientation.includes('☀️') || orientation.includes('🌅')) return 2;
    return 1;
  };

  const stars = getStarCount(orientation);
  
  // Color coding based on rating
  const getBorderColor = () => {
    if (stars === 3) return 'border-emerald-300';
    if (stars === 2) return 'border-gold-300';
    return 'border-gray-300';
  };

  const getGradient = () => {
    if (stars === 3) return 'from-emerald-50 to-emerald-100/30';
    if (stars === 2) return 'from-gold-50 to-gold-100/30';
    return 'from-gray-50 to-gray-100/30';
  };

  return (
    <Card className={`border-2 ${getBorderColor()} shadow-lg hover:shadow-xl transition-shadow`}>
      <CardHeader className={`bg-gradient-to-br ${getGradient()} pb-3`}>
        <CardTitle className="flex items-center justify-between text-lg">
          <span className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-white shadow-sm flex items-center justify-center">
              <Home className="h-4 w-4 text-primary" />
            </div>
            <span>Roof Section {number}</span>
          </span>
          <div className="flex gap-0.5">
            {[...Array(3)].map((_, i) => (
              <span
                key={i}
                className={`text-lg ${i < stars ? 'opacity-100' : 'opacity-20'}`}
              >
                ⭐
              </span>
            ))}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="grid grid-cols-2 gap-4">
          {/* Area */}
          <div className="bg-white rounded-lg p-3 border border-gray-200">
            <div className="flex items-center gap-2 mb-1">
              <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center">
                <TrendingUp className="h-3 w-3 text-blue-600" />
              </div>
              <p className="text-xs text-gray-600 font-medium">Area</p>
            </div>
            <p className="text-xl font-bold text-primary">{area.toFixed(1)}m²</p>
          </div>

          {/* Max Panels */}
          <div className="bg-white rounded-lg p-3 border border-gray-200">
            <div className="flex items-center gap-2 mb-1">
              <div className="h-6 w-6 rounded-full bg-coral-100 flex items-center justify-center">
                <Sun className="h-3 w-3 text-coral" />
              </div>
              <p className="text-xs text-gray-600 font-medium">Max Panels</p>
            </div>
            <p className="text-xl font-bold text-coral">{recommendedPanels}</p>
          </div>

          {/* Orientation */}
          <div className="col-span-2 bg-white rounded-lg p-3 border border-gray-200">
            <div className="flex items-center gap-2 mb-1">
              <div className="h-6 w-6 rounded-full bg-purple-100 flex items-center justify-center">
                <Compass className="h-3 w-3 text-purple-600" />
              </div>
              <p className="text-xs text-gray-600 font-medium">Orientation</p>
            </div>
            <p className="text-base font-bold text-gray-800">{orientation}</p>
          </div>

          {/* Pitch */}
          <div className="bg-white rounded-lg p-3 border border-gray-200">
            <p className="text-xs text-gray-600 mb-1">Pitch Angle</p>
            <p className="text-xl font-bold text-primary">{pitch.toFixed(1)}°</p>
            {pitchRating && (
              <p className="text-xs text-emerald-600 mt-1 font-medium">{pitchRating}</p>
            )}
          </div>

          {/* Sun Hours */}
          <div className="bg-white rounded-lg p-3 border border-gray-200">
            <p className="text-xs text-gray-600 mb-1">Daily Sun</p>
            <p className="text-xl font-bold text-gold">{sunHours.toFixed(1)} hrs</p>
            <p className="text-xs text-gray-600 mt-1">per day avg</p>
          </div>
        </div>

        {/* Production Indicator */}
        <div className="mt-4 bg-gradient-to-r from-emerald-50 to-blue-50 rounded-lg p-3 border border-emerald-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600 mb-1">Estimated Annual Production</p>
              <p className="text-lg font-bold text-emerald">
                {Math.round(recommendedPanels * 440 * 1460 / 1000).toLocaleString()} kWh
              </p>
            </div>
            <div className="text-right">
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                stars === 3 ? 'bg-emerald-100 text-emerald-700' :
                stars === 2 ? 'bg-gold-100 text-gold-700' :
                'bg-gray-100 text-gray-700'
              }`}>
                {stars === 3 ? 'Excellent' : stars === 2 ? 'Very Good' : 'Good'}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
