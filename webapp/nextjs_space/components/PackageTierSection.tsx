'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PackagePoster } from '@/components/PackagePoster';
import { PackagePosterHorizontal } from '@/components/PackagePosterHorizontal';
import { 
  Zap, 
  Battery, 
  DollarSign, 
  TrendingUp, 
  Users, 
  CheckCircle,
  ArrowRight,
  Loader2
} from 'lucide-react';

interface PackageData {
  id: string;
  name: string;
  displayName: string;
  description: string;
  tier: string;
  badge: string | null;
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
  suitability: string;
  dailyUsage: string;
  featureList: string[];
  heroImageUrl?: string | null;
  infographicUrl?: string | null;
  hookText?: string | null;
  ctaText?: string;
}

interface PackageTierSectionProps {
  posterStyle?: boolean; // Use poster-style cards instead of default
}

export function PackageTierSection({ posterStyle = false }: PackageTierSectionProps = {}) {
  const [packages, setPackages] = useState<PackageData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    try {
      console.log('Fetching packages...');
      const response = await fetch('/api/packages/active');
      const data = await response.json();
      
      console.log('Packages data:', data);
      
      if (data.success) {
        console.log('Setting packages:', data.packages);
        setPackages(data.packages);
      } else {
        console.error('Failed to fetch packages:', data);
      }
    } catch (error) {
      console.error('Error fetching packages:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
        </div>
      </section>
    );
  }

  if (packages.length === 0) {
    console.log('No packages to display');
    return (
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-gray-500">No active packages available</p>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-4xl font-bold text-primary mb-4">
            Choose Your Perfect Solar Package
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Pre-configured packages designed for Australian homes. Prices include installation and rebates.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 max-w-5xl mx-auto">
          {packages.map((pkg, idx) => {
            const isPopular = pkg.badge?.toLowerCase().includes('popular');
            
            // Use poster style if enabled
            if (posterStyle) {
              return (
                <PackagePosterHorizontal
                  key={pkg.id}
                  id={pkg.id}
                  displayName={pkg.displayName}
                  description={pkg.description}
                  systemSizeKw={pkg.systemSizeKw}
                  panelCount={pkg.panelCount}
                  batterySizeKwh={pkg.batterySizeKwh}
                  subtotal={pkg.subtotal}
                  totalRebates={pkg.totalRebates}
                  finalPrice={pkg.finalPrice}
                  costPerDay={pkg.costPerDay}
                  annualSavings={pkg.annualSavings}
                  year25Savings={pkg.year25Savings}
                  paybackYears={pkg.paybackYears}
                  badge={pkg.badge}
                  suitability={pkg.suitability}
                  dailyUsage={pkg.dailyUsage}
                  featureList={pkg.featureList}
                  isPopular={isPopular}
                  heroImageUrl={pkg.heroImageUrl || null}
                  infographicUrl={pkg.infographicUrl || null}
                />
              );
            }
            
            // Default card style
            return (
              <Card
                key={pkg.id}
                className={`relative overflow-hidden transition-all hover:shadow-2xl ${
                  isPopular ? 'border-2 border-coral scale-105 shadow-xl' : 'border-gray-200'
                }`}
              >
                {pkg.badge && (
                  <div className="absolute top-0 right-0 bg-coral text-white px-4 py-1 text-sm font-bold rounded-bl-lg">
                    {pkg.badge}
                  </div>
                )}

                <CardHeader className="text-center pb-4">
                  <div className="mb-4">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-coral mb-3">
                      <Zap className="w-8 h-8 text-white" />
                    </div>
                  </div>
                  <CardTitle className="text-2xl font-bold text-primary">
                    {pkg.displayName}
                  </CardTitle>
                  <p className="text-sm text-gray-600 mt-2">{pkg.description}</p>
                </CardHeader>

                <CardContent className="space-y-6">
                  {/* System Size */}
                  <div className="text-center border-b pb-4">
                    <div className="flex items-center justify-center space-x-2 mb-2">
                      <Zap className="w-5 h-5 text-primary" />
                      <span className="text-3xl font-bold text-primary">{pkg.systemSizeKw}kW</span>
                    </div>
                    <p className="text-sm text-gray-600">{pkg.panelCount} solar panels</p>
                    {pkg.batterySizeKwh > 0 && (
                      <div className="flex items-center justify-center space-x-2 mt-2">
                        <Battery className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-semibold text-green-600">
                          + {pkg.batterySizeKwh}kWh Battery
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Pricing */}
                  <div className="text-center space-y-2">
                    <div className="flex items-baseline justify-center">
                      <span className="text-4xl font-bold text-coral">
                        {formatCurrency(pkg.finalPrice)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 line-through">
                      {formatCurrency(pkg.subtotal)}
                    </p>
                    <div className="inline-block bg-green-50 text-green-700 px-3 py-1 rounded-full text-sm font-semibold">
                      Save {formatCurrency(pkg.totalRebates)} in rebates
                    </div>
                    <p className="text-lg font-semibold text-primary">
                      From ${pkg.costPerDay}/day
                    </p>
                  </div>

                  {/* Suitability */}
                  {pkg.suitability && (
                    <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
                      <Users className="w-4 h-4" />
                      <span>{pkg.suitability}</span>
                      {pkg.dailyUsage && (
                        <>
                          <span>•</span>
                          <span>{pkg.dailyUsage} daily</span>
                        </>
                      )}
                    </div>
                  )}

                  {/* Savings */}
                  <div className="bg-emerald-50 rounded-lg p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Annual Savings</span>
                      <span className="font-bold text-emerald-700">
                        {formatCurrency(pkg.annualSavings)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">25-Year Savings</span>
                      <span className="font-bold text-emerald-700">
                        {formatCurrency(pkg.year25Savings)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Payback Period</span>
                      <span className="font-bold text-emerald-700">
                        {pkg.paybackYears} years
                      </span>
                    </div>
                  </div>

                  {/* Features */}
                  {pkg.featureList && pkg.featureList.length > 0 && (
                    <div className="space-y-2">
                      {pkg.featureList.slice(0, 4).map((feature, i) => (
                        <div key={i} className="flex items-start space-x-2">
                          <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                          <span className="text-sm text-gray-700">{feature}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* CTA */}
                  <Link 
                    href={`/calculator-v2?packageId=${pkg.id}&systemSize=${pkg.systemSizeKw}&batterySize=${pkg.batterySizeKwh}`}
                    className="block"
                  >
                    <Button
                      className={`w-full ${
                        isPopular
                          ? 'bg-coral hover:bg-coral-600'
                          : 'bg-primary hover:bg-primary-800'
                      } text-white`}
                      size="lg"
                    >
                      Get This Package
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="mt-12 text-center">
          <p className="text-gray-600 mb-4">
            Need a custom solution? Our calculator can design the perfect system for your needs.
          </p>
          <Link href="/calculator-v2">
            <Button variant="outline" size="lg" className="border-primary text-primary hover:bg-primary hover:text-white">
              <TrendingUp className="w-4 h-4 mr-2" />
              Use Custom Calculator
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
