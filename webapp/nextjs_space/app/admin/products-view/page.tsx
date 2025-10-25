'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Package,
  Search,
  Filter,
  ArrowLeft,
  Loader2,
  DollarSign,
  TrendingUp,
  Truck,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Supplier {
  id: string;
  name: string;
  email: string;
}

interface SupplierProduct {
  id: string;
  unitCost: number;
  retailPrice: number | null;
  markupPercent: number | null;
  leadTime: number | null;
  isActive: boolean;
  supplier: Supplier;
}

interface Product {
  id: string;
  name: string;
  sku: string;
  manufacturer: string;
  productType: string;
  specifications: any;
  warrantyYears: number | null;
  tier: string | null;
  isAvailable: boolean;
  isRecommended: boolean;
  SupplierProduct?: SupplierProduct[];
}

const PRODUCT_TYPES = [
  { value: '', label: 'All Types' },
  { value: 'PANEL', label: 'Solar Panel' },
  { value: 'INVERTER', label: 'Inverter' },
  { value: 'BATTERY', label: 'Battery' },
  { value: 'EV_CHARGER', label: 'EV Charger' },
  { value: 'RAILING', label: 'Railing' },
  { value: 'CABLE_DC', label: 'DC Cable' },
  { value: 'CABLE_AC', label: 'AC Cable' },
];

