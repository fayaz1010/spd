'use client';

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import Autoplay from 'embla-carousel-autoplay';
import { ShoppingCart, Package, Zap, Battery, Car, Droplet, Shield } from 'lucide-react';

interface Product {
  addonId: string;
  name: string;
  description: string;
  cost: number;
  iconName: string;
  category: string;
  benefits?: string[];
}

const iconMap: Record<string, React.ElementType> = {
  package: Package,
  zap: Zap,
  battery: Battery,
  car: Car,
  droplet: Droplet,
  shield: Shield,
  'shopping-cart': ShoppingCart,
};

interface ProductCarouselProps {
  products: Product[];
  title?: string;
  subtitle?: string;
}

export function ProductCarousel({ products, title, subtitle }: ProductCarouselProps) {
  const autoplayPlugin = React.useMemo(
    () => Autoplay({ delay: 4000, stopOnInteraction: false }),
    []
  );

  if (!products || products.length === 0) {
    return null;
  }

  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-primary mb-4">
            {title || 'Enhance Your Solar System'}
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            {subtitle || 'Premium add-ons to maximize your solar investment'}
          </p>
        </div>

        {/* Carousel */}
        <div className="relative">
          <Carousel
            plugins={[autoplayPlugin]}
            opts={{
              align: 'start',
              loop: true,
            }}
            className="w-full"
          >
            <CarouselContent className="-ml-4">
              {products.map((product) => {
                const Icon = iconMap[product.iconName] || Package;
                
                return (
                  <CarouselItem key={product.addonId} className="pl-4 md:basis-1/2 lg:basis-1/3">
                    <Card className="h-full hover:shadow-xl transition-shadow duration-300">
                      <CardHeader>
                        <div className="flex items-start justify-between mb-3">
                          <div className="bg-primary/10 rounded-full p-3">
                            <Icon className="h-8 w-8 text-primary" />
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-coral">
                              ${product.cost.toLocaleString()}
                            </p>
                            <p className="text-xs text-gray-500">inc. GST</p>
                          </div>
                        </div>
                        <CardTitle className="text-xl">{product.name}</CardTitle>
                        <CardDescription className="line-clamp-2">
                          {product.description}
                        </CardDescription>
                      </CardHeader>
                      
                      <CardContent>
                        {product.benefits && product.benefits.length > 0 && (
                          <ul className="space-y-2">
                            {product.benefits.slice(0, 3).map((benefit, idx) => (
                              <li key={idx} className="flex items-start text-sm text-gray-600">
                                <span className="text-emerald-500 mr-2">✓</span>
                                <span>{benefit}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </CardContent>
                      
                      <CardFooter className="flex gap-2">
                        <Link href="/shop" className="flex-1">
                          <Button variant="outline" className="w-full">
                            View Details
                          </Button>
                        </Link>
                        <Link href="/shop" className="flex-1">
                          <Button className="w-full bg-coral hover:bg-coral-600">
                            <ShoppingCart className="h-4 w-4 mr-2" />
                            Add to Cart
                          </Button>
                        </Link>
                      </CardFooter>
                    </Card>
                  </CarouselItem>
                );
              })}
            </CarouselContent>
            
            <CarouselPrevious className="hidden md:flex -left-12" />
            <CarouselNext className="hidden md:flex -right-12" />
          </Carousel>
        </div>

        {/* View All Button */}
        <div className="text-center mt-8">
          <Link href="/shop">
            <Button size="lg" className="bg-primary hover:bg-primary-800">
              View All Products
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
