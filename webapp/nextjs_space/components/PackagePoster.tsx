'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { 
  Zap, 
  Battery, 
  TrendingUp, 
  CheckCircle,
  ArrowRight,
  Sun,
  Home,
  DollarSign,
  Award
} from 'lucide-react';

interface PackagePosterProps {
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
}

export function PackagePoster({
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
  dailyUsage,
  featureList = [],
  isPopular = false,
}: PackagePosterProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className={`
      relative overflow-hidden rounded-2xl shadow-2xl
      bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900
      ${isPopular ? 'ring-4 ring-yellow-400 scale-105' : ''}
      transition-all duration-300 hover:scale-105 hover:shadow-3xl
    `}>
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      {/* Badge */}
      {badge && (
        <div className="absolute top-0 right-0 z-10">
          <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-6 py-2 rounded-bl-2xl font-bold text-sm shadow-lg flex items-center gap-2">
            <Award className="w-4 h-4" />
            {badge}
          </div>
        </div>
      )}

      {/* Header Section */}
      <div className="relative p-8 text-center border-b border-white/20">
        {/* Icon */}
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 mb-4 shadow-lg">
          <Sun className="w-10 h-10 text-white" />
        </div>

        {/* Title */}
        <h3 className="text-3xl font-bold text-white mb-2">
          {displayName}
        </h3>
        <p className="text-blue-100 text-sm mb-4">{description}</p>

        {/* System Size - Hero */}
        <div className="inline-block bg-white/10 backdrop-blur-sm rounded-2xl px-8 py-4 border border-white/20">
          <div className="flex items-baseline justify-center gap-2">
            <Zap className="w-6 h-6 text-yellow-400" />
            <span className="text-5xl font-black text-white">{systemSizeKw}</span>
            <span className="text-2xl font-bold text-blue-200">kW</span>
          </div>
          <p className="text-blue-100 text-sm mt-2">{panelCount} Premium Solar Panels</p>
          {batterySizeKwh > 0 && (
            <div className="flex items-center justify-center gap-2 mt-3 text-green-300">
              <Battery className="w-5 h-5" />
              <span className="font-semibold">+ {batterySizeKwh}kWh Battery Storage</span>
            </div>
          )}
        </div>
      </div>

      {/* Pricing Section - Eye-Catching */}
      <div className="relative p-8 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm">
        {/* Hook - Savings */}
        <div className="text-center mb-6">
          <div className="inline-block bg-green-500 text-white px-6 py-3 rounded-full font-bold text-lg shadow-lg animate-pulse">
            🎉 SAVE {formatCurrency(totalRebates)} IN REBATES!
          </div>
        </div>

        {/* Price */}
        <div className="text-center mb-6">
          <p className="text-blue-200 text-sm mb-2">Total Investment</p>
          <div className="flex items-center justify-center gap-4 mb-2">
            <span className="text-2xl text-blue-300 line-through opacity-75">
              {formatCurrency(subtotal)}
            </span>
            <span className="text-5xl font-black text-white">
              {formatCurrency(finalPrice)}
            </span>
          </div>
          <p className="text-yellow-300 text-xl font-bold">
            From ${costPerDay.toFixed(2)}/day
          </p>
        </div>

        {/* Key Figures Grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {/* Annual Savings */}
          <div className="bg-gradient-to-br from-green-500/20 to-green-600/20 backdrop-blur-sm rounded-xl p-4 border border-green-400/30">
            <TrendingUp className="w-6 h-6 text-green-300 mb-2" />
            <p className="text-green-100 text-xs mb-1">Annual Savings</p>
            <p className="text-2xl font-bold text-white">{formatCurrency(annualSavings)}</p>
          </div>

          {/* 25-Year Savings */}
          <div className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 backdrop-blur-sm rounded-xl p-4 border border-emerald-400/30">
            <DollarSign className="w-6 h-6 text-emerald-300 mb-2" />
            <p className="text-emerald-100 text-xs mb-1">25-Year Savings</p>
            <p className="text-2xl font-bold text-white">{formatCurrency(year25Savings)}</p>
          </div>

          {/* Payback Period */}
          <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 backdrop-blur-sm rounded-xl p-4 border border-blue-400/30">
            <Home className="w-6 h-6 text-blue-300 mb-2" />
            <p className="text-blue-100 text-xs mb-1">Payback Period</p>
            <p className="text-2xl font-bold text-white">{paybackYears} years</p>
          </div>

          {/* Suitability */}
          {suitability && (
            <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 backdrop-blur-sm rounded-xl p-4 border border-purple-400/30">
              <Award className="w-6 h-6 text-purple-300 mb-2" />
              <p className="text-purple-100 text-xs mb-1">Perfect For</p>
              <p className="text-sm font-bold text-white leading-tight">{suitability}</p>
            </div>
          )}
        </div>

        {/* Features List */}
        {featureList.length > 0 && (
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 mb-6 border border-white/10">
            <p className="text-white font-semibold mb-3 text-sm">What's Included:</p>
            <div className="grid grid-cols-1 gap-2">
              {featureList.slice(0, 4).map((feature, i) => (
                <div key={i} className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                  <span className="text-blue-100 text-sm">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Call to Action */}
        <Link 
          href={`/calculator-v2?packageId=${id}&systemSize=${systemSizeKw}&batterySize=${batterySizeKwh}`}
          className="block"
        >
          <Button
            className={`
              w-full py-6 text-lg font-bold rounded-xl
              ${isPopular 
                ? 'bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white' 
                : 'bg-gradient-to-r from-green-400 to-emerald-500 hover:from-green-500 hover:to-emerald-600 text-white'
              }
              shadow-lg hover:shadow-2xl transition-all duration-300
              transform hover:scale-105
            `}
          >
            Get This Package Now
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </Link>

        {/* Trust Badge */}
        <div className="mt-4 text-center">
          <p className="text-blue-200 text-xs">
            ✓ CEC Certified • ✓ 25-Year Warranty • ✓ Full Rebate Assistance
          </p>
        </div>
      </div>

      {/* Decorative Corner */}
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-br from-yellow-400/20 to-transparent rounded-tr-full" />
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-orange-400/20 to-transparent rounded-bl-full" />
    </div>
  );
}
