'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Package,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  X,
  Save,
  Loader2,
  CheckCircle,
  XCircle,
  ArrowLeft,
  Link as LinkIcon,
  Wrench,
  BookOpen,
  ShoppingCart,
} from 'lucide-react';
import ProductSuppliersModal from '@/components/admin/ProductSuppliersModal';
import ProductInstallationModal from '@/components/admin/ProductInstallationModal';
import DocumentationModal from '@/components/admin/DocumentationModal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

// Product Types
const PRODUCT_TYPES = [
  { value: 'PANEL', label: 'Solar Panel' },
  { value: 'INVERTER', label: 'Inverter' },
  { value: 'BATTERY', label: 'Battery' },
  { value: 'RAILING', label: 'Railing' },
  { value: 'CABLE_DC', label: 'DC Cable' },
  { value: 'CABLE_AC', label: 'AC Cable' },
  { value: 'MOUNTING_HARDWARE', label: 'Mounting Hardware' },
  { value: 'OPTIMIZERS', label: 'Optimizers' },
  { value: 'MONITORING_SYSTEM', label: 'Monitoring System' },
  { value: 'EV_CHARGER', label: 'EV Charger' },
  { value: 'SOLAR_HOT_WATER', label: 'Solar Hot Water' },
  { value: 'HEAT_PUMP', label: 'Heat Pump' },
  { value: 'SURGE_PROTECTION', label: 'Surge Protection' },
  { value: 'COMMISSIONING', label: 'Commissioning' },
  { value: 'OTHER', label: 'Other' },
];

const TIERS = [
  { value: 'budget', label: 'Budget' },
  { value: 'mid', label: 'Mid-Range' },
  { value: 'premium', label: 'Premium' },
];

interface Product {
  id: string;
  name: string;
  sku: string;
  manufacturer: string;
  productType: string;
  specifications: any;
  warrantyYears: number | null;
  tier: string | null;
  features: string[];
  bestFor: string[];
  isAvailable: boolean;
  isRecommended: boolean;
  sortOrder: number;
  imageUrl: string | null;
  description: string | null;
  dataSheetUrl: string | null;
}

