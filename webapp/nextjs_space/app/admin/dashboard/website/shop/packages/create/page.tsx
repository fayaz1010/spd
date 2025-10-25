'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
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
  Plus,
  Trash2,
  Save,
  Loader2,
  Package,
  Search,
  DollarSign
} from 'lucide-react';
import toast from 'react-hot-toast';

interface ShopProduct {
  id: string;
  costPrice: number;
  retailPrice: number;
  product: {
    id: string;
    name: string;
    sku: string;
    manufacturer: string;
  };
}

interface PackageItem {
  shopProductId: string;
  productName: string;
  quantity: number;
  costPrice: number;
  retailPrice: number;
}

export default function CreatePackagePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [shopProducts, setShopProducts] = useState<ShopProduct[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [slug, setSlug] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [retailPrice, setRetailPrice] = useState('');
  const [discount, setDiscount] = useState('0');
  const [featured, setFeatured] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [tags, setTags] = useState('');

  // Package items
  const [items, setItems] = useState<PackageItem[]>([]);
  const [selectedProductId, setSelectedProductId] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    // Auto-generate slug from name
    if (name) {
      const generatedSlug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      setSlug(generatedSlug);
    }
  }, [name]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        fetch('/api/admin/shop/products'),
        fetch('/api/admin/shop/categories'),
      ]);

      const productsData = await productsRes.json();
      const categoriesData = await categoriesRes.json();

      setShopProducts(productsData);
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const addItem = () => {
    if (!selectedProductId) {
      toast.error('Please select a product');
      return;
    }

    const product = shopProducts.find(p => p.id === selectedProductId);
    if (!product) return;

    // Check if already added
    if (items.some(item => item.shopProductId === selectedProductId)) {
      toast.error('Product already added to package');
      return;
    }

    setItems([...items, {
      shopProductId: product.id,
      productName: product.product.name,
      quantity: 1,
      costPrice: product.costPrice,
      retailPrice: product.retailPrice,
    }]);

    setSelectedProductId('');
  };

  const removeItem = (shopProductId: string) => {
    setItems(items.filter(item => item.shopProductId !== shopProductId));
  };

  const updateQuantity = (shopProductId: string, quantity: number) => {
    setItems(items.map(item =>
      item.shopProductId === shopProductId
        ? { ...item, quantity: Math.max(1, quantity) }
        : item
    ));
  };

  const calculateBaseCost = () => {
    return items.reduce((sum, item) => sum + (item.costPrice * item.quantity), 0);
  };

  const calculateBasePrice = () => {
    return items.reduce((sum, item) => sum + (item.retailPrice * item.quantity), 0);
  };

  const calculateTotalRetail = () => {
    return items.reduce((sum, item) => sum + (item.retailPrice * item.quantity), 0);
  };

  const calculateSavings = () => {
    const totalRetail = calculateTotalRetail();
    const packagePrice = parseFloat(retailPrice) || 0;
    return Math.max(0, totalRetail - packagePrice);
  };

  const calculateDiscountAmount = () => {
    const retail = parseFloat(retailPrice) || 0;
    const discountPercent = parseFloat(discount) || 0;
    return (retail * discountPercent) / 100;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !slug) {
      toast.error('Name and slug are required');
      return;
    }

    if (items.length === 0) {
      toast.error('Please add at least one product to the package');
      return;
    }

    if (!retailPrice) {
      toast.error('Retail price is required');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/admin/shop/packages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description,
          slug,
          categoryId: categoryId || null,
          basePrice: calculateBasePrice(),
          retailPrice: parseFloat(retailPrice),
          discount: parseFloat(discount),
          featured,
          isActive,
          metaTitle,
          metaDescription,
          tags: tags ? tags.split(',').map(t => t.trim()) : [],
          items: items.map(item => ({
            shopProductId: item.shopProductId,
            quantity: item.quantity,
          })),
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error);
      }

      toast.success('Package created successfully!');
      router.push('/admin/dashboard/website/shop/packages');
    } catch (error: any) {
      toast.error(error.message || 'Failed to create package');
    } finally {
      setSaving(false);
    }
  };

  const filteredProducts = shopProducts.filter(p =>
    p.product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.product.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/dashboard/website/shop/packages">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Packages
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Create Product Package</h1>
          <p className="text-gray-600">Bundle multiple products together</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Package Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="name">Package Name *</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Solar Starter Bundle"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="slug">URL Slug *</Label>
                  <Input
                    id="slug"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="solar-starter-bundle"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Auto-generated from name, can be edited
                  </p>
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe this package..."
                    rows={4}
                  />
                </div>

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
              </CardContent>
            </Card>
          </div>

          {/* Package Items */}
          <Card>
            <CardHeader>
              <CardTitle>Package Items</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add Product */}
              <div className="flex gap-2">
                <div className="flex-1">
                  <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select product to add" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredProducts.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.product.name} - ${product.retailPrice}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button type="button" onClick={addItem}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add
                </Button>
              </div>

              {/* Items Table */}
              {items.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Cost</TableHead>
                      <TableHead>Retail</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item) => (
                      <TableRow key={item.shopProductId}>
                        <TableCell>{item.productName}</TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updateQuantity(item.shopProductId, parseInt(e.target.value))}
                            className="w-20"
                          />
                        </TableCell>
                        <TableCell>${item.costPrice.toFixed(2)}</TableCell>
                        <TableCell>${item.retailPrice.toFixed(2)}</TableCell>
                        <TableCell className="font-medium">
                          ${(item.retailPrice * item.quantity).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeItem(item.shopProductId)}
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-center text-gray-500 py-8">
                  No items added yet. Select products above to add to this package.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Pricing */}
          <Card>
            <CardHeader>
              <CardTitle>Pricing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-gray-50 border rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total Base Cost:</span>
                  <span className="font-medium">${calculateBaseCost().toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total Retail Value:</span>
                  <span className="font-medium">${calculateBasePrice().toFixed(2)}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="retailPrice">Package Retail Price *</Label>
                  <Input
                    id="retailPrice"
                    type="number"
                    step="0.01"
                    value={retailPrice}
                    onChange={(e) => setRetailPrice(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="discount">Discount (%)</Label>
                  <Input
                    id="discount"
                    type="number"
                    step="0.1"
                    value={discount}
                    onChange={(e) => setDiscount(e.target.value)}
                  />
                </div>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <span className="text-green-800 font-medium">Customer Savings:</span>
                  <span className="text-2xl font-bold text-green-600">
                    ${calculateSavings().toFixed(2)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Display Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Display Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <Label>Featured Package</Label>
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
                  placeholder="solar, battery, bundle"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Save Button */}
        <div className="flex justify-end gap-3">
          <Link href="/admin/dashboard/website/shop/packages">
            <Button variant="outline" type="button">
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Create Package
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
