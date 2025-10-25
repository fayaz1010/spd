'use client';

import dynamic from 'next/dynamic';
import { ComponentProps } from 'react';

// Dynamically import PanelMapCanvas with no SSR
const PanelMapCanvas = dynamic(
  () => import('./PanelMapCanvas'),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading map...</p>
        </div>
      </div>
    )
  }
);

export default function DynamicPanelMap(props: ComponentProps<typeof PanelMapCanvas>) {
  return <PanelMapCanvas {...props} />;
}
