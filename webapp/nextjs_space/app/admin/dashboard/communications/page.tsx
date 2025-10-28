'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Mail,
  MessageSquare,
  Phone,
  ArrowLeft,
  Inbox,
  Send,
  Archive,
  Sparkles,
  TrendingUp,
  Users
} from 'lucide-react';
import Link from 'next/link';

export default function CommunicationsHub() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    unreadEmails: 0,
    unreadSMS: 0,
    unreadWhatsApp: 0,
    totalEmails: 0,
    totalSMS: 0,
    totalWhatsApp: 0
  });

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      router.push('/admin');
      return;
    }
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch('/api/admin/communications/stats', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const communicationCards = [
    {
      title: 'Operations Intelligence',
      description: 'Email-linked operations tracking & visualization',
      icon: TrendingUp,
      href: '/admin/dashboard/communications/operations',
      color: 'blue',
      stats: {
        unread: stats.unreadEmails,
        total: stats.totalEmails
      },
      features: [
        'Approval tracking (Synergy/Western Power)',
        'Rebate & STC monitoring',
        'Order & supplier communications',
        'Auto-link to database records'
      ]
    },
    {
      title: 'Email Groups',
      description: 'Categorized emails with AI analysis',
      icon: Mail,
      href: '/admin/dashboard/communications/email/groups',
      color: 'indigo',
      stats: {
        unread: stats.unreadEmails,
        total: stats.totalEmails
      },
      features: [
        'AI categorization',
        'Group by business type',
        'Approval workflows',
        'External system linking'
      ]
    },
    {
      title: 'SMS',
      description: 'Send and receive SMS messages with customers',
      icon: MessageSquare,
      href: '/admin/dashboard/communications/sms',
      color: 'green',
      stats: {
        unread: stats.unreadSMS,
        total: stats.totalSMS
      },
      features: [
        'Two-way messaging',
        'Bulk SMS campaigns',
        'Auto-responses',
        'Delivery tracking'
      ]
    },
    {
      title: 'WhatsApp',
      description: 'Connect with customers via WhatsApp Business',
      icon: Phone,
      href: '/admin/dashboard/communications/whatsapp',
      color: 'emerald',
      stats: {
        unread: stats.unreadWhatsApp,
        total: stats.totalWhatsApp
      },
      features: [
        'WhatsApp Business API',
        'Rich media support',
        'Template messages',
        'Read receipts'
      ]
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Link href="/admin/dashboard">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              </Link>
              <div className="flex items-center">
                <MessageSquare className="h-8 w-8 text-blue-600 mr-3" />
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Communication Hub</h1>
                  <p className="text-xs text-gray-500">Manage all customer communications</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6 bg-gradient-to-br from-blue-50 to-white border-2 border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Messages</p>
                <p className="text-3xl font-bold text-blue-600">
                  {stats.totalEmails + stats.totalSMS + stats.totalWhatsApp}
                </p>
              </div>
              <Inbox className="h-12 w-12 text-blue-400" />
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-green-50 to-white border-2 border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Unread</p>
                <p className="text-3xl font-bold text-green-600">
                  {stats.unreadEmails + stats.unreadSMS + stats.unreadWhatsApp}
                </p>
              </div>
              <Mail className="h-12 w-12 text-green-400" />
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-purple-50 to-white border-2 border-purple-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Response Rate</p>
                <p className="text-3xl font-bold text-purple-600">87%</p>
              </div>
              <TrendingUp className="h-12 w-12 text-purple-400" />
            </div>
          </Card>
        </div>

        {/* Communication Channels */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Communication Channels</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {communicationCards.map((card) => {
              const Icon = card.icon;
              return (
                <Link key={card.href} href={card.href}>
                  <Card className="p-6 hover:shadow-lg transition-all cursor-pointer border-2 hover:border-blue-400 h-full">
                    <div className="flex items-start justify-between mb-4">
                      <div className={`bg-${card.color}-500 rounded-lg h-12 w-12 flex items-center justify-center`}>
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                      {card.stats.unread > 0 && (
                        <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                          {card.stats.unread}
                        </span>
                      )}
                    </div>

                    <h3 className="text-xl font-bold text-gray-900 mb-2">{card.title}</h3>
                    <p className="text-sm text-gray-600 mb-4">{card.description}</p>

                    <div className="space-y-2 mb-4">
                      {card.features.map((feature, idx) => (
                        <div key={idx} className="flex items-center text-xs text-gray-600">
                          <Sparkles className="h-3 w-3 mr-2 text-yellow-500" />
                          {feature}
                        </div>
                      ))}
                    </div>

                    <div className="pt-4 border-t border-gray-200">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Total:</span>
                        <span className="font-semibold text-gray-900">{card.stats.total}</span>
                      </div>
                      <div className="flex justify-between text-sm mt-1">
                        <span className="text-gray-600">Unread:</span>
                        <span className="font-semibold text-red-600">{card.stats.unread}</span>
                      </div>
                    </div>

                    <Button className="w-full mt-4" variant="outline">
                      Open {card.title}
                    </Button>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Actions</h2>
          <div className="grid md:grid-cols-4 gap-4">
            <Link href="/admin/dashboard/communications/email?compose=true">
              <Card className="p-4 hover:shadow-md transition-all cursor-pointer border-2 hover:border-blue-400">
                <div className="flex items-center gap-3">
                  <Send className="h-8 w-8 text-blue-600" />
                  <div>
                    <h4 className="font-semibold text-gray-900">Send Email</h4>
                    <p className="text-xs text-gray-600">Compose new email</p>
                  </div>
                </div>
              </Card>
            </Link>

            <Link href="/admin/dashboard/communications/sms?compose=true">
              <Card className="p-4 hover:shadow-md transition-all cursor-pointer border-2 hover:border-green-400">
                <div className="flex items-center gap-3">
                  <MessageSquare className="h-8 w-8 text-green-600" />
                  <div>
                    <h4 className="font-semibold text-gray-900">Send SMS</h4>
                    <p className="text-xs text-gray-600">Quick text message</p>
                  </div>
                </div>
              </Card>
            </Link>

            <Link href="/admin/crm/templates">
              <Card className="p-4 hover:shadow-md transition-all cursor-pointer border-2 hover:border-purple-400">
                <div className="flex items-center gap-3">
                  <Archive className="h-8 w-8 text-purple-600" />
                  <div>
                    <h4 className="font-semibold text-gray-900">Templates</h4>
                    <p className="text-xs text-gray-600">Manage templates</p>
                  </div>
                </div>
              </Card>
            </Link>

            <Link href="/admin/crm/automation">
              <Card className="p-4 hover:shadow-md transition-all cursor-pointer border-2 hover:border-orange-400">
                <div className="flex items-center gap-3">
                  <Sparkles className="h-8 w-8 text-orange-600" />
                  <div>
                    <h4 className="font-semibold text-gray-900">Automation</h4>
                    <p className="text-xs text-gray-600">Set up rules</p>
                  </div>
                </div>
              </Card>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
