
'use client';

import { useEffect, useState, Suspense } from 'react';
import { CheckCircle, Download, Home, Mail, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams?.get('session_id');
  const quoteRef = searchParams?.get('ref');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Optional: Verify payment with backend
    if (sessionId) {
      // You can make an API call here to verify the payment
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, [sessionId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Verifying your payment...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-green-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl p-8 md:p-12 text-center">
        {/* Success Icon */}
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald mb-6 animate-bounce">
          <CheckCircle className="h-12 w-12 text-white" />
        </div>

        {/* Success Message */}
        <h1 className="text-3xl md:text-4xl font-bold text-primary mb-4">
          Payment Successful! 🎉
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Thank you for securing your solar installation with Sun Direct Power
        </p>

        {/* Quote Reference */}
        {quoteRef && (
          <div className="bg-gradient-primary rounded-xl p-6 text-white mb-8">
            <p className="text-white/70 text-sm mb-2">Your Quote Reference</p>
            <p className="text-3xl font-bold tracking-wide">{quoteRef}</p>
            <p className="text-white/70 text-sm mt-2">
              Save this reference for all future communications
            </p>
          </div>
        )}

        {/* What's Next */}
        <div className="bg-gray-50 rounded-xl p-6 mb-8 text-left">
          <h2 className="text-xl font-bold text-primary mb-4 text-center">What Happens Next?</h2>
          
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 bg-coral rounded-full p-3">
                <Mail className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-primary mb-1">Confirmation Email</h3>
                <p className="text-sm text-gray-600">
                  You'll receive a payment receipt and detailed quote via email within 5 minutes.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 bg-gold rounded-full p-3">
                <Phone className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-primary mb-1">Expert Consultation (24hrs)</h3>
                <p className="text-sm text-gray-600">
                  Our solar specialist will call to schedule your site inspection.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 bg-emerald rounded-full p-3">
                <CheckCircle className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-primary mb-1">Installation Slot Reserved</h3>
                <p className="text-sm text-gray-600">
                  Your installation slot is now secured. Most systems installed within 2-4 weeks.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Info */}
        <div className="bg-gradient-to-r from-primary to-primary/90 rounded-xl p-6 text-white mb-8">
          <h3 className="text-lg font-bold mb-4">Need Help? Contact Us</h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div className="flex items-center justify-center gap-2">
              <Phone className="h-4 w-4" />
              <span>08 6156 6747</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <Mail className="h-4 w-4" />
              <span>sales@sundirectpower.com.au</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            onClick={() => window.print()}
            variant="outline"
            size="lg"
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Print Confirmation
          </Button>
          
          <Link href="/">
            <Button
              size="lg"
              className="flex items-center gap-2 bg-primary hover:bg-primary/90"
            >
              <Home className="h-4 w-4" />
              Return to Homepage
            </Button>
          </Link>
        </div>

        {/* Thank You Message */}
        <div className="mt-8 pt-8 border-t border-gray-200">
          <p className="text-gray-600 text-sm">
            Thank you for choosing Sun Direct Power. We're excited to help you start your solar journey!
          </p>
        </div>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    }>
      <PaymentSuccessContent />
    </Suspense>
  );
}
