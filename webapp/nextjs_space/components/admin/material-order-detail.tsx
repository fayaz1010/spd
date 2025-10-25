'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Package,
  Send,
  CheckCircle,
  Truck,
  Calendar,
  Mail,
  Phone,
  MapPin,
  FileText,
  Download,
  AlertCircle,
  Camera,
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface MaterialOrderDetailProps {
  order: any;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

const statusColors: Record<string, string> = {
  DRAFT: 'bg-gray-500',
  PENDING_REVIEW: 'bg-yellow-500',
  SENT: 'bg-blue-500',
  CONFIRMED: 'bg-indigo-500',
  IN_TRANSIT: 'bg-purple-500',
  DELIVERED: 'bg-green-500',
  CANCELLED: 'bg-red-500',
};

export function MaterialOrderDetail({
  order,
  isOpen,
  onClose,
  onUpdate,
}: MaterialOrderDetailProps) {
  const [loading, setLoading] = useState(false);
  const [deliveryDetails, setDeliveryDetails] = useState({
    deliveryAddress: order?.deliveryAddress || order?.job?.lead?.address || '',
    deliveryContactName: order?.deliveryContactName || order?.job?.lead?.name || '',
    deliveryContactPhone: order?.deliveryContactPhone || order?.job?.lead?.phone || '',
    deliveryTimeSlot: order?.deliveryTimeSlot || 'AM',
    deliveryInstructions: order?.deliveryInstructions || '',
    trackingNumber: order?.trackingNumber || '',
    expectedDelivery: order?.expectedDelivery || '',
  });

  const updateOrderStatus = async (newStatus: string, additionalData?: any) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`/api/admin/orders/${order.id}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: newStatus,
          ...additionalData,
          updatedAt: new Date(),
        }),
      });

      if (!response.ok) throw new Error('Failed to update status');

      toast.success(`Order status updated to ${newStatus.replace('_', ' ')}`);
      onUpdate();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update order status');
    } finally {
      setLoading(false);
    }
  };

  const sendToSupplier = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`/api/admin/orders/${order.id}/send`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          supplierEmail: order.supplier.email,
          deliveryDetails,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to send email');
      }

      await updateOrderStatus('SENT', {
        sentAt: new Date(),
        sentTo: order.supplier.email,
        ...deliveryDetails,
      });

      toast.success('Order sent to supplier via email');
    } catch (error: any) {
      console.error('Error sending to supplier:', error);
      toast.error(error.message || 'Failed to send order to supplier');
    } finally {
      setLoading(false);
    }
  };

  const markAsSentManually = async () => {
    if (!confirm('Have you manually sent this order to the supplier via email or other means?')) {
      return;
    }

    try {
      setLoading(true);
      await updateOrderStatus('SENT', {
        sentAt: new Date(),
        sentTo: order.supplier.email,
        ...deliveryDetails,
        manualSend: true,
      });

      toast.success('Order marked as sent manually');
    } catch (error) {
      console.error('Error marking as sent:', error);
      toast.error('Failed to update order status');
    } finally {
      setLoading(false);
    }
  };

  const saveDeliveryDetails = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`/api/admin/orders/${order.id}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...deliveryDetails,
          updatedAt: new Date(),
        }),
      });

      if (!response.ok) throw new Error('Failed to save');

      toast.success('Delivery details saved');
      onUpdate();
    } catch (error) {
      console.error('Error saving delivery details:', error);
      toast.error('Failed to save delivery details');
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`/api/admin/orders/${order.id}/pdf`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error('Failed to generate PDF');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `PO-${order.poNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('PDF downloaded');
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast.error('Failed to download PDF');
    }
  };

  if (!order) return null;

  const items = Array.isArray(order.items) ? order.items : [];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl">
                Order {order.poNumber}
              </DialogTitle>
              <DialogDescription>
                Job: {order.job?.jobNumber} | Customer: {order.job?.lead?.name}
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={`${statusColors[order.status]} text-white`}>
                {order.status.replace('_', ' ')}
              </Badge>
              <Button
                onClick={downloadPDF}
                variant="outline"
                size="sm"
              >
                <Download className="w-4 h-4 mr-2" />
                PDF
              </Button>
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="details">Order Details</TabsTrigger>
            <TabsTrigger value="delivery">Delivery</TabsTrigger>
            <TabsTrigger value="items">Items ({items.length})</TabsTrigger>
            <TabsTrigger value="status">Status & Actions</TabsTrigger>
          </TabsList>

          {/* Order Details Tab */}
          <TabsContent value="details" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <div>
                  <Label className="text-sm text-gray-600">Supplier</Label>
                  <p className="font-semibold">{order.supplier.name}</p>
                  <p className="text-sm text-gray-500 flex items-center gap-1">
                    <Mail className="w-3 h-3" />
                    {order.supplier.email}
                  </p>
                  {order.supplier.phone && (
                    <p className="text-sm text-gray-500 flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      {order.supplier.phone}
                    </p>
                  )}
                </div>

                <div>
                  <Label className="text-sm text-gray-600">Deliver To (Customer)</Label>
                  <p className="font-semibold">{order.job?.lead?.name}</p>
                  <p className="text-sm text-gray-500 flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {order.job?.lead?.address}
                  </p>
                  <p className="text-sm text-gray-500 flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    {order.job?.lead?.phone}
                  </p>
                </div>

                <div>
                  <Label className="text-sm text-gray-600">Ordered By (Company)</Label>
                  <p className="font-semibold">Sun Direct Power Pty Ltd</p>
                  <p className="text-sm text-gray-500">ABN: 12 345 678 901</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label className="text-sm text-gray-600">Order Summary</Label>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Subtotal:</span>
                      <span className="font-semibold">${order.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Tax (GST):</span>
                      <span className="font-semibold">${order.tax.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span className="font-semibold">Total:</span>
                      <span className="text-lg font-bold text-blue-600">
                        ${order.total.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <Label className="text-sm text-gray-600">Dates</Label>
                  <div className="space-y-1 text-sm">
                    <p>Created: {new Date(order.createdAt).toLocaleDateString()}</p>
                    {order.sentAt && (
                      <p>Sent: {new Date(order.sentAt).toLocaleDateString()}</p>
                    )}
                    {order.confirmedAt && (
                      <p>Confirmed: {new Date(order.confirmedAt).toLocaleDateString()}</p>
                    )}
                    {order.deliveredAt && (
                      <p>Delivered: {new Date(order.deliveredAt).toLocaleDateString()}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {order.notes && (
              <div>
                <Label className="text-sm text-gray-600">Notes</Label>
                <p className="text-sm bg-yellow-50 p-3 rounded-lg">{order.notes}</p>
              </div>
            )}
          </TabsContent>

          {/* Delivery Tab */}
          <TabsContent value="delivery" className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-blue-800">
                <AlertCircle className="w-4 h-4 inline mr-2" />
                Configure delivery details before sending to supplier
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <div>
                  <Label>Delivery Address * (Customer Site)</Label>
                  <Textarea
                    value={deliveryDetails.deliveryAddress}
                    onChange={(e) =>
                      setDeliveryDetails({
                        ...deliveryDetails,
                        deliveryAddress: e.target.value,
                      })
                    }
                    rows={3}
                    placeholder="Customer installation address"
                  />
                  <p className="text-xs text-gray-500 mt-1">Materials will be delivered to customer site</p>
                </div>

                <div>
                  <Label>Contact Name *</Label>
                  <Input
                    value={deliveryDetails.deliveryContactName}
                    onChange={(e) =>
                      setDeliveryDetails({
                        ...deliveryDetails,
                        deliveryContactName: e.target.value,
                      })
                    }
                    placeholder="Who will receive the delivery?"
                  />
                </div>

                <div>
                  <Label>Contact Phone *</Label>
                  <Input
                    value={deliveryDetails.deliveryContactPhone}
                    onChange={(e) =>
                      setDeliveryDetails({
                        ...deliveryDetails,
                        deliveryContactPhone: e.target.value,
                      })
                    }
                    placeholder="Contact phone number"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label>Delivery Time Slot</Label>
                  <select
                    value={deliveryDetails.deliveryTimeSlot}
                    onChange={(e) =>
                      setDeliveryDetails({
                        ...deliveryDetails,
                        deliveryTimeSlot: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="AM">Morning (AM)</option>
                    <option value="PM">Afternoon (PM)</option>
                    <option value="SPECIFIC_TIME">Specific Time</option>
                  </select>
                </div>

                <div>
                  <Label>Expected Delivery Date (From Supplier)</Label>
                  <Input
                    type="date"
                    value={deliveryDetails.expectedDelivery}
                    onChange={(e) =>
                      setDeliveryDetails({
                        ...deliveryDetails,
                        expectedDelivery: e.target.value,
                      })
                    }
                  />
                  <p className="text-xs text-gray-500 mt-1">Update this when supplier confirms delivery date</p>
                </div>

                <div>
                  <Label>Tracking Number</Label>
                  <Input
                    value={deliveryDetails.trackingNumber}
                    onChange={(e) =>
                      setDeliveryDetails({
                        ...deliveryDetails,
                        trackingNumber: e.target.value,
                      })
                    }
                    placeholder="Enter tracking number"
                  />
                </div>

                <div>
                  <Label>Delivery Instructions</Label>
                  <Textarea
                    value={deliveryDetails.deliveryInstructions}
                    onChange={(e) =>
                      setDeliveryDetails({
                        ...deliveryDetails,
                        deliveryInstructions: e.target.value,
                      })
                    }
                    rows={3}
                    placeholder="Special instructions for delivery"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button
                onClick={saveDeliveryDetails}
                disabled={loading}
                variant="outline"
              >
                Save Details
              </Button>
            </div>
          </TabsContent>

          {/* Items Tab */}
          <TabsContent value="items" className="space-y-4">
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left p-3 text-sm font-semibold">Item</th>
                    <th className="text-center p-3 text-sm font-semibold">Qty</th>
                    <th className="text-right p-3 text-sm font-semibold">Unit Price</th>
                    <th className="text-right p-3 text-sm font-semibold">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item: any, index: number) => (
                    <tr key={index} className="border-t">
                      <td className="p-3">
                        <div>
                          <p className="font-medium">
                            {item.category || item.name || item.description || 'Item'}
                          </p>
                          {(item.brand || item.model) && (
                            <p className="text-sm text-gray-600">
                              {item.brand} {item.model}
                            </p>
                          )}
                          {item.sku && (
                            <p className="text-xs text-gray-500">SKU: {item.sku}</p>
                          )}
                        </div>
                      </td>
                      <td className="p-3 text-center">
                        {item.quantity || 1} {item.unit || ''}
                      </td>
                      <td className="p-3 text-right">
                        ${(item.unitPrice || item.unitCost || item.price || 0).toFixed(2)}
                      </td>
                      <td className="p-3 text-right font-semibold">
                        ${((item.quantity || 1) * (item.unitPrice || item.unitCost || item.totalCost || item.price || 0)).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50 border-t-2">
                  <tr>
                    <td colSpan={3} className="p-3 text-right font-semibold">
                      Subtotal:
                    </td>
                    <td className="p-3 text-right font-semibold">
                      ${order.subtotal.toFixed(2)}
                    </td>
                  </tr>
                  <tr>
                    <td colSpan={3} className="p-3 text-right">
                      GST (10%):
                    </td>
                    <td className="p-3 text-right">
                      ${order.tax.toFixed(2)}
                    </td>
                  </tr>
                  <tr className="border-t">
                    <td colSpan={3} className="p-3 text-right font-bold text-lg">
                      Total:
                    </td>
                    <td className="p-3 text-right font-bold text-lg text-blue-600">
                      ${order.total.toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </TabsContent>

          {/* Status & Actions Tab */}
          <TabsContent value="status" className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <Label className="text-sm text-gray-600 mb-2 block">Current Status</Label>
              <Badge className={`${statusColors[order.status]} text-white text-lg px-4 py-2`}>
                {order.status.replace('_', ' ')}
              </Badge>
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-semibold">Available Actions:</Label>

              {order.status === 'DRAFT' && (
                <Button
                  onClick={() => updateOrderStatus('PENDING_REVIEW')}
                  disabled={loading}
                  className="w-full"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Mark for Review
                </Button>
              )}

              {order.status === 'PENDING_REVIEW' && (
                <>
                  <Button
                    onClick={sendToSupplier}
                    disabled={loading}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Send to Supplier via Email
                  </Button>
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-white px-2 text-muted-foreground">Or</span>
                    </div>
                  </div>
                  <Button
                    onClick={markAsSentManually}
                    disabled={loading}
                    variant="outline"
                    className="w-full"
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Mark as Sent Manually
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    Use this if you've sent the order via your own email client or other method
                  </p>
                </>
              )}

              {order.status === 'SENT' && (
                <Button
                  onClick={() => updateOrderStatus('CONFIRMED')}
                  disabled={loading}
                  className="w-full bg-indigo-600 hover:bg-indigo-700"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Mark as Confirmed by Supplier
                </Button>
              )}

              {order.status === 'CONFIRMED' && (
                <Button
                  onClick={() => updateOrderStatus('IN_TRANSIT')}
                  disabled={loading}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                >
                  <Truck className="w-4 h-4 mr-2" />
                  Mark as In Transit
                </Button>
              )}

              {order.status === 'IN_TRANSIT' && (
                <Button
                  onClick={() => updateOrderStatus('DELIVERED')}
                  disabled={loading}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  <Package className="w-4 h-4 mr-2" />
                  Mark as Delivered
                </Button>
              )}

              {order.status === 'DELIVERED' && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-green-800 font-semibold">
                    ✓ Order Delivered
                  </p>
                  <p className="text-sm text-green-700 mt-1">
                    This order has been successfully delivered.
                  </p>
                </div>
              )}
            </div>

            {/* Timeline */}
            <div className="border-t pt-4">
              <Label className="text-sm font-semibold mb-3 block">Order Timeline</Label>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-medium">Order Created</p>
                    <p className="text-sm text-gray-500">
                      {new Date(order.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>

                {order.sentAt && (
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-200 flex items-center justify-center">
                      <Send className="w-4 h-4 text-blue-700" />
                    </div>
                    <div>
                      <p className="font-medium">Sent to Supplier</p>
                      <p className="text-sm text-gray-500">
                        {new Date(order.sentAt).toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-400">To: {order.sentTo}</p>
                    </div>
                  </div>
                )}

                {order.confirmedAt && (
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-200 flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-indigo-700" />
                    </div>
                    <div>
                      <p className="font-medium">Confirmed by Supplier</p>
                      <p className="text-sm text-gray-500">
                        {new Date(order.confirmedAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}

                {order.deliveredAt && (
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-green-200 flex items-center justify-center">
                      <Package className="w-4 h-4 text-green-700" />
                    </div>
                    <div>
                      <p className="font-medium">Delivered</p>
                      <p className="text-sm text-gray-500">
                        {new Date(order.deliveredAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
