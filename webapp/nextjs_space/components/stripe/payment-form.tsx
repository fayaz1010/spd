'use client';

import { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, CreditCard, Lock } from 'lucide-react';

interface PaymentFormProps {
  amount: number;
  paymentType: 'deposit' | 'full';
  leadId?: string;
  quoteReference?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function PaymentForm({
  amount,
  paymentType,
  leadId,
  quoteReference,
  onSuccess,
  onCancel,
}: PaymentFormProps) {
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stripePublicKey, setStripePublicKey] = useState<string | null>(null);

  // Card details
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [cardName, setCardName] = useState('');

  useEffect(() => {
    // Fetch Stripe public key from settings
    fetchStripeKey();
  }, []);

  const fetchStripeKey = async () => {
    try {
      const response = await fetch('/api/settings/stripe-key');
      if (response.ok) {
        const data = await response.json();
        setStripePublicKey(data.publicKey);
      } else {
        setError('Stripe is not configured. Please contact support.');
      }
    } catch (err) {
      console.error('Error fetching Stripe key:', err);
      setError('Failed to load payment system.');
    }
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length) {
      return parts.join(' ');
    } else {
      return value;
    }
  };

  const formatExpiry = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.slice(0, 2) + '/' + v.slice(2, 4);
    }
    return v;
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCardNumber(e.target.value);
    if (formatted.replace(/\s/g, '').length <= 16) {
      setCardNumber(formatted);
    }
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatExpiry(e.target.value);
    if (formatted.replace('/', '').length <= 4) {
      setCardExpiry(formatted);
    }
  };

  const handleCvcChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/gi, '');
    if (value.length <= 4) {
      setCardCvc(value);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setProcessing(true);

    try {
      if (!stripePublicKey) {
        throw new Error('Stripe is not configured');
      }

      // Validate card details
      if (!cardNumber || cardNumber.replace(/\s/g, '').length < 13) {
        throw new Error('Please enter a valid card number');
      }
      if (!cardExpiry || cardExpiry.length < 5) {
        throw new Error('Please enter a valid expiry date');
      }
      if (!cardCvc || cardCvc.length < 3) {
        throw new Error('Please enter a valid CVC');
      }
      if (!cardName.trim()) {
        throw new Error('Please enter the cardholder name');
      }

      // Create payment intent
      const response = await fetch('/api/stripe/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: Math.round(amount * 100), // Convert to cents
          paymentType,
          leadId,
          quoteReference,
          cardDetails: {
            number: cardNumber.replace(/\s/g, ''),
            expMonth: cardExpiry.split('/')[0],
            expYear: cardExpiry.split('/')[1],
            cvc: cardCvc,
            name: cardName,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Payment failed');
      }

      const result = await response.json();

      if (result.success) {
        // Payment successful
        if (onSuccess) {
          onSuccess();
        } else {
          // Redirect to confirmation page
          window.location.href = `/confirmation?ref=${quoteReference}&payment=success`;
        }
      } else {
        throw new Error(result.error || 'Payment failed');
      }
    } catch (err: any) {
      console.error('Payment error:', err);
      setError(err.message || 'Payment failed. Please try again.');
      setProcessing(false);
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

  // Don't block form rendering if Stripe is not configured
  // Show error only when user tries to pay

  return (
    <Card className="border-2 border-blue-500">
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Amount Display */}
          <div className="text-center py-4 bg-blue-50 rounded-lg">
            <div className="text-sm text-gray-600 mb-1">Amount to Pay</div>
            <div className="text-3xl font-bold text-blue-600">
              {formatCurrency(amount)}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {paymentType === 'deposit' ? '10% Deposit' : 'Full Payment'}
            </div>
          </div>

          {!stripePublicKey && !error && (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-lg text-sm">
              ⚠️ Payment system is loading. If this persists, please contact support.
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Card Number */}
          <div>
            <Label htmlFor="cardNumber">Card Number</Label>
            <div className="relative mt-2">
              <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                id="cardNumber"
                type="text"
                value={cardNumber}
                onChange={handleCardNumberChange}
                placeholder="1234 5678 9012 3456"
                className="pl-10"
                required
                disabled={processing}
              />
            </div>
          </div>

          {/* Expiry and CVC */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="cardExpiry">Expiry Date</Label>
              <Input
                id="cardExpiry"
                type="text"
                value={cardExpiry}
                onChange={handleExpiryChange}
                placeholder="MM/YY"
                className="mt-2"
                required
                disabled={processing}
              />
            </div>
            <div>
              <Label htmlFor="cardCvc">CVC</Label>
              <Input
                id="cardCvc"
                type="text"
                value={cardCvc}
                onChange={handleCvcChange}
                placeholder="123"
                className="mt-2"
                required
                disabled={processing}
              />
            </div>
          </div>

          {/* Cardholder Name */}
          <div>
            <Label htmlFor="cardName">Cardholder Name</Label>
            <Input
              id="cardName"
              type="text"
              value={cardName}
              onChange={(e) => setCardName(e.target.value)}
              placeholder="John Smith"
              className="mt-2"
              required
              disabled={processing}
            />
          </div>

          {/* Security Notice */}
          <div className="flex items-start space-x-2 text-xs text-gray-600 bg-gray-50 p-3 rounded">
            <Lock className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
            <p>
              Your payment is secure and encrypted. We use Stripe for payment processing and never store your card details.
            </p>
          </div>

          {/* Buttons */}
          <div className="flex space-x-3">
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={processing}
                className="flex-1"
              >
                Cancel
              </Button>
            )}
            <Button
              type="submit"
              disabled={processing}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
              size="lg"
            >
              {processing ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Processing Payment...
                </>
              ) : (
                <>
                  <Lock className="w-5 h-5 mr-2" />
                  Pay {formatCurrency(amount)}
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
