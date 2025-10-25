'use client';

import { ChevronDown } from 'lucide-react';

interface HeroSectionProps {
  quote: any;
}

export default function HeroSection({ quote }: HeroSectionProps) {
  const customerName = quote.lead?.name || 'Valued Customer';
  const address = quote.address || '';
  const systemSize = quote.systemSizeKw || 0;
  const batterySize = quote.batterySizeKwh || 0;
  const validUntil = quote.validUntil ? new Date(quote.validUntil) : null;

  const scrollToSummary = () => {
    const element = document.getElementById('summary');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-500 overflow-hidden">
      {/* Animated Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 py-20 text-center">
        {/* Logo */}
        <div className="mb-8 flex justify-center">
          <div className="w-20 h-20 bg-white rounded-2xl shadow-2xl flex items-center justify-center">
            <span className="text-4xl">☀️</span>
          </div>
        </div>

        {/* Company Name */}
        <p className="text-white/90 text-lg font-medium mb-2">
          Sun Direct Power
        </p>

        {/* Main Heading */}
        <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6">
          Your Solar Proposal
        </h1>

        {/* System Summary */}
        <div className="inline-block bg-white/10 backdrop-blur-md rounded-2xl px-8 py-6 mb-8">
          <p className="text-white/90 text-lg mb-2">Complete Solar Solution</p>
          <div className="flex items-center justify-center space-x-4 text-white">
            <div className="text-center">
              <p className="text-4xl font-bold">{systemSize}</p>
              <p className="text-sm text-white/80">kW Solar</p>
            </div>
            {batterySize > 0 && (
              <>
                <div className="text-3xl text-white/60">+</div>
                <div className="text-center">
                  <p className="text-4xl font-bold">{batterySize}</p>
                  <p className="text-sm text-white/80">kWh Battery</p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Customer Info */}
        <div className="max-w-2xl mx-auto mb-8">
          <p className="text-white/90 text-xl mb-2">
            Prepared for
          </p>
          <p className="text-white text-2xl font-semibold mb-1">
            {customerName}
          </p>
          {address && (
            <p className="text-white/80 text-lg">
              {address}
            </p>
          )}
        </div>

        {/* Quote Reference */}
        <div className="inline-block bg-white/10 backdrop-blur-md rounded-lg px-6 py-3 mb-8">
          <p className="text-white/80 text-sm">Quote Reference</p>
          <p className="text-white font-mono font-bold text-lg">
            {quote.quoteReference}
          </p>
        </div>

        {/* Valid Until */}
        {validUntil && (
          <p className="text-white/80 text-sm mb-12">
            Valid until {validUntil.toLocaleDateString('en-AU', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </p>
        )}

        {/* Scroll Indicator */}
        <button
          onClick={scrollToSummary}
          className="inline-flex flex-col items-center text-white/80 hover:text-white transition-colors group"
        >
          <span className="text-sm mb-2">Scroll to explore</span>
          <ChevronDown className="w-8 h-8 animate-bounce" />
        </button>
      </div>

      {/* Decorative Elements */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg
          className="w-full h-24 text-white"
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
        >
          <path
            d="M0,0 C300,100 900,100 1200,0 L1200,120 L0,120 Z"
            fill="currentColor"
          />
        </svg>
      </div>
    </div>
  );
}
