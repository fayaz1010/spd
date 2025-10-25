'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight, ArrowLeft, User, Mail, Phone, Clock, Shield, Loader2, CheckCircle2, DollarSign } from 'lucide-react';
import { CalculatorData } from './calculator-flow-v2';
import AddonDrawer from './addon-drawer';
import toast from 'react-hot-toast';

interface Step6Props {
  data: Partial<CalculatorData>;
  updateData: (data: Partial<CalculatorData>) => void;
  nextStep: () => void;
  prevStep: () => void;
}

const CONTACT_TIMES = [
  { value: 'morning', label: 'Morning (9am-12pm)' },
  { value: 'afternoon', label: 'Afternoon (12pm-5pm)' },
  { value: 'evening', label: 'Evening (5pm-8pm)' },
  { value: 'anytime', label: 'Anytime' },
];

export function Step6Contact({ data, updateData, nextStep, prevStep }: Step6Props) {
  const [firstName, setFirstName] = useState(data.firstName || '');
  const [lastName, setLastName] = useState(data.lastName || '');
  const [email, setEmail] = useState(data.email || '');
  const [phone, setPhone] = useState(data.phone || '');
  const [preferredContactTime, setPreferredContactTime] = useState(data.preferredContactTime || 'anytime');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [submitting, setSubmitting] = useState(false);
  const [contactSubmitted, setContactSubmitted] = useState(false);
  const [showAddonDrawer, setShowAddonDrawer] = useState(false);
  const [depositSettings, setDepositSettings] = useState<{
    depositType: string;
    depositPercentage: number;
    depositFixedAmount: number;
  } | null>(null);

  // Fetch deposit settings from backend
  useEffect(() => {
    fetch('/api/admin/system-settings')
      .then(res => res.json())
      .then(settings => {
        setDepositSettings({
          depositType: settings.depositType || 'percentage',
          depositPercentage: settings.depositPercentage || 30,
          depositFixedAmount: settings.depositFixedAmount || 5000,
        });
      })
      .catch(err => console.error('Failed to fetch deposit settings:', err));
  }, []);

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const validatePhone = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '');
    return cleaned.length >= 10;
  };

  const handleSubmit = async () => {
    const newErrors: { [key: string]: string } = {};

    if (!firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }
    if (!lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }
    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    if (!phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!validatePhone(phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setSubmitting(true);
      setErrors({});

      // Create lead in database
      const response = await fetch('/api/leads/create-early', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // Contact info
          name: `${firstName.trim()} ${lastName.trim()}`,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim(),
          phone: phone.trim(),
          preferredContactTime,
          
          // Property info
          address: data.address,
          propertyType: data.propertyType,
          roofType: data.roofType,
          latitude: data.latitude,
          longitude: data.longitude,
          suburb: data.suburb,
          
          // Energy profile
          quarterlyBill: data.quarterlyBill,
          householdSize: data.householdSize,
          hasEv: data.hasEv,
          planningEv: data.planningEv,
          evCount: data.evCount,
          evChargingTime: data.evChargingTime,
          hasPool: data.hasPool,
          poolHeated: data.poolHeated,
          homeOfficeCount: data.homeOfficeCount,
          
          // System selection (from finalCalculation or selectedQuote)
          systemSizeKw: (data as any).finalCalculation?.systemSpecs?.solarKw || data.selectedQuote?.systemSizeKw,
          numPanels: (data as any).finalCalculation?.systemSpecs?.panelCount || data.selectedQuote?.panelCount,
          batterySizeKwh: (data as any).finalCalculation?.systemSpecs?.batteryKwh || data.selectedQuote?.batterySizeKwh,
          
          // Quote data (use finalCalculation if available, otherwise selectedQuote)
          quoteData: (data as any).finalCalculation || data.selectedQuote,
          sessionId: data.sessionId,
          quoteId: data.quoteId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create lead');
      }

      const result = await response.json();

      // Transform finalCalculation to match Step 7's expected quote structure
      const finalCalc = (data as any).finalCalculation;
      const selectedProducts = (data as any).selectedProducts;
      
      // Ensure we have finalCalc, otherwise use existing selectedQuote
      if (!finalCalc && !data.selectedQuote) {
        throw new Error('No quote data available');
      }
      
      const transformedQuote = finalCalc ? {
        systemSizeKw: finalCalc.systemSpecs.solarKw,
        panelCount: finalCalc.systemSpecs.panelCount,
        batterySizeKwh: finalCalc.systemSpecs.batteryKwh,
        panelWattage: finalCalc.systemSpecs.panelWattage,
        
        costs: {
          panels: finalCalc.costs.panels,
          battery: finalCalc.costs.battery,
          inverter: finalCalc.costs.inverter,
          installation: finalCalc.costs.installation,
          subtotal: finalCalc.costs.subtotal,
        },
        
        rebates: {
          federalSRES: finalCalc.rebates.federalSolar,
          federalBattery: finalCalc.rebates.federalBattery,
          waState: finalCalc.rebates.stateBattery,
          total: finalCalc.rebates.total,
        },
        
        totalAfterRebates: finalCalc.finalInvestment,
        depositAmount: depositSettings?.depositType === 'fixed'
          ? depositSettings.depositFixedAmount
          : Math.round(finalCalc.finalInvestment * ((depositSettings?.depositPercentage || 30) / 100)),
        
        savings: {
          monthly: Math.round(finalCalc.savings.annual / 12),
          annual: finalCalc.savings.annual,
          year25: finalCalc.savings.year25,
        },
        
        roi: {
          paybackYears: finalCalc.savings.paybackYears,
          roiPercentage: Math.round((finalCalc.savings.year25 / finalCalc.finalInvestment) * 100),
        },
        
        production: {
          dailyGeneration: finalCalc.systemSpecs.dailyGeneration,
          annualGeneration: Math.round(finalCalc.systemSpecs.dailyGeneration * 365),
        },
        
        // Use selectedProducts IDs instead of finalCalc.products (which doesn't exist)
        panelBrand: selectedProducts?.panelId || null,
        batteryBrand: selectedProducts?.batteryId || null,
        inverterBrand: selectedProducts?.inverterId || null,
      } : {
        // Use existing selectedQuote if finalCalc is not available
        ...data.selectedQuote,
        // Ensure all required fields exist
        savings: data.selectedQuote?.savings || { annual: 0, monthly: 0, year25: 0 },
        roi: data.selectedQuote?.roi || { paybackYears: 0, roiPercentage: 0 },
        costs: data.selectedQuote?.costs || { panels: 0, battery: 0, inverter: 0, installation: 0, subtotal: 0 },
        rebates: data.selectedQuote?.rebates || { federalSRES: 0, federalBattery: 0, waState: 0, total: 0 },
      };

      updateData({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        preferredContactTime,
        leadId: result.leadId,
        quoteReference: result.quoteReference,
        // Ensure quote data is available for Step 7 in the correct format
        selectedQuote: transformedQuote,
      });

      // Show success message
      setContactSubmitted(true);

      // Show addon drawer after 1.5 seconds
      setTimeout(() => {
        setShowAddonDrawer(true);
      }, 1500);
    } catch (error: any) {
      console.error('Error creating lead:', error);
      setErrors({ submit: error.message || 'Failed to submit. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  // Get calculation data for display
  const finalCalc = (data as any).finalCalculation;
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Compelling Header with Savings */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-green-400 to-blue-500 mb-3">
          <CheckCircle2 className="w-9 h-9 text-white" />
        </div>
        <h2 className="text-4xl font-bold text-gray-900">
          You're Eligible for ${finalCalc ? formatCurrency(finalCalc.rebates.total).replace('$', '') : '0'} in Rebates!
        </h2>
        <p className="text-xl text-gray-600">
          Claim your rebates and start saving today
        </p>
      </div>

      {/* Rebates Breakdown - Eye-catching */}
      {finalCalc && (
        <Card className="border-2 border-green-500 bg-gradient-to-br from-green-50 to-blue-50">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                <DollarSign className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(finalCalc.rebates.federalSolar)}
                </div>
                <div className="text-sm text-gray-600 mt-1">Federal Solar Rebate</div>
              </div>
              {finalCalc.rebates.federalBattery > 0 && (
                <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                  <DollarSign className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-green-600">
                    {formatCurrency(finalCalc.rebates.federalBattery)}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">Federal Battery Rebate</div>
                </div>
              )}
              {finalCalc.rebates.stateBattery > 0 && (
                <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                  <DollarSign className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-green-600">
                    {formatCurrency(finalCalc.rebates.stateBattery)}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">WA State Battery Scheme</div>
                </div>
              )}
            </div>
            <div className="text-center p-4 bg-white rounded-lg border-2 border-green-500">
              <div className="text-sm text-gray-600 mb-1">Your Final Investment</div>
              <div className="text-4xl font-bold text-blue-600 mb-1">
                {formatCurrency(finalCalc.finalInvestment + (data.addonTotal || 0))}
              </div>
              <div className="text-sm text-gray-500">
                After {formatCurrency(finalCalc.rebates.total)} in rebates
                {(data.addonTotal || 0) > 0 && ` + ${formatCurrency(data.addonTotal || 0)} in add-ons`}
              </div>
              <div className="mt-3 pt-3 border-t">
                <div className="text-sm text-gray-600">Annual Savings</div>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(finalCalc.savings.annual)}/year
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Urgency Message */}
      <Card className="bg-orange-50 border-orange-200">
        <CardContent className="pt-6">
          <div className="flex items-start space-x-3">
            <Clock className="w-6 h-6 text-orange-600 flex-shrink-0 mt-1" />
            <div>
              <p className="font-semibold text-gray-900">⚡ Limited Time Offer</p>
              <p className="text-sm text-gray-700 mt-1">
                Rebates are subject to availability and may change. Lock in your savings today with just a{' '}
                {depositSettings?.depositType === 'fixed'
                  ? `$${depositSettings.depositFixedAmount.toLocaleString()} deposit`
                  : `${depositSettings?.depositPercentage || 30}% deposit`
                }.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact Form Header */}
      <div className="text-center">
        <h3 className="text-2xl font-bold text-gray-900">
          Get Your Official Quote
        </h3>
        <p className="text-gray-600 mt-2">
          Just a few details to secure your rebates
        </p>
      </div>

      {/* Form */}
      <Card>
        <CardContent className="pt-6 space-y-6">
          {/* Name Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName" className="flex items-center space-x-2">
                <User className="w-4 h-4 text-gray-500" />
                <span>First Name</span>
              </Label>
              <Input
                id="firstName"
                type="text"
                placeholder="John"
                value={firstName}
                onChange={(e) => {
                  setFirstName(e.target.value);
                  if (errors.firstName) {
                    setErrors({ ...errors, firstName: '' });
                  }
                }}
                className={errors.firstName ? 'border-red-500' : ''}
                disabled={submitting}
              />
              {errors.firstName && (
                <p className="text-sm text-red-600">{errors.firstName}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName" className="flex items-center space-x-2">
                <User className="w-4 h-4 text-gray-500" />
                <span>Last Name</span>
              </Label>
              <Input
                id="lastName"
                type="text"
                placeholder="Smith"
                value={lastName}
                onChange={(e) => {
                  setLastName(e.target.value);
                  if (errors.lastName) {
                    setErrors({ ...errors, lastName: '' });
                  }
                }}
                className={errors.lastName ? 'border-red-500' : ''}
                disabled={submitting}
              />
              {errors.lastName && (
                <p className="text-sm text-red-600">{errors.lastName}</p>
              )}
            </div>
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center space-x-2">
              <Mail className="w-4 h-4 text-gray-500" />
              <span>Email Address</span>
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="john.smith@example.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) {
                  setErrors({ ...errors, email: '' });
                }
              }}
              className={errors.email ? 'border-red-500' : ''}
              disabled={submitting}
            />
            {errors.email && (
              <p className="text-sm text-red-600">{errors.email}</p>
            )}
            <p className="text-xs text-gray-500">
              We'll send your quote and updates to this email
            </p>
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="phone" className="flex items-center space-x-2">
              <Phone className="w-4 h-4 text-gray-500" />
              <span>Phone Number</span>
            </Label>
            <Input
              id="phone"
              type="tel"
              placeholder="0412 345 678"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                if (errors.phone) {
                  setErrors({ ...errors, phone: '' });
                }
              }}
              className={errors.phone ? 'border-red-500' : ''}
              disabled={submitting}
            />
            {errors.phone && (
              <p className="text-sm text-red-600">{errors.phone}</p>
            )}
            <p className="text-xs text-gray-500">
              For quick questions about your quote
            </p>
          </div>

          {/* Preferred Contact Time */}
          <div className="space-y-3">
            <Label className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-gray-500" />
              <span>Preferred Contact Time</span>
            </Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {CONTACT_TIMES.map((time) => (
                <button
                  key={time.value}
                  type="button"
                  onClick={() => setPreferredContactTime(time.value)}
                  disabled={submitting}
                  className={`
                    p-3 rounded-lg border-2 transition-all text-sm font-medium
                    ${
                      preferredContactTime === time.value
                        ? 'border-blue-600 bg-blue-50 text-blue-600'
                        : 'border-gray-200 hover:border-gray-300 text-gray-700'
                    }
                    disabled:opacity-50 disabled:cursor-not-allowed
                  `}
                >
                  {time.label}
                </button>
              ))}
            </div>
          </div>

          {/* Submit Error */}
          {errors.submit && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{errors.submit}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Trust Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-green-50 border-green-200">
          <CardContent className="pt-6 text-center">
            <Shield className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-900">Your info is secure</p>
            <p className="text-xs text-gray-600 mt-1">We never share your details</p>
          </CardContent>
        </Card>
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6 text-center">
            <Mail className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-900">No spam, we promise</p>
            <p className="text-xs text-gray-600 mt-1">Only important updates</p>
          </CardContent>
        </Card>
        <Card className="bg-purple-50 border-purple-200">
          <CardContent className="pt-6 text-center">
            <Clock className="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-900">Instant quote</p>
            <p className="text-xs text-gray-600 mt-1">Get it in seconds</p>
          </CardContent>
        </Card>
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-4">
        <Button onClick={prevStep} variant="outline" size="lg" disabled={submitting}>
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={submitting}
          size="lg"
          className="min-w-[250px] bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
        >
          {submitting ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Securing Your Rebates...
            </>
          ) : (
            <>
              Claim My ${finalCalc ? formatCurrency(finalCalc.rebates.total).replace('$', '') : '0'} Rebate
              <ArrowRight className="w-5 h-5 ml-2" />
            </>
          )}
        </Button>
      </div>

      {/* Privacy Note */}
      <p className="text-xs text-center text-gray-500">
        By continuing, you agree to our{' '}
        <a href="/privacy" className="text-blue-600 hover:underline">
          Privacy Policy
        </a>{' '}
        and{' '}
        <a href="/terms" className="text-blue-600 hover:underline">
          Terms of Service
        </a>
      </p>

      {/* Success Message */}
      {contactSubmitted && !showAddonDrawer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40">
          <Card className="max-w-md mx-4">
            <CardContent className="pt-6 text-center">
              <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-2xl font-bold mb-2">Thank You!</h3>
              <p className="text-gray-600">
                We've received your information and will contact you within 24 hours.
              </p>
              <p className="text-sm text-gray-500 mt-4">
                Preparing your personalized recommendations...
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Addon Drawer */}
      {showAddonDrawer && (
        <AddonDrawer
          isOpen={showAddonDrawer}
          onClose={() => {
            setShowAddonDrawer(false);
            nextStep();
          }}
          preSelectedAddonIds={(data as any).selectedAddonIds || []}
          onComplete={async (selectedAddonIds, totalCost) => {
            if (selectedAddonIds.length > 0) {
              try {
                // Save addons to quote
                const response = await fetch('/api/quotes/save-addons', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    sessionId: data.sessionId,
                    addonIds: selectedAddonIds,
                  }),
                });

                const result = await response.json();

                if (result.success) {
                  toast.success(`Added ${selectedAddonIds.length} add-on${selectedAddonIds.length > 1 ? 's' : ''} to your quote!`);
                  
                  // Update data with new total
                  updateData({
                    selectedAddonIds: selectedAddonIds,
                    addonTotal: totalCost,
                  });
                } else {
                  toast.error('Failed to save add-ons');
                }
              } catch (error) {
                console.error('Error saving addons:', error);
                toast.error('Failed to save add-ons');
              }
            }

            setShowAddonDrawer(false);
            nextStep();
          }}
          systemDetails={{
            solarKw: finalCalc?.systemSpecs?.solarKw || 0,
            batteryKwh: finalCalc?.systemSpecs?.batteryKwh || 0,
            totalInvestment: finalCalc?.finalInvestment || 0,
          }}
        />
      )}
    </div>
  );
}
