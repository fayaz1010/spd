import Link from 'next/link';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { Map, Home, Info, Wrench, Image, BookOpen, ShoppingBag, Mail, Calculator, FileText, Shield } from 'lucide-react';

export const metadata = {
  title: 'Sitemap - Sun Direct Power',
  description: 'Complete sitemap of Sun Direct Power website. Find all pages and navigate easily.',
};

export default function SitemapPage() {
  const sitemapSections = [
    {
      title: 'Main Pages',
      icon: Home,
      links: [
        { href: '/', label: 'Home' },
        { href: '/about', label: 'About Us' },
        { href: '/contact', label: 'Contact Us' },
        { href: '/calculator-v2', label: 'Solar Calculator' },
      ],
    },
    {
      title: 'Services',
      icon: Wrench,
      links: [
        { href: '/extra-services', label: 'Extra Services' },
        { href: '/extra-services#security', label: 'Security Systems' },
        { href: '/extra-services#smart-home', label: 'Smart Home' },
        { href: '/extra-services#hvac', label: 'HVAC Services' },
        { href: '/extra-services#roofing', label: 'Roof & Gutter Services' },
      ],
    },
    {
      title: 'Shop',
      icon: ShoppingBag,
      links: [
        { href: '/shop', label: 'Shop Add-ons' },
        { href: '/shop#packages', label: 'Solar Packages' },
        { href: '/shop#batteries', label: 'Battery Storage' },
        { href: '/shop#accessories', label: 'Accessories' },
      ],
    },
    {
      title: 'Resources',
      icon: BookOpen,
      links: [
        { href: '/blog', label: 'Blog' },
        { href: '/gallery', label: 'Gallery' },
        { href: '/#rebates', label: 'Current Rebates' },
        { href: '/#faqs', label: 'FAQs' },
        { href: '/careers', label: 'Careers' },
      ],
    },
    {
      title: 'Legal',
      icon: Shield,
      links: [
        { href: '/privacy-policy', label: 'Privacy Policy' },
        { href: '/terms-conditions', label: 'Terms & Conditions' },
      ],
    },
    {
      title: 'Customer Portal',
      icon: FileText,
      links: [
        { href: '/login', label: 'Customer Login' },
        { href: '/portal/dashboard', label: 'Customer Dashboard' },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      <Navigation />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-900 via-blue-800 to-purple-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 mb-4">
            <Map className="w-12 h-12" />
            <h1 className="text-4xl md:text-5xl font-bold">Sitemap</h1>
          </div>
          <p className="text-xl text-blue-100">
            Navigate through all pages on our website
          </p>
        </div>
      </section>

      {/* Sitemap Content */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {sitemapSections.map((section, index) => {
              const Icon = section.icon;
              return (
                <div key={index} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="bg-blue-100 rounded-full p-2">
                      <Icon className="w-6 h-6 text-blue-600" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">{section.title}</h2>
                  </div>
                  <ul className="space-y-2">
                    {section.links.map((link, linkIndex) => (
                      <li key={linkIndex}>
                        <Link 
                          href={link.href}
                          className="text-gray-600 hover:text-coral transition-colors flex items-center gap-2"
                        >
                          <span className="text-coral">→</span>
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>

          {/* Additional Info */}
          <div className="mt-12 bg-blue-50 border-l-4 border-blue-600 p-6 rounded">
            <h3 className="font-bold text-gray-900 mb-2">Need Help?</h3>
            <p className="text-gray-700 mb-4">
              Can't find what you're looking for? Contact our team and we'll be happy to help.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/contact" className="text-coral hover:text-coral-600 font-semibold">
                Contact Us →
              </Link>
              <Link href="/calculator-v2" className="text-coral hover:text-coral-600 font-semibold">
                Get a Quote →
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
