
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { 
  DollarSign, 
  Battery, 
  Package, 
  Gift, 
  Users, 
  LogOut,
  TrendingUp,
  Settings,
  Briefcase,
  Building2,
  LayoutGrid,
  Map,
  Truck,
  Calendar,
  Wrench,
  ShoppingCart,
  FileText,
  Receipt,
  Zap,
  Calculator,
  BookOpen,
  ClipboardCheck,
  Shield,
  Upload,
  Camera,
  ListChecks,
  UserCheck,
  CheckCircle,
  Clock,
  Phone,
  Mail,
  MessageSquare,
  BarChart3,
  Target,
  Activity,
  Bot,
  Workflow,
  Filter,
  Send,
  Globe,
  Sparkles
} from 'lucide-react';
import Link from 'next/link';
import DocumentationModal from '@/components/admin/DocumentationModal';

export default function AdminDashboard() {
  const router = useRouter();
  const [admin, setAdmin] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showDocumentation, setShowDocumentation] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    const adminData = localStorage.getItem('admin_user');

    if (!token || !adminData) {
      router.push('/admin');
      return;
    }

    setAdmin(JSON.parse(adminData));
    setLoading(false);
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    router.push('/admin');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  // Organized menu sections
  const menuSections = [
    {
      title: '📦 Product Management',
      items: [
        {
          title: 'Products',
          description: 'Manage all products (panels, batteries, inverters)',
          icon: Package,
          href: '/admin/products',
          color: 'blue',
        },
        {
          title: 'Products Catalog',
          description: 'View products with pricing and suppliers',
          icon: FileText,
          href: '/admin/products-view',
          color: 'indigo',
        },
        {
          title: 'Suppliers',
          description: 'Manage material suppliers',
          icon: Truck,
          href: '/admin/suppliers',
          color: 'orange',
        },
      ],
    },
    {
      title: '🔧 Installation Costs',
      items: [
        {
          title: 'Installation Costing',
          description: 'Unified system - All installation costs (Kluem rates, complexity, labor)',
          icon: Wrench,
          href: '/admin/installation-costing',
          color: 'blue',
        },
        {
          title: 'Material Orders',
          description: 'Equipment orders, PO generation, PDF, email to suppliers',
          icon: Package,
          href: '/admin/dashboard/orders',
          color: 'green',
        },
      ],
    },
    {
      title: '💰 Pricing & Calculations',
      items: [
        {
          title: 'Quote Tester',
          description: 'Test pricing with auto product selection & profit analysis',
          icon: Calculator,
          href: '/admin/quote-tester',
          color: 'blue',
        },
        {
          title: 'Package Builder',
          description: 'Calculator packages & homepage promotional packages',
          icon: Package,
          href: '/admin/dashboard/packages',
          color: 'purple',
        },
        {
          title: 'Rebates',
          description: 'Government rebate programs',
          icon: Gift,
          href: '/admin/dashboard/rebates',
          color: 'emerald',
        },
        {
          title: 'Taxes (GST)',
          description: 'Tax configuration and GST settings',
          icon: Receipt,
          href: '/admin/dashboard/tax-settings',
          color: 'blue',
        },
      ],
    },
    {
      title: '👥 Customer Management',
      items: [
        {
          title: 'Customer Quotes',
          description: 'All quotes from calculator',
          icon: FileText,
          href: '/admin/dashboard/quotes',
          color: 'purple',
        },
        {
          title: 'Customer Leads',
          description: 'Lead management and tracking',
          icon: Users,
          href: '/admin/dashboard/leads',
          color: 'indigo',
        },
        {
          title: 'Reschedule Requests',
          description: 'Customer reschedule requests',
          icon: Calendar,
          href: '/admin/reschedule-requests',
          color: 'pink',
        },
      ],
    },
    {
      title: '🎯 CRM & Sales Pipeline',
      items: [
        {
          title: 'Sales Dashboard',
          description: 'Pipeline metrics, revenue forecast, win rates',
          icon: BarChart3,
          href: '/admin/crm/dashboard',
          color: 'blue',
        },
        {
          title: 'Pipeline (Kanban)',
          description: 'Visual deal pipeline with drag-and-drop',
          icon: LayoutGrid,
          href: '/admin/crm/pipeline',
          color: 'purple',
        },
        {
          title: 'Lead Distribution',
          description: 'Auto-assign leads, round-robin, territory routing',
          icon: Filter,
          href: '/admin/crm/distribution',
          color: 'orange',
        },
        {
          title: 'Deals Management',
          description: 'Track deals, stages, and conversions',
          icon: Target,
          href: '/admin/crm/deals',
          color: 'green',
        },
        {
          title: 'Activity Timeline',
          description: 'All customer communications and interactions',
          icon: Activity,
          href: '/admin/crm/activities',
          color: 'indigo',
        },
        {
          title: 'Email Integration',
          description: 'Send emails, track opens/clicks, templates',
          icon: Mail,
          href: '/admin/crm/email',
          color: 'blue',
        },
        {
          title: 'SMS Campaigns',
          description: '2-way SMS, bulk messaging, automation',
          icon: MessageSquare,
          href: '/admin/crm/sms',
          color: 'green',
        },
        {
          title: 'Call Logging',
          description: 'Log calls, track duration, outcomes',
          icon: Phone,
          href: '/admin/crm/calls',
          color: 'teal',
        },
        {
          title: 'Automation Rules',
          description: 'Follow-ups, drip campaigns, task automation',
          icon: Workflow,
          href: '/admin/crm/automation',
          color: 'purple',
        },
        {
          title: 'AI Chatbot',
          description: 'Customer support bot with Gemini AI',
          icon: Bot,
          href: '/admin/crm/chatbot',
          color: 'pink',
        },
        {
          title: 'Reports & Analytics',
          description: 'Custom reports, forecasting, team performance',
          icon: TrendingUp,
          href: '/admin/crm/reports',
          color: 'blue',
        },
        {
          title: 'Email Templates',
          description: 'Manage email templates and signatures',
          icon: Send,
          href: '/admin/crm/templates',
          color: 'cyan',
        },
      ],
    },
    {
      title: '✅ Installation Readiness & Compliance',
      items: [
        {
          title: 'Installation Readiness',
          description: 'Track approved customers through installation',
          icon: CheckCircle,
          href: '/admin/installation-readiness',
          color: 'green',
        },
      ],
    },
    {
      title: '👥 Admin & HR',
      items: [
        {
          title: 'Positions',
          description: 'Manage role templates and pay scales',
          icon: Briefcase,
          href: '/admin/dashboard/positions',
          color: 'purple',
        },
        {
          title: 'Vacancies',
          description: 'Job openings and recruitment',
          icon: Briefcase,
          href: '/admin/dashboard/vacancies',
          color: 'green',
        },
        {
          title: 'Applications',
          description: 'Review job applications',
          icon: Users,
          href: '/admin/dashboard/applications',
          color: 'orange',
        },
        {
          title: 'Staff Management',
          description: 'Manage staff members and details',
          icon: Users,
          href: '/admin/dashboard/staff',
          color: 'blue',
        },
        {
          title: 'Electricians',
          description: 'Manage electrician licenses, CEC, and certifications',
          icon: UserCheck,
          href: '/admin/dashboard/settings/electricians',
          color: 'emerald',
        },
        {
          title: 'Teams',
          description: 'Manage installation teams',
          icon: Users,
          href: '/admin/dashboard/teams',
          color: 'indigo',
        },
        {
          title: 'Staff & Teams Overview',
          description: 'Combined staff and teams view',
          icon: Users,
          href: '/admin/staff-teams',
          color: 'cyan',
        },
        {
          title: 'Performance Dashboard',
          description: 'Team metrics, bonuses & leaderboards from completed jobs',
          icon: TrendingUp,
          href: '/admin/performance',
          color: 'green',
        },
      ],
    },
    {
      title: '🚀 Operations & Jobs',
      items: [
        {
          title: 'Job Assignment',
          description: 'View and manage all jobs',
          icon: Briefcase,
          href: '/admin/jobs',
          color: 'cyan',
        },
        {
          title: 'Job Board (Kanban)',
          description: '7-stage visual pipeline',
          icon: LayoutGrid,
          href: '/admin/jobs-kanban',
          color: 'teal',
        },
        {
          title: 'Schedule',
          description: 'Deliveries and installations calendar',
          icon: Calendar,
          href: '/admin/schedule',
          color: 'green',
        },
        {
          title: 'Operations Map',
          description: 'Geographic view of jobs',
          icon: Map,
          href: '/admin/operations-map',
          color: 'blue',
        },
        {
          title: 'Leads Map',
          description: 'All leads on map by status',
          icon: Map,
          href: '/admin/leads-map',
          color: 'purple',
        },
        {
          title: 'Subcontractors',
          description: 'External contractors and rates',
          icon: Building2,
          href: '/admin/dashboard/subcontractors',
          color: 'indigo',
        },
      ],
    },
    {
      title: '👷 Installer Portal',
      items: [
        {
          title: 'Installer Portal',
          description: 'Mobile field service app with 7-stage wizard workflow',
          icon: Wrench,
          href: '/mobile/installer',
          color: 'orange',
        },
        {
          title: 'Photo Upload',
          description: 'Upload installation photos (30-50 required)',
          icon: Camera,
          href: '/installer/photos',
          color: 'purple',
        },
        {
          title: 'QR Scanner',
          description: 'Scan equipment serial numbers',
          icon: ClipboardCheck,
          href: '/installer/scanner',
          color: 'green',
        },
        {
          title: 'Compliance Checklist',
          description: 'Interactive installation checklist',
          icon: ListChecks,
          href: '/installer/checklist',
          color: 'orange',
        },
        {
          title: 'Time & Attendance',
          description: 'Clock in/out with GPS verification',
          icon: Clock,
          href: '/installer/attendance',
          color: 'indigo',
        },
        {
          title: 'Document Upload',
          description: 'Upload certificates and compliance docs',
          icon: Upload,
          href: '/installer/documents',
          color: 'teal',
        },
      ],
    },
    {
      title: '🎨 Design Tools',
      items: [
        {
          title: 'Interactive SLD Designer',
          description: 'Design single line diagrams with drag-and-drop',
          icon: Zap,
          href: '/admin/dashboard/design',
          color: 'blue',
        },
        {
          title: 'Voltage Rise Calculator',
          description: 'Calculate voltage drop and compliance',
          icon: Calculator,
          href: '/admin/dashboard/design/voltage-calculator',
          color: 'green',
        },
      ],
    },
    {
      title: '🌐 Website & Content',
      items: [
        {
          title: 'Website Management',
          description: 'Manage shop, services, blog, gallery, and hero carousel',
          icon: Globe,
          href: '/admin/dashboard/website',
          color: 'blue',
        },
        {
          title: 'Content Strategy',
          description: 'AI-powered SEO content strategy - Generate 40+ articles with funnels',
          icon: Sparkles,
          href: '/admin/dashboard/content-strategy',
          color: 'purple',
        },
      ],
    },
    {
      title: '⚙️ System & Analytics',
      items: [
        {
          title: 'Analytics',
          description: 'Sales and conversion metrics',
          icon: TrendingUp,
          href: '/admin/dashboard/analytics',
          color: 'blue',
        },
        {
          title: 'Company Settings',
          description: 'Company details, logos, and branding',
          icon: Building2,
          href: '/settings/company',
          color: 'purple',
        },
        {
          title: 'API Settings',
          description: 'Stripe, AI, email/SMS config',
          icon: Settings,
          href: '/admin/dashboard/api-settings',
          color: 'coral',
        },
        {
          title: 'Pricing Settings',
          description: 'Supplier selection strategy',
          icon: Settings,
          href: '/admin/dashboard/system-settings',
          color: 'purple',
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Settings className="h-8 w-8 text-primary mr-3" />
              <div>
                <h1 className="text-xl font-bold text-primary">Admin Dashboard</h1>
                <p className="text-xs text-gray-500">Sun Direct Power</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-900">{admin?.name}</p>
                <p className="text-xs text-gray-500">{admin?.email}</p>
              </div>
              <Button
                variant="outline"
                onClick={handleLogout}
                className="flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Welcome back, {admin?.name}! 👋
          </h2>
          <p className="text-gray-600">
            Manage your solar business pricing, leads, and analytics from here.
          </p>
        </div>

        {/* Menu Sections */}
        <div className="space-y-8">
          {menuSections.map((section, sectionIdx) => (
            <div key={sectionIdx}>
              {/* Section Header */}
              <div className="flex items-center justify-between mb-4 pb-2 border-b-2 border-gray-200">
                <h3 className="text-xl font-bold text-gray-900">
                  {section.title}
                </h3>
                {section.title === '📦 Product Management' && (
                  <Button
                    onClick={() => setShowDocumentation(true)}
                    variant="outline"
                    size="sm"
                    className="border-blue-600 text-blue-600 hover:bg-blue-50"
                  >
                    <BookOpen className="w-4 h-4 mr-2" />
                    Help & Guide
                  </Button>
                )}
              </div>
              
              {/* Section Items Grid */}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link key={item.href} href={item.href}>
                      <div className="bg-white rounded-lg border-2 border-gray-200 hover:border-blue-400 hover:shadow-md transition-all p-4 cursor-pointer group h-full">
                        <div className="flex items-start gap-3">
                          <div className={`bg-${item.color}-500 rounded-lg h-10 w-10 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
                            <Icon className="h-5 w-5 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-gray-900 mb-1 text-sm">{item.title}</h4>
                            <p className="text-xs text-gray-600 line-clamp-2">{item.description}</p>
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Quick Stats */}
        <div className="mt-8 grid md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-gold-50 to-white rounded-xl p-6 border-2 border-gold-200">
            <p className="text-sm text-gray-600 mb-1">Active Pricing</p>
            <p className="text-3xl font-bold text-gold">$1,000</p>
            <p className="text-xs text-gray-500 mt-1">per kW solar</p>
          </div>
          <div className="bg-gradient-to-br from-coral-50 to-white rounded-xl p-6 border-2 border-coral-200">
            <p className="text-sm text-gray-600 mb-1">New Leads</p>
            <p className="text-3xl font-bold text-coral">0</p>
            <p className="text-xs text-gray-500 mt-1">this week</p>
          </div>
          <div className="bg-gradient-to-br from-emerald-50 to-white rounded-xl p-6 border-2 border-emerald-200">
            <p className="text-sm text-gray-600 mb-1">Active Rebates</p>
            <p className="text-3xl font-bold text-emerald">3</p>
            <p className="text-xs text-gray-500 mt-1">programs</p>
          </div>
          <div className="bg-gradient-to-br from-primary-50 to-white rounded-xl p-6 border-2 border-primary-200">
            <p className="text-sm text-gray-600 mb-1">Conversion Rate</p>
            <p className="text-3xl font-bold text-primary">N/A</p>
            <p className="text-xs text-gray-500 mt-1">quote to sale</p>
          </div>
        </div>

        {/* Documentation Modal */}
        {showDocumentation && (
          <DocumentationModal
            onClose={() => setShowDocumentation(false)}
          />
        )}
      </main>
    </div>
  );
}
