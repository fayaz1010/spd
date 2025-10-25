'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { 
  CreditCard, 
  DollarSign, 
  CheckCircle2, 
  Calendar, 
  Wrench, 
  Zap, 
  FileText, 
  Loader2, 
  ArrowRight, 
  ArrowLeft, 
  Phone, 
  Mail, 
  Printer,
  TrendingDown,
  Info
} from 'lucide-react';
import { CalculatorData } from './calculator-flow-v2';
import { PaymentForm } from '@/components/stripe/payment-form';

interface Step7Props {
  data: Partial<CalculatorData>;
  updateData: (data: Partial<CalculatorData>) => void;
}

export function Step7PaymentOptions({ data, updateData }: Step7Props) {
  const [processing, setProcessing] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<'deposit' | 'full' | 'loan' | null>(null);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [showLoanForm, setShowLoanForm] = useState(false);
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
  
  // Loan eligibility data
  const [householdIncome, setHouseholdIncome] = useState('');
  const [numberOfDependents, setNumberOfDependents] = useState('');
  const [employmentStatus, setEmploymentStatus] = useState('');
  const [pensionCardHolder, setPensionCardHolder] = useState(false);
  const [healthCareCardHolder, setHealthCareCardHolder] = useState(false);
  const [loanTerm, setLoanTerm] = useState('5'); // Default 5 years

  const quote = data.selectedQuote;
  const quoteReference = data.quoteReference;

  if (!quote || !quoteReference) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Quote information not available.</p>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Calculate loan details
  const balanceAfterDeposit = quote.totalAfterRebates - quote.depositAmount;
  const loanAmount = balanceAfterDeposit;
  const loanTermMonths = parseInt(loanTerm) * 12;
  const monthlyPayment = loanAmount / loanTermMonths;
  
  // Check loan eligibility
  const incomeValue = parseFloat(householdIncome.replace(/[^0-9.]/g, ''));
  const isEligibleForLoan = incomeValue > 0 && incomeValue < 210000;

  const handlePayment = (paymentType: 'deposit' | 'full') => {
    setSelectedPayment(paymentType);
    setShowPaymentForm(true);
  };

  const handleLoanSelection = () => {
    setSelectedPayment('loan');
    setShowLoanForm(true);
  };

  const handleLoanSubmit = () => {
    // Validate loan form
    if (!householdIncome || !numberOfDependents || !employmentStatus) {
      alert('Please fill in all required fields');
      return;
    }

    if (!isEligibleForLoan) {
      alert('Household income must be under $210,000 to qualify for the interest-free loan');
      return;
    }

    // Save loan data
    updateData({
      loanRequested: true,
      loanAmount: loanAmount,
      loanTerm: parseInt(loanTerm),
      loanMonthlyPayment: monthlyPayment,
      householdIncome: incomeValue,
      numberOfDependents: parseInt(numberOfDependents),
      employmentStatus,
      pensionCardHolder,
      healthCareCardHolder,
      paymentChoice: 'loan'
    });

    // Redirect to confirmation
    window.location.href = `/confirmation?ref=${quoteReference}&payment=loan`;
  };

  const handlePaymentSuccess = () => {
    window.location.href = `/confirmation?ref=${quoteReference}&payment=success`;
  };

  const handleCancelPayment = () => {
    setShowPaymentForm(false);
    setShowLoanForm(false);
    setSelectedPayment(null);
  };

  const handlePayLater = () => {
    updateData({ paymentChoice: 'later' });
    window.location.href = '/';
  };

  const handlePrintQuote = () => {
    window.print();
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
          <CheckCircle2 className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-4xl font-bold text-gray-900">
          Your Solar Quote is Ready!
        </h2>
        <p className="text-xl text-gray-600">
          Quote Reference: <span className="font-bold text-blue-600">{quoteReference}</span>
        </p>
        <Badge variant="outline" className="text-sm">
          Valid for 30 days
        </Badge>
      </div>

      {/* Quote Summary */}
      <Card className="border-2 border-blue-500">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50">
          <CardTitle>Your Solar System Summary</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{quote.systemSizeKw}kW</div>
              <div className="text-sm text-gray-600 mt-1">Solar System</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">
                {quote.batterySizeKwh > 0 ? `${quote.batterySizeKwh}kWh` : 'No Battery'}
              </div>
              <div className="text-sm text-gray-600 mt-1">Battery Storage</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600">
                {formatCurrency(quote.savings.annual)}
              </div>
              <div className="text-sm text-gray-600 mt-1">Annual Savings</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">
                {quote.roi.paybackYears} years
              </div>
              <div className="text-sm text-gray-600 mt-1">Payback Period</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Loan Form (shown when loan selected) */}
      {showLoanForm && selectedPayment === 'loan' && (
        <Card className="border-2 border-green-500">
          <CardHeader className="bg-green-50">
            <CardTitle className="flex items-center justify-between">
              <span>WA Interest-Free Loan Application</span>
              <Button variant="outline" size="sm" onClick={handleCancelPayment}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Eligibility:</strong> Household income must be under $210,000 per year.
                This is a 0% interest loan administered by Plenti.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="householdIncome">
                  Household Gross Annual Income * 
                  <span className="text-xs text-gray-500 ml-2">(Must be under $210,000)</span>
                </Label>
                <Input
                  id="householdIncome"
                  type="text"
                  value={householdIncome}
                  onChange={(e) => setHouseholdIncome(e.target.value)}
                  placeholder="e.g., 150000"
                  className={!isEligibleForLoan && householdIncome ? 'border-red-500' : ''}
                />
                {!isEligibleForLoan && householdIncome && (
                  <p className="text-xs text-red-600 mt-1">
                    Income must be under $210,000 to qualify
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="numberOfDependents">Number of Dependents *</Label>
                <Input
                  id="numberOfDependents"
                  type="number"
                  value={numberOfDependents}
                  onChange={(e) => setNumberOfDependents(e.target.value)}
                  placeholder="e.g., 2"
                  min="0"
                />
              </div>

              <div>
                <Label htmlFor="employmentStatus">Employment Status *</Label>
                <RadioGroup value={employmentStatus} onValueChange={setEmploymentStatus}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="full_time" id="full_time" />
                    <Label htmlFor="full_time" className="font-normal">Full-time</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="part_time" id="part_time" />
                    <Label htmlFor="part_time" className="font-normal">Part-time</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="self_employed" id="self_employed" />
                    <Label htmlFor="self_employed" className="font-normal">Self-employed</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="retired" id="retired" />
                    <Label htmlFor="retired" className="font-normal">Retired</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="other" id="other" />
                    <Label htmlFor="other" className="font-normal">Other</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="pensionCard"
                    checked={pensionCardHolder}
                    onChange={(e) => setPensionCardHolder(e.target.checked)}
                    className="rounded"
                  />
                  <Label htmlFor="pensionCard" className="font-normal">
                    Pension Card Holder
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="healthCareCard"
                    checked={healthCareCardHolder}
                    onChange={(e) => setHealthCareCardHolder(e.target.checked)}
                    className="rounded"
                  />
                  <Label htmlFor="healthCareCard" className="font-normal">
                    Healthcare Card Holder
                  </Label>
                </div>
              </div>

              <div>
                <Label htmlFor="loanTerm">Loan Term *</Label>
                <select
                  id="loanTerm"
                  value={loanTerm}
                  onChange={(e) => setLoanTerm(e.target.value)}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="3">3 years</option>
                  <option value="4">4 years</option>
                  <option value="5">5 years</option>
                  <option value="6">6 years</option>
                  <option value="7">7 years</option>
                  <option value="8">8 years</option>
                  <option value="9">9 years</option>
                  <option value="10">10 years</option>
                </select>
              </div>

              {/* Loan Summary */}
              {isEligibleForLoan && (
                <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                  <h4 className="font-semibold text-green-900 mb-3">Your Loan Summary</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Deposit ({depositSettings?.depositType === 'fixed' ? 'Fixed' : `${depositSettings?.depositPercentage || 30}%`}):</span>
                      <span className="font-semibold">{formatCurrency(quote.depositAmount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Loan Amount:</span>
                      <span className="font-semibold">{formatCurrency(loanAmount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Loan Term:</span>
                      <span className="font-semibold">{loanTerm} years ({loanTermMonths} months)</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Interest Rate:</span>
                      <span className="font-semibold text-green-600">0% (Interest-Free!)</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold text-green-900 pt-2 border-t">
                      <span>Monthly Payment:</span>
                      <span>{formatCurrency(monthlyPayment)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <Button
              onClick={handleLoanSubmit}
              disabled={!isEligibleForLoan || !householdIncome || !numberOfDependents || !employmentStatus}
              className="w-full"
              size="lg"
            >
              Submit Loan Application
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Payment Form (shown when deposit/full selected) */}
      {showPaymentForm && selectedPayment && selectedPayment !== 'loan' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-bold text-gray-900">
              Enter Payment Details
            </h3>
            <Button
              variant="outline"
              onClick={handleCancelPayment}
              size="sm"
            >
              <ArrowLeft className="w-4 w-4 mr-2" />
              Back to Options
            </Button>
          </div>
          
          <PaymentForm
            amount={selectedPayment === 'deposit' ? quote.depositAmount : quote.totalAfterRebates}
            paymentType={selectedPayment}
            leadId={data.leadId}
            quoteReference={quoteReference}
            onSuccess={handlePaymentSuccess}
            onCancel={handleCancelPayment}
          />
        </div>
      )}

      {/* Payment Options (hidden when form is shown) */}
      {!showPaymentForm && !showLoanForm && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Pay Deposit */}
          <Card className="border-2 border-blue-500 hover:shadow-xl transition-shadow">
            <CardHeader className="bg-blue-50">
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center space-x-2">
                  <DollarSign className="w-6 h-6 text-blue-600" />
                  <span className="text-base">Pay Deposit ({depositSettings?.depositType === 'fixed' ? 'Fixed' : `${depositSettings?.depositPercentage || 30}%`})</span>
                </span>
                <Badge className="bg-blue-600">Popular</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="text-center py-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                <div className="text-sm text-gray-600 mb-1">Deposit Amount</div>
                <div className="text-3xl font-bold text-blue-600">
                  {formatCurrency(quote.depositAmount)}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Balance: {formatCurrency(balanceAfterDeposit)}
                </div>
              </div>

              <div className="space-y-2">
                {[
                  'Secure installation slot',
                  'Lock in pricing',
                  'Priority scheduling',
                  'Pay balance after install',
                ].map((benefit, index) => (
                  <div key={index} className="flex items-start space-x-2 text-xs">
                    <CheckCircle2 className="w-3 h-3 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">{benefit}</span>
                  </div>
                ))}
              </div>

              <Button
                onClick={() => handlePayment('deposit')}
                disabled={processing}
                className="w-full"
                size="lg"
              >
                <CreditCard className="w-5 h-5 mr-2" />
                Pay Deposit Now
              </Button>
            </CardContent>
          </Card>

          {/* WA Interest-Free Loan */}
          <Card className="border-2 border-green-500 hover:shadow-xl transition-shadow">
            <CardHeader className="bg-green-50">
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center space-x-2">
                  <TrendingDown className="w-6 h-6 text-green-600" />
                  <span className="text-base">Interest-Free Loan</span>
                </span>
                <Badge className="bg-green-600">0% Interest</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="text-center py-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg">
                <div className="text-sm text-gray-600 mb-1">Loan Amount</div>
                <div className="text-3xl font-bold text-green-600">
                  Up to {formatCurrency(10000)}
                </div>
                <div className="text-xs text-green-600 mt-1 font-semibold">
                  ✓ 0% Interest • 3-10 years
                </div>
              </div>

              <div className="space-y-2">
                {[
                  'No interest charges',
                  'Flexible 3-10 year terms',
                  'Income under $210k',
                  'Administered by Plenti',
                ].map((benefit, index) => (
                  <div key={index} className="flex items-start space-x-2 text-xs">
                    <CheckCircle2 className="w-3 h-3 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">{benefit}</span>
                  </div>
                ))}
              </div>

              <Button
                onClick={handleLoanSelection}
                disabled={processing}
                className="w-full bg-green-600 hover:bg-green-700"
                size="lg"
              >
                <FileText className="w-5 h-5 mr-2" />
                Apply for Loan
              </Button>
            </CardContent>
          </Card>

          {/* Pay Full */}
          <Card className="border-2 border-purple-500 hover:shadow-xl transition-shadow">
            <CardHeader className="bg-purple-50">
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center space-x-2">
                  <CheckCircle2 className="w-6 h-6 text-purple-600" />
                  <span className="text-base">Pay in Full</span>
                </span>
                <Badge className="bg-purple-600">Best Value</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="text-center py-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
                <div className="text-sm text-gray-600 mb-1">Total Amount</div>
                <div className="text-3xl font-bold text-purple-600">
                  {formatCurrency(quote.totalAfterRebates)}
                </div>
                <div className="text-xs text-purple-600 mt-1 font-semibold">
                  ✓ No additional fees
                </div>
              </div>

              <div className="space-y-2">
                {[
                  'Highest priority',
                  'Faster installation',
                  'No payment worries',
                  'Start saving immediately',
                ].map((benefit, index) => (
                  <div key={index} className="flex items-start space-x-2 text-xs">
                    <CheckCircle2 className="w-3 h-3 text-purple-600 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">{benefit}</span>
                  </div>
                ))}
              </div>

              <Button
                onClick={() => handlePayment('full')}
                disabled={processing}
                className="w-full bg-purple-600 hover:bg-purple-700"
                size="lg"
              >
                <CreditCard className="w-5 h-5 mr-2" />
                Pay Full Amount
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Pay Later Option */}
      {!showPaymentForm && !showLoanForm && (
        <Card className="border-2 border-gray-300">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-start space-x-3">
                <FileText className="w-6 h-6 text-gray-600 mt-1" />
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">
                    Not ready to pay now?
                  </h3>
                  <p className="text-sm text-gray-600">
                    We'll email you the quote and you can pay when you're ready. Your quote is valid for 30 days.
                  </p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  onClick={handlePrintQuote}
                  variant="outline"
                  disabled={processing}
                  className="w-full sm:w-auto"
                >
                  <Printer className="w-4 h-4 mr-2" />
                  Print Quote
                </Button>
                <Button
                  onClick={handlePayLater}
                  variant="outline"
                  disabled={processing}
                  className="w-full sm:w-auto"
                >
                  I'll Pay Later
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* What Happens Next - same as before */}
      <Card>
        <CardHeader>
          <CardTitle>What Happens Next?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {[
              {
                icon: CheckCircle2,
                title: 'Deposit Confirmed',
                description: 'Instant confirmation email',
                color: 'green',
              },
              {
                icon: Calendar,
                title: 'Site Inspection',
                description: 'Schedule within 3-5 days',
                color: 'blue',
              },
              {
                icon: FileText,
                title: 'Proposal Acceptance',
                description: 'Review and sign proposal',
                color: 'purple',
              },
              {
                icon: Wrench,
                title: 'Installation',
                description: '4-6 weeks from deposit',
                color: 'orange',
              },
              {
                icon: Zap,
                title: 'System Active',
                description: 'Start saving immediately',
                color: 'green',
              },
            ].map((step, index) => {
              const Icon = step.icon;
              return (
                <div key={index} className="text-center">
                  <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full bg-${step.color}-100 mb-3`}>
                    <Icon className={`w-6 h-6 text-${step.color}-600`} />
                  </div>
                  <h4 className="font-semibold text-sm text-gray-900 mb-1">
                    {step.title}
                  </h4>
                  <p className="text-xs text-gray-600">{step.description}</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Help Section */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="text-center">
            <h3 className="font-semibold text-gray-900 mb-2">
              Questions? We're Here to Help
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Our solar experts are available to answer any questions about your quote
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-3">
              <Button 
                variant="outline" 
                size="sm"
                className="w-full sm:w-auto"
                onClick={() => window.location.href = 'tel:1300123456'}
              >
                <Phone className="w-4 h-4 mr-2" />
                Call Us
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                className="w-full sm:w-auto"
                onClick={() => window.location.href = 'mailto:info@sundirectsolar.com.au?subject=Quote ' + quoteReference}
              >
                <Mail className="w-4 h-4 mr-2" />
                Email Us
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
