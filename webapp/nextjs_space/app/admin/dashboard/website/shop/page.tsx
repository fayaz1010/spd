'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Package, 
  ShoppingBag, 
  FolderTree, 
  Settings, 
  Plus,
  TrendingUp,
  DollarSign,
  AlertTriangle,
  ArrowLeft,
  Box,
  Layers,
  BarChart3,
  PackageOpen
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Stats {
  totalProducts: number;
  activePackages: number;
  lowStockItems: number;
  totalValue: number;
  categories: number;
}

export default function ShopManagementPage() {
  const [stats, setStats] = useState<Stats>({
    totalProducts: 0,
    activePackages: 0,
    lowStockItems: 0,
    totalValue: 0,
    categories: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [products, packages, lowStock, categories] = await Promise.all([
        fetch('/api/admin/shop/products').then(r => r.json()),
        fetch('/api/admin/shop/packages').then(r => r.json()),
        fetch('/api/admin/shop/stock?type=low').then(r => r.json()),
        fetch('/api/admin/shop/categories').then(r => r.json()),
      ]);

      const totalValue = products.reduce((sum: number, p: any) => 
        sum + (p.retailPrice * p.stockQty), 0
      );

      setStats({
        totalProducts: products.length,
        activePackages: packages.filter((p: any) => p.isActive).length,
        lowStockItems: lowStock.length,
        totalValue,
        categories: categories.length,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
      toast.error('Failed to load statistics');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/dashboard/website">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Website
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Shop Management</h1>
            <p className="text-gray-600">Manage products, packages, categories, and inventory</p>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="border-2 border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-700 font-medium">Total Products</p>
                <p className="text-3xl font-bold text-blue-900">{stats.totalProducts}</p>
                <p className="text-xs text-blue-600 mt-1">In shop</p>
              </div>
              <Package className="w-10 h-10 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-2 border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-700 font-medium">Active Packages</p>
                <p className="text-3xl font-bold text-green-900">{stats.activePackages}</p>
                <p className="text-xs text-green-600 mt-1">Product bundles</p>
              </div>
              <ShoppingBag className="w-10 h-10 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-2 border-orange-200 bg-orange-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-700 font-medium">Low Stock</p>
                <p className="text-3xl font-bold text-orange-900">{stats.lowStockItems}</p>
                <p className="text-xs text-orange-600 mt-1">Need restock</p>
              </div>
              <AlertTriangle className="w-10 h-10 text-orange-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-2 border-purple-200 bg-purple-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-700 font-medium">Inventory Value</p>
                <p className="text-2xl font-bold text-purple-900">${Math.round(stats.totalValue).toLocaleString()}</p>
                <p className="text-xs text-purple-600 mt-1">Total stock value</p>
              </div>
              <DollarSign className="w-10 h-10 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-indigo-200 bg-indigo-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-indigo-700 font-medium">Categories</p>
                <p className="text-3xl font-bold text-indigo-900">{stats.categories}</p>
                <p className="text-xs text-indigo-600 mt-1">Active categories</p>
              </div>
              <FolderTree className="w-10 h-10 text-indigo-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Link href="/admin/dashboard/website/shop/products">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-blue-500">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Box className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">Manage Products</CardTitle>
                  <CardDescription>Add, edit, and organize products</CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/admin/dashboard/website/shop/packages">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-green-500">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-100 rounded-lg">
                  <Layers className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">Product Packages</CardTitle>
                  <CardDescription>Create and manage bundles</CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/admin/dashboard/website/shop/categories">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-purple-500">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <FolderTree className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">Categories</CardTitle>
                  <CardDescription>Organize product categories</CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/admin/dashboard/website/shop/inventory">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-orange-500">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-orange-100 rounded-lg">
                  <BarChart3 className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">Inventory</CardTitle>
                  <CardDescription>Track stock and history</CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>
        </Link>
      </div>

      {/* Additional Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link href="/admin/dashboard/website/orders">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <PackageOpen className="w-8 h-8 text-blue-600" />
                  <div>
                    <CardTitle>Shop Orders</CardTitle>
                    <CardDescription>View and manage customer orders</CardDescription>
                  </div>
                </div>
                <Badge>View</Badge>
              </div>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/admin/dashboard/website/shop/settings">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Settings className="w-8 h-8 text-gray-600" />
                  <div>
                    <CardTitle>Shop Settings</CardTitle>
                    <CardDescription>Configure shipping, tax, and payments</CardDescription>
                  </div>
                </div>
                <Badge variant="outline">Configure</Badge>
              </div>
            </CardHeader>
          </Card>
        </Link>
      </div>

      {/* Help Section */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg text-gray-900 mb-2">
                Getting Started with Shop Management
              </h3>
              <p className="text-gray-700 text-sm mb-4">
                Set up your online shop in a few simple steps:
              </p>
              <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
                <li><strong>Create Categories</strong> - Organize your products into categories</li>
                <li><strong>Add Products</strong> - Add products from your inventory to the shop</li>
                <li><strong>Set Pricing</strong> - Configure cost, retail prices, and commissions</li>
                <li><strong>Create Packages</strong> - Bundle products together for special offers</li>
                <li><strong>Manage Inventory</strong> - Track stock levels and set low stock alerts</li>
                <li><strong>Configure Settings</strong> - Set up shipping, tax, and payment options</li>
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
