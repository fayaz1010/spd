
'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';

interface RoofVisualizationProps {
  latitude: number;
  longitude: number;
  roofArea: number;
}

export function RoofVisualization({
  latitude,
  longitude,
  roofArea
}: RoofVisualizationProps) {
  const [roofImageUrl, setRoofImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch actual satellite image of the roof
  useEffect(() => {
    async function fetchRoofImage() {
      try {
        setLoading(true);
        const response = await fetch('/api/roof-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            latitude,
            longitude,
            zoom: 20,
            size: '600x400'
          })
        });

        if (!response.ok) {
          throw new Error('Failed to fetch roof image');
        }

        const data = await response.json();
        setRoofImageUrl(data.imageUrl);
        setError(null);
      } catch (err: any) {
        console.error('Error fetching roof image:', err);
        setError(err?.message ?? 'Could not load roof image');
      } finally {
        setLoading(false);
      }
    }

    if (latitude && longitude) {
      fetchRoofImage();
    }
  }, [latitude, longitude]);

  if (loading) {
    return (
      <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden shadow-md flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">Loading satellite imagery...</p>
        </div>
      </div>
    );
  }

  if (error || !roofImageUrl) {
    return (
      <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden shadow-md">
        <Image
          src="/images/solar_installation.jpg"
          alt="Solar panel installation"
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-primary/40 to-transparent" />
        <div className="absolute bottom-4 left-4 right-4">
          <div className="bg-white/95 backdrop-blur-sm rounded-lg p-4">
            <p className="text-xs text-gray-600">
              📍 Satellite imagery temporarily unavailable - showing representative image
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden shadow-md">
        {/* Actual satellite image */}
        <img
          src={roofImageUrl}
          alt="Satellite view of your roof"
          className="w-full h-full object-cover"
          crossOrigin="anonymous"
        />

        {/* Subtle gradient overlay at bottom for readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />

        {/* Info badge */}
        <div className="absolute top-4 left-4">
          <div className="bg-white/95 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg">
            <div className="flex items-center text-xs font-semibold text-primary">
              <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse mr-2"></span>
              Live Satellite View
            </div>
          </div>
        </div>

        {/* Stats overlay at bottom */}
        <div className="absolute bottom-4 left-4 right-4">
          <div className="bg-white/95 backdrop-blur-sm rounded-lg p-4">
            <div className="text-center">
              <p className="text-xs text-gray-600 mb-1">Available Roof Space</p>
              <p className="text-2xl font-bold text-primary">
                {roofArea.toFixed(1)}m²
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Caption */}
      <p className="text-xs text-gray-500 mt-2 text-center">
        🛰️ Actual satellite view of your property
      </p>
    </div>
  );
}
