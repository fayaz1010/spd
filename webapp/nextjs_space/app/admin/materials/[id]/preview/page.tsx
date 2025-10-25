
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Loader2, Download, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import PurchaseOrderTemplate from "@/lib/templates/purchase-order";

interface MaterialOrder {
  id: string;
  poNumber: string;
  status: string;
  subtotal: number;
  tax: number;
  total: number;
  items: any[];
  notes: string | null;
  createdAt: Date;
  supplier: {
    name: string;
    email: string;
    phone: string | null;
    contactPerson: string | null;
    address: string | null;
    city: string | null;
    postcode: string | null;
    paymentTerms: string | null;
  };
  job: {
    jobNumber: string;
    scheduledDate: Date | null;
    lead: {
      name: string;
      email: string;
      phone: string;
      address: string;
    };
  };
}

export default function POPreviewPage() {
  const params = useParams();
  const orderId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<MaterialOrder | null>(null);

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  const fetchOrder = async () => {
    try {
      const token = localStorage.getItem("admin_token");
      const response = await fetch(`/api/admin/materials/${orderId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setOrder(data);
      }
    } catch (error) {
      console.error("Error fetching material order:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Material Order Not Found</h1>
          <p className="text-muted-foreground">
            The material order you are looking for does not exist.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Action Bar - Hidden on print */}
      <div className="bg-gray-100 p-4 border-b print:hidden">
        <div className="container mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold">Purchase Order Preview</h1>
            <p className="text-sm text-muted-foreground">{order.poNumber}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={handlePrint} variant="outline">
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
          </div>
        </div>
      </div>

      {/* PO Template */}
      <div className="container mx-auto p-8 max-w-5xl">
        <PurchaseOrderTemplate order={order} />
      </div>
    </div>
  );
}
