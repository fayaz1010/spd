'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface NavigationProps {
  activePage?: string;
}

interface CompanySettings {
  logoUrl: string;
  companyName: string;
}

export function Navigation({ activePage }: NavigationProps) {
  const [settings, setSettings] = useState<CompanySettings>({
    logoUrl: '/logos/sdp-logo-medium.png',
    companyName: 'Sun Direct Power',
  });

  useEffect(() => {
    // Fetch company settings from API
    fetch('/api/company-settings')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.settings) {
          setSettings({
            logoUrl: data.settings.logoUrl || '/logos/sdp-logo-medium.png',
            companyName: data.settings.companyName || 'Sun Direct Power',
          });
        }
      })
      .catch(err => console.error('Failed to load company settings:', err));
  }, []);

  const isActive = (page: string) => activePage === page ? 'text-coral' : 'hover:text-coral transition-colors';

  return (
    <header className="sticky top-0 z-50 bg-white border-b shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <Link href="/" className="flex items-center">
            <Image 
              src={settings.logoUrl} 
              alt={settings.companyName} 
              width={250} 
              height={65}
              className="h-16 w-auto"
              priority
            />
          </Link>
          <nav className="hidden md:flex space-x-6 items-center">
            <Link href="/" className={`text-sm font-medium flex items-center gap-1 ${isActive('home')}`}>
              <Home className="w-4 h-4" />
              Home
            </Link>
            <Link href="/about" className={`text-sm font-medium ${isActive('about')}`}>
              About Us
            </Link>
            <Link href="/extra-services" className={`text-sm font-medium ${isActive('services')}`}>
              Services
            </Link>
            <Link href="/gallery" className={`text-sm font-medium ${isActive('gallery')}`}>
              Gallery
            </Link>
            <Link href="/blog" className={`text-sm font-medium ${isActive('blog')}`}>
              Blog
            </Link>
            <Link href="/shop" className={`text-sm font-medium ${isActive('shop')}`}>
              Shop
            </Link>
            <Link href="/careers" className={`text-sm font-medium ${isActive('careers')}`}>
              Careers
            </Link>
            <Link href="/contact" className={`text-sm font-medium ${isActive('contact')}`}>
              Contact
            </Link>
            <Link href="/login">
              <Button variant="outline" className="border-coral text-coral hover:bg-coral hover:text-white">
                Login
              </Button>
            </Link>
            <Link href="/calculator-v2">
              <Button className="bg-coral hover:bg-coral-600 text-white">
                Get Quote
              </Button>
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
