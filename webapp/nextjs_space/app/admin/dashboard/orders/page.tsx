
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Package,
  Truck,
  CheckCircle,
  Clock,
  FileText,
  Filter,
  Search,
  ChevronDown,
  ExternalLink,
  Calendar,
  DollarSign,
  Eye,
  AlertCircle,
  Plus,
  ArrowLeft,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { MaterialOrderDetail } from '@/components/admin/material-order-detail';

interface MaterialOrder {
  id: string;
  poNumber: string;
  jobId: string;
  supplierId: string;
  items: any[];
  subtotal: number;
  tax: number;
  total: number;
  status: string;
  sentAt: string | null;
  sentTo: string | null;
  confirmedAt: string | null;
  expectedDelivery: string | null;
  deliveredAt: string | null;
  deliveryNotes: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  supplier: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
  };
  job: {
    id: string;
    jobNumber: string;
    scheduledDate: string | null;
    lead: {
      id: string;
      name: string;
      email: string;
      phone: string;
      address: string;
      quoteReference: string;
    };
  };
}

interface OrderSummary {
  totalOrders: number;
  totalValue: number;
  byStatus: Record<string, number>;
  bySupplier: Record<string, { name: string; count: number; total: number }>;
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

const statusIcons: Record<string, any> = {
  DRAFT: FileText,
  PENDING_REVIEW: Clock,
  SENT: Package,
  CONFIRMED: CheckCircle,
  IN_TRANSIT: Truck,
  DELIVERED: CheckCircle,
  CANCELLED: AlertCircle,
};

export default function OrdersManagementPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [orders, setOrders] = useState<MaterialOrder[]>([]);
  const [summary, setSummary] = useState<OrderSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<MaterialOrder | null>(
    null
  );
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [supplierFilter, setSupplierFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchOrders();
  }, [statusFilter, supplierFilter]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter && statusFilter !== 'all') {
        params.append('status', statusFilter);
      }
      if (supplierFilter && supplierFilter !== 'all') {
        params.append('supplierId', supplierFilter);
      }

      const token = localStorage.getItem('admin_token');
      const response = await fetch(`/api/admin/orders?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch orders');

      const data = await response.json();
      setOrders(data.orders);
      setSummary(data.summary);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch orders',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (
    orderId: string,
    newStatus: string,
    additionalData?: any
  ) => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: newStatus,
          ...additionalData,
        }),
      });

      if (!response.ok) throw new Error('Failed to update order');

      toast({
        title: 'Success',
        description: `Order status updated to ${newStatus}`,
      });

      fetchOrders();
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error updating order:', error);
      toast({
        title: 'Error',
        description: 'Failed to update order status',
        variant: 'destructive',
      });
    }
  };

  const viewOrderDetails = (order: MaterialOrder) => {
    setSelectedOrder(order);
    setIsDialogOpen(true);
  };

  const filteredOrders = orders.filter((order) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        order.poNumber.toLowerCase().includes(query) ||
        order.job.jobNumber.toLowerCase().includes(query) ||
        order.supplier.name.toLowerCase().includes(query) ||
        order.job.lead.name.toLowerCase().includes(query)
      );
    }
    return true;
  });

  const uniqueSuppliers = Array.from(
    new Set(orders.map((o) => o.supplier.id))
  ).map((id) => {
    const supplier = orders.find((o) => o.supplier.id === id)?.supplier;
    return { id, name: supplier?.name || '' };
  });

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <Button
          onClick={() => router.push('/admin/dashboard')}
          variant="ghost"
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>
        
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-primary mb-2">
              Material Orders
            </h1>
            <p className="text-gray-600">
              View and manage all material orders across suppliers
            </p>
          </div>
          <Button 
            className="bg-primary hover:bg-primary/90"
            onClick={() => window.location.href = '/admin/materials/orders/new'}
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Order
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Orders</p>
                <p className="text-3xl font-bold text-primary">
                  {summary.totalOrders}
                </p>
              </div>
              <Package className="h-12 w-12 text-primary/20" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Value</p>
                <p className="text-3xl font-bold text-emerald">
                  ${summary.totalValue.toLocaleString()}
                </p>
              </div>
              <DollarSign className="h-12 w-12 text-emerald/20" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Pending</p>
                <p className="text-3xl font-bold text-yellow-600">
                  {summary.byStatus.DRAFT + summary.byStatus.PENDING_REVIEW}
                </p>
              </div>
              <Clock className="h-12 w-12 text-yellow-600/20" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">In Transit</p>
                <p className="text-3xl font-bold text-blue-600">
                  {summary.byStatus.IN_TRANSIT}
                </p>
              </div>
              <Truck className="h-12 w-12 text-blue-600/20" />
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <Label htmlFor="search">Search</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="search"
                placeholder="PO, Job, Supplier..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="status">Status</Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger id="status">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="PENDING_REVIEW">Pending Review</SelectItem>
                <SelectItem value="SENT">Sent</SelectItem>
                <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                <SelectItem value="IN_TRANSIT">In Transit</SelectItem>
                <SelectItem value="DELIVERED">Delivered</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="supplier">Supplier</Label>
            <Select value={supplierFilter} onValueChange={setSupplierFilter}>
              <SelectTrigger id="supplier">
                <SelectValue placeholder="All Suppliers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Suppliers</SelectItem>
                {uniqueSuppliers.map((supplier) => (
                  <SelectItem key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-end">
            <Button onClick={fetchOrders} className="w-full">
              <Filter className="h-4 w-4 mr-2" />
              Apply Filters
            </Button>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500">
            Loading orders...
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            No orders found
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>PO Number</TableHead>
                <TableHead>Job</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Expected Delivery</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.map((order) => {
                const StatusIcon = statusIcons[order.status];
                return (
                  <TableRow key={order.id}>
                    <TableCell className="font-mono font-semibold">
                      {order.poNumber}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-semibold">
                          {order.job.jobNumber}
                        </span>
                        <span className="text-xs text-gray-500">
                          {order.job.lead.name}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-semibold">
                          {order.supplier.name}
                        </span>
                        <span className="text-xs text-gray-500">
                          {order.supplier.email}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {Array.isArray(order.items) ? order.items.length : 0}{' '}
                      items
                    </TableCell>
                    <TableCell className="font-semibold">
                      ${order.total.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={`${statusColors[order.status]} text-white`}
                      >
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {order.status.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-sm">
                      {order.expectedDelivery ? (
                        <span>
                          {new Date(
                            order.expectedDelivery
                          ).toLocaleDateString()}
                        </span>
                      ) : (
                        <span className="text-gray-400">Not set</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => viewOrderDetails(order)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Order Details Dialog */}
      {selectedOrder && (
        <MaterialOrderDetail
          order={selectedOrder}
          isOpen={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
          onUpdate={fetchOrders}
        />
      )}
    </div>
  );
}
