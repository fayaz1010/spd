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
  Layers,
  Star,
  Package
} from 'lucide-react';
import toast from 'react-hot-toast';

interface ShopPackage {
  id: string;
  name: string;
  slug: string;
  basePrice: number;
  retailPrice: number;
  discount: number;
  featured: boolean;
  isActive: boolean;
  category: {
    id: string;
    name: string;
  } | null;
  items: Array<{
    id: string;
    quantity: number;
    shopProduct: {
      product: {
        name: string;
      };
    };
  }>;
}

export default function PackagesPage() {
  const [packages, setPackages] = useState<ShopPackage[]>([]);
  const [filteredPackages, setFilteredPackages] = useState<ShopPackage[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filterPackages();
  }, [searchTerm, categoryFilter, packages]);

  const fetchData = async () => {
    try {
      const [packagesRes, categoriesRes] = await Promise.all([
        fetch('/api/admin/shop/packages?includeInactive=true'),
        fetch('/api/admin/shop/categories'),
      ]);

      const packagesData = await packagesRes.json();
      const categoriesData = await categoriesRes.json();

      setPackages(packagesData);
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load packages');
    } finally {
      setLoading(false);
    }
  };

  const filterPackages = () => {
    let filtered = [...packages];

    if (searchTerm) {
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.slug.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(p => p.category?.id === categoryFilter);
    }

    setFilteredPackages(filtered);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this package?')) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/shop/packages/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error);
      }

      toast.success('Package deleted');
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete package');
    }
  };

  const calculateSavings = (pkg: ShopPackage) => {
    if (pkg.discount === 0) return 0;
    return ((pkg.basePrice * pkg.discount) / 100).toFixed(2);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <p className="text-gray-600">Loading packages...</p>
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
            <h1 className="text-3xl font-bold">Product Packages</h1>
            <p className="text-gray-600">Create and manage product bundles</p>
          </div>
        </div>
        <Link href="/admin/dashboard/website/shop/packages/create">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Create Package
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold">{packages.length}</p>
              <p className="text-sm text-gray-600">Total Packages</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {packages.filter(p => p.isActive).length}
              </p>
              <p className="text-sm text-gray-600">Active</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-600">
                {packages.filter(p => p.featured).length}
              </p>
              <p className="text-sm text-gray-600">Featured</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">
                {packages.reduce((sum, p) => sum + p.items.length, 0)}
              </p>
              <p className="text-sm text-gray-600">Total Items</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search packages..."
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

            <Button variant="outline" onClick={() => {
              setSearchTerm('');
              setCategoryFilter('all');
            }}>
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Packages Table */}
      <Card>
        <CardHeader>
          <CardTitle>Packages ({filteredPackages.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Package</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Base Price</TableHead>
                <TableHead>Retail Price</TableHead>
                <TableHead>Discount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPackages.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                    No packages found
                  </TableCell>
                </TableRow>
              ) : (
                filteredPackages.map((pkg) => (
                  <TableRow key={pkg.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {pkg.featured && <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />}
                        <div>
                          <p className="font-medium">{pkg.name}</p>
                          <p className="text-sm text-gray-500">{pkg.slug}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {pkg.category ? (
                        <Badge variant="outline">{pkg.category.name}</Badge>
                      ) : (
                        <span className="text-gray-400">Uncategorized</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Package className="w-4 h-4 text-gray-400" />
                        <span>{pkg.items.length} items</span>
                      </div>
                    </TableCell>
                    <TableCell>${pkg.basePrice.toFixed(2)}</TableCell>
                    <TableCell>
                      <p className="font-medium">${pkg.retailPrice.toFixed(2)}</p>
                    </TableCell>
                    <TableCell>
                      {pkg.discount > 0 ? (
                        <div>
                          <Badge className="bg-green-500">{pkg.discount}% OFF</Badge>
                          <p className="text-xs text-gray-500 mt-1">
                            Save ${calculateSavings(pkg)}
                          </p>
                        </div>
                      ) : (
                        <span className="text-gray-400">No discount</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {pkg.isActive ? (
                        <Badge className="bg-green-500">Active</Badge>
                      ) : (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/admin/dashboard/website/shop/packages/${pkg.id}`}>
                          <Button variant="outline" size="sm">
                            <Edit className="w-4 h-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(pkg.id)}
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
