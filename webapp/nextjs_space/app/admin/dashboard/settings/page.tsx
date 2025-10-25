'use client';

import Link from 'next/link';
import { 
  Building2, 
  Users, 
  Zap, 
  DollarSign, 
  Settings as SettingsIcon,
  Receipt,
  Shield,
  UserCheck,
  ArrowRight,
  Wrench
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

export default function SettingsHub() {
  const settingsCategories = [
    {
      title: 'Company & Branding',
      description: 'Company information, logos, and compliance details',
      icon: Building2,
      color: 'blue',
      items: [
        {
          title: 'Company Settings',
          description: 'Company details, ABN, licenses, contact information',
          href: '/settings/company',
          icon: Building2,
        },
      ],
    },
    {
      title: 'People & Teams',
      description: 'Manage staff, electricians, and subcontractors',
      icon: Users,
      color: 'green',
      items: [
        {
          title: 'Electrician Management',
          description: 'Manage electrician profiles, licenses, and certificates',
          href: '/admin/dashboard/settings/electricians',
          icon: UserCheck,
          badge: 'New',
        },
        {
          title: 'Team Management',
          description: 'Manage in-house teams and team members',
          href: '/admin/dashboard/teams',
          icon: Users,
        },
        {
          title: 'Subcontractor Management',
          description: 'Manage subcontractors and their rates',
          href: '/admin/dashboard/subcontractors',
          icon: Wrench,
        },
      ],
    },
    {
      title: 'Pricing & Products',
      description: 'Configure pricing, markups, and product settings',
      icon: DollarSign,
      color: 'yellow',
      items: [
        {
          title: 'Solar Pricing',
          description: 'Panel pricing and supplier management',
          href: '/admin/dashboard/solar-pricing',
          icon: Zap,
        },
        {
          title: 'Battery Pricing',
          description: 'Battery pricing and configurations',
          href: '/admin/dashboard/battery-pricing',
          icon: Zap,
        },
        {
          title: 'Inverter Pricing',
          description: 'Inverter brands and pricing',
          href: '/admin/dashboard/inverter-brands',
          icon: Zap,
        },
        {
          title: 'Manage Add-ons',
          description: 'Solar add-ons and checkout visibility',
          href: '/admin/dashboard/manage-addons',
          icon: DollarSign,
          badge: 'New',
        },
        {
          title: 'Addons & Extras',
          description: 'Additional products and services',
          href: '/admin/dashboard/addons',
          icon: DollarSign,
        },
        {
          title: 'Extra Costs',
          description: 'Installation and regulatory costs',
          href: '/admin/dashboard/extra-costs',
          icon: Receipt,
        },
      ],
    },
    {
      title: 'System Configuration',
      description: 'Technical settings and integrations',
      icon: SettingsIcon,
      color: 'purple',
      items: [
        {
          title: 'Solar Calculation Settings',
          description: 'Solar production, rates, and financial projections',
          href: '/admin/dashboard/solar-calculation-settings',
          icon: Zap,
          badge: 'New',
        },
        {
          title: 'Popup Settings',
          description: 'Control when and where popups appear',
          href: '/admin/dashboard/popup-settings',
          icon: SettingsIcon,
          badge: 'New',
        },
        {
          title: 'API Settings',
          description: 'Stripe, AI, email/SMS configuration',
          href: '/admin/dashboard/settings/api',
          icon: Zap,
        },
        {
          title: 'System Settings',
          description: 'Supplier strategy, markups, and margins',
          href: '/admin/dashboard/settings/system',
          icon: SettingsIcon,
        },
        {
          title: 'Tax Settings',
          description: 'Tax rates and configurations',
          href: '/admin/dashboard/settings/tax',
          icon: Receipt,
        },
      ],
    },
    {
      title: 'Compliance & Safety',
      description: 'Licenses, insurance, and compliance tracking',
      icon: Shield,
      color: 'red',
      items: [
        {
          title: 'Compliance Tracking',
          description: 'Track licenses, certificates, and expiry dates',
          href: '/admin/dashboard/compliance',
          icon: Shield,
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
              <p className="text-gray-600 mt-1">Manage all system settings and configurations</p>
            </div>
            <Link 
              href="/admin/dashboard"
              className="text-sm text-blue-600 hover:text-blue-700 flex items-center"
            >
              Back to Dashboard
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Settings Categories */}
        <div className="space-y-8">
          {settingsCategories.map((category) => (
            <div key={category.title}>
              <div className="flex items-center mb-4">
                <category.icon className={`h-6 w-6 text-${category.color}-600 mr-2`} />
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">{category.title}</h2>
                  <p className="text-sm text-gray-600">{category.description}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {category.items.map((item) => (
                  <Link key={item.href} href={item.href}>
                    <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex items-center">
                            <div className={`w-10 h-10 bg-${category.color}-100 rounded-lg flex items-center justify-center mr-3`}>
                              <item.icon className={`h-5 w-5 text-${category.color}-600`} />
                            </div>
                            <div>
                              <CardTitle className="text-base flex items-center">
                                {item.title}
                                {item.badge && (
                                  <span className="ml-2 px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded-full">
                                    {item.badge}
                                  </span>
                                )}
                              </CardTitle>
                            </div>
                          </div>
                          <ArrowRight className="h-4 w-4 text-gray-400" />
                        </div>
                        <CardDescription className="mt-2">
                          {item.description}
                        </CardDescription>
                      </CardHeader>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="mt-12 bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/settings/company">
              <div className="bg-white p-4 rounded-lg hover:shadow-md transition-shadow cursor-pointer">
                <Building2 className="h-8 w-8 text-blue-600 mb-2" />
                <h4 className="font-semibold">Update Company Info</h4>
                <p className="text-sm text-gray-600">Change company details and branding</p>
              </div>
            </Link>
            
            <Link href="/admin/dashboard/settings/electricians">
              <div className="bg-white p-4 rounded-lg hover:shadow-md transition-shadow cursor-pointer">
                <UserCheck className="h-8 w-8 text-green-600 mb-2" />
                <h4 className="font-semibold">Add Electrician</h4>
                <p className="text-sm text-gray-600">Create new electrician profile</p>
              </div>
            </Link>
            
            <Link href="/admin/dashboard/settings/api">
              <div className="bg-white p-4 rounded-lg hover:shadow-md transition-shadow cursor-pointer">
                <Zap className="h-8 w-8 text-purple-600 mb-2" />
                <h4 className="font-semibold">Configure APIs</h4>
                <p className="text-sm text-gray-600">Set up Stripe, email, and SMS</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
