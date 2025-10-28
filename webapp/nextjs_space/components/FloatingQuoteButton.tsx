'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Calculator, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Floating Quote Button - Always visible across the site
 * Directs users to the calculator for full solar system quotes
 * Hidden on calculator and admin pages
 */
export function FloatingQuoteButton() {
  const pathname = usePathname();
  const [isVisible, setIsVisible] = React.useState(true);
  const [isMinimized, setIsMinimized] = React.useState(false);

  // Only show on pages WITHOUT calculator CTAs
  // Show on: shop, gallery, services, blog
  // Hide on: homepage (has calculator), calculator pages, admin, portal
  const shouldShow = React.useMemo(() => {
    if (!pathname) return false;
    
    const pagesWithoutCTAs = [
      '/shop',
      '/gallery',
      '/services',
      '/blog',
    ];

    return pagesWithoutCTAs.some(path => pathname.startsWith(path));
  }, [pathname]);

  // Don't render if not on allowed pages
  if (!shouldShow) return null;

  // User manually closed it
  if (!isVisible) return null;

  return (
    <>
      {/* Desktop Version - Bottom Right */}
      <div className="hidden md:block fixed bottom-6 right-6 z-50">
        {isMinimized ? (
          // Minimized state - Just icon
          <Button
            onClick={() => setIsMinimized(false)}
            className="h-14 w-14 rounded-full shadow-2xl bg-gradient-to-r from-coral to-orange-600 hover:from-coral-600 hover:to-orange-700 text-white"
            size="icon"
          >
            <Calculator className="h-6 w-6" />
          </Button>
        ) : (
          // Expanded state - Full button
          <div className="bg-white rounded-2xl shadow-2xl border-2 border-coral p-4 max-w-sm animate-in slide-in-from-bottom-5">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="bg-coral/10 rounded-full p-2">
                  <Calculator className="h-5 w-5 text-coral" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Get Your Solar Quote</h3>
                  <p className="text-xs text-gray-600">Full system installation</p>
                </div>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => setIsMinimized(true)}
                  className="text-gray-400 hover:text-gray-600 p-1"
                  aria-label="Minimize"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                  </svg>
                </button>
                <button
                  onClick={() => setIsVisible(false)}
                  className="text-gray-400 hover:text-gray-600 p-1"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
            
            <p className="text-sm text-gray-700 mb-3">
              Ready for a complete solar system? Get a personalized quote in minutes!
            </p>
            
            <Link href="/calculator-v2">
              <Button className="w-full bg-gradient-to-r from-coral to-orange-600 hover:from-coral-600 hover:to-orange-700 text-white font-semibold">
                Calculate My System
                <Calculator className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            
            <p className="text-xs text-gray-500 text-center mt-2">
              Free quote • No obligation • Perth experts
            </p>
          </div>
        )}
      </div>

      {/* Mobile Version - Bottom Sticky Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t-2 border-coral shadow-2xl">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="bg-coral/10 rounded-full p-2">
                <Calculator className="h-4 w-4 text-coral" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-gray-900">Get Solar Quote</h3>
                <p className="text-xs text-gray-600">Full system installation</p>
              </div>
            </div>
            <button
              onClick={() => setIsVisible(false)}
              className="text-gray-400 hover:text-gray-600 p-1"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          <Link href="/calculator-v2">
            <Button className="w-full bg-gradient-to-r from-coral to-orange-600 hover:from-coral-600 hover:to-orange-700 text-white font-semibold">
              Calculate My System
              <Calculator className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </>
  );
}
