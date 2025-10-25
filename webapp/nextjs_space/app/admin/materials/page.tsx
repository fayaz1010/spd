
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Package,
  FileText,
  Eye,
  Download,
  Send,
  Loader2,
  Filter,
  Plus,
  AlertCircle,
  ArrowLeft,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

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
  createdAt: Date;
  supplier: {
    id: string;
    name: string;
    email: string;
  };
  job: {
    id: string;
    jobNumber: string;
    lead: {
      name: string;
      address: string;
    };
  };
  items: any;
}

interface JobNeedingMaterials {
  id: string;
  jobNumber: string;
  status: string;
  systemSize: number;
  panelCount: number;
  batteryCapacity: number | null;
  inverterModel: string;
  scheduledDate: Date | null;
  lead: {
    name: string;
    email: string;
    address: string;
  };
  selectedComponents?: any;
}

export default function MaterialsPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<MaterialOrder[]>([]);
  const [jobsNeedingMaterials, setJobsNeedingMaterials] = useState<JobNeedingMaterials[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [generatingOrder, setGeneratingOrder] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [statusFilter]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("admin_token");
      
      // Fetch material orders
      const ordersUrl =
        statusFilter && statusFilter !== "all"
          ? `/api/admin/materials?status=${statusFilter}`
          : "/api/admin/materials";

      const ordersResponse = await fetch(ordersUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (ordersResponse.ok) {
        const ordersData = await ordersResponse.json();
        setOrders(ordersData);
      }

      // Fetch jobs needing materials
      const jobsResponse = await fetch("/api/admin/materials/jobs-needing-materials", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (jobsResponse.ok) {
        const jobsData = await jobsResponse.json();
        setJobsNeedingMaterials(jobsData);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load materials data");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateOrder = async (jobId: string) => {
    try {
      setGeneratingOrder(jobId);
      const token = localStorage.getItem("admin_token");

      const response = await fetch("/api/admin/materials/generate", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ jobId }),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(data.message || "Material orders created successfully");
        fetchData(); // Refresh the data
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to generate material orders");
      }
    } catch (error) {
      console.error("Error generating material orders:", error);
      toast.error("Failed to generate material orders");
    } finally {
      setGeneratingOrder(null);
    }
  };

  const handleCreateManualOrder = (jobId: string) => {
    router.push(`/admin/materials/create?jobId=${jobId}`);
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

  const handleViewPO = (orderId: string) => {
    window.open(`/admin/materials/${orderId}/preview`, "_blank");
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/admin/dashboard")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Material Orders</h1>
            <p className="text-muted-foreground">
              Manage material orders and purchase orders
            </p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="orders" className="w-full">
        <TabsList>
          <TabsTrigger value="orders">
            Material Orders ({orders.length})
          </TabsTrigger>
          <TabsTrigger value="needs-materials">
            Jobs Needing Materials ({jobsNeedingMaterials.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="orders" className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="PENDING_REVIEW">Pending Review</SelectItem>
                  <SelectItem value="SENT">Sent</SelectItem>
                  <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                  <SelectItem value="IN_TRANSIT">In Transit</SelectItem>
                  <SelectItem value="DELIVERED">Delivered</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Material Orders</CardTitle>
              <CardDescription>
                View and manage all material orders and purchase orders
              </CardDescription>
            </CardHeader>
            <CardContent>
              {orders.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No material orders found</p>
                  <p className="text-sm mt-2">
                    Material orders are generated when jobs are scheduled
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>PO Number</TableHead>
                      <TableHead>Job</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Supplier</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">{order.poNumber}</TableCell>
                        <TableCell>{order.job.jobNumber}</TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{order.job.lead.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {order.job.lead.address}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{order.supplier.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {order.supplier.email}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          ${order.total.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusColor(order.status) as any}>
                            {getStatusLabel(order.status)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(order.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleViewPO(order.id)}
                              title="View PO"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() =>
                                router.push(`/admin/materials/${order.id}`)
                              }
                              title="Manage"
                            >
                              <FileText className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="needs-materials" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Jobs Needing Materials</CardTitle>
              <CardDescription>
                Jobs that are scheduled but don't have material orders yet
              </CardDescription>
            </CardHeader>
            <CardContent>
              {jobsNeedingMaterials.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>All scheduled jobs have material orders</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Job Number</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>System Details</TableHead>
                      <TableHead>Scheduled Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {jobsNeedingMaterials.map((job) => (
                      <TableRow key={job.id}>
                        <TableCell className="font-medium">{job.jobNumber}</TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{job.lead.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {job.lead.address}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm space-y-1">
                            <div>{job.systemSize}kW System</div>
                            <div>{job.panelCount} Panels</div>
                            {job.batteryCapacity && (
                              <div>{job.batteryCapacity}kWh Battery</div>
                            )}
                            <div className="text-muted-foreground">{job.inverterModel}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {job.scheduledDate
                            ? new Date(job.scheduledDate).toLocaleDateString()
                            : "Not scheduled"}
                        </TableCell>
                        <TableCell>
                          <Badge variant={job.status === "SCHEDULED" ? "default" : "secondary"}>
                            {job.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleGenerateOrder(job.id)}
                              disabled={generatingOrder === job.id}
                            >
                              {generatingOrder === job.id ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  Generating...
                                </>
                              ) : (
                                <>
                                  <Package className="h-4 w-4 mr-2" />
                                  Auto Generate
                                </>
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleCreateManualOrder(job.id)}
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Manual Order
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
