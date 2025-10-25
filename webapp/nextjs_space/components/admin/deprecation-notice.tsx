'use client';

import { AlertTriangle, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Props {
  oldPage: string;
  newPage: string;
  message: string;
}

export function DeprecationNotice({ oldPage, newPage, message }: Props) {
  const router = useRouter();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full p-8">
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0">
            <AlertTriangle className="w-12 h-12 text-orange-500" />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Page Deprecated
            </h2>
            <p className="text-gray-600 mb-4">
              This page has been replaced by a new unified system.
            </p>
            
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-orange-800">
                <strong>{oldPage}</strong> is no longer maintained.
              </p>
              <p className="text-sm text-orange-700 mt-2">
                {message}
              </p>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">New Location:</p>
                <p className="text-lg font-semibold text-blue-600">{newPage}</p>
              </div>
              <button
                onClick={() => router.push(newPage)}
                className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <span>Go to New Page</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
