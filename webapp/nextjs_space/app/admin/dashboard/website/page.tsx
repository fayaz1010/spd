'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Globe,
  ShoppingBag,
  Wrench,
  FileText,
  Image,
  Phone,
  Share2,
  ArrowRight,
  Store,
  Briefcase,
  Mail,
  MapPin,
  Instagram,
  Facebook,
  Linkedin,
  Youtube,
  MessageSquare,
  Calendar,
  Award,
  Users as UsersIcon,
  Star,
  ArrowLeft,
  Shield
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function WebsiteManagementHub() {
  const router = useRouter();

  const sections = [
    {
      title: 'E-Commerce',
      description: 'Manage online shop and product catalog',
      icon: ShoppingBag,
      color: 'blue',
      items: [
        {
          title: 'Manage Shop',
          description: 'Products, categories, inventory, and pricing',
          href: '/admin/dashboard/website/shop',
          icon: Store,
          badge: 'New',
        },
        {
          title: 'Shop Orders',
          description: 'View and manage customer orders',
          href: '/admin/dashboard/website/orders',
          icon: ShoppingBag,
        },
        {
          title: 'Shop Settings',
          description: 'Shipping, payment, and store configuration',
          href: '/admin/dashboard/website/shop/settings',
          icon: Store,
        },
      ],
    },
    {
      title: 'Extra Services',
      description: 'Non-solar services offered to customers',
      icon: Wrench,
      color: 'orange',
      items: [
        {
          title: 'Manage Extra Services',
          description: 'Gutter cleaning, roof painting, CCTV, locks, etc.',
          href: '/admin/dashboard/website/extra-services',
          icon: Wrench,
          badge: 'New',
        },
        {
          title: 'Service Bookings',
          description: 'View and manage service requests',
          href: '/admin/dashboard/website/service-bookings',
          icon: Calendar,
        },
        {
          title: 'Service Areas',
          description: 'Configure service coverage areas',
          href: '/admin/dashboard/website/service-areas',
          icon: MapPin,
        },
      ],
    },
    {
      title: 'Content Management',
      description: 'Blog, news, and educational content',
      icon: FileText,
      color: 'green',
      items: [
        {
          title: 'Manage Blog',
          description: 'Blog posts, articles, and news',
          href: '/admin/dashboard/website/blog',
          icon: FileText,
        },
        {
          title: 'Case Studies',
          description: 'Customer success stories and projects',
          href: '/admin/dashboard/website/case-studies',
          icon: Award,
        },
        {
          title: 'FAQs',
          description: 'Frequently asked questions',
          href: '/admin/dashboard/website/faqs',
          icon: MessageSquare,
        },
        {
          title: 'Testimonials',
          description: 'Customer reviews and testimonials',
          href: '/admin/dashboard/website/testimonials',
          icon: Star,
        },
      ],
    },
    {
      title: 'Media & Gallery',
      description: 'Images, videos, and project galleries',
      icon: Image,
      color: 'purple',
      items: [
        {
          title: 'Manage Gallery',
          description: 'Project photos and installation galleries',
          href: '/admin/dashboard/website/gallery',
          icon: Image,
        },
        {
          title: 'Media Library',
          description: 'Upload and organize media files',
          href: '/admin/dashboard/website/media',
          icon: Image,
        },
        {
          title: 'Video Gallery',
          description: 'Installation videos and tutorials',
          href: '/admin/dashboard/website/videos',
          icon: Youtube,
        },
      ],
    },
    {
      title: 'Contact & Social',
      description: 'Contact information and social media',
      icon: Phone,
      color: 'pink',
      items: [
        {
          title: 'Contact Details',
          description: 'Phone, email, address, and business hours',
          href: '/admin/dashboard/website/contact',
          icon: Phone,
        },
        {
          title: 'Social Media Links',
          description: 'Facebook, Instagram, LinkedIn, YouTube',
          href: '/admin/dashboard/website/social',
          icon: Share2,
        },
        {
          title: 'Contact Form Settings',
          description: 'Configure contact form and notifications',
          href: '/admin/dashboard/website/contact-form',
          icon: Mail,
        },
        {
          title: 'Live Chat Settings',
          description: 'Configure live chat widget',
          href: '/admin/dashboard/website/live-chat',
          icon: MessageSquare,
        },
        {
          title: 'Legal Documents',
          description: 'Privacy policy, terms, cookies & sitemap',
          href: '/admin/dashboard/website/legal',
          icon: Shield,
        },
      ],
    },
    {
      title: 'Team & About',
      description: 'Company information and team profiles',
      icon: UsersIcon,
      color: 'indigo',
      items: [
        {
          title: 'About Us Page',
          description: 'Company story, mission, and values',
          href: '/admin/dashboard/website/about',
          icon: Briefcase,
        },
        {
          title: 'Team Profiles',
          description: 'Staff bios and team member profiles',
          href: '/admin/dashboard/website/team',
          icon: UsersIcon,
        },
        {
          title: 'Certifications',
          description: 'Display licenses and certifications',
          href: '/admin/dashboard/website/certifications',
          icon: Award,
        },
      ],
    },
    {
      title: 'Homepage Management',
      description: 'Hero carousel and homepage content',
      icon: Globe,
      color: 'teal',
      items: [
        {
          title: 'Hero Carousel',
          description: 'Manage homepage hero slides and content',
          href: '/admin/dashboard/website/hero-carousel',
          icon: Image,
          badge: 'New',
        },
        {
          title: 'Partners & Logos',
          description: 'Manage partner logos carousel',
          href: '/admin/dashboard/website/partners',
          icon: Briefcase,
        },
      ],
    },
  ];

  const getColorClasses = (color: string) => {
    const colors: Record<string, string> = {
      blue: 'from-blue-500 to-blue-600',
      orange: 'from-orange-500 to-orange-600',
      green: 'from-green-500 to-green-600',
      purple: 'from-purple-500 to-purple-600',
      pink: 'from-pink-500 to-pink-600',
      indigo: 'from-indigo-500 to-indigo-600',
      teal: 'from-teal-500 to-teal-600',
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              onClick={() => router.push('/admin/dashboard')}
              className="text-white hover:bg-white/20 hover:text-white"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
          <div className="flex items-center gap-4">
            <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-sm">
              <Globe className="w-12 h-12" />
            </div>
            <div>
              <h1 className="text-4xl font-bold mb-2">Website Management</h1>
              <p className="text-blue-100 text-lg">
                Manage all public-facing website content and features
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Shop Products</p>
                  <p className="text-2xl font-bold">24</p>
                </div>
                <ShoppingBag className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Extra Services</p>
                  <p className="text-2xl font-bold">8</p>
                </div>
                <Wrench className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Blog Posts</p>
                  <p className="text-2xl font-bold">42</p>
                </div>
                <FileText className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Gallery Images</p>
                  <p className="text-2xl font-bold">156</p>
                </div>
                <Image className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sections */}
        <div className="space-y-8">
          {sections.map((section) => {
            const Icon = section.icon;
            return (
              <div key={section.title}>
                <div className="flex items-center gap-3 mb-4">
                  <div className={`bg-gradient-to-r ${getColorClasses(section.color)} rounded-lg p-2`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{section.title}</h2>
                    <p className="text-gray-600">{section.description}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {section.items.map((item) => {
                    const ItemIcon = item.icon;
                    return (
                      <Link key={item.title} href={item.href}>
                        <Card className="hover:shadow-lg transition-all duration-200 hover:scale-105 cursor-pointer h-full">
                          <CardHeader>
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-3">
                                <div className="bg-gray-100 rounded-lg p-2">
                                  <ItemIcon className="w-5 h-5 text-gray-700" />
                                </div>
                                <div>
                                  <CardTitle className="text-lg flex items-center gap-2">
                                    {item.title}
                                    {item.badge && (
                                      <Badge className="bg-gradient-to-r from-coral to-orange-600 text-white">
                                        {item.badge}
                                      </Badge>
                                    )}
                                  </CardTitle>
                                </div>
                              </div>
                              <ArrowRight className="w-5 h-5 text-gray-400" />
                            </div>
                            <CardDescription className="mt-2">
                              {item.description}
                            </CardDescription>
                          </CardHeader>
                        </Card>
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Info Box */}
        <Card className="mt-8 bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <Globe className="w-8 h-8 text-blue-600 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-lg mb-2">Website Management Tips</h3>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li>• Keep your shop products and services up to date with current pricing</li>
                  <li>• Regularly publish blog posts to improve SEO and customer engagement</li>
                  <li>• Update gallery with recent installation photos to showcase your work</li>
                  <li>• Ensure contact details and social media links are accurate</li>
                  <li>• Respond to testimonials and service bookings promptly</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
