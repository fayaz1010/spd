'use client';

import { CheckCircle, Download, Mail, Phone, Calendar, ArrowRight, Sun, Zap, Battery, CreditCard, Clock, AlertCircle, DollarSign, TrendingUp, ShieldCheck, ChevronDown, Share2, Printer, Loader2, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { useState, useEffect, Suspense } from 'react';
import { formatCurrency } from '@/lib/calculations';
import { useToast } from '@/hooks/use-toast';
import { useSearchParams } from 'next/navigation';
import { SignaturePad } from '@/components/signatures/SignaturePad';
import { SignatureDisplay } from '@/components/signatures/SignatureDisplay';

// Force dynamic rendering since we use searchParams
export const dynamic = 'force-dynamic';

interface PaymentSettings {
  depositPercentage: number;
  installmentMonths: number;
  urgencyMessage: string;
}

function ConfirmationContent() {
  const searchParams = useSearchParams();
  const quoteRef = searchParams.get('ref') ?? 'N/A';
  const { toast } = useToast();
  const [quoteData, setQuoteData] = useState<any>(null);
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings | null>(null);
  const [paymentOption, setPaymentOption] = useState<'deposit' | 'installment' | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingQuote, setLoadingQuote] = useState(true);
  
  // Card payment form
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCVV, setCardCVV] = useState('');
  
  // Signature state
  const [showSignaturePad, setShowSignaturePad] = useState(false);
  const [signature, setSignature] = useState<any>(null);
  const [downloadingPDF, setDownloadingPDF] = useState(false);

  useEffect(() => {
    // PHASE 2: Fetch quote from database instead of URL
    async function fetchQuote() {
      const quoteId = searchParams.get('quoteId');
      const leadId = searchParams.get('leadId');
      
      if (!quoteId && !leadId) {
        console.error('No quote ID or lead ID provided');
        setLoadingQuote(false);
        return;
      }
      
      try {
        const params = new URLSearchParams();
        if (quoteId) params.append('quoteId', quoteId);
        else if (leadId) params.append('leadId', leadId);
        
        const response = await fetch(`/api/quote/get?${params}`);
        const result = await response.json();
        
        if (result.success && result.quote) {
          // Transform database quote to display format
          setQuoteData({
            leadId: leadId || result.quote.leadId,
            systemSizeKw: result.quote.systemSizeKw,
            numPanels: result.quote.panelCount,
            batterySizeKwh: result.quote.batterySizeKwh,
            totalCost: result.quote.totalCostAfterRebates,
            finalTotal: result.quote.totalCostAfterRebates,
            solarCost: result.quote.panelSystemCost,
            batteryCost: result.quote.batteryCost,
            inverterCost: result.quote.inverterCost,
            installationCost: result.quote.installationCost,
            subtotal: result.quote.totalCostBeforeRebates,
            totalRebates: result.quote.totalRebates,
            annualSavings: result.quote.annualSavings,
            paybackYears: result.quote.paybackYears,
            savings25Years: result.quote.year25Savings,
            rebates: {
              federalSRES: result.quote.federalSolarRebate,
              federalBattery: result.quote.federalBatteryRebate,
              waBatteryScheme: result.quote.stateBatteryRebate,
            },
            panelBrand: {
              name: result.quote.panelBrandName,
              wattage: result.quote.panelBrandWattage,
            },
            batteryBrand: {
              name: result.quote.batteryBrandName,
              capacity: result.quote.batteryBrandCapacity,
            },
            inverterBrand: {
              name: result.quote.inverterBrandName,
            },
          });
        } else {
          console.error('Failed to fetch quote:', result.error);
        }
      } catch (error) {
        console.error('Error fetching quote:', error);
      } finally {
        setLoadingQuote(false);
      }
    }
    
    fetchQuote();
    
    // Fetch payment settings
    fetch('/api/payment-settings')
      .then(res => res.json())
      .then(data => setPaymentSettings(data))
      .catch(err => console.error('Failed to fetch payment settings:', err));
  }, [searchParams]);

  if (loadingQuote) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-primary animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading your quote...</p>
        </div>
      </div>
    );
  }

  if (!quoteData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <AlertCircle className="h-12 w-12 mx-auto" />
          </div>
          <p className="text-gray-600">Unable to load quote. Please contact support.</p>
        </div>
      </div>
    );
  }

  // Use finalTotal if available (from API calculation), otherwise use totalCost
  const totalInvestment = quoteData.finalTotal || quoteData.totalCost || 0;
  const annualSavings = quoteData.annualSavings || 0;
  const paybackYears = annualSavings > 0 ? totalInvestment / annualSavings : 0;
  
  const depositAmount = paymentSettings 
    ? (totalInvestment * paymentSettings.depositPercentage) / 100 
    : 0;
  
  const monthlyPayment = paymentSettings
    ? totalInvestment / paymentSettings.installmentMonths
    : 0;

  const handlePayDeposit = async () => {
    if (!quoteData?.leadId) {
      alert('Error: No lead ID found. Please contact support.');
      return;
    }

    setLoading(true);
    
    try {
      // Check if Stripe is configured
      const configRes = await fetch('/api/stripe/config');
      const config = await configRes.json();
      
      if (!config.enabled) {
        alert('Online payments are currently unavailable. Please contact us directly to complete your payment.');
        setLoading(false);
        return;
      }

      // Create checkout session
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId: quoteData.leadId,
          paymentType: 'deposit',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error: any) {
      console.error('Payment error:', error);
      alert(error.message || 'Failed to process payment. Please try again.');
      setLoading(false);
    }
  };

  const handleInstallmentPlan = async () => {
    if (!quoteData?.leadId) {
      alert('Error: No lead ID found. Please contact support.');
      return;
    }

    setLoading(true);
    
    try {
      // Check if Stripe is configured
      const configRes = await fetch('/api/stripe/config');
      const config = await configRes.json();
      
      if (!config.enabled) {
        alert('Online payments are currently unavailable. Please contact us directly to set up a payment plan.');
        setLoading(false);
        return;
      }

      // For installment plans, you might want to create a Stripe subscription
      // or a payment plan. For now, we'll use the same checkout with a note
      alert('Our team will contact you within 24 hours to set up your custom payment plan. Thank you!');
      setLoading(false);
    } catch (error: any) {
      console.error('Payment plan error:', error);
      alert(error.message || 'Failed to set up payment plan. Please try again.');
      setLoading(false);
    }
  };

  const handlePrint = () => {
    // Hide payment forms and buttons before printing
    const paymentSections = document.querySelectorAll('.no-print');
    paymentSections.forEach(section => {
      (section as HTMLElement).style.display = 'none';
    });

    window.print();

    // Restore visibility after printing
    setTimeout(() => {
      paymentSections.forEach(section => {
        (section as HTMLElement).style.display = '';
      });
    }, 100);
  };

  const handleSignature = async (signatureData: string, signerName: string) => {
    const quoteId = searchParams.get('quoteId');
    
    if (!quoteId) {
      toast({
        title: 'Error',
        description: 'Quote ID not found',
        variant: 'destructive',
      });
      return;
    }

    try {
      const response = await fetch('/api/signatures/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quoteId,
          signatureData,
          signerName,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setSignature({
          signatureData,
          signedBy: signerName,
          signedAt: result.signature.signedAt,
        });
        setShowSignaturePad(false);
        toast({
          title: 'Success!',
          description: 'Quote signed successfully',
        });
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to save signature',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Signature error:', error);
      toast({
        title: 'Error',
        description: 'Failed to save signature',
        variant: 'destructive',
      });
    }
  };

  const handleDownloadPDF = async () => {
    const quoteId = searchParams.get('quoteId');
    
    if (!quoteId) {
      toast({
        title: 'Error',
        description: 'Quote ID not found',
        variant: 'destructive',
      });
      return;
    }

    setDownloadingPDF(true);

    try {
      const response = await fetch('/api/quotes/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quoteId }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `quote-${quoteData?.quoteReference || quoteId}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        toast({
          title: 'Success!',
          description: 'PDF downloaded successfully',
        });
      } else {
        throw new Error('Failed to generate PDF');
      }
    } catch (error) {
      console.error('PDF download error:', error);
      toast({
        title: 'Error',
        description: 'Failed to download PDF',
        variant: 'destructive',
      });
    } finally {
      setDownloadingPDF(false);
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: `Sun Direct Power - Solar Quote ${quoteRef}`,
      text: `Check out my personalized solar quote! ${Number(quoteData?.systemSizeKw || 0).toFixed(2)}kW system with ${Number(quoteData?.batterySizeKwh || 0).toFixed(1)}kWh battery - saving ${formatCurrency(annualSavings)}/year!`,
      url: window.location.href,
    };

    try {
      // Try native share API first (works on mobile)
      if (navigator.share) {
        await navigator.share(shareData);
        toast({
          title: 'Shared successfully!',
          description: 'Quote shared',
        });
      } else {
        // Fallback: Copy link to clipboard
        await navigator.clipboard.writeText(window.location.href);
        toast({
          title: 'Link copied!',
          description: 'Quote link has been copied to your clipboard',
        });
      }
    } catch (error) {
      console.error('Error sharing:', error);
      // If all else fails, try copying to clipboard
      try {
        await navigator.clipboard.writeText(window.location.href);
        toast({
          title: 'Link copied!',
          description: 'Quote link has been copied to your clipboard',
        });
      } catch (clipboardError) {
        toast({
          title: 'Share failed',
          description: 'Please copy the URL manually',
          variant: 'destructive',
        });
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-2">
              <Sun className="h-8 w-8 text-gold" />
              <span className="text-xl font-bold text-primary">Sun Direct Power</span>
            </Link>
            <div className="flex items-center space-x-4">
              <div className="hidden md:block text-right">
                <p className="text-xs text-gray-500">Your Quote Reference</p>
                <p className="text-sm font-bold text-primary">{quoteRef}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
        {/* Success Message */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald mb-4">
            <CheckCircle className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-primary mb-2">
            Your Custom Solar Quote is Ready!
          </h1>
          <p className="text-lg text-gray-600">
            Start saving ${Math.round(annualSavings).toLocaleString()} per year
          </p>
          
          {/* Share & Print Buttons */}
          <div className="flex items-center justify-center gap-3 mt-6 no-print">
            <Button
              onClick={handleShare}
              variant="outline"
              className="flex items-center gap-2 px-6 py-2 text-primary border-primary hover:bg-primary hover:text-white transition-colors"
            >
              <Share2 className="h-4 w-4" />
              Share Quote
            </Button>
            <Button
              onClick={handlePrint}
              variant="outline"
              className="flex items-center gap-2 px-6 py-2 text-primary border-primary hover:bg-primary hover:text-white transition-colors"
            >
              <Printer className="h-4 w-4" />
              Print Quote
            </Button>
          </div>
        </div>

        {/* Main Grid - Quote Details & Payment */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* LEFT COLUMN: Quote Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* System Summary */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-primary mb-6">Your Solar System</h2>
              
              <div className="grid md:grid-cols-3 gap-4 mb-6">
                <div className="bg-gradient-primary rounded-xl p-4 text-white">
                  <Zap className="h-8 w-8 mb-2 text-gold" />
                  <p className="text-white/70 text-sm mb-1">Solar Panels</p>
                  <p className="text-2xl font-bold">{Number(quoteData.systemSizeKw).toFixed(2)}kW</p>
                  <p className="text-white/70 text-xs">{quoteData.numPanels} panels</p>
                  {quoteData.panelBrand && (
                    <p className="text-white/60 text-xs mt-1">
                      {quoteData.panelBrand.wattage}W per panel
                    </p>
                  )}
                </div>
                
                <div className="bg-gradient-gold rounded-xl p-4 text-white">
                  <Battery className="h-8 w-8 mb-2" />
                  <p className="text-white/70 text-sm mb-1">Battery Storage</p>
                  <p className="text-2xl font-bold">{Number(quoteData.batterySizeKwh).toFixed(1)}kWh</p>
                  <p className="text-white/70 text-xs">Backup power</p>
                </div>
                
                <div className="bg-gradient-emerald rounded-xl p-4 text-white">
                  <TrendingUp className="h-8 w-8 mb-2" />
                  <p className="text-white/70 text-sm mb-1">Annual Savings</p>
                  <p className="text-2xl font-bold">{formatCurrency(annualSavings)}</p>
                  <p className="text-white/70 text-xs">Per year</p>
                </div>
              </div>

              {/* Detailed Breakdown */}
              <div className="border-t border-gray-200 pt-6">
                <h3 className="font-semibold text-primary mb-4">Investment Breakdown</h3>
                <div className="space-y-3">
                  {/* Solar System */}
                  <details className="group">
                    <summary className="flex justify-between text-sm cursor-pointer hover:bg-gray-50 p-2 rounded">
                      <span className="text-gray-600 flex items-center">
                        Solar System ({(quoteData.systemSizeKw ?? 0).toFixed(1)}kW)
                        <ChevronDown className="h-4 w-4 ml-2 group-open:rotate-180 transition-transform" />
                      </span>
                      <span className="font-semibold">{formatCurrency(quoteData.solarCost || 0)}</span>
                    </summary>
                    <div className="mt-2 ml-4 p-3 bg-gray-50 rounded-lg text-xs space-y-1">
                      {quoteData.panelBrand ? (
                        <>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Brand:</span>
                            <span className="font-semibold">{quoteData.panelBrand.manufacturer} {quoteData.panelBrand.name}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Number of Panels:</span>
                            <span className="font-semibold">{quoteData.numPanels ?? 0} × {quoteData.panelBrand.wattage}W</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Efficiency:</span>
                            <span className="font-semibold">{quoteData.panelBrand.efficiency}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Warranty:</span>
                            <span className="font-semibold">{quoteData.panelBrand.warrantyYears} years</span>
                          </div>
                        </>
                      ) : (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Number of Panels:</span>
                          <span className="font-semibold">{quoteData.numPanels ?? 0} panels</span>
                        </div>
                      )}
                    </div>
                  </details>

                  {/* Battery Storage */}
                  {quoteData.batterySizeKwh > 0 && (
                    <details className="group">
                      <summary className="flex justify-between text-sm cursor-pointer hover:bg-gray-50 p-2 rounded">
                        <span className="text-gray-600 flex items-center">
                          Battery Storage ({Number(quoteData.batterySizeKwh ?? 0).toFixed(1)}kWh)
                          <ChevronDown className="h-4 w-4 ml-2 group-open:rotate-180 transition-transform" />
                        </span>
                        <span className="font-semibold">{formatCurrency(quoteData.batteryCost || 0)}</span>
                      </summary>
                      <div className="mt-2 ml-4 p-3 bg-gray-50 rounded-lg text-xs space-y-1">
                        {quoteData.batteryBrand ? (
                          <>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Brand:</span>
                              <span className="font-semibold">{quoteData.batteryBrand.manufacturer} {quoteData.batteryBrand.name}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Configuration:</span>
                              <span className="font-semibold">
                                {(quoteData.numBatteries || 1) > 1 
                                  ? `${quoteData.numBatteries} × ${Number(quoteData.batteryBrand.capacityKwh).toFixed(1)}kWh units`
                                  : `${Number(quoteData.batteryBrand.capacityKwh).toFixed(1)}kWh single unit`
                                }
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Usable Capacity:</span>
                              <span className="font-semibold">{(Number(quoteData.batteryBrand.usableKwh) * (quoteData.numBatteries || 1)).toFixed(1)}kWh</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Warranty:</span>
                              <span className="font-semibold">{quoteData.batteryBrand.warrantyYears} years</span>
                            </div>
                          </>
                        ) : (
                          <div className="text-gray-600">
                            {Number(quoteData.batterySizeKwh ?? 0).toFixed(1)}kWh total storage capacity
                          </div>
                        )}
                      </div>
                    </details>
                  )}

                  {/* Inverter */}
                  {quoteData.inverterBrand && quoteData.inverterCost > 0 && (
                    <details className="group">
                      <summary className="flex justify-between text-sm cursor-pointer hover:bg-gray-50 p-2 rounded">
                        <span className="text-gray-600 flex items-center">
                          Inverter ({(quoteData.systemSizeKw ?? 0).toFixed(1)}kW)
                          <ChevronDown className="h-4 w-4 ml-2 group-open:rotate-180 transition-transform" />
                        </span>
                        <span className="font-semibold">{formatCurrency(quoteData.inverterCost || 0)}</span>
                      </summary>
                      <div className="mt-2 ml-4 p-3 bg-gray-50 rounded-lg text-xs space-y-1">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Brand:</span>
                          <span className="font-semibold">{quoteData.inverterBrand.manufacturer} {quoteData.inverterBrand.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Capacity:</span>
                          <span className="font-semibold">{quoteData.inverterBrand.capacityKw}kW</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Warranty:</span>
                          <span className="font-semibold">{quoteData.inverterBrand.warrantyYears} years</span>
                        </div>
                        {quoteData.inverterBrand.hasOptimizers && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Features:</span>
                            <span className="font-semibold text-emerald">Panel optimizers included</span>
                          </div>
                        )}
                      </div>
                    </details>
                  )}

                  {/* Add-ons */}
                  {quoteData.selectedAddons && quoteData.selectedAddons.length > 0 && (
                    <details className="group">
                      <summary className="flex justify-between text-sm cursor-pointer hover:bg-gray-50 p-2 rounded">
                        <span className="text-gray-600 flex items-center">
                          Add-ons & Extras ({quoteData.selectedAddons.length})
                          <ChevronDown className="h-4 w-4 ml-2 group-open:rotate-180 transition-transform" />
                        </span>
                        <span className="font-semibold">{formatCurrency(quoteData.addonsCost || 0)}</span>
                      </summary>
                      <div className="mt-2 ml-4 p-3 bg-gray-50 rounded-lg text-xs space-y-1">
                        {quoteData.selectedAddons.map((addon: string, idx: number) => (
                          <div key={idx} className="text-gray-700">
                            • {addon.replace(/([A-Z])/g, ' $1').trim()}
                          </div>
                        ))}
                      </div>
                    </details>
                  )}

                  <div className="flex justify-between text-sm border-t pt-3">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-semibold">{formatCurrency(quoteData.subtotal || totalInvestment)}</span>
                  </div>
                  
                  {/* Rebates with expandable details */}
                  <details className="group">
                    <summary className="flex justify-between text-sm cursor-pointer hover:bg-gray-50 p-2 rounded text-emerald">
                      <span className="flex items-center font-semibold">
                        Government Rebates Applied
                        <ChevronDown className="h-4 w-4 ml-2 group-open:rotate-180 transition-transform" />
                      </span>
                      <span className="font-semibold">-{formatCurrency(quoteData.totalRebates || 0)}</span>
                    </summary>
                    <div className="mt-2 ml-4 p-3 bg-emerald-50 rounded-lg text-xs space-y-2">
                      {quoteData.rebates?.federalSRES > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-700">Federal SRES (Solar):</span>
                          <span className="font-semibold text-emerald">-{formatCurrency(quoteData.rebates.federalSRES)}</span>
                        </div>
                      )}
                      {quoteData.rebates?.federalBattery > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-700">Federal Battery (30%):</span>
                          <span className="font-semibold text-emerald">-{formatCurrency(quoteData.rebates.federalBattery)}</span>
                        </div>
                      )}
                      {quoteData.rebates?.waBatteryScheme > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-700">WA Battery Scheme:</span>
                          <span className="font-semibold text-emerald">-{formatCurrency(quoteData.rebates.waBatteryScheme)}</span>
                        </div>
                      )}
                      <div className="border-t border-emerald-200 pt-2 mt-2">
                        <p className="text-gray-600 text-xs italic">
                          We handle all rebate applications for you - no extra paperwork required!
                        </p>
                      </div>
                    </div>
                  </details>
                  
                  <div className="flex justify-between text-lg font-bold border-t border-gray-300 pt-3">
                    <span className="text-primary">Total Investment</span>
                    <span className="text-coral">{formatCurrency(totalInvestment)}</span>
                  </div>
                </div>
              </div>

              {/* Important Info - Deposit & Rebates */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-xl p-6 mt-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-blue-600 rounded-full p-2">
                    <DollarSign className="h-5 w-5 text-white" />
                  </div>
                  <h4 className="font-bold text-primary text-lg">Payment & Rebate Details</h4>
                </div>
                
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div className="bg-white rounded-lg p-4">
                    <p className="text-xs text-gray-600 mb-1">Required Deposit ({paymentSettings?.depositPercentage ?? 10}%)</p>
                    <p className="text-2xl font-bold text-primary">{formatCurrency(depositAmount)}</p>
                    <p className="text-xs text-gray-500 mt-1">To secure your installation & lock in rebates</p>
                  </div>
                  <div className="bg-white rounded-lg p-4">
                    <p className="text-xs text-gray-600 mb-1">Government Rebates Applied</p>
                    <p className="text-2xl font-bold text-emerald">{formatCurrency(quoteData.totalRebates || 0)}</p>
                    <p className="text-xs text-gray-500 mt-1">We handle all applications for you</p>
                  </div>
                </div>

                <div className="bg-white rounded-lg p-4">
                  <p className="text-sm text-gray-700 mb-2"><strong>Payment Breakdown:</strong></p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Today (to secure booking):</span>
                      <span className="font-bold text-primary">{formatCurrency(depositAmount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">On installation day:</span>
                      <span className="font-bold text-primary">{formatCurrency(totalInvestment - depositAmount)}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2 mt-2">
                      <span className="text-gray-900 font-semibold">Total Investment:</span>
                      <span className="font-bold text-coral text-lg">{formatCurrency(totalInvestment)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* ROI Highlight */}
              <div className="bg-emerald-50 border-2 border-emerald-200 rounded-xl p-4 mt-6">
                <div className="flex items-center gap-3 mb-2">
                  <ShieldCheck className="h-6 w-6 text-emerald" />
                  <h4 className="font-bold text-primary">Your Investment Returns</h4>
                </div>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Payback Period</p>
                    <p className="text-2xl font-bold text-emerald">{paybackYears.toFixed(1)} years</p>
                  </div>
                  <div>
                    <p className="text-gray-600">25-Year Savings</p>
                    <p className="text-2xl font-bold text-emerald">{formatCurrency(annualSavings * 25)}</p>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-3">
                  After payback, all savings are pure profit for the next 20+ years!
                </p>
              </div>
            </div>

            {/* What Happens Next */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-primary mb-6">What Happens Next?</h2>
              
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 bg-coral rounded-full p-3">
                    <Mail className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-primary mb-1">1. Quote Confirmation Email</h3>
                    <p className="text-sm text-gray-600">
                      Check your inbox for a detailed PDF quote with all specifications.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 bg-gold rounded-full p-3">
                    <Phone className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-primary mb-1">2. Expert Consultation (24hrs)</h3>
                    <p className="text-sm text-gray-600">
                      Our solar specialist will call to discuss your system and answer questions.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 bg-emerald rounded-full p-3">
                    <Calendar className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-primary mb-1">3. Site Inspection & Design</h3>
                    <p className="text-sm text-gray-600">
                      We visit your property to finalize the design and confirm installation details.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 bg-primary rounded-full p-3">
                    <Sun className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-primary mb-1">4. Professional Installation</h3>
                    <p className="text-sm text-gray-600">
                      Most systems installed in 1 day. Start saving immediately!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Payment Options */}
          <div className="lg:col-span-1 space-y-6 no-print">
            {/* Dynamic Rebate Banner */}
            <div className="bg-gradient-to-r from-emerald to-emerald-600 text-white rounded-xl p-4 shadow-lg">
              <div className="flex items-center gap-2 mb-2">
                <ShieldCheck className="h-5 w-5" />
                <h3 className="font-bold">You're Qualified!</h3>
              </div>
              <p className="text-lg font-bold text-white mb-1">
                {formatCurrency(quoteData.totalRebates || 0)} in Government Rebates
              </p>
              <div className="text-xs text-white/90 space-y-1">
                {quoteData.rebates?.federalSRES > 0 && (
                  <p>✓ Federal SRES: {formatCurrency(quoteData.rebates.federalSRES)}</p>
                )}
                {quoteData.rebates?.federalBattery > 0 && (
                  <p>✓ Federal Battery: {formatCurrency(quoteData.rebates.federalBattery)}</p>
                )}
                {quoteData.rebates?.waBatteryScheme > 0 && (
                  <p>✓ WA Battery Scheme: {formatCurrency(quoteData.rebates.waBatteryScheme)}</p>
                )}
              </div>
            </div>

            {/* Urgency Banner */}
            {paymentSettings?.urgencyMessage && (
              <div className="bg-gradient-to-r from-coral to-coral-600 text-white rounded-xl p-4 shadow-lg animate-pulse">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="h-5 w-5" />
                  <h3 className="font-bold">Act Fast!</h3>
                </div>
                <p className="text-sm text-white/90">{paymentSettings.urgencyMessage}</p>
                <p className="text-xs text-white/75 mt-2">
                  Every month you wait = ${Math.round(annualSavings/12)} in lost savings
                </p>
              </div>
            )}

            {/* Payment Option 1: Deposit */}
            <div className={`bg-white rounded-2xl shadow-xl p-6 border-2 transition-all ${paymentOption === 'deposit' ? 'border-emerald' : 'border-gray-200'}`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-6 w-6 text-coral" />
                  <h3 className="text-xl font-bold text-primary">Pay Deposit</h3>
                </div>
                <span className="bg-emerald text-white text-xs px-3 py-1 rounded-full font-bold">POPULAR</span>
              </div>
              
              <div className="bg-gradient-primary rounded-xl p-4 text-white mb-4">
                <p className="text-white/70 text-sm mb-1">Deposit Amount ({paymentSettings?.depositPercentage}%)</p>
                <p className="text-3xl font-bold">{formatCurrency(depositAmount)}</p>
              </div>

              <ul className="space-y-2 mb-4 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald flex-shrink-0" />
                  <span>Lock in your installation slot TODAY</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald flex-shrink-0" />
                  <span>Price guarantee for 30 days</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald flex-shrink-0" />
                  <span>Priority scheduling</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald flex-shrink-0" />
                  <span>Remaining balance due on installation day</span>
                </li>
              </ul>

              {paymentOption === 'deposit' ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 gap-3">
                    <div>
                      <Label className="text-xs font-semibold text-gray-700">Card Number</Label>
                      <Input 
                        type="text"
                        placeholder="1234 5678 9012 3456"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        maxLength={19}
                        className="font-mono"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs font-semibold text-gray-700">Expiry (MM/YY)</Label>
                        <Input 
                          type="text"
                          placeholder="12/25"
                          value={cardExpiry}
                          onChange={(e) => setCardExpiry(e.target.value)}
                          maxLength={5}
                          className="font-mono"
                        />
                      </div>
                      <div>
                        <Label className="text-xs font-semibold text-gray-700">CVV</Label>
                        <Input 
                          type="text"
                          placeholder="123"
                          value={cardCVV}
                          onChange={(e) => setCardCVV(e.target.value)}
                          maxLength={3}
                          className="font-mono"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <Button 
                    onClick={handlePayDeposit}
                    disabled={loading}
                    className="w-full bg-emerald hover:bg-emerald-600 text-white text-lg h-12"
                  >
                    {loading ? 'Processing...' : `Pay ${formatCurrency(depositAmount)} & Lock Deal`}
                  </Button>
                  
                  <Button 
                    variant="ghost"
                    onClick={() => setPaymentOption(null)}
                    className="w-full text-xs"
                  >
                    Choose different option
                  </Button>
                </div>
              ) : (
                <Button 
                  onClick={() => setPaymentOption('deposit')}
                  className="w-full bg-coral hover:bg-coral-600 text-white"
                >
                  Choose This Option
                </Button>
              )}
            </div>

            {/* Payment Option 2: Installment */}
            <div className={`bg-white rounded-2xl shadow-xl p-6 border-2 transition-all ${paymentOption === 'installment' ? 'border-emerald' : 'border-gray-200'}`}>
              <div className="flex items-center gap-2 mb-4">
                <Clock className="h-6 w-6 text-gold" />
                <h3 className="text-xl font-bold text-primary">Payment Plan</h3>
              </div>
              
              <div className="bg-gradient-gold rounded-xl p-4 text-white mb-4">
                <p className="text-white/70 text-sm mb-1">{paymentSettings?.installmentMonths} Monthly Payments</p>
                <p className="text-3xl font-bold">{formatCurrency(monthlyPayment)}/mo</p>
                <p className="text-white/70 text-xs mt-1">0% interest</p>
              </div>

              <ul className="space-y-2 mb-4 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald flex-shrink-0" />
                  <span>Start saving immediately</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald flex-shrink-0" />
                  <span>No interest, no hidden fees</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald flex-shrink-0" />
                  <span>Your savings may cover the payment!</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald flex-shrink-0" />
                  <span>Flexible payment dates</span>
                </li>
              </ul>

              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 mb-4">
                <p className="text-xs text-gray-600 mb-1">💡 Smart Financing Tip</p>
                <p className="text-sm font-semibold text-primary">
                  Your ${Math.round(annualSavings/12)}/month savings can cover {Math.round((annualSavings/12)/monthlyPayment*100)}% of this payment!
                </p>
              </div>

              <Button 
                onClick={handleInstallmentPlan}
                disabled={loading}
                className="w-full bg-gold hover:bg-gold-600 text-white"
              >
                {loading ? 'Processing...' : 'Set Up Payment Plan'}
              </Button>
            </div>

            {/* Contact Box */}
            <div className="bg-gradient-primary rounded-xl p-6 text-white">
              <h3 className="text-lg font-bold mb-3">Questions? We're Here</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5" />
                  <div>
                    <p className="text-white/70 text-xs">Call Us</p>
                    <p className="font-bold">08 6156 6747</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5" />
                  <div>
                    <p className="text-white/70 text-xs">Email Us</p>
                    <p className="font-bold text-sm">sales@sundirectpower.com.au</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Signature & PDF Download Section */}
        <div className="mt-12 space-y-6">
          {/* PDF Download Button */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="h-8 w-8 text-primary" />
                <div>
                  <h3 className="text-lg font-bold text-primary">Download Your Quote</h3>
                  <p className="text-sm text-gray-600">Get a professional PDF copy of your quote</p>
                </div>
              </div>
              <Button
                onClick={handleDownloadPDF}
                disabled={downloadingPDF}
                className="bg-primary hover:bg-primary/90"
              >
                {downloadingPDF ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Download PDF
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Signature Section */}
          {!signature && !showSignaturePad && (
            <div className="bg-gradient-to-r from-emerald to-emerald-600 text-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-8 w-8" />
                  <div>
                    <h3 className="text-lg font-bold">Accept This Quote</h3>
                    <p className="text-sm text-white/90">Sign electronically to proceed with your solar installation</p>
                  </div>
                </div>
                <Button
                  onClick={() => setShowSignaturePad(true)}
                  className="bg-white text-emerald hover:bg-gray-100"
                >
                  Sign Quote
                </Button>
              </div>
            </div>
          )}

          {/* Signature Pad */}
          {showSignaturePad && !signature && (
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <SignaturePad
                onSave={handleSignature}
                onCancel={() => setShowSignaturePad(false)}
                title="Accept Your Solar Quote"
                description="By signing below, you accept this quote and authorize us to proceed with your solar installation"
              />
            </div>
          )}

          {/* Display Signed Quote */}
          {signature && (
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <SignatureDisplay
                signatureData={signature.signatureData}
                signerName={signature.signedBy}
                signedAt={signature.signedAt}
                showBorder={false}
              />
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800 font-medium">
                  ✓ Quote accepted! Our team will contact you within 24 hours to schedule your installation.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Trust Signals */}
        <div className="mt-12 bg-white rounded-2xl shadow-lg p-8">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <p className="text-3xl font-bold text-coral mb-2">⭐⭐⭐⭐⭐</p>
              <p className="text-sm font-semibold text-primary">4.9/5 Customer Rating</p>
              <p className="text-xs text-gray-500">From 500+ verified reviews</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-primary mb-2">5,000+</p>
              <p className="text-sm font-semibold text-primary">Happy Perth Families</p>
              <p className="text-xs text-gray-500">Saving money since 2014</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-emerald mb-2">25 Years</p>
              <p className="text-sm font-semibold text-primary">Performance Warranty</p>
              <p className="text-xs text-gray-500">Premium quality guarantee</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Wrap the content in Suspense for useSearchParams
export default function ConfirmationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-primary animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading your quote...</p>
        </div>
      </div>
    }>
      <ConfirmationContent />
    </Suspense>
  );
}
