
'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, DollarSign, Clock, Package, Star } from 'lucide-react';

interface BrandSuppliersModalProps {
  isOpen: boolean;
  onClose: () => void;
  brandId: string;
  brandName: string;
  category: 'PANEL' | 'BATTERY' | 'INVERTER';
}

export function BrandSuppliersModal({
  isOpen,
  onClose,
  brandId,
  brandName,
  category,
}: BrandSuppliersModalProps) {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && brandId) {
      fetchSuppliers();
    }
  }, [isOpen, brandId]);

  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/brand-suppliers/${brandId}?category=${category}`);
      if (res.ok) {
        const data = await res.json();
        setSuppliers(data);
      }
    } catch (error) {
      console.error('Error fetching suppliers:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateNetCost = (mapping: any) => {
    if (mapping.commissionType === 'percentage') {
      const commission = (mapping.supplierCost * mapping.ourCommission) / 100;
      return mapping.supplierCost - commission;
    }
    return mapping.supplierCost - mapping.ourCommission;
  };

  const calculateProfit = (mapping: any) => {
    if (mapping.commissionType === 'percentage') {
      return (mapping.supplierCost * mapping.ourCommission) / 100;
    }
    return mapping.ourCommission;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Supplier Information: {brandName}
          </DialogTitle>
          <DialogDescription>
            View all supplier mappings and pricing for this brand
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="py-8 text-center">
            <p className="text-muted-foreground">Loading suppliers...</p>
          </div>
        ) : suppliers.length === 0 ? (
          <div className="py-8 text-center">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No supplier mappings found</p>
            <p className="text-sm text-muted-foreground mt-1">
              Add supplier mappings in the Suppliers section
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {suppliers.map((mapping) => {
              const netCost = calculateNetCost(mapping);
              const profit = calculateProfit(mapping);
              
              return (
                <div
                  key={mapping.id}
                  className="border rounded-lg p-4 space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold flex items-center gap-2">
                        {mapping.supplierProduct.supplier.name}
                        {mapping.isPrimary && (
                          <Badge variant="default" className="flex items-center gap-1">
                            <Star className="h-3 w-3" />
                            Primary
                          </Badge>
                        )}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {mapping.supplierProduct.brand} - {mapping.supplierProduct.model}
                      </p>
                      {mapping.supplierProduct.sku && (
                        <p className="text-xs text-muted-foreground">
                          SKU: {mapping.supplierProduct.sku}
                        </p>
                      )}
                    </div>
                    {!mapping.isActive && (
                      <Badge variant="secondary">Inactive</Badge>
                    )}
                  </div>

                  <div className="grid grid-cols-4 gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <DollarSign className="h-3 w-3" />
                        Supplier Cost
                      </div>
                      <p className="font-semibold">${mapping.supplierCost.toFixed(2)}</p>
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <TrendingUp className="h-3 w-3" />
                        Commission
                      </div>
                      <p className="font-semibold">
                        {mapping.commissionType === 'percentage'
                          ? `${mapping.ourCommission}%`
                          : `$${mapping.ourCommission.toFixed(2)}`}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        = ${profit.toFixed(2)}
                      </p>
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <DollarSign className="h-3 w-3" />
                        Net Cost
                      </div>
                      <p className="font-semibold">${netCost.toFixed(2)}</p>
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        Lead Time
                      </div>
                      <p className="font-semibold">
                        {mapping.leadTimeDays || mapping.supplierProduct.leadTime || 'N/A'} days
                      </p>
                    </div>
                  </div>

                  {mapping.notes && (
                    <p className="text-sm text-muted-foreground border-t pt-2 mt-2">
                      {mapping.notes}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div className="flex justify-end pt-4 border-t">
          <Button onClick={onClose}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
