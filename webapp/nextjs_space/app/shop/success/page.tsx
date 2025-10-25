'use client';

import * as React from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Package, Sun } from 'lucide-react';
import { Suspense } from 'react';

function SuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [order, setOrder] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!sessionId) {
      setLoading(false);
      return;
    }

    async function fetchOrder() {
      try {
        const response = await fetch(`/api/shop/checkout?session_id=${sessionId}`);
        const data = await response.json();
        setOrder(data);
      } catch (error) {
        console.error('Error fetching order:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchOrder();
  }, [sessionId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading order details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <Link href="/" className="flex items-center space-x-2">
              <Sun className="h-10 w-10 text-gold" />
              <div>
                <h1 className="text-2xl font-bold text-primary">Sun Direct Power</h1>
                <p className="text-xs text-muted-foreground">Solar Shop</p>
              </div>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-emerald-100 rounded-full mb-4">
            <CheckCircle className="h-12 w-12 text-emerald-600" />
          </div>
          <h1 className="text-4xl font-bold text-primary mb-2">Order Confirmed!</h1>
          <p className="text-xl text-gray-600">
            Thank you for your purchase
          </p>
        </div>

        {order && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Order Details</CardTitle>
              <CardDescription>
                Order #{order.orderNumber}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Customer</p>
                  <p className="font-semibold">{order.customerName}</p>
                </div>
                <div>
                  <p className="text-gray-500">Email</p>
                  <p className="font-semibold">{order.customerEmail}</p>
                </div>
                {order.customerPhone && (
                  <div>
                    <p className="text-gray-500">Phone</p>
                    <p className="font-semibold">{order.customerPhone}</p>
                  </div>
                )}
                {order.shippingAddress && (
                  <div className="col-span-2">
                    <p className="text-gray-500">Shipping Address</p>
                    <p className="font-semibold">{order.shippingAddress}</p>
                  </div>
                )}
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Items Ordered</h3>
                <div className="space-y-2">
                  {Array.isArray(order.items) && order.items.map((item: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-center text-sm">
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-gray-400" />
                        <span>{item.name}</span>
                        <span className="text-gray-500">x{item.quantity}</span>
                      </div>
                      <span className="font-semibold">${item.totalPrice.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>${order.subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Tax (GST)</span>
                  <span>${order.tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Shipping</span>
                  <span>{order.shippingCost === 0 ? 'FREE' : `$${order.shippingCost}`}</span>
                </div>
                <div className="flex justify-between font-bold text-lg border-t pt-2">
                  <span>Total</span>
                  <span>${order.totalAmount.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <h3 className="font-semibold text-blue-900 mb-2">What's Next?</h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li className="flex items-start">
              <span className="mr-2">✓</span>
              <span>You'll receive an order confirmation email shortly</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">✓</span>
              <span>Our team will contact you within 24 hours to arrange delivery</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">✓</span>
              <span>Installation can be scheduled at your convenience</span>
            </li>
          </ul>
        </div>

        <div className="flex gap-4 justify-center">
          <Link href="/">
            <Button variant="outline" size="lg">
              Back to Home
            </Button>
          </Link>
          <Link href="/shop">
            <Button size="lg" className="bg-coral hover:bg-coral-600">
              Continue Shopping
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <SuccessContent />
    </Suspense>
  );
}
