'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  ArrowLeft,
  Plus,
  Search,
  Edit,
  Trash2,
  Package,
  AlertCircle,
  CheckCircle,
  Star,
  TrendingUp
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
  featured: boolean;
  isActive: boolean;
  product: {
    id: string;
    name: string;
    sku: string;
    manufacturer: string;
    productType: string;
  };
  category: {
    id: string;
    name: string;
  } | null;
}

export default function ShopProductsPage() {
  const [products, setProducts] = useState<ShopProduct[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<ShopProduct[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [searchTerm, categoryFilter, stockFilter, products]);

  const fetchData = async () => {
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        fetch('/api/admin/shop/products?includeInactive=true'),
        fetch('/api/admin/shop/categories'),
      ]);

      const productsData = await productsRes.json();
      const categoriesData = await categoriesRes.json();

      setProducts(productsData);
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const filterProducts = () => {
    let filtered = [...products];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(p =>
        p.product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.product.manufacturer.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(p => p.category?.id === categoryFilter);
    }

    // Stock filter
    if (stockFilter === 'low') {
      filtered = filtered.filter(p => p.trackInventory && p.stockQty <= p.lowStockAlert && p.stockQty > 0);
    } else if (stockFilter === 'out') {
      filtered = filtered.filter(p => p.trackInventory && p.stockQty === 0);
    } else if (stockFilter === 'in') {
      filtered = filtered.filter(p => !p.trackInventory || p.stockQty > p.lowStockAlert);
    }

    setFilteredProducts(filtered);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this product from the shop?')) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/shop/products/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error);
      }

      toast.success('Product removed from shop');
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to remove product');
    }
  };

  const getStockBadge = (product: ShopProduct) => {
    if (!product.trackInventory) {
      return <Badge variant="outline">Not Tracked</Badge>;
    }

    if (product.stockQty === 0) {
      return <Badge variant="destructive">Out of Stock</Badge>;
    }

    if (product.stockQty <= product.lowStockAlert) {
      return <Badge className="bg-orange-500">Low Stock ({product.stockQty})</Badge>;
    }

    return <Badge className="bg-green-500">In Stock ({product.stockQty})</Badge>;
  };

  const calculateMargin = (product: ShopProduct) => {
    const price = product.salePrice || product.retailPrice;
    const margin = ((price - product.costPrice) / price) * 100;
    return margin.toFixed(1);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <p className="text-gray-600">Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/dashboard/website/shop">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Shop
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Shop Products</h1>
            <p className="text-gray-600">Manage products in your online shop</p>
          </div>
        </div>
        <Link href="/admin/dashboard/website/shop/products/add">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add Product
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold">{products.length}</p>
              <p className="text-sm text-gray-600">Total Products</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {products.filter(p => p.isActive).length}
              </p>
              <p className="text-sm text-gray-600">Active</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-600">
                {products.filter(p => p.trackInventory && p.stockQty <= p.lowStockAlert && p.stockQty > 0).length}
              </p>
              <p className="text-sm text-gray-600">Low Stock</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">
                {products.filter(p => p.featured).length}
              </p>
              <p className="text-sm text-gray-600">Featured</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={stockFilter} onValueChange={setStockFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Stock Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stock Status</SelectItem>
                <SelectItem value="in">In Stock</SelectItem>
                <SelectItem value="low">Low Stock</SelectItem>
                <SelectItem value="out">Out of Stock</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" onClick={() => {
              setSearchTerm('');
              setCategoryFilter('all');
              setStockFilter('all');
            }}>
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle>Products ({filteredProducts.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Cost</TableHead>
                <TableHead>Retail</TableHead>
                <TableHead>Margin</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                    No products found
                  </TableCell>
                </TableRow>
              ) : (
                filteredProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {product.featured && <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />}
                        <div>
                          <p className="font-medium">{product.product.name}</p>
                          <p className="text-sm text-gray-500">{product.product.sku}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {product.category ? (
                        <Badge variant="outline">{product.category.name}</Badge>
                      ) : (
                        <span className="text-gray-400">Uncategorized</span>
                      )}
                    </TableCell>
                    <TableCell>${product.costPrice.toFixed(2)}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">${product.retailPrice.toFixed(2)}</p>
                        {product.salePrice && (
                          <p className="text-sm text-green-600">Sale: ${product.salePrice.toFixed(2)}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{calculateMargin(product)}%</Badge>
                    </TableCell>
                    <TableCell>{getStockBadge(product)}</TableCell>
                    <TableCell>
                      {product.isActive ? (
                        <Badge className="bg-green-500">Active</Badge>
                      ) : (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/admin/dashboard/website/shop/products/${product.id}`}>
                          <Button variant="outline" size="sm">
                            <Edit className="w-4 h-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(product.id)}
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
