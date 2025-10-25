
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Download,
  Eye,
  Loader2,
  Package,
  Calendar,
  Truck,
  CheckCircle,
  XCircle,
  Send,
} from "lucide-react";
import { MaterialOrderDetail } from "@/components/admin/material-order-detail";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface MaterialOrder {
  id: string;
  poNumber: string;
  status: string;
  subtotal: number;
  tax: number;
  total: number;
  sentAt: Date | null;
  confirmedAt: Date | null;
  expectedDelivery: Date | null;
  deliveredAt: Date | null;
  notes: string | null;
  createdAt: Date;
  supplier: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    contactPerson: string | null;
  };
  job: {
    id: string;
    jobNumber: string;
    systemSize: number;
    panelCount: number;
    batteryCapacity: number | null;
    scheduledDate: Date | null;
    lead: {
      name: string;
      email: string;
      address: string;
    };
    team: {
      name: string;
    } | null;
  };
  items: any[];
}

export default function MaterialOrderDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const [order, setOrder] = useState<MaterialOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchOrder();
  }, [params.id]);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("admin_token");
      const response = await fetch(`/api/admin/materials/${params.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setOrder(data);
      } else {
        toast.error("Failed to load material order");
        router.push("/admin/materials");
      }
    } catch (error) {
      console.error("Error fetching material order:", error);
      toast.error("Failed to load material order");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus: string) => {
    try {
      setUpdatingStatus(true);
      const token = localStorage.getItem("admin_token");
      const response = await fetch(`/api/admin/materials/${params.id}/status`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        toast.success("Status updated successfully");
        fetchOrder();
      } else {
        toast.error("Failed to update status");
      }
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Failed to update status");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleViewPO = () => {
    window.open(`/admin/materials/${params.id}/preview`, "_blank");
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      DRAFT: "secondary",
      PENDING_REVIEW: "default",
      SENT: "default",
      CONFIRMED: "default",
      IN_TRANSIT: "default",
      DELIVERED: "default",
      CANCELLED: "destructive",
    };
    return colors[status] || "secondary";
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      DRAFT: "Draft",
      PENDING_REVIEW: "Pending Review",
      SENT: "Sent",
      CONFIRMED: "Confirmed",
      IN_TRANSIT: "In Transit",
      DELIVERED: "Delivered",
      CANCELLED: "Cancelled",
    };
    return labels[status] || status;
  };

  const getStatusIcon = (status: string) => {
    const icons: Record<string, any> = {
      DRAFT: Package,
      PENDING_REVIEW: Calendar,
      SENT: Package,
      CONFIRMED: CheckCircle,
      IN_TRANSIT: Truck,
      DELIVERED: CheckCircle,
      CANCELLED: XCircle,
    };
    const Icon = icons[status] || Package;
    return <Icon className="h-4 w-4" />;
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container mx-auto p-6">
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">Material order not found</p>
          <Button onClick={() => router.push("/admin/materials")} className="mt-4">
            Back to Materials
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/admin/materials")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold">{order.poNumber}</h1>
            <Badge variant={getStatusColor(order.status) as any}>
              {getStatusIcon(order.status)}
              <span className="ml-2">{getStatusLabel(order.status)}</span>
            </Badge>
          </div>
          <p className="text-muted-foreground">Material Order Details</p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            onClick={() => setShowModal(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Send className="h-4 w-4 mr-2" />
            Send to Supplier
          </Button>
          <Button onClick={handleViewPO} variant="outline">
            <Eye className="h-4 w-4 mr-2" />
            Preview PO
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Job Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="text-xs text-muted-foreground">Job Number</Label>
              <p className="font-medium">{order.job.jobNumber}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Customer</Label>
              <p className="font-medium">{order.job.lead.name}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Address</Label>
              <p className="text-sm">{order.job.lead.address}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">System</Label>
              <p className="text-sm">
                {order.job.systemSize}kW, {order.job.panelCount} panels
                {order.job.batteryCapacity && (
                  <>, {order.job.batteryCapacity}kWh battery</>
                )}
              </p>
            </div>
            {order.job.team && (
              <div>
                <Label className="text-xs text-muted-foreground">Assigned Team</Label>
                <p className="text-sm">{order.job.team.name}</p>
              </div>
            )}
            {order.job.scheduledDate && (
              <div>
                <Label className="text-xs text-muted-foreground">Scheduled</Label>
                <p className="text-sm">
                  {new Date(order.job.scheduledDate).toLocaleDateString()}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Supplier Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="text-xs text-muted-foreground">Company</Label>
              <p className="font-medium">{order.supplier.name}</p>
            </div>
            {order.supplier.contactPerson && (
              <div>
                <Label className="text-xs text-muted-foreground">Contact</Label>
                <p className="text-sm">{order.supplier.contactPerson}</p>
              </div>
            )}
            <div>
              <Label className="text-xs text-muted-foreground">Email</Label>
              <p className="text-sm">{order.supplier.email}</p>
            </div>
            {order.supplier.phone && (
              <div>
                <Label className="text-xs text-muted-foreground">Phone</Label>
                <p className="text-sm">{order.supplier.phone}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Order Timeline</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="text-xs text-muted-foreground">Created</Label>
              <p className="text-sm">
                {new Date(order.createdAt).toLocaleDateString()}
              </p>
            </div>
            {order.sentAt && (
              <div>
                <Label className="text-xs text-muted-foreground">Sent</Label>
                <p className="text-sm">
                  {new Date(order.sentAt).toLocaleDateString()}
                </p>
              </div>
            )}
            {order.confirmedAt && (
              <div>
                <Label className="text-xs text-muted-foreground">Confirmed</Label>
                <p className="text-sm">
                  {new Date(order.confirmedAt).toLocaleDateString()}
                </p>
              </div>
            )}
            {order.expectedDelivery && (
              <div>
                <Label className="text-xs text-muted-foreground">Expected Delivery</Label>
                <p className="text-sm">
                  {new Date(order.expectedDelivery).toLocaleDateString()}
                </p>
              </div>
            )}
            {order.deliveredAt && (
              <div>
                <Label className="text-xs text-muted-foreground">Delivered</Label>
                <p className="text-sm">
                  {new Date(order.deliveredAt).toLocaleDateString()}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Update Status</CardTitle>
          <CardDescription>
            Change the status of this material order
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Select
              value={order.status}
              onValueChange={handleStatusUpdate}
              disabled={updatingStatus}
            >
              <SelectTrigger className="w-[250px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="PENDING_REVIEW">Pending Review</SelectItem>
                <SelectItem value="SENT">Sent</SelectItem>
                <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                <SelectItem value="IN_TRANSIT">In Transit</SelectItem>
                <SelectItem value="DELIVERED">Delivered</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            {updatingStatus && <Loader2 className="h-4 w-4 animate-spin" />}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Order Items</CardTitle>
          <CardDescription>
            Materials included in this purchase order
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Description</TableHead>
                <TableHead className="text-center">Quantity</TableHead>
                <TableHead className="text-right">Unit Cost</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {order.items.map((item: any, index: number) => (
                <TableRow key={index}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{item.description}</p>
                      {item.brand && (
                        <p className="text-sm text-muted-foreground">{item.brand}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    {item.quantity} {item.unit || "units"}
                  </TableCell>
                  <TableCell className="text-right">
                    ${item.unitCost?.toFixed(2) || "0.00"}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    ${item.total?.toFixed(2) || "0.00"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="mt-6 space-y-2 border-t pt-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal:</span>
              <span className="font-medium">${order.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Tax (GST):</span>
              <span className="font-medium">${order.tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold border-t pt-2">
              <span>Total:</span>
              <span>${order.total.toFixed(2)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {order.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{order.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Material Order Detail Modal */}
      <MaterialOrderDetail
        order={order}
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onUpdate={fetchOrder}
      />
    </div>
  );
}
