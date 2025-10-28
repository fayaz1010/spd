'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Facebook, Instagram, Linkedin, Youtube, Mail, Phone, MapPin, Music, Image as ImageIcon } from 'lucide-react';
import { CookieConsent } from './CookieConsent';

interface SocialLinks {
  facebook: string;
  instagram: string;
  linkedin: string;
  youtube: string;
  tiktok: string;
  pinterest: string;
}

interface CompanySettings {
  companyName: string;
  abn: string;
  address: string;
  city: string;
  phone: string;
  mobile: string;
  email: string;
  logoUrl: string;
}

export function Footer() {
  const currentYear = new Date().getFullYear();
  const [socialLinks, setSocialLinks] = useState<SocialLinks>({
    facebook: 'https://facebook.com',
    instagram: 'https://instagram.com',
    linkedin: 'https://linkedin.com',
    youtube: 'https://youtube.com',
    tiktok: '',
    pinterest: '',
  });

  const [companySettings, setCompanySettings] = useState<CompanySettings>({
    companyName: 'Sun Direct Power',
    abn: '12 345 678 901',
    address: '1 Whipper Street',
    city: 'Balcatta, WA 6112',
    phone: '08 6246 5606',
    mobile: '+61 0413 823 725',
    email: 'admin@sundirectpower.com.au',
    logoUrl: '/logos/sdp-logo-medium.png',
  });

  useEffect(() => {
    // Fetch social links from API
    fetch('/api/social-links')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.links) {
          setSocialLinks(data.links);
        }
      })
      .catch(err => console.error('Failed to load social links:', err));

    // Fetch company settings from API
    fetch('/api/company-settings')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.settings) {
          setCompanySettings(prev => ({
            ...prev,
            ...data.settings
          }));
        }
      })
      .catch(err => console.error('Failed to load company settings:', err));
  }, []);

  return (
    <footer className="bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* Company Info */}
          <div>
            <div className="mb-4">
              <Image 
                src={companySettings.logoUrl} 
                alt={companySettings.companyName} 
                width={200} 
                height={52}
                className="h-12 w-auto"
              />
            </div>
            <p className="text-white/70 text-sm mb-4">
              Perth's trusted solar installation experts since 2010. Leading the renewable energy revolution in Western Australia.
            </p>
            <div className="flex gap-3">
              {socialLinks.facebook && (
                <a 
                  href={socialLinks.facebook} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors"
                  aria-label="Facebook"
                >
                  <Facebook className="w-5 h-5" />
                </a>
              )}
              {socialLinks.instagram && (
                <a 
                  href={socialLinks.instagram} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors"
                  aria-label="Instagram"
                >
                  <Instagram className="w-5 h-5" />
                </a>
              )}
              {socialLinks.linkedin && (
                <a 
                  href={socialLinks.linkedin} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors"
                  aria-label="LinkedIn"
                >
                  <Linkedin className="w-5 h-5" />
                </a>
              )}
              {socialLinks.youtube && (
                <a 
                  href={socialLinks.youtube} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors"
                  aria-label="YouTube"
                >
                  <Youtube className="w-5 h-5" />
                </a>
              )}
              {socialLinks.tiktok && (
                <a 
                  href={socialLinks.tiktok} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors"
                  aria-label="TikTok"
                >
                  <Music className="w-5 h-5" />
                </a>
              )}
              {socialLinks.pinterest && (
                <a 
                  href={socialLinks.pinterest} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors"
                  aria-label="Pinterest"
                >
                  <ImageIcon className="w-5 h-5" />
                </a>
              )}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-bold mb-4 text-lg">Quick Links</h3>
            <div className="space-y-2 text-sm">
              <Link href="/about" className="block text-white/70 hover:text-white transition-colors">
                About Us
              </Link>
              <Link href="/calculator-v2" className="block text-white/70 hover:text-white transition-colors">
                Solar Calculator
              </Link>
              <Link href="/extra-services" className="block text-white/70 hover:text-white transition-colors">
                Extra Services
              </Link>
              <Link href="/shop" className="block text-white/70 hover:text-white transition-colors">
                Shop Add-ons
              </Link>
              <Link href="/gallery" className="block text-white/70 hover:text-white transition-colors">
                Gallery
              </Link>
              <Link href="/blog" className="block text-white/70 hover:text-white transition-colors">
                Blog
              </Link>
              <Link href="/contact" className="block text-white/70 hover:text-white transition-colors">
                Contact Us
              </Link>
              <Link href="/careers" className="block text-white/70 hover:text-white transition-colors">
                Careers
              </Link>
            </div>
          </div>

          {/* Resources */}
          <div>
            <h3 className="font-bold mb-4 text-lg">Resources</h3>
            <div className="space-y-2 text-sm">
              <Link href="/#rebates" className="block text-white/70 hover:text-white transition-colors">
                Current Rebates
              </Link>
              <Link href="/#how-it-works" className="block text-white/70 hover:text-white transition-colors">
                How It Works
              </Link>
              <Link href="/#faqs" className="block text-white/70 hover:text-white transition-colors">
                FAQs
              </Link>
              <Link href="/case-studies" className="block text-white/70 hover:text-white transition-colors">
                Case Studies
              </Link>
              <Link href="/testimonials" className="block text-white/70 hover:text-white transition-colors">
                Testimonials
              </Link>
              <Link href="/privacy-policy" className="block text-white/70 hover:text-white transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms-conditions" className="block text-white/70 hover:text-white transition-colors">
                Terms & Conditions
              </Link>
            </div>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="font-bold mb-4 text-lg">Contact Us</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-coral flex-shrink-0 mt-1" />
                <div>
                  <p className="text-white/70">{companySettings.address}</p>
                  <p className="text-white/70">{companySettings.city}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-coral flex-shrink-0" />
                <a href={`tel:${companySettings.phone.replace(/\s/g, '')}`} className="text-white/70 hover:text-white transition-colors">
                  {companySettings.phone}
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-coral flex-shrink-0" />
                <a href={`tel:${companySettings.mobile.replace(/\s/g, '')}`} className="text-white/70 hover:text-white transition-colors">
                  {companySettings.mobile}
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-coral flex-shrink-0" />
                <a href={`mailto:${companySettings.email}`} className="text-white/70 hover:text-white transition-colors">
                  {companySettings.email}
                </a>
              </div>
              <div className="pt-2">
                <p className="text-white/70 text-xs">
                  <strong>Hours:</strong> Mon-Fri: 8:00 AM - 5:00 PM
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/10 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-center md:text-left">
              <p className="text-white/60 text-sm">
                © {currentYear} {companySettings.companyName}. All rights reserved.
              </p>
              <p className="text-white/50 text-xs mt-1">
                CEC Certified Installers | ABN: {companySettings.abn}
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-4 text-xs">
              <Link href="/privacy-policy" className="text-white/60 hover:text-white transition-colors">
                Privacy Policy
              </Link>
              <span className="text-white/30">|</span>
              <Link href="/terms-conditions" className="text-white/60 hover:text-white transition-colors">
                Terms & Conditions
              </Link>
              <span className="text-white/30">|</span>
              <Link href="/cookie-policy" className="text-white/60 hover:text-white transition-colors">
                Cookie Policy
              </Link>
              <span className="text-white/30">|</span>
              <Link href="/sitemap-page" className="text-white/60 hover:text-white transition-colors">
                Sitemap
              </Link>
              <span className="text-white/30">|</span>
              <a 
                href="https://www.sundirectpower.com.au" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-white/60 hover:text-white transition-colors"
              >
                www.sundirectpower.com.au
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Cookie Consent Banner */}
      <CookieConsent />
    </footer>
  );
}
