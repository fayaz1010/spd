'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { 
  Zap, 
  Battery, 
  TrendingUp, 
  CheckCircle,
  ArrowRight,
  Award
} from 'lucide-react';

interface PackagePosterHorizontalProps {
  id: string;
  displayName: string;
  description: string;
  systemSizeKw: number;
  panelCount: number;
  batterySizeKwh: number;
  subtotal: number;
  totalRebates: number;
  finalPrice: number;
  costPerDay: number;
  annualSavings: number;
  year25Savings: number;
  paybackYears: number;
  badge?: string | null;
  suitability?: string;
  dailyUsage?: string;
  featureList?: string[];
  isPopular?: boolean;
  heroImageUrl?: string | null;
  infographicUrl?: string | null;
}

export function PackagePosterHorizontal({
  id,
  displayName,
  description,
  systemSizeKw,
  panelCount,
  batterySizeKwh,
  subtotal,
  totalRebates,
  finalPrice,
  costPerDay,
  annualSavings,
  year25Savings,
  paybackYears,
  badge,
  suitability,
  featureList = [],
  isPopular = false,
  heroImageUrl,
  infographicUrl,
}: PackagePosterHorizontalProps) {
  const formatCurrency = (amount: number) => {
    if (!amount || isNaN(amount)) return '$0';
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Safety checks
  const safeSystemSize = systemSizeKw || 0;
  const safePanelCount = panelCount || 0;
  const safeBatterySize = batterySizeKwh || 0;
  const safeSubtotal = subtotal || 0;
  const safeTotalRebates = totalRebates || 0;
  const safeFinalPrice = finalPrice || 0;
  const safeCostPerDay = costPerDay || 0;
  const safeAnnualSavings = annualSavings || 0;
  const safeYear25Savings = year25Savings || 0;
  const safePaybackYears = paybackYears || 0;

  try {
    return (
    <div className={`
      relative overflow-hidden rounded-2xl shadow-2xl
      bg-gradient-to-r from-blue-600 via-blue-700 to-blue-900
      ${isPopular ? 'ring-4 ring-yellow-400' : ''}
      transition-all duration-300 hover:shadow-3xl
    `}>
      {/* Badge */}
      {badge && (
        <div className="absolute top-4 right-4 z-10">
          <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-4 py-1 rounded-full font-bold text-sm shadow-lg flex items-center gap-1">
            <Award className="w-3 h-3" />
            {badge}
          </div>
        </div>
      )}

      <div className={`grid gap-6 p-6 ${
        infographicUrl 
          ? 'md:grid-cols-[280px_1fr_400px]' 
          : 'md:grid-cols-[300px_1fr_280px]'
      }`}>
        {/* Left: System Info & Image */}
        <div className="flex flex-col justify-center">
          <h3 className="text-2xl font-bold text-white mb-2">
            {displayName}
          </h3>
          <p className="text-blue-100 text-sm mb-4">{description}</p>
          
          {/* System Size */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/20 mb-4">
            <div className="flex items-baseline gap-2">
              <Zap className="w-5 h-5 text-yellow-400" />
              <span className="text-3xl font-black text-white">{safeSystemSize}</span>
              <span className="text-lg font-bold text-blue-200">kW</span>
            </div>
            <p className="text-blue-100 text-xs mt-1">{safePanelCount} Premium Panels</p>
            {safeBatterySize > 0 && (
              <div className="flex items-center gap-2 mt-2 text-green-300 text-sm">
                <Battery className="w-4 h-4" />
                <span>+ {safeBatterySize}kWh Battery</span>
              </div>
            )}
          </div>

          {/* Image */}
          {heroImageUrl && (
            <div className="rounded-lg overflow-hidden border-2 border-white/20">
              <img 
                src={heroImageUrl.startsWith('/') ? heroImageUrl : `/${heroImageUrl}`}
                alt={displayName}
                className="w-full h-auto object-cover"
                onError={(e) => {
                  // Hide image if it fails to load
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          )}
        </div>

        {/* Middle: KEY DECISION DRIVERS - Rebates & Annual Savings */}
        <div className="flex flex-col justify-center space-y-3">
          {/* 🎯 KEY VALUE 1: REBATES - HUGE & PROMINENT */}
          <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-5 shadow-2xl border-4 border-yellow-300 transform hover:scale-105 transition-all">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <span className="text-2xl">⭐</span>
                <p className="text-white text-xs font-bold uppercase tracking-wide">Government Rebates</p>
                <span className="text-2xl">⭐</span>
              </div>
              <div className="text-5xl font-black text-white mb-1 drop-shadow-lg">
                {formatCurrency(safeTotalRebates)}
              </div>
              <p className="text-green-100 text-xs font-semibold">
                💰 You Get This Back Instantly!
              </p>
            </div>
          </div>

          {/* 🎯 KEY VALUE 2: ANNUAL SAVINGS - HUGE & PROMINENT */}
          <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl p-5 shadow-2xl border-4 border-yellow-300 transform hover:scale-105 transition-all">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <span className="text-2xl">⭐</span>
                <p className="text-white text-xs font-bold uppercase tracking-wide">Annual Savings</p>
                <span className="text-2xl">⭐</span>
              </div>
              <div className="text-5xl font-black text-white mb-1 drop-shadow-lg">
                {formatCurrency(safeAnnualSavings)}
              </div>
              <p className="text-orange-100 text-xs font-semibold">
                📉 Save Every Year on Power Bills!
              </p>
            </div>
          </div>

          {/* Price - Secondary Info */}
          <div className="text-center bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
            <p className="text-blue-200 text-xs mb-1">Your Investment</p>
            <div className="flex items-center justify-center gap-2 mb-1">
              <span className="text-sm text-blue-300 line-through opacity-75">
                {formatCurrency(safeSubtotal)}
              </span>
              <span className="text-2xl font-black text-white">
                {formatCurrency(safeFinalPrice)}
              </span>
            </div>
            <p className="text-yellow-300 text-xs font-bold">
              From ${safeCostPerDay.toFixed(2)}/day • Payback: {safePaybackYears} years
            </p>
          </div>
        </div>

        {/* Right: Infographic OR Features & CTA */}
        {infographicUrl ? (
          /* INFOGRAPHIC - Contained professional display */
          <div className="relative flex flex-col bg-white/5 backdrop-blur-sm rounded-xl border-2 border-white/20 overflow-hidden">
            <div className="flex-1 flex items-center justify-center p-2 max-h-[450px]">
              <img 
                src={infographicUrl.startsWith('/') ? infographicUrl : `/${infographicUrl}`}
                alt="Package Infographic"
                className="max-w-full max-h-full object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
            {/* CTA at bottom */}
            <div className="p-4 bg-gradient-to-t from-black/60 to-transparent">
              <Link 
                href={`/calculator-v2?packageId=${id}&systemSize=${safeSystemSize}&batterySize=${safeBatterySize}`}
                className="block"
              >
                <Button
                  className={`
                    w-full py-3 text-base font-bold rounded-xl
                    ${isPopular 
                      ? 'bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white' 
                      : 'bg-gradient-to-r from-green-400 to-emerald-500 hover:from-green-500 hover:to-emerald-600 text-white'
                    }
                    shadow-lg hover:shadow-2xl transition-all duration-300
                    transform hover:scale-105
                  `}
                >
                  Get This Package Now
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          /* NO INFOGRAPHIC - Show features and CTA */
          <div className="flex flex-col justify-center space-y-3">
            {/* Features */}
            {featureList.length > 0 && (
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-3 border border-white/10">
                <p className="text-white font-semibold mb-2 text-xs">What's Included:</p>
                <div className="space-y-1">
                  {featureList.slice(0, 5).map((feature, i) => (
                    <div key={i} className="flex items-start gap-1.5">
                      <CheckCircle className="w-3 h-3 text-green-400 flex-shrink-0 mt-0.5" />
                      <span className="text-blue-100 text-xs leading-tight">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* CTA */}
            <Link 
              href={`/calculator-v2?packageId=${id}&systemSize=${safeSystemSize}&batterySize=${safeBatterySize}`}
              className="block"
            >
              <Button
                className={`
                  w-full py-4 text-base font-bold rounded-xl
                  ${isPopular 
                    ? 'bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white' 
                    : 'bg-gradient-to-r from-green-400 to-emerald-500 hover:from-green-500 hover:to-emerald-600 text-white'
                  }
                  shadow-lg hover:shadow-2xl transition-all duration-300
                  transform hover:scale-105
                `}
              >
                Get This Package Now
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>

            {/* Trust Badge */}
            <div className="text-center">
              <p className="text-blue-200 text-xs leading-tight">
                ✓ CEC Certified • ✓ 25-Year Warranty<br/>✓ Full Rebate Assistance
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
  } catch (error) {
    console.error('Error rendering PackagePosterHorizontal:', error);
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        <p>Error loading package: {displayName}</p>
      </div>
    );
  }
}
