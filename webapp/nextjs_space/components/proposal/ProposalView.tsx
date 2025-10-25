'use client';

import { useState, useEffect } from 'react';
import HeroSection from './sections/HeroSection';
import ExecutiveSummary from './sections/ExecutiveSummary';
import PropertyAnalysis from './sections/PropertyAnalysis';
import SystemSpecifications from './sections/SystemSpecifications';
import EnergyProduction from './sections/EnergyProduction';
import CostBreakdown from './sections/CostBreakdown';
import SavingsAnalysis from './sections/SavingsAnalysis';
import SavingsPlaceholder from './sections/SavingsPlaceholder';
import ROIAnalysis from './sections/ROIAnalysis';
import EnvironmentalImpact from './sections/EnvironmentalImpact';
import WhatsIncluded from './sections/WhatsIncluded';
import InstallationProcess from './sections/InstallationProcess';
import TermsAndConditions from './sections/TermsAndConditions';
import SignatureSection from './sections/SignatureSection';
import ProposalNavigation from './ProposalNavigation';
import ProposalChartsSection from './sections/ProposalChartsSection';

interface ProposalViewProps {
  quote: any;
  token: string;
}

export default function ProposalView({ quote, token }: ProposalViewProps) {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeSection, setActiveSection] = useState('hero');

  // Track scroll progress
  useEffect(() => {
    const handleScroll = () => {
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight - windowHeight;
      const scrolled = window.scrollY;
      const progress = (scrolled / documentHeight) * 100;
      setScrollProgress(Math.min(progress, 100));
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Track page view
  useEffect(() => {
    // TODO: Send analytics event
    console.log('Proposal viewed:', quote.id);
  }, [quote.id]);

  const hasSavingsData = quote.hasSavingsData && quote.savingsDataJson;

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-gray-50">
      {/* Progress Bar */}
      <div className="fixed top-0 left-0 w-full h-1 bg-gray-200 z-50">
        <div
          className="h-full bg-blue-600 transition-all duration-300"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      {/* Navigation */}
      <ProposalNavigation
        activeSection={activeSection}
        hasSavingsData={hasSavingsData}
      />

      {/* Main Content */}
      <main>
        {/* Section 1: Hero */}
        <section id="hero" className="min-h-screen">
          <HeroSection quote={quote} />
        </section>

        {/* Section 2: Executive Summary */}
        <section id="summary" className="py-8">
          <ExecutiveSummary quote={quote} />
        </section>

        {/* Section 3: Property Analysis */}
        {quote.hasRoofAnalysis && quote.roofAnalysisData && (
          <section id="property" className="py-8 bg-white">
            <PropertyAnalysis
              address={quote.address}
              roofData={quote.roofAnalysisData}
              systemSize={quote.systemSizeKw}
              panelCount={quote.panelCount}
            />
          </section>
        )}

        {/* Section 4: System Specifications */}
        <section id="system" className="py-8">
          <SystemSpecifications quote={quote} />
        </section>

        {/* Section 5: Energy Production */}
        <section id="production" className="py-8 bg-white">
          <EnergyProduction
            monthlyProduction={
              (() => {
                if (!quote.monthlyProductionData) return [];
                if (Array.isArray(quote.monthlyProductionData)) return quote.monthlyProductionData;
                try {
                  const parsed = typeof quote.monthlyProductionData === 'string' 
                    ? JSON.parse(quote.monthlyProductionData)
                    : quote.monthlyProductionData;
                  return Array.isArray(parsed) ? parsed : [];
                } catch {
                  return [];
                }
              })()
            }
            annualProduction={quote.annualProductionKwh || 0}
            systemSize={quote.systemSizeKw || 1}
            quote={quote}
          />
        </section>

        {/* Section 6: Cost Breakdown */}
        <section id="costs" className="py-8">
          <CostBreakdown quote={quote} />
        </section>

        {/* Section 7: Savings Analysis - Conditional */}
        <section id="savings" className="py-8 bg-white">
          {hasSavingsData ? (
            <SavingsAnalysis
              savingsData={quote.savingsDataJson}
              monthlyBill={quote.monthlyBillAmount}
            />
          ) : (
            <SavingsPlaceholder quoteId={quote.id} token={token} />
          )}
        </section>

        {/* Section 8: ROI Analysis - Conditional */}
        {hasSavingsData && (
          <section id="roi" className="py-8">
            <ROIAnalysis savingsData={quote.savingsDataJson} />
          </section>
        )}

        {/* Section 8.5: Performance Charts - NEW! */}
        <section id="charts" className="py-8 bg-gradient-to-b from-blue-50 to-white">
          <ProposalChartsSection quote={quote} />
        </section>

        {/* Section 9: Environmental Impact */}
        <section id="environment" className="py-8 bg-gradient-to-b from-green-50 to-white">
          <EnvironmentalImpact
            annualProduction={quote.annualProductionKwh}
          />
        </section>

        {/* Section 10: What's Included */}
        <section id="included" className="py-8">
          <WhatsIncluded
            hasBattery={quote.batterySizeKwh > 0}
            systemSize={quote.systemSizeKw}
          />
        </section>

        {/* Section 11: Installation Process */}
        <section id="installation" className="py-8 bg-white">
          <InstallationProcess />
        </section>

        {/* Section 12: Terms & Conditions */}
        <section id="terms" className="py-8">
          <TermsAndConditions />
        </section>

        {/* Section 13: Signature */}
        <section id="signature" className="py-12 bg-gradient-to-b from-blue-50 to-white">
          <SignatureSection
            quoteId={quote.id}
            token={token}
            customerName={quote.lead?.name || ''}
            isSigned={!!quote.signature}
          />
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-400">
            © {new Date().getFullYear()} Sun Direct Power. All rights reserved.
          </p>
          <p className="text-gray-500 text-sm mt-2">
            Quote Reference: {quote.quoteReference}
          </p>
        </div>
      </footer>
    </div>
  );
}
