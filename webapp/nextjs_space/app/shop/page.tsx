'use client';

import * as React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import {
  ShoppingCart,
  Package,
  Zap,
  Battery,
  Car,
  Droplet,
  Shield,
  Trash2,
  Plus,
  Minus,
  Sun,
  ArrowLeft,
  Home,
  Flame,
  Wind,
  Gauge,
} from 'lucide-react';
import { toast } from 'sonner';
import { ProductDetailModal } from '@/components/ProductDetailModal';

const iconMap: Record<string, React.ElementType> = {
  package: Package,
  zap: Zap,
  battery: Battery,
  car: Car,
  droplet: Droplet,
  shield: Shield,
  sun: Sun,
  home: Home,
  flame: Flame,
  wind: Wind,
  gauge: Gauge,
  'shopping-cart': ShoppingCart,
};

interface CartItem {
  addonId: string;
  name: string;
  description: string;
  price: number;
  quantity: number;
  totalPrice: number;
  iconName: string;
  category: string;
}

interface Cart {
  id: string;
  items: CartItem[];
  totalAmount: number;
}

export default function ShopPage() {
  const [products, setProducts] = React.useState<any[]>([]);
  const [cart, setCart] = React.useState<Cart | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [cartOpen, setCartOpen] = React.useState(false);
  const [checkoutLoading, setCheckoutLoading] = React.useState(false);
  const [sessionId, setSessionId] = React.useState<string>('');
  const [selectedProduct, setSelectedProduct] = React.useState<any>(null);
  const [productModalOpen, setProductModalOpen] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [showAccessories, setShowAccessories] = React.useState(false);
  const [selectedCategory, setSelectedCategory] = React.useState<string>('all');
  const [customerInfo, setCustomerInfo] = React.useState({
    name: '',
    email: '',
    phone: '',
    address: '',
  });

  // Generate or get session ID
  React.useEffect(() => {
    let sid = localStorage.getItem('shop_session_id');
    if (!sid) {
      sid = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('shop_session_id', sid);
    }
    setSessionId(sid);
  }, []);

  // Load products
  React.useEffect(() => {
    async function loadProducts() {
      try {
        const response = await fetch('/api/shop/products');
        const data = await response.json();
        if (data.success && data.products) {
          setProducts(data.products);
        }
      } catch (error) {
        console.error('Error loading products:', error);
        toast.error('Failed to load products');
      } finally {
        setLoading(false);
      }
    }
    loadProducts();
  }, []);

  // Load cart
  React.useEffect(() => {
    if (!sessionId) return;
    
    async function loadCart() {
      try {
        const response = await fetch(`/api/shop/cart?sessionId=${sessionId}`);
        const data = await response.json();
        setCart(data);
      } catch (error) {
        console.error('Error loading cart:', error);
      }
    }
    loadCart();
  }, [sessionId]);

  const addToCart = async (addonId: string) => {
    if (!sessionId) return;

    try {
      const response = await fetch('/api/shop/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, addonId, quantity: 1 }),
      });

      if (!response.ok) throw new Error('Failed to add to cart');

      const updatedCart = await response.json();
      setCart(updatedCart);
      toast.success('Added to cart!');
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error('Failed to add to cart');
    }
  };

  const updateQuantity = async (addonId: string, quantity: number) => {
    if (!sessionId) return;

    try {
      const response = await fetch('/api/shop/cart', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, addonId, quantity }),
      });

      if (!response.ok) throw new Error('Failed to update cart');

      const updatedCart = await response.json();
      setCart(updatedCart);
    } catch (error) {
      console.error('Error updating cart:', error);
      toast.error('Failed to update cart');
    }
  };

  const removeFromCart = async (addonId: string) => {
    if (!sessionId) return;

    try {
      const response = await fetch(`/api/shop/cart?sessionId=${sessionId}&addonId=${addonId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to remove from cart');

      const updatedCart = await response.json();
      setCart(updatedCart);
      toast.success('Removed from cart');
    } catch (error) {
      console.error('Error removing from cart:', error);
      toast.error('Failed to remove from cart');
    }
  };

  const handleCheckout = async () => {
    if (!cart || cart.items.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    if (!customerInfo.name || !customerInfo.email) {
      toast.error('Please fill in your name and email');
      return;
    }

    setCheckoutLoading(true);

    try {
      const response = await fetch('/api/shop/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          customerName: customerInfo.name,
          customerEmail: customerInfo.email,
          customerPhone: customerInfo.phone,
          shippingAddress: customerInfo.address,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create checkout');
      }

      const data = await response.json();
      
      // Redirect to Stripe checkout
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      }
    } catch (error: any) {
      console.error('Error during checkout:', error);
      toast.error(error.message || 'Failed to proceed to checkout');
    } finally {
      setCheckoutLoading(false);
    }
  };

  const cartItems = Array.isArray(cart?.items) ? cart.items : [];
  const cartItemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cart?.totalAmount || 0;
  const tax = subtotal * 0.1;
  const shipping = subtotal >= 1000 ? 0 : 50;
  const total = subtotal + tax + shipping;

  // Filter products
  const filteredProducts = React.useMemo(() => {
    let filtered = products;

    // Filter by search term
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(search) ||
          p.manufacturer?.toLowerCase().includes(search) ||
          p.description?.toLowerCase().includes(search)
      );
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter((p) => p.productType === selectedCategory);
    }

    // Hide accessories unless explicitly shown
    if (!showAccessories) {
      filtered = filtered.filter(
        (p) =>
          p.productType === 'PANEL' ||
          p.productType === 'BATTERY' ||
          p.productType === 'INVERTER' ||
          p.productType === 'EV_CHARGER'
      );
    }

    return filtered;
  }, [products, searchTerm, selectedCategory, showAccessories]);

  // Group products by type
  const groupedProducts = React.useMemo(() => {
    const groups: Record<string, any[]> = {
      PANEL: [],
      INVERTER: [],
      BATTERY: [],
      EV_CHARGER: [],
      OTHER: [],
    };

    filteredProducts.forEach((product) => {
      const type = product.productType;
      if (groups[type]) {
        groups[type].push(product);
      } else {
        groups.OTHER.push(product);
      }
    });

    return groups;
  }, [filteredProducts]);

  const productTypeLabels: Record<string, string> = {
    PANEL: 'Solar Panels',
    INVERTER: 'Inverters',
    BATTERY: 'Batteries',
    EV_CHARGER: 'EV Chargers',
    OTHER: 'Accessories & Add-ons',
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-4">
              <Link href="/" className="flex items-center space-x-2">
                <Sun className="h-10 w-10 text-gold" />
                <div>
                  <h1 className="text-2xl font-bold text-primary">Sun Direct Power</h1>
                  <p className="text-xs text-muted-foreground">Solar Shop</p>
                </div>
              </Link>
            </div>
            
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Home
                </Button>
              </Link>
              
              <Link href="/extra-services">
                <Button variant="ghost">
                  Services
                </Button>
              </Link>
              
              <Link href="/blog">
                <Button variant="ghost">
                  Blog
                </Button>
              </Link>
              
              <Link href="/gallery">
                <Button variant="ghost">
                  Gallery
                </Button>
              </Link>
              
              <Sheet open={cartOpen} onOpenChange={setCartOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" className="relative">
                    <ShoppingCart className="h-5 w-5" />
                    {cartItemCount > 0 && (
                      <Badge className="absolute -top-2 -right-2 bg-coral">{cartItemCount}</Badge>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
                  <SheetHeader>
                    <SheetTitle>Shopping Cart</SheetTitle>
                    <SheetDescription>
                      {cartItemCount} {cartItemCount === 1 ? 'item' : 'items'} in your cart
                    </SheetDescription>
                  </SheetHeader>

                  <div className="mt-8 space-y-4">
                    {cartItems.length > 0 ? (
                      <>
                        {/* Cart Items */}
                        {cartItems.map((item) => {
                          const Icon = iconMap[item.iconName] || Package;
                          return (
                            <Card key={item.addonId}>
                              <CardContent className="p-4">
                                <div className="flex items-start gap-4">
                                  <div className="bg-primary/10 rounded p-2">
                                    <Icon className="h-6 w-6 text-primary" />
                                  </div>
                                  <div className="flex-1">
                                    <h4 className="font-semibold">{item.name}</h4>
                                    <p className="text-sm text-gray-600">${item.price.toLocaleString()}</p>
                                    <div className="flex items-center gap-2 mt-2">
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => updateQuantity(item.addonId, item.quantity - 1)}
                                      >
                                        <Minus className="h-3 w-3" />
                                      </Button>
                                      <span className="w-8 text-center">{item.quantity}</span>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => updateQuantity(item.addonId, item.quantity + 1)}
                                      >
                                        <Plus className="h-3 w-3" />
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="ml-auto text-red-500"
                                        onClick={() => removeFromCart(item.addonId)}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <p className="font-bold">${item.totalPrice.toLocaleString()}</p>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}

                        <Separator />

                        {/* Customer Info */}
                        <div className="space-y-4">
                          <h3 className="font-semibold">Contact Information</h3>
                          <div className="space-y-2">
                            <Label htmlFor="name">Name *</Label>
                            <Input
                              id="name"
                              value={customerInfo.name}
                              onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                              placeholder="John Smith"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="email">Email *</Label>
                            <Input
                              id="email"
                              type="email"
                              value={customerInfo.email}
                              onChange={(e) => setCustomerInfo({ ...customerInfo, email: e.target.value })}
                              placeholder="john@example.com"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="phone">Phone</Label>
                            <Input
                              id="phone"
                              value={customerInfo.phone}
                              onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                              placeholder="0400 000 000"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="address">Shipping Address</Label>
                            <Input
                              id="address"
                              value={customerInfo.address}
                              onChange={(e) => setCustomerInfo({ ...customerInfo, address: e.target.value })}
                              placeholder="123 Main St, Perth WA 6000"
                            />
                          </div>
                        </div>

                        <Separator />

                        {/* Totals */}
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Subtotal</span>
                            <span>${subtotal.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Tax (GST 10%)</span>
                            <span>${tax.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Shipping</span>
                            <span>{shipping === 0 ? 'FREE' : `$${shipping}`}</span>
                          </div>
                          {subtotal < 1000 && (
                            <p className="text-xs text-gray-500">
                              Free shipping on orders over $1,000
                            </p>
                          )}
                          <Separator />
                          <div className="flex justify-between font-bold text-lg">
                            <span>Total</span>
                            <span>${total.toFixed(2)}</span>
                          </div>
                        </div>

                        <Button
                          className="w-full bg-coral hover:bg-coral-600"
                          size="lg"
                          onClick={handleCheckout}
                          disabled={checkoutLoading}
                        >
                          {checkoutLoading ? 'Processing...' : 'Proceed to Checkout'}
                        </Button>
                      </>
                    ) : (
                      <div className="text-center py-12">
                        <ShoppingCart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500">Your cart is empty</p>
                      </div>
                    )}
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-primary mb-2">Solar Products & Accessories</h1>
          <p className="text-xl text-gray-600">
            Browse our complete range of solar panels, batteries, inverters, and add-ons
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Input
              type="text"
              placeholder="Search products by name, manufacturer, or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-6 text-lg"
            />
            <Package className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          </div>

          {/* Category Filters */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedCategory === 'all' ? 'default' : 'outline'}
              onClick={() => setSelectedCategory('all')}
              className="gap-2"
            >
              All Products
            </Button>
            <Button
              variant={selectedCategory === 'PANEL' ? 'default' : 'outline'}
              onClick={() => setSelectedCategory('PANEL')}
              className="gap-2"
            >
              <Sun className="h-4 w-4" />
              Solar Panels
            </Button>
            <Button
              variant={selectedCategory === 'INVERTER' ? 'default' : 'outline'}
              onClick={() => setSelectedCategory('INVERTER')}
              className="gap-2"
            >
              <Zap className="h-4 w-4" />
              Inverters
            </Button>
            <Button
              variant={selectedCategory === 'BATTERY' ? 'default' : 'outline'}
              onClick={() => setSelectedCategory('BATTERY')}
              className="gap-2"
            >
              <Battery className="h-4 w-4" />
              Batteries
            </Button>
            <Button
              variant={selectedCategory === 'EV_CHARGER' ? 'default' : 'outline'}
              onClick={() => setSelectedCategory('EV_CHARGER')}
              className="gap-2"
            >
              <Car className="h-4 w-4" />
              EV Chargers
            </Button>
            <Button
              variant={showAccessories ? 'default' : 'outline'}
              onClick={() => setShowAccessories(!showAccessories)}
              className="gap-2 ml-auto"
            >
              <Package className="h-4 w-4" />
              {showAccessories ? 'Hide' : 'Show'} Accessories
            </Button>
          </div>

          {/* Results Count */}
          <div className="text-sm text-gray-600">
            Showing {filteredProducts.length} of {products.length} products
          </div>
        </div>

        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-12 w-12 bg-gray-200 rounded-full mb-4" />
                  <div className="h-6 bg-gray-200 rounded w-3/4 mb-2" />
                  <div className="h-4 bg-gray-200 rounded w-full" />
                </CardHeader>
                <CardContent>
                  <div className="h-4 bg-gray-200 rounded w-full mb-2" />
                  <div className="h-4 bg-gray-200 rounded w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">No products found</h3>
            <p className="text-gray-500">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="space-y-12">
            {/* Render each product type section */}
            {Object.entries(groupedProducts).map(([type, typeProducts]) => {
              if (typeProducts.length === 0) return null;

              const typeColors: Record<string, string> = {
                PANEL: 'bg-yellow-100 text-yellow-800 border-yellow-200',
                BATTERY: 'bg-green-100 text-green-800 border-green-200',
                INVERTER: 'bg-blue-100 text-blue-800 border-blue-200',
                EV_CHARGER: 'bg-indigo-100 text-indigo-800 border-indigo-200',
                OTHER: 'bg-purple-100 text-purple-800 border-purple-200',
              };
              const sectionColor = typeColors[type] || 'bg-gray-100 text-gray-800 border-gray-200';

              return (
                <section key={type} className="space-y-4">
                  {/* Section Header */}
                  <div className="flex items-center gap-3 pb-3 border-b-2">
                    <Badge className={`${sectionColor} text-lg px-4 py-2`}>
                      {productTypeLabels[type]}
                    </Badge>
                    <span className="text-sm text-gray-500">
                      {typeProducts.length} {typeProducts.length === 1 ? 'product' : 'products'}
                    </span>
                  </div>

                  {/* Products Grid */}
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {typeProducts.map((product) => {
                      const Icon = iconMap[product.iconName] || Package;
                      const benefits = Array.isArray(product.benefits) ? product.benefits : [];
                      const cost = product.cost || 0;

                      return (
                        <Card
                          key={product.addonId}
                          className="hover:shadow-xl transition-shadow cursor-pointer"
                          onClick={() => {
                            setSelectedProduct(product);
                            setProductModalOpen(true);
                          }}
                        >
                          <CardHeader>
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <div className="bg-primary/10 rounded-full p-3">
                                  <Icon className="h-8 w-8 text-primary" />
                                </div>
                                {product.tier && (
                                  <Badge variant="outline" className="text-xs">
                                    {product.tier}
                                  </Badge>
                                )}
                                {product.isPopular && (
                                  <Badge className="bg-orange-500 text-white text-xs">
                                    🔥 Popular
                                  </Badge>
                                )}
                              </div>
                              <div className="text-right">
                                <p className="text-2xl font-bold text-coral">
                                  ${cost.toLocaleString()}
                                </p>
                                <p className="text-xs text-gray-500">inc. GST</p>
                              </div>
                            </div>
                            <CardTitle className="text-xl">{product.name}</CardTitle>
                            <CardDescription className="line-clamp-2">
                              {product.manufacturer && (
                                <span className="font-semibold">{product.manufacturer}</span>
                              )}
                              {product.description && (
                                <span className="block text-sm mt-1">{product.description}</span>
                              )}
                            </CardDescription>
                          </CardHeader>

                          <CardContent>
                            {benefits.length > 0 && (
                              <ul className="space-y-2">
                                {benefits.slice(0, 3).map((benefit: string, idx: number) => (
                                  <li key={idx} className="flex items-start text-sm text-gray-600">
                                    <span className="text-emerald-500 mr-2">✓</span>
                                    <span className="line-clamp-1">{benefit}</span>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </CardContent>

                          <CardFooter>
                            <Button
                              className="w-full bg-coral hover:bg-coral-600"
                              onClick={(e) => {
                                e.stopPropagation();
                                addToCart(product.addonId);
                              }}
                            >
                              <ShoppingCart className="h-4 w-4 mr-2" />
                              Add to Cart
                            </Button>
                          </CardFooter>
                        </Card>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
        )}

        {/* Product Detail Modal */}
        {selectedProduct && (
          <ProductDetailModal
            product={selectedProduct}
            open={productModalOpen}
            onOpenChange={setProductModalOpen}
            onAddToCart={addToCart}
            Icon={iconMap[selectedProduct.iconName] || Package}
          />
        )}
      </main>
    </div>
  );
}
