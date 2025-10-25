
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Loader2, User, Mail, Phone, Clock, MessageSquare, CheckCircle, DollarSign, AlertCircle, History } from 'lucide-react';
import { CalculatorData } from './calculator-flow';
import { useRouter } from 'next/navigation';
import { generateQuoteReference } from '@/lib/quote-reference';

interface Step7Props {
  data: Partial<CalculatorData>;
  prevStep: () => void;
}

interface PreviousQuote {
  reference: string;
  date: string;
  daysSince: number;
  name: string;
  email: string;
  phone: string;
  status: string;
  systemSize: number;
  batterySize: number;
  quarterlyBill: number;
  depositPaid: boolean;
  segment?: string;
}

export function Step7LeadCapture({ data, prevStep }: Step7Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [checkingPrevious, setCheckingPrevious] = useState(false);
  const [previousQuote, setPreviousQuote] = useState<PreviousQuote | null>(null);
  const [showPreviousQuote, setShowPreviousQuote] = useState(false);
  const [savedQuote, setSavedQuote] = useState<any>(null);
  const [loadingQuote, setLoadingQuote] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    preferredContactTime: 'anytime',
    comments: '',
    agreeToContact: false,
  });

  // Fetch saved quote on mount
  useEffect(() => {
    fetchSavedQuote();
    checkPreviousQuotes();
  }, [data?.address, data?.quoteId]);
  
  const fetchSavedQuote = async () => {
    if (!data?.quoteId) {
      setLoadingQuote(false);
      return;
    }
    
    try {
      const response = await fetch(`/api/quotes/${data.quoteId}`);
      const result = await response.json();
      
      if (result.success && result.quote) {
        setSavedQuote(result.quote);
      }
    } catch (error) {
      console.error('Error fetching saved quote:', error);
    } finally {
      setLoadingQuote(false);
    }
  };

  // Check for previous quotes when component mounts
  const checkPreviousQuotes = async () => {
    if (!data?.address) return;

    setCheckingPrevious(true);
    try {
      const response = await fetch('/api/check-previous-quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: data.address }),
      });

      const result = await response.json();
      
      if (result.hasPreviousQuote) {
        setPreviousQuote(result.previousQuote);
        setShowPreviousQuote(true);
        
        // Pre-fill form with previous quote data
        setFormData(prev => ({
          ...prev,
          name: result.previousQuote.name || '',
          email: result.previousQuote.email || '',
          phone: result.previousQuote.phone || '',
        }));
      }
    } catch (error) {
      console.error('Error checking previous quotes:', error);
    } finally {
      setCheckingPrevious(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.phone) {
      alert('Please fill in all required fields');
      return;
    }

    if (!formData.agreeToContact) {
      alert('Please agree to be contacted to proceed');
      return;
    }

    // PHASE 3 FIX: Validate quoteId before submission
    const quoteId = savedQuote?.id || data?.quoteId;
    if (!quoteId) {
      alert('No quote found. Please restart the calculator and try again.');
      return;
    }

    setLoading(true);

    try {
      const quoteReference = generateQuoteReference();
      
      // PHASE 3 FIX: Send minimal data - API will fetch quote from database
      const leadData = {
        ...formData,
        ...data,
        quoteReference,
        quoteId, // CRITICAL: Pass quoteId so API can fetch existing quote
      };

      const response = await fetch('/api/submit-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(leadData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.error ?? 'Failed to submit quote');
      }

      // Redirect to confirmation page with IDs only
      // Confirmation page will fetch complete quote from database
      router.push(`/confirmation?quoteId=${quoteId}&leadId=${result.leadId}&ref=${result.quoteReference}`);
    } catch (error: any) {
      console.error('Submit error:', error);
      alert(error?.message ?? 'Failed to submit quote. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 animate-fade-in max-w-3xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <CheckCircle className="h-8 w-8 text-emerald mr-3" />
          <h2 className="text-3xl font-bold text-primary">
            See My Personalized Quote
          </h2>
        </div>
        <p className="text-gray-600">
          One of our solar experts will contact you within 24 hours with your personalized quote and answer any questions.
        </p>
      </div>

      {/* Previous Quote Notification */}
      {checkingPrevious && (
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center">
          <Loader2 className="h-5 w-5 mr-3 text-blue-600 animate-spin" />
          <p className="text-sm text-blue-800">Checking for previous quotes...</p>
        </div>
      )}

      {showPreviousQuote && previousQuote && (
        <div className="mb-6 bg-amber-50 border-2 border-amber-300 rounded-xl p-6 animate-fade-in">
          <div className="flex items-start">
            <History className="h-6 w-6 text-amber-600 mr-3 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h3 className="font-bold text-amber-900 text-lg mb-2">
                Welcome Back! Previous Quote Found
              </h3>
              <p className="text-sm text-amber-800 mb-3">
                We found a quote from {previousQuote.daysSince} days ago for this address. 
                Your previous information has been pre-filled below.
              </p>
              
              <div className="bg-white rounded-lg p-4 space-y-2">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Quote Reference:</p>
                    <p className="font-semibold text-primary">{previousQuote.reference}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Status:</p>
                    <p className="font-semibold capitalize text-primary">{previousQuote.status}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">System Size:</p>
                    <p className="font-semibold text-primary">{previousQuote.systemSize} kW</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Battery Size:</p>
                    <p className="font-semibold text-primary">{previousQuote.batterySize} kWh</p>
                  </div>
                </div>
                
                {previousQuote.depositPaid && (
                  <div className="mt-3 bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                    <p className="text-sm text-emerald-800 font-semibold">
                      ✓ Deposit already paid for previous quote
                    </p>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => setShowPreviousQuote(false)}
                className="mt-3 text-sm text-amber-700 hover:text-amber-900 font-medium underline"
              >
                Dismiss this message
              </button>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Name */}
        <div>
          <Label htmlFor="name" className="text-sm font-semibold text-primary mb-2 block">
            <User className="inline h-4 w-4 mr-2" />
            Full Name *
          </Label>
          <Input
            id="name"
            type="text"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="John Smith"
            className="text-lg py-6"
            required
          />
        </div>

        {/* Email */}
        <div>
          <Label htmlFor="email" className="text-sm font-semibold text-primary mb-2 block">
            <Mail className="inline h-4 w-4 mr-2" />
            Email Address *
          </Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            placeholder="john@example.com"
            className="text-lg py-6"
            required
          />
        </div>

        {/* Phone */}
        <div>
          <Label htmlFor="phone" className="text-sm font-semibold text-primary mb-2 block">
            <Phone className="inline h-4 w-4 mr-2" />
            Phone Number *
          </Label>
          <Input
            id="phone"
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
            placeholder="04XX XXX XXX"
            className="text-lg py-6"
            required
          />
        </div>

        {/* Preferred Contact Time */}
        <div>
          <Label htmlFor="contactTime" className="text-sm font-semibold text-primary mb-2 block">
            <Clock className="inline h-4 w-4 mr-2" />
            Preferred Contact Time
          </Label>
          <Select 
            value={formData.preferredContactTime}
            onValueChange={(value) => setFormData(prev => ({ ...prev, preferredContactTime: value }))}
          >
            <SelectTrigger className="text-lg py-6">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="anytime">Anytime</SelectItem>
              <SelectItem value="morning">Morning (8am - 12pm)</SelectItem>
              <SelectItem value="afternoon">Afternoon (12pm - 5pm)</SelectItem>
              <SelectItem value="evening">Evening (5pm - 8pm)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Comments */}
        <div>
          <Label htmlFor="comments" className="text-sm font-semibold text-primary mb-2 block">
            <MessageSquare className="inline h-4 w-4 mr-2" />
            Additional Comments (Optional)
          </Label>
          <Textarea
            id="comments"
            value={formData.comments}
            onChange={(e) => setFormData(prev => ({ ...prev, comments: e.target.value }))}
            placeholder="Any questions or special requirements?"
            rows={4}
            className="text-lg"
          />
        </div>

        {/* Consent */}
        <div className="bg-gray-50 rounded-xl p-6">
          <label className="flex items-start cursor-pointer">
            <input
              type="checkbox"
              checked={formData.agreeToContact}
              onChange={(e) => setFormData(prev => ({ ...prev, agreeToContact: e.target.checked }))}
              className="mt-1 h-5 w-5 rounded border-gray-300 text-coral focus:ring-coral"
            />
            <span className="ml-3 text-sm text-gray-700">
              I agree to be contacted by Sun Direct Power regarding my solar quote. Your information will be kept confidential and never shared with third parties. *
            </span>
          </label>
        </div>

        {/* Deposit Info Box */}
        <div className="bg-gradient-to-br from-coral-50 to-gold-50 border-2 border-coral-300 rounded-xl p-6 mb-6">
          <div className="flex items-start mb-4">
            <div className="bg-coral rounded-full p-2 mr-3 flex-shrink-0">
              <DollarSign className="h-6 w-6 text-white" />
            </div>
            <div>
              <h4 className="font-bold text-primary text-lg mb-2">🎯 Secure Your Rebates & Priority Scheduling</h4>
              <p className="text-sm text-gray-700 mb-3">
                Lock in today's rebates and get priority scheduling before rebate programs fill up or change!
              </p>
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-4 space-y-3">
            <div className="flex items-start">
              <CheckCircle className="h-5 w-5 mr-3 flex-shrink-0 text-emerald mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-primary">Immediate Priority Scheduling</p>
                <p className="text-xs text-gray-600">Skip the waitlist - installations within 2-4 weeks</p>
              </div>
            </div>
            <div className="flex items-start">
              <CheckCircle className="h-5 w-5 mr-3 flex-shrink-0 text-emerald mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-primary">Lock in Current Rebates</p>
                <p className="text-xs text-gray-600">Secure up to $5,000 WA Battery Scheme + Federal rebates before they change</p>
              </div>
            </div>
            <div className="flex items-start">
              <CheckCircle className="h-5 w-5 mr-3 flex-shrink-0 text-emerald mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-primary">We Handle ALL Paperwork</p>
                <p className="text-xs text-gray-600">Complete rebate application service - you don't lift a finger</p>
              </div>
            </div>
            <div className="flex items-start">
              <CheckCircle className="h-5 w-5 mr-3 flex-shrink-0 text-emerald mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-primary">100% Refundable</p>
                <p className="text-xs text-gray-600">If you change your mind, we refund every cent - no questions asked</p>
              </div>
            </div>
          </div>
          
          <div className="mt-4 bg-primary-50 border border-primary-200 rounded-lg p-3">
            <p className="text-xs text-primary-900 font-medium">
              ⚠️ <strong>Don't miss out!</strong> Customers who delay often lose thousands in rebates when programs close or reduce. Many come back saying "I wish I'd locked this in earlier."
            </p>
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6">
          <h4 className="font-semibold text-emerald-900 mb-2">What Happens Next?</h4>
          <ul className="space-y-2 text-sm text-emerald-800">
            <li className="flex items-start">
              <CheckCircle className="h-5 w-5 mr-2 flex-shrink-0 text-emerald" />
              <span>You'll receive an email confirmation with your quote details</span>
            </li>
            <li className="flex items-start">
              <CheckCircle className="h-5 w-5 mr-2 flex-shrink-0 text-emerald" />
              <span>Our team will review your property and contact you within 24 hours</span>
            </li>
            <li className="flex items-start">
              <CheckCircle className="h-5 w-5 mr-2 flex-shrink-0 text-emerald" />
              <span>Ready to proceed? A 10% deposit secures your rebates and scheduling</span>
            </li>
            <li className="flex items-start">
              <CheckCircle className="h-5 w-5 mr-2 flex-shrink-0 text-emerald" />
              <span>Installation typically completed in just 1 day!</span>
            </li>
          </ul>
        </div>

        {/* Navigation */}
        <div className="flex justify-between pt-4">
          <Button 
            type="button"
            variant="outline"
            size="lg"
            onClick={prevStep}
            disabled={loading}
            className="px-8"
          >
            <ArrowLeft className="mr-2 h-5 w-5" />
            Back
          </Button>
          
          <Button 
            type="submit" 
            size="lg"
            disabled={loading}
            className="bg-coral hover:bg-coral-600 text-white px-8 text-lg"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                See My Quote
                <CheckCircle className="ml-2 h-5 w-5" />
              </>
            )}
          </Button>
        </div>

        <p className="text-center text-sm text-gray-500 mt-4">
          Optional 10% deposit to lock in rebates • Free consultation • 24hr response time
        </p>
      </form>
    </div>
  );
}
