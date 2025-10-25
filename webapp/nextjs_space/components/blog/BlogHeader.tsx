'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Sun } from 'lucide-react';

export function BlogHeader() {
  return (
    <header className="sticky top-0 z-50 bg-white border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center space-x-2">
            <Sun className="h-8 w-8 text-gold" />
            <div>
              <h1 className="text-xl font-bold text-primary">Sun Direct Power</h1>
              <p className="text-xs text-muted-foreground">Solar Blog</p>
            </div>
          </Link>
          
          <nav className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="sm">Home</Button>
            </Link>
            <Link href="/extra-services">
              <Button variant="ghost" size="sm">Services</Button>
            </Link>
            <Link href="/gallery">
              <Button variant="ghost" size="sm">Gallery</Button>
            </Link>
            <Link href="/shop">
              <Button variant="ghost" size="sm">Shop</Button>
            </Link>
            <Link href="/calculator-v2">
              <Button size="sm" className="bg-coral hover:bg-coral-600">
                Get Quote
              </Button>
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
