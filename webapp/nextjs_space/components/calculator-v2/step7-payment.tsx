'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CreditCard, DollarSign, CheckCircle2, Calendar, Wrench, Zap, FileText, Loader2, ArrowRight, ArrowLeft, Phone, Mail, Printer } from 'lucide-react';
import { CalculatorData } from './calculator-flow-v2';
import { PaymentForm } from '@/components/stripe/payment-form';

interface Step7Props {
  data: Partial<CalculatorData>;
  updateData: (data: Partial<CalculatorData>) => void;
}

export function Step7Payment({ data, updateData }: Step7Props) {
  const [processing, setProcessing] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<'deposit' | 'full' | null>(null);
  const [showPaymentForm, setShowPaymentForm] = useState(false);

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

  const handlePayment = (paymentType: 'deposit' | 'full') => {
    setSelectedPayment(paymentType);
    setShowPaymentForm(true);
  };

  const handlePaymentSuccess = () => {
    // Redirect to confirmation page
    window.location.href = `/confirmation?ref=${quoteReference}&payment=success`;
  };

  const handleCancelPayment = () => {
    setShowPaymentForm(false);
    setSelectedPayment(null);
  };

  const handlePayLater = () => {
    updateData({ paymentChoice: 'later' });
    // Redirect to home page
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

      {/* Payment Form (shown when user clicks pay button) */}
      {showPaymentForm && selectedPayment && (
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
              <ArrowLeft className="w-4 h-4 mr-2" />
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
      {!showPaymentForm && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pay Deposit */}
        <Card className="border-2 border-blue-500 hover:shadow-xl transition-shadow">
          <CardHeader className="bg-blue-50">
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center space-x-2">
                <DollarSign className="w-6 h-6 text-blue-600" />
                <span>Pay Deposit (10%)</span>
              </span>
              <Badge className="bg-blue-600">Popular</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <div className="text-center py-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
              <div className="text-sm text-gray-600 mb-2">Deposit Amount</div>
              <div className="text-4xl font-bold text-blue-600">
                {formatCurrency(quote.depositAmount)}
              </div>
              <div className="text-sm text-gray-500 mt-2">
                Balance: {formatCurrency(quote.totalAfterRebates - quote.depositAmount)}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Due before installation
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold text-gray-900">What you get:</h4>
              <div className="space-y-2">
                {[
                  'Secure your installation slot',
                  'Lock in current pricing',
                  'Priority scheduling',
                  'Flexible payment terms',
                  'Pay balance before installation',
                ].map((benefit, index) => (
                  <div key={index} className="flex items-start space-x-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>

            <Button
              onClick={() => handlePayment('deposit')}
              disabled={processing}
              className="w-full"
              size="lg"
            >
              {processing && selectedPayment === 'deposit' ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="w-5 h-5 mr-2" />
                  Pay Deposit Now
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Pay Full */}
        <Card className="border-2 border-green-500 hover:shadow-xl transition-shadow">
          <CardHeader className="bg-green-50">
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center space-x-2">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
                <span>Pay in Full</span>
              </span>
              <Badge className="bg-green-600">Save More</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <div className="text-center py-6 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg">
              <div className="text-sm text-gray-600 mb-2">Total Amount</div>
              <div className="text-4xl font-bold text-green-600">
                {formatCurrency(quote.totalAfterRebates)}
              </div>
              <div className="text-sm text-green-600 mt-2 font-semibold">
                ✓ No additional fees
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Complete payment today
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold text-gray-900">What you get:</h4>
              <div className="space-y-2">
                {[
                  'Highest priority scheduling',
                  'Faster installation timeline',
                  'No payment worries later',
                  'Complete peace of mind',
                  'Start saving immediately',
                ].map((benefit, index) => (
                  <div key={index} className="flex items-start space-x-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>

            <Button
              onClick={() => handlePayment('full')}
              disabled={processing}
              className="w-full bg-green-600 hover:bg-green-700"
              size="lg"
            >
              {processing && selectedPayment === 'full' ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="w-5 h-5 mr-2" />
                  Pay Full Amount
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
      )}

      {/* Pay Later Option (always visible) */}
      {!showPaymentForm && (
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

      {/* What Happens Next */}
      <Card>
        <CardHeader>
          <CardTitle>What Happens Next?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {[
              {
                icon: CheckCircle2,
                title: 'Payment Confirmed',
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
                title: 'Final Design',
                description: 'Approve installation plan',
                color: 'purple',
              },
              {
                icon: Wrench,
                title: 'Installation',
                description: '4-6 weeks from payment',
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

      {/* Trust Badges */}
      <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-600">
        <div className="flex items-center space-x-2">
          <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span>Secure Payment</span>
        </div>
        <div className="flex items-center space-x-2">
          <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span>Money-Back Guarantee</span>
        </div>
        <div className="flex items-center space-x-2">
          <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span>Licensed Installers</span>
        </div>
        <div className="flex items-center space-x-2">
          <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span>25-Year Warranty</span>
        </div>
      </div>

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
