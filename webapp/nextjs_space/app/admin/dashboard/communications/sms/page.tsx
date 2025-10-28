'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, MessageSquare, Construction } from 'lucide-react';
import Link from 'next/link';

export default function SMSInterface() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Link href="/admin/dashboard/communications">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              </Link>
              <div className="flex items-center">
                <MessageSquare className="h-8 w-8 text-green-600 mr-3" />
                <div>
                  <h1 className="text-xl font-bold text-gray-900">SMS Messages</h1>
                  <p className="text-xs text-gray-500">Two-way SMS messaging</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="p-12 text-center">
          <Construction className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">SMS Interface Coming Soon</h2>
          <p className="text-gray-600 mb-6">
            This feature is currently under development. You can still use the existing SMS functionality in the CRM section.
          </p>
          <Link href="/admin/crm/sms">
            <Button>
              <MessageSquare className="h-4 w-4 mr-2" />
              Go to CRM SMS
            </Button>
          </Link>
        </Card>
      </main>
    </div>
  );
}
