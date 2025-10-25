'use client';

import { MapPin, Maximize2, Sun, Compass } from 'lucide-react';
import { useState } from 'react';

interface PropertyAnalysisProps {
  address: string;
  roofData: any;
  systemSize: number;
  panelCount: number;
}

export default function PropertyAnalysis({
  address,
  roofData,
  systemSize,
  panelCount,
}: PropertyAnalysisProps) {
  const [imageLoaded, setImageLoaded] = useState(false);

  const maxPanels = roofData?.maxArrayPanelsCount || 0;
  const roofArea = roofData?.maxArrayAreaMeters2 || 0;
  const sunshineHours = roofData?.maxSunshineHoursPerYear || 0;
  const roofSegments = roofData?.roofSegmentStats || [];

  // Get orientation label
  const getOrientation = (azimuth: number) => {
    if (azimuth >= 337.5 || azimuth < 22.5) return 'North';
    if (azimuth >= 22.5 && azimuth < 67.5) return 'North-East';
    if (azimuth >= 67.5 && azimuth < 112.5) return 'East';
    if (azimuth >= 112.5 && azimuth < 157.5) return 'South-East';
    if (azimuth >= 157.5 && azimuth < 202.5) return 'South';
    if (azimuth >= 202.5 && azimuth < 247.5) return 'South-West';
    if (azimuth >= 247.5 && azimuth < 292.5) return 'West';
    return 'North-West';
  };

  return (
    <div className="container mx-auto px-4">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Your Property Analysis
          </h2>
          <p className="text-xl text-gray-600 flex items-center justify-center gap-2">
            <MapPin className="w-5 h-5" />
            {address}
          </p>
        </div>

        {/* Satellite Image */}
        <div className="mb-12">
          <div className="relative rounded-2xl overflow-hidden shadow-2xl bg-gray-100">
            {/* Placeholder while loading */}
            {!imageLoaded && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            )}
            
            {/* Google Maps Static Image */}
            <img
              src={`https://maps.googleapis.com/maps/api/staticmap?center=${address}&zoom=19&size=1200x600&maptype=satellite&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`}
              alt="Property satellite view"
              className={`w-full h-auto transition-opacity duration-300 ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
              onLoad={() => setImageLoaded(true)}
            />
            
            {/* Overlay Badge */}
            <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-xl px-4 py-2 shadow-lg">
              <p className="text-sm font-medium text-gray-600">Satellite View</p>
              <p className="text-xs text-gray-500">Powered by Google Maps</p>
            </div>
          </div>
        </div>

        {/* Roof Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          {/* Max Capacity */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 text-center">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Maximize2 className="w-6 h-6 text-white" />
            </div>
            <p className="text-3xl font-bold text-gray-900 mb-1">{maxPanels}</p>
            <p className="text-sm text-gray-600">Max Panel Capacity</p>
          </div>

          {/* Roof Area */}
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6 text-center">
            <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Maximize2 className="w-6 h-6 text-white" />
            </div>
            <p className="text-3xl font-bold text-gray-900 mb-1">{roofArea.toFixed(1)}</p>
            <p className="text-sm text-gray-600">m² Usable Area</p>
          </div>

          {/* Sunshine Hours */}
          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-2xl p-6 text-center">
            <div className="w-12 h-12 bg-yellow-600 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Sun className="w-6 h-6 text-white" />
            </div>
            <p className="text-3xl font-bold text-gray-900 mb-1">{sunshineHours.toLocaleString()}</p>
            <p className="text-sm text-gray-600">Hours/Year</p>
          </div>

          {/* Your System */}
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6 text-center">
            <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Compass className="w-6 h-6 text-white" />
            </div>
            <p className="text-3xl font-bold text-gray-900 mb-1">{panelCount}</p>
            <p className="text-sm text-gray-600">Panels Proposed</p>
          </div>
        </div>

        {/* Roof Segments */}
        {roofSegments.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">
              Roof Segment Analysis
            </h3>
            
            <div className="space-y-4">
              {roofSegments.slice(0, 5).map((segment: any, index: number) => {
                const orientation = getOrientation(segment.azimuthDegrees);
                const tilt = segment.pitchDegrees;
                const area = segment.stats?.areaMeters2 || 0;
                
                return (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Compass className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">
                          Segment {index + 1}
                        </p>
                        <p className="text-sm text-gray-600">
                          {orientation} facing
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex gap-6 text-right">
                      <div>
                        <p className="text-sm text-gray-500">Tilt</p>
                        <p className="font-semibold text-gray-900">{tilt.toFixed(1)}°</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Area</p>
                        <p className="font-semibold text-gray-900">{area.toFixed(1)} m²</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Summary */}
            <div className="mt-6 p-4 bg-blue-50 rounded-xl">
              <p className="text-sm text-gray-700">
                <span className="font-semibold">Analysis:</span> Your roof has excellent solar potential with {roofSegments.length} suitable segments. 
                The proposed {panelCount}-panel system utilizes {((panelCount / maxPanels) * 100).toFixed(0)}% of your available capacity.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
