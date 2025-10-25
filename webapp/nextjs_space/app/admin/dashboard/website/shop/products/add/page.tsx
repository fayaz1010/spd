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
  ArrowLeft,
  Search,
  Plus,
  Loader2,
  AlertCircle,
  CheckCircle,
  Package
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Product {
  id: string;
  name: string;
  sku: string;
  manufacturer: string;
  productType: string;
  isAvailable: boolean;
  imageUrl?: string;
  SupplierProduct: Array<{
    unitCost: number;
    retailPrice: number;
    supplier: {
      name: string;
    };
  }>;
}

export default function AddShopProductPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  // Get productId from URL if provided
  const searchParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
  const preselectedProductId = searchParams.get('productId');

  // Form state
  const [costPrice, setCostPrice] = useState('');
  const [retailPrice, setRetailPrice] = useState('');
  const [salePrice, setSalePrice] = useState('');
  const [commission, setCommission] = useState('0');
  const [stockQty, setStockQty] = useState('0');
  const [lowStockAlert, setLowStockAlert] = useState('5');
  const [trackInventory, setTrackInventory] = useState(true);
  const [allowBackorder, setAllowBackorder] = useState(false);
  const [categoryId, setCategoryId] = useState('');
  const [featured, setFeatured] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [tags, setTags] = useState('');

  useEffect(() => {
    fetchCategories();
    // If productId is provided, load and select that product
    if (preselectedProductId) {
      loadPreselectedProduct(preselectedProductId);
    }
  }, []);

  useEffect(() => {
    if (searchTerm.length >= 2) {
      searchProducts();
    } else {
      setProducts([]);
    }
  }, [searchTerm]);

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/admin/shop/categories');
      const data = await res.json();
      setCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const loadPreselectedProduct = async (productId: string) => {
    try {
      setLoading(true);
      // Fetch the specific product
      const res = await fetch(`/api/admin/products?search=${productId}`);
      const data = await res.json();
      
      // Find the product by ID
      const product = data.find((p: Product) => p.id === productId);
      
      if (product) {
        // Check if already in shop
        const shopRes = await fetch('/api/admin/shop/products');
        const shopProducts = await shopRes.json();
        const alreadyInShop = shopProducts.some((p: any) => p.productId === productId);
        
        if (alreadyInShop) {
          toast.error('This product is already in the shop!');
          router.push('/admin/dashboard/website/shop/products');
          return;
        }
        
        // Auto-select the product
        selectProduct(product);
      } else {
        toast.error('Product not found');
      }
    } catch (error) {
      console.error('Error loading product:', error);
      toast.error('Failed to load product');
    } finally {
      setLoading(false);
    }
  };

  const searchProducts = async () => {
    setSearching(true);
    try {
      const res = await fetch(`/api/admin/products?search=${encodeURIComponent(searchTerm)}`);
      const data = await res.json();
      
      // Filter out products already in shop
      const shopRes = await fetch('/api/admin/shop/products');
      const shopProducts = await shopRes.json();
      const shopProductIds = shopProducts.map((p: any) => p.productId);
      
      const availableProducts = data.filter((p: Product) => !shopProductIds.includes(p.id));
      setProducts(availableProducts);
    } catch (error) {
      console.error('Error searching products:', error);
      toast.error('Failed to search products');
    } finally {
      setSearching(false);
    }
  };

  const selectProduct = (product: Product) => {
    setSelectedProduct(product);
    
    // Auto-fill prices from supplier data if available
    if (product.SupplierProduct && product.SupplierProduct.length > 0) {
      const supplierProduct = product.SupplierProduct[0];
      setCostPrice(supplierProduct.unitCost.toString());
      setRetailPrice(supplierProduct.retailPrice.toString());
      
      // Calculate commission
      const calc = ((supplierProduct.retailPrice - supplierProduct.unitCost) / supplierProduct.retailPrice * 100);
      setCommission(calc.toFixed(2));
    }
    
    // Auto-fill meta from product name
    setMetaTitle(product.name);
    setMetaDescription(`${product.name} by ${product.manufacturer}. High-quality ${product.productType.toLowerCase()} for solar installations.`);
  };

  const calculateMargin = () => {
    const cost = parseFloat(costPrice) || 0;
    const retail = parseFloat(retailPrice) || 0;
    if (retail === 0) return '0';
    return (((retail - cost) / retail) * 100).toFixed(1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedProduct) {
      toast.error('Please select a product');
      return;
    }

    if (!costPrice || !retailPrice) {
      toast.error('Cost price and retail price are required');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/admin/shop/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: selectedProduct.id,
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

      toast.success('Product added to shop successfully!');
      router.push('/admin/dashboard/website/shop/products');
    } catch (error: any) {
      toast.error(error.message || 'Failed to add product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/dashboard/website/shop/products">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Products
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Add Product to Shop</h1>
          <p className="text-gray-600">Select a product from inventory and configure shop settings</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Product Selection */}
        <Card className="border-2 border-blue-200">
          <CardHeader className="bg-blue-50">
            <CardTitle>Step 1: Select Product from Inventory</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div>
              <Label>Search Products</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search by name, SKU, or manufacturer..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Type at least 2 characters to search
              </p>
            </div>

            {searching && (
              <div className="text-center py-4">
                <Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-400" />
                <p className="text-sm text-gray-500 mt-2">Searching products...</p>
              </div>
            )}

            {!searching && products.length > 0 && (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {products.map((product) => (
                  <div
                    key={product.id}
                    onClick={() => selectProduct(product)}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      selectedProduct?.id === product.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {product.imageUrl ? (
                          <img src={product.imageUrl} alt={product.name} className="w-12 h-12 object-cover rounded" />
                        ) : (
                          <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
                            <Package className="w-6 h-6 text-gray-400" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium">{product.name}</p>
                          <p className="text-sm text-gray-500">
                            {product.sku} • {product.manufacturer} • {product.productType}
                          </p>
                          {product.SupplierProduct && product.SupplierProduct.length > 0 && (
                            <p className="text-sm text-gray-600 mt-1">
                              Cost: ${product.SupplierProduct[0].unitCost} • 
                              Retail: ${product.SupplierProduct[0].retailPrice}
                            </p>
                          )}
                        </div>
                      </div>
                      {selectedProduct?.id === product.id && (
                        <CheckCircle className="w-6 h-6 text-blue-600" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!searching && searchTerm.length >= 2 && products.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <AlertCircle className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                <p>No available products found</p>
                <p className="text-sm">All matching products may already be in the shop</p>
              </div>
            )}

            {selectedProduct && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <p className="font-medium text-green-900">Selected Product:</p>
                </div>
                <p className="text-sm text-green-800">{selectedProduct.name}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {selectedProduct && (
          <>
            {/* Pricing */}
            <Card>
              <CardHeader>
                <CardTitle>Step 2: Set Pricing</CardTitle>
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
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">What you pay</p>
                  </div>

                  <div>
                    <Label htmlFor="retailPrice">Retail Price *</Label>
                    <Input
                      id="retailPrice"
                      type="number"
                      step="0.01"
                      value={retailPrice}
                      onChange={(e) => setRetailPrice(e.target.value)}
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">Customer pays</p>
                  </div>

                  <div>
                    <Label htmlFor="salePrice">Sale Price (Optional)</Label>
                    <Input
                      id="salePrice"
                      type="number"
                      step="0.01"
                      value={salePrice}
                      onChange={(e) => setSalePrice(e.target.value)}
                    />
                    <p className="text-xs text-gray-500 mt-1">Discounted price</p>
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
                <CardTitle>Step 3: Configure Inventory</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Track Inventory</Label>
                    <p className="text-sm text-gray-500">Monitor stock levels for this product</p>
                  </div>
                  <Switch checked={trackInventory} onCheckedChange={setTrackInventory} />
                </div>

                {trackInventory && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="stockQty">Initial Stock Quantity</Label>
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
                      <p className="text-xs text-gray-500 mt-1">Alert when stock reaches this level</p>
                    </div>

                    <div className="flex items-end">
                      <div className="flex items-center gap-2">
                        <Switch checked={allowBackorder} onCheckedChange={setAllowBackorder} />
                        <Label>Allow Backorder</Label>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Display Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Step 4: Display Settings</CardTitle>
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
                      <p className="text-sm text-gray-500">Show in featured section</p>
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
                    placeholder="Product title for search engines"
                  />
                </div>

                <div>
                  <Label htmlFor="metaDescription">SEO Description</Label>
                  <Textarea
                    id="metaDescription"
                    value={metaDescription}
                    onChange={(e) => setMetaDescription(e.target.value)}
                    placeholder="Product description for search engines"
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="tags">Tags (comma-separated)</Label>
                  <Input
                    id="tags"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    placeholder="solar, panel, high-efficiency"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex items-center justify-end gap-4">
              <Link href="/admin/dashboard/website/shop/products">
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Add to Shop
                  </>
                )}
              </Button>
            </div>
          </>
        )}
      </form>
    </div>
  );
}
