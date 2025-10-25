'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  ArrowLeft,
  Save,
  Loader2,
  Store,
  Truck,
  DollarSign,
  CreditCard,
  Package,
  Bell,
  RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function ShopSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Store Info
  const [storeName, setStoreName] = useState('');
  const [storeEmail, setStoreEmail] = useState('');
  const [storePhone, setStorePhone] = useState('');
  const [storeAddress, setStoreAddress] = useState('');

  // Shipping
  const [freeShippingThreshold, setFreeShippingThreshold] = useState('');
  const [flatShippingRate, setFlatShippingRate] = useState('');
  const [expressShippingRate, setExpressShippingRate] = useState('');

  // Tax
  const [taxRate, setTaxRate] = useState('');
  const [taxIncluded, setTaxIncluded] = useState(false);

  // Payment
  const [stripeEnabled, setStripeEnabled] = useState(true);
  const [paypalEnabled, setPaypalEnabled] = useState(false);
  const [cashOnDelivery, setCashOnDelivery] = useState(false);

  // Inventory
  const [lowStockAlert, setLowStockAlert] = useState('');
  const [outOfStockBehavior, setOutOfStockBehavior] = useState('hide');

  // Display
  const [productsPerPage, setProductsPerPage] = useState('');
  const [showOutOfStock, setShowOutOfStock] = useState(false);

  // Notifications
  const [orderNotificationEmail, setOrderNotificationEmail] = useState('');
  const [lowStockNotificationEmail, setLowStockNotificationEmail] = useState('');
  
  // Sync settings
  const [defaultMargin, setDefaultMargin] = useState('30');
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/admin/shop/settings');
      const data = await res.json();

      setStoreName(data.storeName || '');
      setStoreEmail(data.storeEmail || '');
      setStorePhone(data.storePhone || '');
      setStoreAddress(data.storeAddress || '');
      setFreeShippingThreshold(data.freeShippingThreshold?.toString() || '100');
      setFlatShippingRate(data.flatShippingRate?.toString() || '15');
      setExpressShippingRate(data.expressShippingRate?.toString() || '25');
      setTaxRate(data.taxRate?.toString() || '10');
      setTaxIncluded(data.taxIncluded || false);
      setStripeEnabled(data.stripeEnabled !== undefined ? data.stripeEnabled : true);
      setPaypalEnabled(data.paypalEnabled || false);
      setCashOnDelivery(data.cashOnDelivery || false);
      setLowStockAlert(data.lowStockAlert?.toString() || '5');
      setOutOfStockBehavior(data.outOfStockBehavior || 'hide');
      setProductsPerPage(data.productsPerPage?.toString() || '12');
      setShowOutOfStock(data.showOutOfStock || false);
      setOrderNotificationEmail(data.orderNotificationEmail || '');
      setLowStockNotificationEmail(data.lowStockNotificationEmail || '');
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/shop/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeName,
          storeEmail,
          storePhone,
          storeAddress,
          freeShippingThreshold: parseFloat(freeShippingThreshold),
          flatShippingRate: parseFloat(flatShippingRate),
          expressShippingRate: parseFloat(expressShippingRate),
          taxRate: parseFloat(taxRate),
          taxIncluded,
          stripeEnabled,
          paypalEnabled,
          cashOnDelivery,
          lowStockAlert: parseInt(lowStockAlert),
          outOfStockBehavior,
          productsPerPage: parseInt(productsPerPage),
          showOutOfStock,
          orderNotificationEmail,
          lowStockNotificationEmail,
        }),
      });

      if (!res.ok) throw new Error('Failed to save settings');

      toast.success('Settings saved successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleSync = async () => {
    if (!confirm('This will sync all products from your catalog to the shop. Continue?')) {
      return;
    }

    setSyncing(true);
    try {
      const res = await fetch('/api/admin/shop/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          defaultMargin: parseFloat(defaultMargin),
        }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Failed to sync products');

      toast.success(data.message);
    } catch (error: any) {
      toast.error(error.message || 'Failed to sync products');
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-gray-400" />
          <p className="text-gray-600 mt-4">Loading settings...</p>
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
            <h1 className="text-3xl font-bold">Shop Settings</h1>
            <p className="text-gray-600">Configure your online store</p>
          </div>
        </div>
      </div>

      {/* Product Sync Section */}
      <Card className="mb-6 border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5" />
            Product Catalog Sync
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-700">
            Automatically sync all products from your product catalog to the shop. 
            Products will use supplier pricing with your default margin. 
            Use the "Show in Shop" toggle in product settings to control visibility.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="defaultMargin">Default Margin (%)</Label>
              <Input
                id="defaultMargin"
                type="number"
                step="0.1"
                value={defaultMargin}
                onChange={(e) => setDefaultMargin(e.target.value)}
              />
              <p className="text-xs text-gray-500 mt-1">
                Applied to cost price when supplier has no retail price
              </p>
            </div>
            
            <div className="flex items-end">
              <Button 
                onClick={handleSync} 
                disabled={syncing}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {syncing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Syncing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Sync All Products
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="bg-white border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-sm mb-2">How it works:</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• All products from catalog are synced to shop</li>
              <li>• Pricing pulled from supplier data automatically</li>
              <li>• Stock levels synced from suppliers</li>
              <li>• Products with "Show in Shop" = false are hidden</li>
              <li>• Existing products are updated with latest pricing</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Store Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Store className="w-5 h-5" />
              Store Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="storeName">Store Name</Label>
              <Input
                id="storeName"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="storeEmail">Store Email</Label>
              <Input
                id="storeEmail"
                type="email"
                value={storeEmail}
                onChange={(e) => setStoreEmail(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="storePhone">Store Phone</Label>
              <Input
                id="storePhone"
                value={storePhone}
                onChange={(e) => setStorePhone(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="storeAddress">Store Address</Label>
              <Input
                id="storeAddress"
                value={storeAddress}
                onChange={(e) => setStoreAddress(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Shipping Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="w-5 h-5" />
              Shipping Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="freeShippingThreshold">Free Shipping Threshold ($)</Label>
              <Input
                id="freeShippingThreshold"
                type="number"
                step="0.01"
                value={freeShippingThreshold}
                onChange={(e) => setFreeShippingThreshold(e.target.value)}
              />
              <p className="text-xs text-gray-500 mt-1">Orders above this amount get free shipping</p>
            </div>
            <div>
              <Label htmlFor="flatShippingRate">Flat Shipping Rate ($)</Label>
              <Input
                id="flatShippingRate"
                type="number"
                step="0.01"
                value={flatShippingRate}
                onChange={(e) => setFlatShippingRate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="expressShippingRate">Express Shipping Rate ($)</Label>
              <Input
                id="expressShippingRate"
                type="number"
                step="0.01"
                value={expressShippingRate}
                onChange={(e) => setExpressShippingRate(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Tax Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Tax Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="taxRate">Tax Rate (%)</Label>
              <Input
                id="taxRate"
                type="number"
                step="0.1"
                value={taxRate}
                onChange={(e) => setTaxRate(e.target.value)}
              />
              <p className="text-xs text-gray-500 mt-1">GST/VAT rate (e.g., 10 for 10%)</p>
            </div>
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <Label>Tax Included in Prices</Label>
                <p className="text-sm text-gray-500">Prices already include tax</p>
              </div>
              <Switch checked={taxIncluded} onCheckedChange={setTaxIncluded} />
            </div>
          </CardContent>
        </Card>

        {/* Payment Methods */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Payment Methods
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <Label>Stripe</Label>
                <p className="text-sm text-gray-500">Accept credit/debit cards</p>
              </div>
              <Switch checked={stripeEnabled} onCheckedChange={setStripeEnabled} />
            </div>
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <Label>PayPal</Label>
                <p className="text-sm text-gray-500">Accept PayPal payments</p>
              </div>
              <Switch checked={paypalEnabled} onCheckedChange={setPaypalEnabled} />
            </div>
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <Label>Cash on Delivery</Label>
                <p className="text-sm text-gray-500">Pay when receiving order</p>
              </div>
              <Switch checked={cashOnDelivery} onCheckedChange={setCashOnDelivery} />
            </div>
          </CardContent>
        </Card>

        {/* Inventory Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Inventory Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="lowStockAlert">Low Stock Alert Threshold</Label>
              <Input
                id="lowStockAlert"
                type="number"
                value={lowStockAlert}
                onChange={(e) => setLowStockAlert(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="outOfStockBehavior">Out of Stock Behavior</Label>
              <Select value={outOfStockBehavior} onValueChange={setOutOfStockBehavior}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hide">Hide Product</SelectItem>
                  <SelectItem value="show">Show as Out of Stock</SelectItem>
                  <SelectItem value="backorder">Allow Backorder</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <Label>Show Out of Stock Products</Label>
                <p className="text-sm text-gray-500">Display unavailable items</p>
              </div>
              <Switch checked={showOutOfStock} onCheckedChange={setShowOutOfStock} />
            </div>
          </CardContent>
        </Card>

        {/* Display Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Display Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="productsPerPage">Products Per Page</Label>
              <Input
                id="productsPerPage"
                type="number"
                value={productsPerPage}
                onChange={(e) => setProductsPerPage(e.target.value)}
              />
              <p className="text-xs text-gray-500 mt-1">Number of products to show per page</p>
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Notification Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="orderNotificationEmail">Order Notification Email</Label>
                <Input
                  id="orderNotificationEmail"
                  type="email"
                  value={orderNotificationEmail}
                  onChange={(e) => setOrderNotificationEmail(e.target.value)}
                  placeholder="orders@example.com"
                />
                <p className="text-xs text-gray-500 mt-1">Receive notifications for new orders</p>
              </div>
              <div>
                <Label htmlFor="lowStockNotificationEmail">Low Stock Notification Email</Label>
                <Input
                  id="lowStockNotificationEmail"
                  type="email"
                  value={lowStockNotificationEmail}
                  onChange={(e) => setLowStockNotificationEmail(e.target.value)}
                  placeholder="inventory@example.com"
                />
                <p className="text-xs text-gray-500 mt-1">Receive low stock alerts</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} size="lg">
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Settings
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