export default function ProductsManagementPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [showModal, setShowModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showSuppliersModal, setShowSuppliersModal] = useState(false);
  const [showInstallationModal, setShowInstallationModal] = useState(false);
  const [showDocumentation, setShowDocumentation] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [suppliersProduct, setSuppliersProduct] = useState<Product | null>(null);
  const [installationProduct, setInstallationProduct] = useState<Product | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [addingToShop, setAddingToShop] = useState<string | null>(null);
  const [productsInShop, setProductsInShop] = useState<Set<string>>(new Set());

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    manufacturer: '',
    productType: 'PANEL',
    specifications: '{}',
    warrantyYears: '',
    tier: 'mid',
    features: '',
    bestFor: '',
    isAvailable: true,
    isRecommended: false,
    sortOrder: '0',
    imageUrl: '',
    description: '',
    dataSheetUrl: '',
    // New shop-related fields
    showInShop: true,
    iconName: 'package',
    benefits: '',
    technicalSpecs: '',
  });

  // Fetch products
  useEffect(() => {
    fetchProducts();
    fetchShopProducts();
  }, []);

  // Filter products
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

  const fetchShopProducts = async () => {
    try {
      const res = await fetch('/api/admin/shop/products');
      const data = await res.json();
      const shopProductIds = new Set<string>(data.map((p: any) => p.productId as string));
      setProductsInShop(shopProductIds);
    } catch (error) {
      console.error('Error fetching shop products:', error);
    }
  };

  const handleAdd = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      sku: '',
      manufacturer: '',
      productType: 'PANEL',
      specifications: '{}',
      warrantyYears: '',
      tier: 'mid',
      features: '',
      bestFor: '',
      isAvailable: true,
      isRecommended: false,
      sortOrder: '0',
      imageUrl: '',
      description: '',
      dataSheetUrl: '',
      showInShop: true,
      iconName: 'package',
      benefits: '',
      technicalSpecs: '',
    });
    setShowModal(true);
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    const specs = product.specifications as any;
    setFormData({
      name: product.name,
      sku: product.sku,
      manufacturer: product.manufacturer,
      productType: product.productType,
      specifications: JSON.stringify(product.specifications, null, 2),
      warrantyYears: product.warrantyYears?.toString() || '',
      tier: product.tier || 'mid',
      features: Array.isArray(product.features) ? product.features.join(', ') : '',
      bestFor: Array.isArray(product.bestFor) ? product.bestFor.join(', ') : '',
      isAvailable: product.isAvailable,
      isRecommended: product.isRecommended,
      sortOrder: product.sortOrder.toString(),
      imageUrl: product.imageUrl || '',
      description: product.description || '',
      dataSheetUrl: product.dataSheetUrl || '',
      showInShop: specs?.showInShop !== false,
      iconName: specs?.iconName || 'package',
      benefits: Array.isArray(specs?.benefits) ? specs.benefits.join('\n') : '',
      technicalSpecs: specs?.technicalSpecs 
        ? Object.entries(specs.technicalSpecs)
            .map(([key, value]) => {
              // Convert camelCase to Title Case
              const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
              return `${label}: ${value}`;
            })
            .join('\n')
        : '',
    });
    setShowModal(true);
  };

  const handleDelete = (product: Product) => {
    setDeletingProduct(product);
    setShowDeleteDialog(true);
  };

  const handleManageSuppliers = (product: Product) => {
    setSuppliersProduct(product);
    setShowSuppliersModal(true);
  };

  const handleManageInstallation = (product: Product) => {
    setInstallationProduct(product);
    setShowInstallationModal(true);
  };

  const handleAddToShop = async (product: Product) => {
    try {
      setAddingToShop(product.id);

      // Check if already in shop
      const checkRes = await fetch('/api/admin/shop/products');
      const shopProducts = await checkRes.json();
      const alreadyInShop = shopProducts.some((p: any) => p.productId === product.id);

      if (alreadyInShop) {
        alert('This product is already in the shop!');
        setAddingToShop(null);
        return;
      }

      // Get supplier pricing and stock if available
      const productRes = await fetch(`/api/admin/products/${product.id}`);
      const { product: productData } = await productRes.json();
      
      console.log('Product data:', productData);
      console.log('Supplier products:', productData.SupplierProduct);
      
      let costPrice = 100; // Default
      let retailPrice = 150; // Default
      let stockQty = 0; // Default
      
      if (productData.SupplierProduct && productData.SupplierProduct.length > 0) {
        // Sort by best price and get the first active supplier
        const activeSuppliers = productData.SupplierProduct
          .filter((sp: any) => sp.isActive)
          .sort((a: any, b: any) => (a.retailPrice || 0) - (b.retailPrice || 0));
        
        console.log('Active suppliers:', activeSuppliers);
        
        if (activeSuppliers.length > 0) {
          const supplier = activeSuppliers[0];
          console.log('Selected supplier:', supplier);
          costPrice = supplier.unitCost || supplier.wholesalePrice || 100;
          retailPrice = supplier.retailPrice || costPrice * 1.5;
          stockQty = supplier.stockLevel || 0;
          console.log('Final prices - Cost:', costPrice, 'Retail:', retailPrice, 'Stock:', stockQty);
        }
      } else {
        console.log('No supplier products found, using defaults');
      }

      // Add to shop with supplier data
      const res = await fetch('/api/admin/shop/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          costPrice,
          retailPrice,
          salePrice: null,
          commission: parseFloat(((retailPrice - costPrice) / retailPrice * 100).toFixed(2)),
          stockQty, // Use supplier stock level
          lowStockAlert: 5,
          trackInventory: true,
          allowBackorder: false,
          categoryId: null,
          featured: false,
          isActive: true,
          metaTitle: product.name,
          metaDescription: `${product.name} by ${product.manufacturer}`,
          tags: [product.productType.toLowerCase()],
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error);
      }

      // Update the shop products list
      await fetchShopProducts();
      
      alert(`✅ ${product.name} added to shop!\n\nYou can now manage it in Shop Products.`);
      
      // Optionally redirect to shop products
      if (confirm('Go to Shop Products to set pricing and stock?')) {
        router.push('/admin/dashboard/website/shop/products');
      }
    } catch (error: any) {
      console.error('Error adding to shop:', error);
      alert(`Failed to add to shop: ${error.message}`);
    } finally {
      setAddingToShop(null);
    }
  };

  const confirmDelete = async () => {
    if (!deletingProduct) return;

    try {
      setDeleting(true);
      const res = await fetch(`/api/admin/products/${deletingProduct.id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        throw new Error('Failed to delete product');
      }

      await fetchProducts();
      setShowDeleteDialog(false);
      setDeletingProduct(null);
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Failed to delete product');
    } finally {
      setDeleting(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      // Parse specifications JSON
      let specifications = {};
      try {
        specifications = JSON.parse(formData.specifications);
      } catch (e) {
        alert('Invalid JSON in specifications field');
        return;
      }

      // Parse technical specs (convert from "Label: Value" format to JSON)
      let technicalSpecs: Record<string, string> = {};
      if (formData.technicalSpecs.trim()) {
        const lines = formData.technicalSpecs.split('\n').filter(line => line.trim());
        lines.forEach(line => {
          const colonIndex = line.indexOf(':');
          if (colonIndex > 0) {
            const key = line.substring(0, colonIndex).trim();
            const value = line.substring(colonIndex + 1).trim();
            
            // Convert key to camelCase for JSON
            const camelKey = key
              .toLowerCase()
              .replace(/[^a-z0-9]+(.)/g, (_, chr) => chr.toUpperCase());
            
            technicalSpecs[camelKey] = value;
          }
        });
      }

      // Parse benefits (one per line)
      const benefits = formData.benefits
        ? formData.benefits.split('\n').map(b => b.trim()).filter(b => b)
        : [];

      // Parse arrays
      const features = formData.features
        ? formData.features.split(',').map(f => f.trim()).filter(f => f)
        : [];
      const bestFor = formData.bestFor
        ? formData.bestFor.split(',').map(b => b.trim()).filter(b => b)
        : [];

      // Merge shop-related fields into specifications
      const mergedSpecifications = {
        ...specifications,
        showInShop: formData.showInShop,
        iconName: formData.iconName,
        benefits: benefits.length > 0 ? benefits : undefined,
        technicalSpecs: Object.keys(technicalSpecs).length > 0 ? technicalSpecs : undefined,
      };

      const payload = {
        name: formData.name,
        sku: formData.sku,
        manufacturer: formData.manufacturer,
        productType: formData.productType,
        specifications: mergedSpecifications,
        warrantyYears: formData.warrantyYears ? parseInt(formData.warrantyYears) : null,
        tier: formData.tier || null,
        features,
        bestFor,
        isAvailable: formData.isAvailable,
        isRecommended: formData.isRecommended,
        sortOrder: parseInt(formData.sortOrder) || 0,
        imageUrl: formData.imageUrl || null,
        description: formData.description || null,
        dataSheetUrl: formData.dataSheetUrl || null,
      };

      const url = editingProduct
        ? `/api/admin/products/${editingProduct.id}`
        : '/api/admin/products';
      
      const method = editingProduct ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to save product');
      }

      await fetchProducts();
      setShowModal(false);
    } catch (error: any) {
      console.error('Error saving product:', error);
      alert(error.message || 'Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  const getProductTypeLabel = (type: string) => {
    return PRODUCT_TYPES.find(t => t.value === type)?.label || type;
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
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <Package className="w-8 h-8 mr-3 text-blue-600" />
                Products Management
              </h1>
              <p className="text-gray-600 mt-2">
                Manage all products across panels, batteries, inverters, and more
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <Button 
                onClick={() => setShowDocumentation(true)} 
                variant="outline"
                className="border-blue-600 text-blue-600 hover:bg-blue-50"
              >
                <BookOpen className="w-4 h-4 mr-2" />
                Help & Guide
              </Button>
              <Button onClick={handleAdd} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Add Product
              </Button>
            </div>
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
                  <option value="">All Types</option>
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

        {/* Products Table */}
        <Card>
          <CardHeader>
            <CardTitle>
              Products ({filteredProducts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                No products found
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Manufacturer</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Warranty</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tier</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredProducts.map((product) => (
                      <tr key={product.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {getProductTypeLabel(product.productType)}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-medium text-gray-900">{product.name}</td>
                        <td className="px-4 py-3 text-gray-600">{product.manufacturer}</td>
                        <td className="px-4 py-3 text-gray-600 font-mono text-sm">{product.sku}</td>
                        <td className="px-4 py-3 text-gray-600">
                          {product.warrantyYears ? `${product.warrantyYears} years` : '-'}
                        </td>
                        <td className="px-4 py-3">
                          {product.tier && (
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                              product.tier === 'premium' ? 'bg-purple-100 text-purple-800' :
                              product.tier === 'mid' ? 'bg-green-100 text-green-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {product.tier}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center space-x-2">
                            {product.isAvailable ? (
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            ) : (
                              <XCircle className="w-4 h-4 text-red-600" />
                            )}
                            {product.isRecommended && (
                              <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">★</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <Button
                              onClick={() => handleAddToShop(product)}
                              variant="ghost"
                              size="sm"
                              className={
                                productsInShop.has(product.id)
                                  ? "text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                  : "text-green-600 hover:text-green-700 hover:bg-green-50"
                              }
                              title={productsInShop.has(product.id) ? "Already in Shop" : "Add to Shop"}
                              disabled={addingToShop === product.id || productsInShop.has(product.id)}
                            >
                              {addingToShop === product.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <ShoppingCart className={productsInShop.has(product.id) ? "w-4 h-4 fill-current" : "w-4 h-4"} />
                              )}
                            </Button>
                            <Button
                              onClick={() => handleManageSuppliers(product)}
                              variant="ghost"
                              size="sm"
                              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                              title="Manage Suppliers"
                            >
                              <LinkIcon className="w-4 h-4" />
                            </Button>
                            <Button
                              onClick={() => handleManageInstallation(product)}
                              variant="ghost"
                              size="sm"
                              className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                              title="Installation Requirements"
                            >
                              <Wrench className="w-4 h-4" />
                            </Button>
                            <Button
                              onClick={() => handleEdit(product)}
                              variant="ghost"
                              size="sm"
                              title="Edit Product"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              onClick={() => handleDelete(product)}
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              title="Delete Product"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Add/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
                <h2 className="text-xl font-bold">
                  {editingProduct ? 'Edit Product' : 'Add New Product'}
                </h2>
                <Button
                  onClick={() => setShowModal(false)}
                  variant="ghost"
                  size="sm"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <div className="p-6 space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Product Type *</Label>
                    <select
                      value={formData.productType}
                      onChange={(e) => setFormData({ ...formData, productType: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      {PRODUCT_TYPES.map(type => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <Label>SKU *</Label>
                    <Input
                      value={formData.sku}
                      onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                      placeholder="e.g., PANEL-JKM400"
                      required
                    />
                  </div>

                  <div>
                    <Label>Name *</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., Tiger Neo 400W"
                      required
                    />
                  </div>

                  <div>
                    <Label>Manufacturer *</Label>
                    <Input
                      value={formData.manufacturer}
                      onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                      placeholder="e.g., Jinko Solar"
                      required
                    />
                  </div>

                  <div>
                    <Label>Warranty (Years)</Label>
                    <Input
                      type="number"
                      value={formData.warrantyYears}
                      onChange={(e) => setFormData({ ...formData, warrantyYears: e.target.value })}
                      placeholder="e.g., 25"
                    />
                  </div>

                  <div>
                    <Label>Tier</Label>
                    <select
                      value={formData.tier}
                      onChange={(e) => setFormData({ ...formData, tier: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {TIERS.map(tier => (
                        <option key={tier.value} value={tier.value}>
                          {tier.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Specifications */}
                <div>
                  <Label>Specifications (JSON)</Label>
                  <Textarea
                    value={formData.specifications}
                    onChange={(e) => setFormData({ ...formData, specifications: e.target.value })}
                    placeholder='{"wattage": 400, "efficiency": 22.3}'
                    rows={4}
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Enter product specifications as JSON. Example: {`{"wattage": 400, "efficiency": 22.3}`}
                  </p>
                </div>

                {/* Features & Best For */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Features (comma-separated)</Label>
                    <Textarea
                      value={formData.features}
                      onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                      placeholder="High efficiency, Durable, Long warranty"
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label>Best For (comma-separated)</Label>
                    <Textarea
                      value={formData.bestFor}
                      onChange={(e) => setFormData({ ...formData, bestFor: e.target.value })}
                      placeholder="Residential, Commercial, Large systems"
                      rows={3}
                    />
                  </div>
                </div>

                {/* URLs */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Image URL</Label>
                    <Input
                      value={formData.imageUrl}
                      onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>

                  <div>
                    <Label>Data Sheet URL</Label>
                    <Input
                      value={formData.dataSheetUrl}
                      onChange={(e) => setFormData({ ...formData, dataSheetUrl: e.target.value })}
                      placeholder="https://example.com/datasheet.pdf"
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <Label>Product Description</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Enter detailed product description (3-5 paragraphs recommended for shop display)..."
                    rows={8}
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    This description will be displayed in the shop product details modal.
                  </p>
                </div>

                {/* Shop Display Section */}
                <div className="border-t pt-4 mt-4">
                  <h3 className="text-lg font-semibold mb-4 text-gray-900">Shop Display Settings</h3>
                  
                  {/* Benefits */}
                  <div className="mb-4">
                    <Label>Product Benefits (one per line)</Label>
                    <Textarea
                      value={formData.benefits}
                      onChange={(e) => setFormData({ ...formData, benefits: e.target.value })}
                      placeholder="Real-time monitoring&#10;Mobile app access&#10;Energy usage insights&#10;Solar integration"
                      rows={5}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Enter each benefit on a new line. These will appear as bullet points in the product modal.
                    </p>
                  </div>

                  {/* Icon Name */}
                  <div className="mb-4">
                    <Label>Icon Name</Label>
                    <select
                      value={formData.iconName}
                      onChange={(e) => setFormData({ ...formData, iconName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="package">Package (Default)</option>
                      <option value="sun">Sun (Solar Panels)</option>
                      <option value="battery">Battery</option>
                      <option value="zap">Zap (Inverters/Power)</option>
                      <option value="car">Car (EV Chargers)</option>
                      <option value="droplet">Droplet (Water Systems)</option>
                      <option value="shield">Shield (Protection/Warranty)</option>
                      <option value="home">Home</option>
                      <option value="flame">Flame (Hot Water/Heating)</option>
                      <option value="wind">Wind (Cooling/HVAC)</option>
                      <option value="gauge">Gauge (Monitoring)</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      Icon displayed on product cards and in the shop.
                    </p>
                  </div>

                  {/* Technical Specifications */}
                  <div className="mb-4">
                    <Label>Technical Specifications (one per line)</Label>
                    <Textarea
                      value={formData.technicalSpecs}
                      onChange={(e) => setFormData({ ...formData, technicalSpecs: e.target.value })}
                      placeholder="Power: 7kW (32A)&#10;Voltage: 240V Single Phase&#10;Cable Length: 7.5 meters&#10;Warranty: 4 years&#10;Charging Speed: Up to 45km/hour"
                      rows={8}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Enter each specification as "Label: Value" on a new line. Will be displayed in a grid in the product modal.
                    </p>
                  </div>
                </div>

                {/* Checkboxes */}
                <div className="flex items-center space-x-6">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.isAvailable}
                      onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Available</span>
                  </label>

                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.isRecommended}
                      onChange={(e) => setFormData({ ...formData, isRecommended: e.target.checked })}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Recommended</span>
                  </label>

                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.showInShop}
                      onChange={(e) => setFormData({ ...formData, showInShop: e.target.checked })}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Show in Shop</span>
                  </label>
                </div>

                {/* Sort Order */}
                <div className="w-32">
                  <Label>Sort Order</Label>
                  <Input
                    type="number"
                    value={formData.sortOrder}
                    onChange={(e) => setFormData({ ...formData, sortOrder: e.target.value })}
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="sticky bottom-0 bg-gray-50 border-t px-6 py-4 flex items-center justify-end space-x-3">
                <Button
                  onClick={() => setShowModal(false)}
                  variant="outline"
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Product
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        {showDeleteDialog && deletingProduct && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <h3 className="text-lg font-bold mb-4">Delete Product?</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete <strong>{deletingProduct.name}</strong>?
                This action cannot be undone.
              </p>
              <div className="flex items-center justify-end space-x-3">
                <Button
                  onClick={() => setShowDeleteDialog(false)}
                  variant="outline"
                  disabled={deleting}
                >
                  Cancel
                </Button>
                <Button
                  onClick={confirmDelete}
                  disabled={deleting}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  {deleting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Suppliers Modal */}
        {showSuppliersModal && suppliersProduct && (
          <ProductSuppliersModal
            productId={suppliersProduct.id}
            productName={suppliersProduct.name}
            onClose={() => {
              setShowSuppliersModal(false);
              setSuppliersProduct(null);
            }}
          />
        )}

        {/* Installation Modal */}
        {showInstallationModal && installationProduct && (
          <ProductInstallationModal
            productId={installationProduct.id}
            productName={installationProduct.name}
            onClose={() => {
              setShowInstallationModal(false);
              setInstallationProduct(null);
            }}
          />
        )}

        {/* Documentation Modal */}
        {showDocumentation && (
          <DocumentationModal
            onClose={() => setShowDocumentation(false)}
          />
        )}
      </div>
    </div>
  );
}
