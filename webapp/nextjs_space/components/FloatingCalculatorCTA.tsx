'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Calculator } from 'lucide-react';

/**
 * Floating Calculator CTA Button - Bottom Center (Small)
 * Shows ONLY on pages WITHOUT calculator CTAs (shop, gallery, services, blog)
 * Homepage already has CTAs, so this is hidden there
 * Simple, small, non-intrusive button
 */
export function FloatingCalculatorCTA() {
  const pathname = usePathname();

  // Only show on pages WITHOUT calculator CTAs
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

  if (!shouldShow) return null;

  return (
    <>
      {/* Desktop Version - Bottom Center (Small) */}
      <div className="hidden md:block fixed bottom-6 left-1/2 -translate-x-1/2 z-30">
        <Link href="/calculator-v2">
          <button className="bg-gradient-to-r from-coral to-orange-600 hover:from-coral-600 hover:to-orange-700 text-white px-4 py-2 rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-105 flex items-center gap-2 text-sm font-semibold">
            <Calculator className="h-4 w-4" />
            <span>Get Quote</span>
          </button>
        </Link>
      </div>

      {/* Mobile Version - Bottom Center (Extra Small) */}
      <div className="md:hidden fixed bottom-4 left-1/2 -translate-x-1/2 z-30">
        <Link href="/calculator-v2">
          <button className="bg-gradient-to-r from-coral to-orange-600 hover:from-coral-600 hover:to-orange-700 text-white px-3 py-2 rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-105 flex items-center gap-1.5 text-xs font-semibold">
            <Calculator className="h-3.5 w-3.5" />
            <span>Quote</span>
          </button>
        </Link>
      </div>
    </>
  );
}
