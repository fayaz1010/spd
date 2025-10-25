'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { 
  ArrowLeft,
  AlertTriangle,
  Package,
  TrendingUp,
  TrendingDown,
  Edit3,
  Save,
  Loader2
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function InventoryPage() {
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<any[]>([]);
  const [outOfStockProducts, setOutOfStockProducts] = useState<any[]>([]);
  const [stockHistory, setStockHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [adjustDialogOpen, setAdjustDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [adjustmentQty, setAdjustmentQty] = useState('');
  const [adjustmentReason, setAdjustmentReason] = useState('adjustment');
  const [adjustmentNotes, setAdjustmentNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [allRes, lowRes, outRes] = await Promise.all([
        fetch('/api/admin/shop/stock?type=all'),
        fetch('/api/admin/shop/stock?type=low'),
        fetch('/api/admin/shop/stock?type=out'),
      ]);

      const allData = await allRes.json();
      const lowData = await lowRes.json();
      const outData = await outRes.json();

      setAllProducts(allData);
      setLowStockProducts(lowData);
      setOutOfStockProducts(outData);
    } catch (error) {
      console.error('Error fetching inventory:', error);
      toast.error('Failed to load inventory');
    } finally {
      setLoading(false);
    }
  };

  const openAdjustDialog = (product: any) => {
    setSelectedProduct(product);
    setAdjustmentQty('');
    setAdjustmentReason('adjustment');
    setAdjustmentNotes('');
    setAdjustDialogOpen(true);
  };

  const handleAdjustStock = async () => {
    if (!adjustmentQty || adjustmentQty === '0') {
      toast.error('Please enter a quantity');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/admin/shop/stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shopProductId: selectedProduct.id,
          quantity: parseInt(adjustmentQty),
          reason: adjustmentReason,
          notes: adjustmentNotes,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error);
      }

      toast.success('Stock adjusted successfully');
      setAdjustDialogOpen(false);
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to adjust stock');
    } finally {
      setSaving(false);
    }
  };

  const getStockBadge = (product: any) => {
    if (!product.trackInventory) {
      return <Badge variant="outline">Not Tracked</Badge>;
    }
    if (product.stockQty === 0) {
      return <Badge variant="destructive">Out of Stock</Badge>;
    }
    if (product.stockQty <= product.lowStockAlert) {
      return <Badge className="bg-orange-500">Low Stock</Badge>;
    }
    return <Badge className="bg-green-500">In Stock</Badge>;
  };

  const totalValue = allProducts.reduce((sum, p) => sum + (p.retailPrice * p.stockQty), 0);

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-gray-400" />
          <p className="text-gray-600 mt-4">Loading inventory...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/dashboard/website/shop">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Shop
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Inventory Management</h1>
          <p className="text-gray-600">Track and manage stock levels</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-2 border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-700 font-medium">Total Products</p>
                <p className="text-3xl font-bold text-blue-900">{allProducts.length}</p>
              </div>
              <Package className="w-10 h-10 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-orange-200 bg-orange-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-700 font-medium">Low Stock</p>
                <p className="text-3xl font-bold text-orange-900">{lowStockProducts.length}</p>
              </div>
              <AlertTriangle className="w-10 h-10 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-700 font-medium">Out of Stock</p>
                <p className="text-3xl font-bold text-red-900">{outOfStockProducts.length}</p>
              </div>
              <Package className="w-10 h-10 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-700 font-medium">Total Value</p>
                <p className="text-2xl font-bold text-green-900">${totalValue.toLocaleString()}</p>
              </div>
              <TrendingUp className="w-10 h-10 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Inventory Tabs */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Products ({allProducts.length})</TabsTrigger>
          <TabsTrigger value="low">Low Stock ({lowStockProducts.length})</TabsTrigger>
          <TabsTrigger value="out">Out of Stock ({outOfStockProducts.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <Card>
            <CardHeader>
              <CardTitle>All Products</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Alert Level</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{product.product.name}</p>
                          <p className="text-sm text-gray-500">{product.product.sku}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {product.category ? (
                          <Badge variant="outline">{product.category.name}</Badge>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="font-bold">{product.stockQty}</span>
                      </TableCell>
                      <TableCell>{product.lowStockAlert}</TableCell>
                      <TableCell>${(product.retailPrice * product.stockQty).toFixed(2)}</TableCell>
                      <TableCell>{getStockBadge(product)}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openAdjustDialog(product)}
                        >
                          <Edit3 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="low">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-600" />
                Low Stock Products
              </CardTitle>
            </CardHeader>
            <CardContent>
              {lowStockProducts.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Package className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                  <p>No low stock products</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Stock</TableHead>
                      <TableHead>Alert Level</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lowStockProducts.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell>
                          <p className="font-medium">{product.product.name}</p>
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-orange-500">{product.stockQty}</Badge>
                        </TableCell>
                        <TableCell>{product.lowStockAlert}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openAdjustDialog(product)}
                          >
                            Restock
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="out">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <Package className="w-5 h-5" />
                Out of Stock Products
              </CardTitle>
            </CardHeader>
            <CardContent>
              {outOfStockProducts.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Package className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                  <p>No out of stock products</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {outOfStockProducts.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell>
                          <p className="font-medium">{product.product.name}</p>
                        </TableCell>
                        <TableCell>
                          {product.category?.name || '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openAdjustDialog(product)}
                          >
                            Restock
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Adjust Stock Dialog */}
      <Dialog open={adjustDialogOpen} onOpenChange={setAdjustDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adjust Stock</DialogTitle>
          </DialogHeader>
          {selectedProduct && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="font-medium">{selectedProduct.product.name}</p>
                <p className="text-sm text-gray-600">Current Stock: {selectedProduct.stockQty}</p>
              </div>

              <div>
                <Label htmlFor="quantity">Adjustment Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  value={adjustmentQty}
                  onChange={(e) => setAdjustmentQty(e.target.value)}
                  placeholder="Enter positive or negative number"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Use positive numbers to add stock, negative to reduce
                </p>
              </div>

              <div>
                <Label htmlFor="reason">Reason</Label>
                <select
                  id="reason"
                  value={adjustmentReason}
                  onChange={(e) => setAdjustmentReason(e.target.value)}
                  className="w-full border rounded-md p-2"
                >
                  <option value="restock">Restock</option>
                  <option value="adjustment">Adjustment</option>
                  <option value="damage">Damage</option>
                  <option value="return">Return</option>
                </select>
              </div>

              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={adjustmentNotes}
                  onChange={(e) => setAdjustmentNotes(e.target.value)}
                  placeholder="Optional notes..."
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setAdjustDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAdjustStock} disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Adjust Stock
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
