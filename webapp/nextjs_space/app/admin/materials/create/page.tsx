
"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  ArrowLeft,
  Plus,
  Trash2,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";

interface Job {
  id: string;
  jobNumber: string;
  systemSize: number;
  panelCount: number;
  batteryCapacity: number | null;
  inverterModel: string;
  selectedComponents?: any;
  lead: {
    name: string;
    address: string;
  };
}

interface Supplier {
  id: string;
  name: string;
  email: string;
  phone: string | null;
}

interface SupplierProduct {
  id: string;
  category: string;
  brand: string;
  model: string;
  sku: string | null;
  unitCost: number;
  unit: string;
  leadTime: number | null;
  minOrderQty: number | null;
}

interface OrderItem {
  productId: string;
  description: string;
  quantity: number;
  unitCost: number;
  unit: string;
  total: number;
}

function CreateOrderForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const jobId = searchParams.get("jobId");

  const [job, setJob] = useState<Job | null>(null);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<SupplierProduct[]>([]);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>("");
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!jobId) {
      toast.error("Job ID is required");
      router.push("/admin/materials");
      return;
    }
    fetchInitialData();
  }, [jobId]);

  useEffect(() => {
    if (selectedSupplierId) {
      fetchSupplierProducts(selectedSupplierId);
    }
  }, [selectedSupplierId]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("admin_token");

      // Fetch job details
      const jobResponse = await fetch(`/api/admin/jobs/${jobId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!jobResponse.ok) {
        throw new Error("Failed to fetch job details");
      }

      const jobData = await jobResponse.json();
      setJob(jobData);

      // Fetch suppliers
      const suppliersResponse = await fetch("/api/admin/suppliers", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!suppliersResponse.ok) {
        throw new Error("Failed to fetch suppliers");
      }

      const suppliersData = await suppliersResponse.json();
      setSuppliers(suppliersData);

      // Auto-populate items based on job configuration
      if (jobData.selectedComponents) {
        autoPopulateItems(jobData);
      }
    } catch (error) {
      console.error("Error fetching initial data:", error);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const fetchSupplierProducts = async (supplierId: string) => {
    try {
      const token = localStorage.getItem("admin_token");
      const response = await fetch(
        `/api/admin/suppliers/${supplierId}/products`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setProducts(data);
      }
    } catch (error) {
      console.error("Error fetching supplier products:", error);
    }
  };

  const autoPopulateItems = (jobData: Job) => {
    const items: OrderItem[] = [];

    // Add panels
    if (jobData.panelCount > 0) {
      items.push({
        productId: "",
        description: `Solar Panels (${jobData.panelCount} units)`,
        quantity: jobData.panelCount,
        unitCost: 0,
        unit: "unit",
        total: 0,
      });
    }

    // Add battery
    if (jobData.batteryCapacity) {
      items.push({
        productId: "",
        description: `Battery System (${jobData.batteryCapacity}kWh)`,
        quantity: 1,
        unitCost: 0,
        unit: "unit",
        total: 0,
      });
    }

    // Add inverter
    if (jobData.inverterModel) {
      items.push({
        productId: "",
        description: `Inverter - ${jobData.inverterModel}`,
        quantity: 1,
        unitCost: 0,
        unit: "unit",
        total: 0,
      });
    }

    // Add standard items
    items.push({
      productId: "",
      description: "Mounting System & Rails",
      quantity: 1,
      unitCost: 0,
      unit: "set",
      total: 0,
    });

    items.push({
      productId: "",
      description: "Electrical Cables & Conduit",
      quantity: 1,
      unitCost: 0,
      unit: "set",
      total: 0,
    });

    items.push({
      productId: "",
      description: "Safety & Installation Hardware",
      quantity: 1,
      unitCost: 0,
      unit: "set",
      total: 0,
    });

    setOrderItems(items);
  };

  const addItem = () => {
    setOrderItems([
      ...orderItems,
      {
        productId: "",
        description: "",
        quantity: 1,
        unitCost: 0,
        unit: "unit",
        total: 0,
      },
    ]);
  };

  const removeItem = (index: number) => {
    setOrderItems(orderItems.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: string, value: any) => {
    const updatedItems = [...orderItems];
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: value,
    };

    // Recalculate total
    if (field === "quantity" || field === "unitCost") {
      updatedItems[index].total =
        updatedItems[index].quantity * updatedItems[index].unitCost;
    }

    setOrderItems(updatedItems);
  };

  const selectProduct = (index: number, productId: string) => {
    const product = products.find((p) => p.id === productId);
    if (product) {
      updateItem(index, "productId", productId);
      updateItem(index, "description", `${product.brand} ${product.model}`);
      updateItem(index, "unitCost", product.unitCost);
      updateItem(index, "unit", product.unit);
      // Recalculate total
      const updatedItems = [...orderItems];
      updatedItems[index].total =
        updatedItems[index].quantity * product.unitCost;
      setOrderItems(updatedItems);
    }
  };

  const calculateSubtotal = () => {
    return orderItems.reduce((sum, item) => sum + item.total, 0);
  };

  const calculateTax = () => {
    return calculateSubtotal() * 0.1; // 10% GST
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax();
  };

  const handleSubmit = async () => {
    if (!selectedSupplierId) {
      toast.error("Please select a supplier");
      return;
    }

    if (orderItems.length === 0) {
      toast.error("Please add at least one item");
      return;
    }

    if (orderItems.some((item) => !item.description || item.unitCost === 0)) {
      toast.error("Please complete all item details");
      return;
    }

    try {
      setSubmitting(true);
      const token = localStorage.getItem("admin_token");

      const response = await fetch("/api/admin/materials", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jobId,
          supplierId: selectedSupplierId,
          items: orderItems,
          notes,
          subtotal: calculateSubtotal(),
          tax: calculateTax(),
          total: calculateTotal(),
        }),
      });

      if (response.ok) {
        toast.success("Material order created successfully");
        router.push("/admin/materials");
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to create material order");
      }
    } catch (error) {
      console.error("Error creating material order:", error);
      toast.error("Failed to create material order");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="container mx-auto p-6">
        <Card className="p-8 text-center">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
          <p className="text-muted-foreground">Job not found</p>
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
        <div>
          <h1 className="text-3xl font-bold">Create Material Order</h1>
          <p className="text-muted-foreground">
            Create a manual material order for {job.jobNumber}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Job Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground">Customer</Label>
              <p className="font-medium">{job.lead.name}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Address</Label>
              <p className="font-medium">{job.lead.address}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">System Size</Label>
              <p className="font-medium">{job.systemSize}kW</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Panel Count</Label>
              <p className="font-medium">{job.panelCount} panels</p>
            </div>
            {job.batteryCapacity && (
              <div>
                <Label className="text-muted-foreground">Battery</Label>
                <p className="font-medium">{job.batteryCapacity}kWh</p>
              </div>
            )}
            <div>
              <Label className="text-muted-foreground">Inverter</Label>
              <p className="font-medium">{job.inverterModel}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Supplier Selection</CardTitle>
          <CardDescription>Select the supplier for this order</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="supplier">Supplier</Label>
              <Select
                value={selectedSupplierId}
                onValueChange={setSelectedSupplierId}
              >
                <SelectTrigger id="supplier">
                  <SelectValue placeholder="Select a supplier" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map((supplier) => (
                    <SelectItem key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Order Items</CardTitle>
              <CardDescription>Add items to this material order</CardDescription>
            </div>
            <Button onClick={addItem} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Description</TableHead>
                <TableHead className="w-[100px]">Quantity</TableHead>
                <TableHead className="w-[150px]">Unit Cost</TableHead>
                <TableHead className="w-[100px]">Unit</TableHead>
                <TableHead className="w-[150px] text-right">Total</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orderItems.map((item, index) => (
                <TableRow key={index}>
                  <TableCell>
                    {products.length > 0 && selectedSupplierId ? (
                      <Select
                        value={item.productId}
                        onValueChange={(value) => selectProduct(index, value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a product" />
                        </SelectTrigger>
                        <SelectContent>
                          {products.map((product) => (
                            <SelectItem key={product.id} value={product.id}>
                              {product.category} - {product.brand} {product.model}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        value={item.description}
                        onChange={(e) =>
                          updateItem(index, "description", e.target.value)
                        }
                        placeholder="Item description"
                      />
                    )}
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) =>
                        updateItem(index, "quantity", parseInt(e.target.value) || 1)
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.unitCost}
                      onChange={(e) =>
                        updateItem(index, "unitCost", parseFloat(e.target.value) || 0)
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      value={item.unit}
                      onChange={(e) =>
                        updateItem(index, "unit", e.target.value)
                      }
                      placeholder="unit"
                    />
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    ${item.total.toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeItem(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {orderItems.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No items added yet. Click "Add Item" to get started.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {orderItems.length > 0 && (
            <div className="mt-6 space-y-2 border-t pt-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal:</span>
                <span className="font-medium">${calculateSubtotal().toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tax (GST 10%):</span>
                <span className="font-medium">${calculateTax().toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t pt-2">
                <span>Total:</span>
                <span>${calculateTotal().toFixed(2)}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Additional Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any additional notes or instructions for this order..."
            rows={4}
          />
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <Button
          variant="outline"
          onClick={() => router.push("/admin/materials")}
          disabled={submitting}
        >
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={submitting}>
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Creating Order...
            </>
          ) : (
            <>
              <Package className="h-4 w-4 mr-2" />
              Create Order
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

export default function CreateOrderPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto p-6 flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    }>
      <CreateOrderForm />
    </Suspense>
  );
}
