'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Package,
  CheckCircle,
  Loader2,
  AlertCircle,
  Truck,
  Send,
  ExternalLink,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { MaterialOrderDetail } from './material-order-detail';

interface MaterialOrderCardProps {
  leadId: string;
  lead: any;
}

export function MaterialOrderCard({ leadId, lead }: MaterialOrderCardProps) {
  const [loading, setLoading] = useState(true);
  const [materialOrder, setMaterialOrder] = useState<any>(null);
  const [creating, setCreating] = useState(false);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchMaterialOrder();
  }, [leadId]);

  const fetchMaterialOrder = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`/api/admin/leads/${leadId}/material-order`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setMaterialOrder(data.materialOrder);
      }
    } catch (error) {
      console.error('Error fetching material order:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrder = async () => {
    setCreating(true);
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`/api/admin/leads/${leadId}/material-order`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Failed to create material order');

      const data = await response.json();
      setMaterialOrder(data.materialOrder);
      toast.success('Material order created successfully');
    } catch (error) {
      console.error('Error creating material order:', error);
      toast.error('Failed to create material order');
    } finally {
      setCreating(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      DRAFT: { label: 'Draft', className: 'bg-gray-500' },
      PENDING_REVIEW: { label: 'Pending Review', className: 'bg-yellow-500' },
      SENT: { label: 'Sent to Supplier', className: 'bg-blue-500' },
      CONFIRMED: { label: 'Confirmed', className: 'bg-green-500' },
      IN_TRANSIT: { label: 'In Transit', className: 'bg-purple-500' },
      DELIVERED: { label: 'Delivered', className: 'bg-green-600' },
      CANCELLED: { label: 'Cancelled', className: 'bg-red-500' }
    };

    const config = statusConfig[status] || { label: status, className: 'bg-gray-500' };
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // No material order exists
  if (!materialOrder) {
    const canCreate = lead.InstallationJob && lead.InstallationJob.status === 'READY_TO_SCHEDULE';
    
    return (
      <Card className="border-2 border-gray-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Material Order
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">No material order created yet</p>
            
            {canCreate ? (
              <>
                <p className="text-sm text-gray-500 mb-4">
                  Installation is ready to schedule. Create a material order to proceed.
                </p>
                <Button 
                  onClick={handleCreateOrder}
                  disabled={creating}
                >
                  {creating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Package className="h-4 w-4 mr-2" />
                      Create Material Order
                    </>
                  )}
                </Button>
              </>
            ) : (
              <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg">
                <p className="text-sm text-orange-800">
                  <strong>Not ready yet:</strong> Material order will be auto-created when all approvals are received and installation is ready to schedule.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Material order exists
  return (
    <Card className="border-2 border-blue-200">
      <CardHeader className="bg-blue-50">
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Package className="h-5 w-5 text-blue-600" />
            Material Order
          </span>
          <div className="flex items-center gap-2">
            {getStatusBadge(materialOrder.status)}
            <Button
              variant="outline"
              size="sm"
              onClick={fetchMaterialOrder}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button 
              size="sm" 
              className="bg-blue-600 hover:bg-blue-700"
              onClick={() => setShowModal(true)}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              View Details
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6 space-y-4">
        
        {/* Order Details */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-gray-600">PO Number</div>
            <div className="font-semibold">{materialOrder.poNumber}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Supplier</div>
            <div className="font-semibold">{materialOrder.supplier?.name || 'N/A'}</div>
          </div>
        </div>

        <Separator />

        {/* Cost Summary */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Subtotal:</span>
            <span className="font-medium">${materialOrder.subtotal?.toFixed(2) || '0.00'}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">GST (10%):</span>
            <span className="font-medium">${materialOrder.tax?.toFixed(2) || '0.00'}</span>
          </div>
          <Separator />
          <div className="flex justify-between">
            <span className="font-semibold">Total:</span>
            <span className="font-bold text-lg">${materialOrder.total?.toFixed(2) || '0.00'}</span>
          </div>
        </div>

        <Separator />

        {/* Material Items */}
        <div>
          <div className="text-sm font-semibold mb-2">Materials ({materialOrder.items?.length || 0} items)</div>
          <div className="max-h-60 overflow-y-auto space-y-2">
            {materialOrder.items && materialOrder.items.length > 0 ? (
              materialOrder.items.map((item: any, index: number) => (
                <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded text-sm">
                  <div>
                    <div className="font-medium">{item.brand} {item.model}</div>
                    <div className="text-xs text-gray-600">{item.category} - {item.type}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{item.quantity} {item.unit}</div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500">No items</p>
            )}
          </div>
        </div>

        <Separator />

        {/* Dates */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          {materialOrder.sentAt && (
            <div>
              <div className="text-gray-600">Sent to Supplier:</div>
              <div className="font-medium">{new Date(materialOrder.sentAt).toLocaleDateString()}</div>
            </div>
          )}
          {materialOrder.confirmedAt && (
            <div>
              <div className="text-gray-600">Confirmed:</div>
              <div className="font-medium">{new Date(materialOrder.confirmedAt).toLocaleDateString()}</div>
            </div>
          )}
          {materialOrder.expectedDelivery && (
            <div>
              <div className="text-gray-600">Expected Delivery:</div>
              <div className="font-medium">{new Date(materialOrder.expectedDelivery).toLocaleDateString()}</div>
            </div>
          )}
          {materialOrder.deliveredAt && (
            <div>
              <div className="text-gray-600">Delivered:</div>
              <div className="font-medium text-green-600">{new Date(materialOrder.deliveredAt).toLocaleDateString()}</div>
            </div>
          )}
        </div>

        {/* Notes */}
        {materialOrder.notes && (
          <>
            <Separator />
            <div>
              <div className="text-sm text-gray-600 mb-1">Notes:</div>
              <div className="text-sm bg-gray-50 p-2 rounded">{materialOrder.notes}</div>
            </div>
          </>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <Link href={`/admin/materials/${materialOrder.id}`} className="flex-1">
            <Button variant="outline" className="w-full">
              <ExternalLink className="h-4 w-4 mr-2" />
              View Full Order
            </Button>
          </Link>
          
          {materialOrder.status === 'DRAFT' && (
            <Link href={`/admin/materials/${materialOrder.id}`} className="flex-1">
              <Button className="w-full bg-blue-600 hover:bg-blue-700">
                <Send className="h-4 w-4 mr-2" />
                Review & Send
              </Button>
            </Link>
          )}
        </div>

        {/* Status Info */}
        {materialOrder.status === 'DRAFT' && (
          <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>Action Required:</strong> Review the material order and send it to the supplier to proceed with procurement.
            </p>
          </div>
        )}

        {materialOrder.status === 'DELIVERED' && (
          <div className="bg-green-50 border border-green-200 p-3 rounded-lg flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <p className="text-sm text-green-800">
              <strong>Materials Ready:</strong> All materials have been delivered and installation can be scheduled.
            </p>
          </div>
        )}
      </CardContent>

      {/* Material Order Detail Modal */}
      <MaterialOrderDetail
        order={materialOrder}
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onUpdate={fetchMaterialOrder}
      />
    </Card>
  );
}
