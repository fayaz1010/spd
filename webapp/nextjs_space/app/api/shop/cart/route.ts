import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { nanoid } from 'nanoid';

const prisma = new PrismaClient();

// GET - Get cart by session ID
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
    }

    let cart = await prisma.shopCart.findUnique({
      where: { sessionId },
    });

    // Create cart if it doesn't exist
    if (!cart) {
      cart = await prisma.shopCart.create({
        data: {
          id: nanoid(),
          sessionId,
          items: [],
          totalAmount: 0,
          updatedAt: new Date(),
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        },
      });
    }

    return NextResponse.json(cart);
  } catch (error) {
    console.error('Error fetching cart:', error);
    return NextResponse.json({ error: 'Failed to fetch cart' }, { status: 500 });
  }
}

// POST - Add item to cart
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, addonId, quantity = 1 } = body;

    if (!sessionId || !addonId) {
      return NextResponse.json({ error: 'Session ID and product ID required' }, { status: 400 });
    }

    // Get product details from Product table
    const product = await prisma.product.findUnique({
      where: { id: addonId },
      include: {
        SupplierProduct: {
          where: { isActive: true },
          take: 1,
        },
      },
    });

    if (!product || !product.isAvailable) {
      return NextResponse.json({ error: 'Product not found or unavailable' }, { status: 404 });
    }

    const supplier = product.SupplierProduct[0];
    const price = supplier?.retailPrice || 0;
    const specs = product.specifications as any;

    // Get or create cart
    let cart = await prisma.shopCart.findUnique({
      where: { sessionId },
    });

    if (!cart) {
      cart = await prisma.shopCart.create({
        data: {
          id: nanoid(),
          sessionId,
          items: [],
          totalAmount: 0,
          updatedAt: new Date(),
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });
    }

    // Update cart items
    const items = Array.isArray(cart.items) ? (cart.items as any[]) : [];
    const existingItemIndex = items.findIndex((item: any) => item.addonId === addonId);

    if (existingItemIndex > -1 && items[existingItemIndex]) {
      // Update quantity
      const existingItem = items[existingItemIndex] as any;
      existingItem.quantity += quantity;
      existingItem.totalPrice = existingItem.quantity * price;
    } else {
      // Add new item
      items.push({
        addonId: product.id,
        name: product.name,
        description: product.description || '',
        price: price,
        quantity,
        totalPrice: price * quantity,
        iconName: specs?.iconName || 'package',
        category: specs?.addonCategory || 'general',
      });
    }

    // Calculate total
    const totalAmount = items.reduce((sum: number, item: any) => sum + item.totalPrice, 0);

    // Update cart
    const updatedCart = await prisma.shopCart.update({
      where: { id: cart.id },
      data: {
        items,
        totalAmount,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(updatedCart);
  } catch (error) {
    console.error('Error adding to cart:', error);
    return NextResponse.json({ error: 'Failed to add to cart' }, { status: 500 });
  }
}

// PUT - Update cart item quantity
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, addonId, quantity } = body;

    if (!sessionId || !addonId || quantity === undefined) {
      return NextResponse.json({ error: 'Session ID, addon ID, and quantity required' }, { status: 400 });
    }

    const cart = await prisma.shopCart.findUnique({
      where: { sessionId },
    });

    if (!cart) {
      return NextResponse.json({ error: 'Cart not found' }, { status: 404 });
    }

    const items = Array.isArray(cart.items) ? (cart.items as any[]) : [];
    const itemIndex = items.findIndex((item: any) => item.addonId === addonId);

    if (itemIndex === -1) {
      return NextResponse.json({ error: 'Item not found in cart' }, { status: 404 });
    }

    if (quantity <= 0) {
      // Remove item
      items.splice(itemIndex, 1);
    } else if (items[itemIndex]) {
      // Update quantity
      const item = items[itemIndex] as any;
      item.quantity = quantity;
      item.totalPrice = item.price * quantity;
    }

    // Calculate total
    const totalAmount = items.reduce((sum: number, item: any) => sum + item.totalPrice, 0);

    // Update cart
    const updatedCart = await prisma.shopCart.update({
      where: { id: cart.id },
      data: {
        items,
        totalAmount,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(updatedCart);
  } catch (error) {
    console.error('Error updating cart:', error);
    return NextResponse.json({ error: 'Failed to update cart' }, { status: 500 });
  }
}

// DELETE - Remove item from cart
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const sessionId = searchParams.get('sessionId');
    const addonId = searchParams.get('addonId');

    if (!sessionId || !addonId) {
      return NextResponse.json({ error: 'Session ID and addon ID required' }, { status: 400 });
    }

    const cart = await prisma.shopCart.findUnique({
      where: { sessionId },
    });

    if (!cart) {
      return NextResponse.json({ error: 'Cart not found' }, { status: 404 });
    }

    const items = Array.isArray(cart.items) ? cart.items : [];
    const filteredItems = items.filter((item: any) => item.addonId !== addonId);

    // Calculate total
    const totalAmount = filteredItems.reduce((sum: number, item: any) => sum + item.totalPrice, 0);

    // Update cart
    const updatedCart = await prisma.shopCart.update({
      where: { id: cart.id },
      data: {
        items: filteredItems,
        totalAmount,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(updatedCart);
  } catch (error) {
    console.error('Error removing from cart:', error);
    return NextResponse.json({ error: 'Failed to remove from cart' }, { status: 500 });
  }
}