export default function ProductsViewPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('');

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    let filtered = products;

    if (selectedType) {
      filtered = filtered.filter(p => p.productType === selectedType);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(term) ||
        p.manufacturer.toLowerCase().includes(term) ||
        p.sku.toLowerCase().includes(term)
      );
    }

    setFilteredProducts(filtered);
  }, [products, selectedType, searchTerm]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/products');
      const data = await res.json();
      setProducts(data.products || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      alert('Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  const getProductTypeLabel = (type: string) => {
    return PRODUCT_TYPES.find(t => t.value === type)?.label || type;
  };

  const getBestPrice = (supplierProducts: SupplierProduct[]) => {
    if (!supplierProducts || supplierProducts.length === 0) return null;
    
    const activePrices = supplierProducts
      .filter(sp => sp.isActive && sp.unitCost)
      .map(sp => sp.unitCost);
    
    if (activePrices.length === 0) return null;
    return Math.min(...activePrices);
  };

  const getAverageMarkup = (supplierProducts: SupplierProduct[]) => {
    if (!supplierProducts || supplierProducts.length === 0) return null;
    
    const markups = supplierProducts
      .filter(sp => sp.isActive && sp.markupPercent)
      .map(sp => sp.markupPercent!);
    
    if (markups.length === 0) return null;
    return markups.reduce((a, b) => a + b, 0) / markups.length;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
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
          
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <Package className="w-8 h-8 mr-3 text-blue-600" />
              Products Catalog with Pricing
            </h1>
            <p className="text-gray-600 mt-2">
              View all products with supplier pricing and availability
            </p>
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Search */}
              <div>
                <Label>Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search by name, manufacturer, or SKU..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Product Type Filter */}
              <div>
                <Label>Product Type</Label>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {PRODUCT_TYPES.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Products List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : filteredProducts.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-gray-500">
              No products found
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredProducts.map((product) => {
              const bestPrice = getBestPrice(product.SupplierProduct || []);
              const avgMarkup = getAverageMarkup(product.SupplierProduct || []);
              
              return (
                <Card key={product.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {getProductTypeLabel(product.productType)}
                          </span>
                          <h3 className="text-xl font-bold">{product.name}</h3>
                          {product.isRecommended && (
                            <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">
                              ★ Recommended
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                          <span><strong>Manufacturer:</strong> {product.manufacturer}</span>
                          <span><strong>SKU:</strong> <span className="font-mono">{product.sku}</span></span>
                          {product.warrantyYears && (
                            <span><strong>Warranty:</strong> {product.warrantyYears} years</span>
                          )}
                          {product.tier && (
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                              product.tier === 'premium' ? 'bg-purple-100 text-purple-800' :
                              product.tier === 'mid' ? 'bg-green-100 text-green-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {product.tier}
                            </span>
                          )}
                        </div>

                        {/* Specifications */}
                        {product.specifications && Object.keys(product.specifications).length > 0 && (
                          <div className="bg-gray-50 rounded p-3 mb-3">
                            <div className="text-xs font-semibold text-gray-500 mb-1">SPECIFICATIONS</div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                              {Object.entries(product.specifications).map(([key, value]) => (
                                <div key={key}>
                                  <span className="text-gray-500 capitalize">{key}:</span>{' '}
                                  <span className="font-semibold">{String(value)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Pricing Summary */}
                        {product.SupplierProduct && product.SupplierProduct.length > 0 ? (
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                              <div className="flex items-center space-x-2 mb-1">
                                <DollarSign className="w-4 h-4 text-green-600" />
                                <span className="text-xs font-semibold text-green-700">BEST PRICE</span>
                              </div>
                              <div className="text-2xl font-bold text-green-900">
                                {bestPrice ? `$${bestPrice.toFixed(2)}` : 'N/A'}
                              </div>
                              <div className="text-xs text-green-600">Lowest unit cost</div>
                            </div>

                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                              <div className="flex items-center space-x-2 mb-1">
                                <TrendingUp className="w-4 h-4 text-blue-600" />
                                <span className="text-xs font-semibold text-blue-700">AVG MARKUP</span>
                              </div>
                              <div className="text-2xl font-bold text-blue-900">
                                {avgMarkup ? `${avgMarkup.toFixed(1)}%` : 'N/A'}
                              </div>
                              <div className="text-xs text-blue-600">Average profit margin</div>
                            </div>

                            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                              <div className="flex items-center space-x-2 mb-1">
                                <Truck className="w-4 h-4 text-purple-600" />
                                <span className="text-xs font-semibold text-purple-700">SUPPLIERS</span>
                              </div>
                              <div className="text-2xl font-bold text-purple-900">
                                {product.SupplierProduct.filter((sp: SupplierProduct) => sp.isActive).length}
                              </div>
                              <div className="text-xs text-purple-600">Active suppliers</div>
                            </div>
                          </div>
                        ) : (
                          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                            <p className="text-sm text-yellow-800">
                              ⚠️ No suppliers linked yet. Go to Products management to add suppliers.
                            </p>
                          </div>
                        )}

                        {/* Supplier Details */}
                        {product.SupplierProduct && product.SupplierProduct.length > 0 && (
                          <div>
                            <div className="text-xs font-semibold text-gray-500 mb-2">SUPPLIER PRICING</div>
                            <div className="space-y-2">
                              {product.SupplierProduct
                                .filter((sp: SupplierProduct) => sp.isActive)
                                .sort((a: SupplierProduct, b: SupplierProduct) => a.unitCost - b.unitCost)
                                .map((sp: SupplierProduct) => (
                                  <div
                                    key={sp.id}
                                    className="flex items-center justify-between bg-white border rounded p-3 text-sm"
                                  >
                                    <div className="flex-1">
                                      <div className="font-semibold">{sp.supplier.name}</div>
                                      <div className="text-xs text-gray-500">{sp.supplier.email}</div>
                                    </div>
                                    <div className="flex items-center space-x-6">
                                      <div className="text-right">
                                        <div className="text-xs text-gray-500">Unit Cost</div>
                                        <div className="font-semibold text-red-600">
                                          ${sp.unitCost.toFixed(2)}
                                        </div>
                                      </div>
                                      {sp.retailPrice && (
                                        <div className="text-right">
                                          <div className="text-xs text-gray-500">Retail Price</div>
                                          <div className="font-semibold text-green-600">
                                            ${sp.retailPrice.toFixed(2)}
                                          </div>
                                        </div>
                                      )}
                                      {sp.markupPercent && (
                                        <div className="text-right">
                                          <div className="text-xs text-gray-500">Markup</div>
                                          <div className="font-semibold text-blue-600">
                                            {sp.markupPercent.toFixed(1)}%
                                          </div>
                                        </div>
                                      )}
                                      {sp.leadTime && (
                                        <div className="text-right">
                                          <div className="text-xs text-gray-500">Lead Time</div>
                                          <div className="font-semibold">
                                            {sp.leadTime} days
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
