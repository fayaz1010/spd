'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  ArrowLeft,
  Save,
  Loader2,
  Package,
  TrendingUp,
  History,
  AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

interface ShopProduct {
  id: string;
  costPrice: number;
  retailPrice: number;
  salePrice: number | null;
  commission: number;
  stockQty: number;
  lowStockAlert: number;
  trackInventory: boolean;
  allowBackorder: boolean;
  featured: boolean;
  isActive: boolean;
  categoryId: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  tags: string[];
  product: {
    id: string;
    name: string;
    sku: string;
    manufacturer: string;
    productType: string;
    imageUrl: string | null;
  };
  category: {
    id: string;
    name: string;
  } | null;
  stockHistory: Array<{
    id: string;
    previousQty: number;
    newQty: number;
    change: number;
    reason: string;
    notes: string | null;
    createdAt: string;
  }>;
}

export default function EditShopProductPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [shopProduct, setShopProduct] = useState<ShopProduct | null>(null);
  const [categories, setCategories] = useState<any[]>([]);

  // Form state
  const [costPrice, setCostPrice] = useState('');
  const [retailPrice, setRetailPrice] = useState('');
  const [salePrice, setSalePrice] = useState('');
  const [commission, setCommission] = useState('');
  const [stockQty, setStockQty] = useState('');
  const [lowStockAlert, setLowStockAlert] = useState('');
  const [trackInventory, setTrackInventory] = useState(true);
  const [allowBackorder, setAllowBackorder] = useState(false);
  const [categoryId, setCategoryId] = useState('');
  const [featured, setFeatured] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [tags, setTags] = useState('');

  useEffect(() => {
    fetchData();
  }, [params.id]);

  const fetchData = async () => {
    try {
      const [productRes, categoriesRes] = await Promise.all([
        fetch(`/api/admin/shop/products/${params.id}`),
        fetch('/api/admin/shop/categories'),
      ]);

      const productData = await productRes.json();
      const categoriesData = await categoriesRes.json();

      setShopProduct(productData);
      setCategories(categoriesData);

      // Set form values
      setCostPrice(productData.costPrice.toString());
      setRetailPrice(productData.retailPrice.toString());
      setSalePrice(productData.salePrice?.toString() || '');
      setCommission(productData.commission.toString());
      setStockQty(productData.stockQty.toString());
      setLowStockAlert(productData.lowStockAlert.toString());
      setTrackInventory(productData.trackInventory);
      setAllowBackorder(productData.allowBackorder);
      setCategoryId(productData.categoryId || '');
      setFeatured(productData.featured);
      setIsActive(productData.isActive);
      setMetaTitle(productData.metaTitle || '');
      setMetaDescription(productData.metaDescription || '');
      setTags(productData.tags.join(', '));
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load product');
    } finally {
      setLoading(false);
    }
  };

  const calculateMargin = () => {
    const cost = parseFloat(costPrice) || 0;
    const retail = parseFloat(retailPrice) || 0;
    if (retail === 0) return '0';
    return (((retail - cost) / retail) * 100).toFixed(1);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/shop/products/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          costPrice: parseFloat(costPrice),
          retailPrice: parseFloat(retailPrice),
          salePrice: salePrice ? parseFloat(salePrice) : null,
          commission: parseFloat(commission),
          stockQty: parseInt(stockQty),
          lowStockAlert: parseInt(lowStockAlert),
          trackInventory,
          allowBackorder,
          categoryId: categoryId || null,
          featured,
          isActive,
          metaTitle,
          metaDescription,
          tags: tags ? tags.split(',').map(t => t.trim()) : [],
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error);
      }

      toast.success('Product updated successfully!');
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update product');
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-AU', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getReasonBadge = (reason: string) => {
    const config: Record<string, { label: string; className: string }> = {
      sale: { label: 'Sale', className: 'bg-red-500' },
      restock: { label: 'Restock', className: 'bg-green-500' },
      adjustment: { label: 'Adjustment', className: 'bg-blue-500' },
      return: { label: 'Return', className: 'bg-yellow-500' },
      refund: { label: 'Refund', className: 'bg-orange-500' },
      initial_stock: { label: 'Initial', className: 'bg-gray-500' },
    };

    const reasonConfig = config[reason] || { label: reason, className: 'bg-gray-500' };
    return <Badge className={reasonConfig.className}>{reasonConfig.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-gray-400" />
          <p className="text-gray-600 mt-4">Loading product...</p>
        </div>
      </div>
    );
  }

  if (!shopProduct) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 mx-auto text-red-500 mb-4" />
          <h2 className="text-2xl font-bold mb-2">Product Not Found</h2>
          <Link href="/admin/dashboard/website/shop/products">
            <Button>Back to Products</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/dashboard/website/shop/products">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Products
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">{shopProduct.product.name}</h1>
            <p className="text-gray-600">
              {shopProduct.product.sku} • {shopProduct.product.manufacturer}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {shopProduct.featured && <Badge className="bg-yellow-500">Featured</Badge>}
          {shopProduct.isActive ? (
            <Badge className="bg-green-500">Active</Badge>
          ) : (
            <Badge variant="secondary">Inactive</Badge>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Edit Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Pricing */}
          <Card>
            <CardHeader>
              <CardTitle>Pricing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="costPrice">Cost Price *</Label>
                  <Input
                    id="costPrice"
                    type="number"
                    step="0.01"
                    value={costPrice}
                    onChange={(e) => setCostPrice(e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="retailPrice">Retail Price *</Label>
                  <Input
                    id="retailPrice"
                    type="number"
                    step="0.01"
                    value={retailPrice}
                    onChange={(e) => setRetailPrice(e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="salePrice">Sale Price</Label>
                  <Input
                    id="salePrice"
                    type="number"
                    step="0.01"
                    value={salePrice}
                    onChange={(e) => setSalePrice(e.target.value)}
                  />
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Profit Margin:</p>
                    <p className="text-xl font-bold text-blue-600">{calculateMargin()}%</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Profit Amount:</p>
                    <p className="text-xl font-bold text-green-600">
                      ${((parseFloat(retailPrice) || 0) - (parseFloat(costPrice) || 0)).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Inventory */}
          <Card>
            <CardHeader>
              <CardTitle>Inventory</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Track Inventory</Label>
                  <p className="text-sm text-gray-500">Monitor stock levels</p>
                </div>
                <Switch checked={trackInventory} onCheckedChange={setTrackInventory} />
              </div>

              {trackInventory && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="stockQty">Stock Quantity</Label>
                      <Input
                        id="stockQty"
                        type="number"
                        value={stockQty}
                        onChange={(e) => setStockQty(e.target.value)}
                      />
                    </div>

                    <div>
                      <Label htmlFor="lowStockAlert">Low Stock Alert</Label>
                      <Input
                        id="lowStockAlert"
                        type="number"
                        value={lowStockAlert}
                        onChange={(e) => setLowStockAlert(e.target.value)}
                      />
                    </div>

                    <div className="flex items-end">
                      <div className="flex items-center gap-2">
                        <Switch checked={allowBackorder} onCheckedChange={setAllowBackorder} />
                        <Label>Allow Backorder</Label>
                      </div>
                    </div>
                  </div>

                  {parseInt(stockQty) <= parseInt(lowStockAlert) && parseInt(stockQty) > 0 && (
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                      <div className="flex items-center gap-2 text-orange-800">
                        <AlertCircle className="w-4 h-4" />
                        <span className="text-sm font-medium">Low Stock Alert</span>
                      </div>
                    </div>
                  )}

                  {parseInt(stockQty) === 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <div className="flex items-center gap-2 text-red-800">
                        <AlertCircle className="w-4 h-4" />
                        <span className="text-sm font-medium">Out of Stock</span>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Display Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Display Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="category">Category</Label>
                <Select value={categoryId || "none"} onValueChange={(val) => setCategoryId(val === "none" ? "" : val)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Uncategorized</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <Label>Featured Product</Label>
                    <p className="text-sm text-gray-500">Show in featured</p>
                  </div>
                  <Switch checked={featured} onCheckedChange={setFeatured} />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <Label>Active in Shop</Label>
                    <p className="text-sm text-gray-500">Visible to customers</p>
                  </div>
                  <Switch checked={isActive} onCheckedChange={setIsActive} />
                </div>
              </div>

              <div>
                <Label htmlFor="metaTitle">SEO Title</Label>
                <Input
                  id="metaTitle"
                  value={metaTitle}
                  onChange={(e) => setMetaTitle(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="metaDescription">SEO Description</Label>
                <Textarea
                  id="metaDescription"
                  value={metaDescription}
                  onChange={(e) => setMetaDescription(e.target.value)}
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="tags">Tags (comma-separated)</Label>
                <Input
                  id="tags"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          <Button onClick={handleSave} disabled={saving} className="w-full" size="lg">
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>

        {/* Right Column - Info & History */}
        <div className="space-y-6">
          {/* Product Info */}
          <Card>
            <CardHeader>
              <CardTitle>Product Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {shopProduct.product.imageUrl && (
                <img
                  src={shopProduct.product.imageUrl}
                  alt={shopProduct.product.name}
                  className="w-full h-48 object-cover rounded-lg"
                />
              )}
              <div className="space-y-2 text-sm">
                <div>
                  <p className="text-gray-600">SKU:</p>
                  <p className="font-medium">{shopProduct.product.sku}</p>
                </div>
                <div>
                  <p className="text-gray-600">Manufacturer:</p>
                  <p className="font-medium">{shopProduct.product.manufacturer}</p>
                </div>
                <div>
                  <p className="text-gray-600">Type:</p>
                  <p className="font-medium">{shopProduct.product.productType}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stock History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="w-5 h-5" />
                Stock History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {shopProduct.stockHistory.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">No stock history</p>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {shopProduct.stockHistory.map((history) => (
                    <div key={history.id} className="border-b pb-3 last:border-0">
                      <div className="flex items-center justify-between mb-1">
                        {getReasonBadge(history.reason)}
                        <span className={`text-sm font-bold ${history.change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {history.change > 0 ? '+' : ''}{history.change}
                        </span>
                      </div>
                      <div className="text-xs text-gray-600">
                        <p>{history.previousQty} → {history.newQty}</p>
                        <p>{formatDate(history.createdAt)}</p>
                        {history.notes && <p className="italic mt-1">{history.notes}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
