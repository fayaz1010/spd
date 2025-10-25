'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  ArrowLeft,
  Package,
  Truck,
  CheckCircle,
  XCircle,
  Clock,
  Save,
  Loader2,
  User,
  Mail,
  Phone,
  MapPin,
  CreditCard,
  Calendar,
  DollarSign,
  AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  shippingAddress: string | null;
  billingAddress: string | null;
  items: any[];
  subtotal: number;
  tax: number;
  shippingCost: number;
  totalAmount: number;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  stripePaymentId: string | null;
  trackingNumber: string | null;
  carrier: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  paymentCompletedAt: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  cancelledAt: string | null;
  cancellationReason: string | null;
}

export default function OrderDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state
  const [status, setStatus] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [carrier, setCarrier] = useState('');
  const [notes, setNotes] = useState('');
  const [cancellationReason, setCancellationReason] = useState('');

  useEffect(() => {
    fetchOrder();
  }, [params.id]);

  const fetchOrder = async () => {
    try {
      const res = await fetch(`/api/admin/shop/orders/${params.id}`);
      if (!res.ok) throw new Error('Order not found');
      
      const data = await res.json();
      setOrder(data);
      
      // Set form values
      setStatus(data.status);
      setPaymentStatus(data.paymentStatus);
      setTrackingNumber(data.trackingNumber || '');
      setCarrier(data.carrier || '');
      setNotes(data.notes || '');
      setCancellationReason(data.cancellationReason || '');
    } catch (error) {
      console.error('Error fetching order:', error);
      toast.error('Failed to load order');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updateData: any = {
        status,
        paymentStatus,
        trackingNumber: trackingNumber || null,
        carrier: carrier || null,
        notes: notes || null,
      };

      // Add timestamps based on status
      if (status === 'shipped' && !order?.shippedAt) {
        updateData.shippedAt = new Date().toISOString();
      }
      if (status === 'delivered' && !order?.deliveredAt) {
        updateData.deliveredAt = new Date().toISOString();
      }
      if (status === 'cancelled' && !order?.cancelledAt) {
        updateData.cancelledAt = new Date().toISOString();
        updateData.cancellationReason = cancellationReason;
      }

      const res = await fetch(`/api/admin/shop/orders/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });

      if (!res.ok) throw new Error('Failed to update order');

      toast.success('Order updated successfully! Inventory has been updated.');
      fetchOrder();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update order');
    } finally {
      setSaving(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; className: string; icon: any }> = {
      pending: { label: 'Pending', className: 'bg-yellow-500', icon: Clock },
      paid: { label: 'Paid', className: 'bg-blue-500', icon: CheckCircle },
      processing: { label: 'Processing', className: 'bg-purple-500', icon: Package },
      shipped: { label: 'Shipped', className: 'bg-indigo-500', icon: Truck },
      delivered: { label: 'Delivered', className: 'bg-green-500', icon: CheckCircle },
      cancelled: { label: 'Cancelled', className: 'bg-red-500', icon: XCircle },
    };

    const statusConfig = config[status] || config.pending;
    const Icon = statusConfig.icon;

    return (
      <Badge className={statusConfig.className}>
        <Icon className="w-3 h-3 mr-1" />
        {statusConfig.label}
      </Badge>
    );
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-AU', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-gray-400" />
          <p className="text-gray-600 mt-4">Loading order...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 mx-auto text-red-500 mb-4" />
          <h2 className="text-2xl font-bold mb-2">Order Not Found</h2>
          <p className="text-gray-600 mb-4">The order you're looking for doesn't exist.</p>
          <Link href="/admin/dashboard/website/orders">
            <Button>Back to Orders</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/dashboard/website/orders">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Orders
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Order {order.orderNumber}</h1>
            <p className="text-gray-600">Manage order details and shipping</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {getStatusBadge(order.status)}
          <Badge className={order.paymentStatus === 'paid' ? 'bg-green-500' : 'bg-yellow-500'}>
            {order.paymentStatus}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Order Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <Card>
            <CardHeader>
              <CardTitle>Order Items</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {order.items.map((item: any, index: number) => (
                    <TableRow key={index}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{item.name}</p>
                          {item.description && (
                            <p className="text-sm text-gray-500">{item.description}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>${item.price?.toFixed(2) || item.cost?.toFixed(2)}</TableCell>
                      <TableCell className="text-right font-medium">
                        ${item.totalPrice?.toFixed(2) || (item.price * item.quantity).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="mt-6 space-y-2 border-t pt-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium">${order.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tax:</span>
                  <span className="font-medium">${order.tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Shipping:</span>
                  <span className="font-medium">${order.shippingCost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t pt-2">
                  <span>Total:</span>
                  <span>${order.totalAmount.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Order Management */}
          <Card>
            <CardHeader>
              <CardTitle>Order Management</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="status">Order Status</Label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="processing">Processing</SelectItem>
                      <SelectItem value="shipped">Shipped</SelectItem>
                      <SelectItem value="delivered">Delivered</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="paymentStatus">Payment Status</Label>
                  <Select value={paymentStatus} onValueChange={setPaymentStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                      <SelectItem value="refunded">Refunded</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {status === 'cancelled' && (
                <div>
                  <Label htmlFor="cancellationReason">Cancellation Reason</Label>
                  <Textarea
                    id="cancellationReason"
                    value={cancellationReason}
                    onChange={(e) => setCancellationReason(e.target.value)}
                    placeholder="Why was this order cancelled?"
                    rows={3}
                  />
                </div>
              )}

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div className="text-sm text-blue-900">
                    <p className="font-medium mb-1">Inventory Auto-Update</p>
                    <ul className="list-disc list-inside space-y-1 text-blue-800">
                      <li>Setting payment to "Paid" will <strong>reduce inventory</strong></li>
                      <li>Cancelling or refunding will <strong>restore inventory</strong></li>
                      <li>All changes are logged in stock history</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Shipping Information */}
          <Card>
            <CardHeader>
              <CardTitle>Shipping Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="carrier">Carrier</Label>
                  <Input
                    id="carrier"
                    value={carrier}
                    onChange={(e) => setCarrier(e.target.value)}
                    placeholder="e.g., Australia Post, StarTrack"
                  />
                </div>

                <div>
                  <Label htmlFor="trackingNumber">Tracking Number</Label>
                  <Input
                    id="trackingNumber"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    placeholder="Enter tracking number"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="notes">Internal Notes</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add internal notes about this order..."
                  rows={3}
                />
              </div>

              <Button onClick={handleSave} disabled={saving} className="w-full">
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Customer & Timeline */}
        <div className="space-y-6">
          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle>Customer Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-gray-400" />
                <span className="font-medium">{order.customerName}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-gray-400" />
                <a href={`mailto:${order.customerEmail}`} className="text-blue-600 hover:underline">
                  {order.customerEmail}
                </a>
              </div>
              {order.customerPhone && (
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <a href={`tel:${order.customerPhone}`} className="text-blue-600 hover:underline">
                    {order.customerPhone}
                  </a>
                </div>
              )}
              {order.shippingAddress && (
                <div className="flex items-start gap-2 pt-2 border-t">
                  <MapPin className="w-4 h-4 text-gray-400 mt-1" />
                  <div className="text-sm">
                    <p className="font-medium mb-1">Shipping Address:</p>
                    <p className="text-gray-600 whitespace-pre-line">{order.shippingAddress}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payment Information */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-gray-400" />
                <span className="font-medium">{order.paymentMethod}</span>
              </div>
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-gray-400" />
                <span className="font-medium">${order.totalAmount.toFixed(2)}</span>
              </div>
              {order.stripePaymentId && (
                <div className="text-sm text-gray-600">
                  <p>Payment ID:</p>
                  <p className="font-mono text-xs break-all">{order.stripePaymentId}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Order Timeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3">
                <Calendar className="w-4 h-4 text-gray-400 mt-1" />
                <div className="text-sm">
                  <p className="font-medium">Created</p>
                  <p className="text-gray-600">{formatDate(order.createdAt)}</p>
                </div>
              </div>
              {order.paymentCompletedAt && (
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-1" />
                  <div className="text-sm">
                    <p className="font-medium">Payment Completed</p>
                    <p className="text-gray-600">{formatDate(order.paymentCompletedAt)}</p>
                  </div>
                </div>
              )}
              {order.shippedAt && (
                <div className="flex items-start gap-3">
                  <Truck className="w-4 h-4 text-indigo-600 mt-1" />
                  <div className="text-sm">
                    <p className="font-medium">Shipped</p>
                    <p className="text-gray-600">{formatDate(order.shippedAt)}</p>
                  </div>
                </div>
              )}
              {order.deliveredAt && (
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-1" />
                  <div className="text-sm">
                    <p className="font-medium">Delivered</p>
                    <p className="text-gray-600">{formatDate(order.deliveredAt)}</p>
                  </div>
                </div>
              )}
              {order.cancelledAt && (
                <div className="flex items-start gap-3">
                  <XCircle className="w-4 h-4 text-red-600 mt-1" />
                  <div className="text-sm">
                    <p className="font-medium">Cancelled</p>
                    <p className="text-gray-600">{formatDate(order.cancelledAt)}</p>
                    {order.cancellationReason && (
                      <p className="text-gray-500 text-xs mt-1">{order.cancellationReason}</p>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
