'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Lock, Mail } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // First try admin/staff login
      const adminResponse = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (adminResponse.ok) {
        const data = await adminResponse.json();
        localStorage.setItem('admin_token', data.token);
        
        // Route based on role
        if (data.admin.role === 'ADMIN' || data.admin.role === 'SUPER_ADMIN') {
          toast({
            title: 'Welcome back!',
            description: 'Redirecting to dashboard...',
          });
          router.push('/admin/dashboard');
        } else if (data.admin.role === 'STAFF') {
          toast({
            title: 'Welcome back!',
            description: 'Redirecting to staff portal...',
          });
          router.push('/staff/dashboard');
        } else {
          router.push('/admin/dashboard');
        }
        return;
      }

      // If admin login fails, try installer login
      const installerResponse = await fetch('/api/installer/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (installerResponse.ok) {
        const data = await installerResponse.json();
        localStorage.setItem('installer_token', data.token);
        localStorage.setItem('installer_id', data.electricianId);
        toast({
          title: 'Welcome back!',
          description: 'Redirecting to installer portal...',
        });
        router.push('/installer/dashboard');
        return;
      }

      // If installer login fails, try customer login (password = quote number)
      const customerResponse = await fetch('/api/customer/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          quoteNumber: password,
        }),
      });

      if (customerResponse.ok) {
        const data = await customerResponse.json();
        localStorage.setItem('customer_token', data.token);
        toast({
          title: 'Welcome back!',
          description: 'Redirecting to your quotes...',
        });
        router.push('/customer/quotes');
        return;
      }

      // All failed
      toast({
        title: 'Login failed',
        description: 'Invalid email or password',
        variant: 'destructive',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to login. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <Link href="/">
            <h1 className="text-3xl font-bold text-blue-600 mb-2">SunDirect Power</h1>
          </Link>
          <p className="text-gray-600">Sign in to your account</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Login</CardTitle>
            <CardDescription>
              Admin, Staff, Team Members, Installers & Customers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="your.email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  <strong>Customers:</strong> Use your quote number as password<br/>
                  <strong>Team Members:</strong> Link your electrician profile for portal access
                </p>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Footer Links */}
        <div className="mt-6 text-center space-y-2">
          <p className="text-sm text-gray-600">
            Looking for a job?{' '}
            <Link href="/careers" className="text-blue-600 hover:underline">
              View open positions
            </Link>
          </p>
          <p className="text-sm text-gray-600">
            Need help?{' '}
            <Link href="/contact" className="text-blue-600 hover:underline">
              Contact support
            </Link>
          </p>
          <Link href="/" className="block text-sm text-gray-500 hover:text-gray-700">
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
