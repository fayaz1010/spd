'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ShoppingCart, Check, Package } from 'lucide-react';

interface ProductDetailModalProps {
  product: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddToCart: (productId: string) => void;
  Icon: React.ElementType;
}

export function ProductDetailModal({
  product,
  open,
  onOpenChange,
  onAddToCart,
  Icon,
}: ProductDetailModalProps) {
  if (!product) return null;

  const technicalSpecs = product.technicalSpecs || {};
  const features = product.features || [];
  const benefits = product.benefits || [];
  const productType = product.productType || 'ADDON';
  
  const typeColors: Record<string, string> = {
    PANEL: 'bg-yellow-100 text-yellow-800',
    BATTERY: 'bg-green-100 text-green-800',
    INVERTER: 'bg-blue-100 text-blue-800',
    ADDON: 'bg-purple-100 text-purple-800',
    EV_CHARGER: 'bg-indigo-100 text-indigo-800',
  };
  const typeColor = typeColors[productType] || 'bg-gray-100 text-gray-800';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start gap-4 mb-4">
            <div className="bg-primary/10 rounded-full p-4">
              <Icon className="h-10 w-10 text-primary" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <DialogTitle className="text-2xl">{product.name}</DialogTitle>
                <Badge className={typeColor}>
                  {productType.replace('_', ' ')}
                </Badge>
              </div>
              {product.manufacturer && (
                <p className="text-sm text-muted-foreground">
                  by {product.manufacturer}
                </p>
              )}
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-coral">
                ${product.cost?.toLocaleString() || '0'}
              </p>
              <p className="text-xs text-gray-500">inc. GST</p>
            </div>
          </div>
        </DialogHeader>

        {/* Description */}
        <div className="space-y-6">
          <div>
            <h3 className="font-semibold text-lg mb-2">Product Description</h3>
            <p className="text-gray-700 leading-relaxed">{product.description}</p>
          </div>

          {/* Benefits */}
          {benefits.length > 0 && (
            <>
              <Separator />
              <div>
                <h3 className="font-semibold text-lg mb-3">Key Benefits</h3>
                <div className="grid md:grid-cols-2 gap-3">
                  {benefits.map((benefit: string, idx: number) => (
                    <div key={idx} className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-700">{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Technical Specifications */}
          {Object.keys(technicalSpecs).length > 0 && (
            <>
              <Separator />
              <div>
                <h3 className="font-semibold text-lg mb-3">Technical Specifications</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  {Object.entries(technicalSpecs).map(([key, value]) => {
                    // Handle arrays
                    if (Array.isArray(value)) {
                      return (
                        <div key={key} className="col-span-2">
                          <p className="text-sm font-medium text-gray-600 mb-2">
                            {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                          </p>
                          <ul className="list-disc list-inside space-y-1">
                            {value.map((item, idx) => (
                              <li key={idx} className="text-sm text-gray-700">{item}</li>
                            ))}
                          </ul>
                        </div>
                      );
                    }
                    
                    // Handle regular values
                    return (
                      <div key={key}>
                        <p className="text-sm font-medium text-gray-600">
                          {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                        </p>
                        <p className="text-sm text-gray-900 font-semibold">{String(value)}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {/* Product Info */}
          <Separator />
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            {product.sku && (
              <div>
                <p className="text-gray-600">SKU</p>
                <p className="font-semibold">{product.sku}</p>
              </div>
            )}
            {product.warrantyYears && (
              <div>
                <p className="text-gray-600">Warranty</p>
                <p className="font-semibold">{product.warrantyYears} years</p>
              </div>
            )}
            {product.tier && (
              <div>
                <p className="text-gray-600">Quality Tier</p>
                <p className="font-semibold">{product.tier}</p>
              </div>
            )}
          </div>

          {/* Add to Cart Button */}
          <div className="sticky bottom-0 bg-white pt-4 pb-2 border-t">
            <div className="flex gap-3">
              <Button
                className="flex-1 bg-coral hover:bg-coral-600 text-white text-lg py-6"
                onClick={() => {
                  onAddToCart(product.id || product.addonId);
                  onOpenChange(false);
                }}
              >
                <ShoppingCart className="h-5 w-5 mr-2" />
                Add to Cart
              </Button>
              <Button
                variant="outline"
                className="px-6"
                onClick={() => onOpenChange(false)}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
