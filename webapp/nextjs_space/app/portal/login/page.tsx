'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Lock, Mail, FileText, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function CustomerLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [quoteNumber, setQuoteNumber] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/customer-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, quoteNumber }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      // Store token
      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      // Redirect to dashboard
      router.push('/portal/dashboard');
    } catch (err: any) {
      setError(err.message || 'Invalid email or quote number');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-primary-600 to-primary-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="bg-white rounded-full h-20 w-20 flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Lock className="h-10 w-10 text-coral" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Customer Portal</h1>
          <p className="text-white/80">Track your solar installation journey</p>
        </div>

        <Card className="shadow-2xl">
          <CardHeader>
            <CardTitle>Welcome Back</CardTitle>
            <CardDescription>
              Login with your email and quote number to access your project
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              <div>
                <Label htmlFor="email">Email Address</Label>
                <div className="relative mt-2">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your.email@example.com"
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="quoteNumber">Quote Number</Label>
                <div className="relative mt-2">
                  <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    id="quoteNumber"
                    type="text"
                    value={quoteNumber}
                    onChange={(e) => setQuoteNumber(e.target.value)}
                    placeholder="SDP-2025-123456"
                    className="pl-10"
                    required
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Your quote number was sent to you via email
                </p>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-coral hover:bg-coral-600 text-white py-6 text-lg"
              >
                {loading ? 'Signing in...' : 'Access My Project'}
              </Button>
            </form>

            <div className="mt-6 text-center space-y-2">
              <p className="text-sm text-gray-600">
                Don't have your quote number?{' '}
                <a href="mailto:support@sundirectpower.com" className="text-coral hover:underline">
                  Contact Support
                </a>
              </p>
              <p className="text-sm text-gray-600">
                New customer?{' '}
                <Link href="/calculator-v2" className="text-coral hover:underline">
                  Get a Quote
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Help Text */}
        <div className="mt-6 text-center text-white/80 text-sm">
          <p>Need help? Call us at <strong>1300 XXX XXX</strong></p>
          <p className="mt-2">Monday - Friday, 8am - 6pm AWST</p>
        </div>
      </div>
    </div>
  );
}
