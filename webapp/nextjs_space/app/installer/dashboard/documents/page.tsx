'use client';

import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, FileText, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function InstallerDocumentsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Link href="/installer/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Documents</h1>
              <p className="text-gray-600">Generate and view compliance documents</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Alert className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Document generation is available from the job detail pages. 
            Go to "My Jobs" and select a job to generate SLDs and compliance documents.
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Available Documents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold mb-1">Single Line Diagram (SLD)</h3>
                <p className="text-sm text-gray-600">
                  Generate WP-compliant SLDs with your credentials automatically included
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold mb-1">Certificate of Electrical Safety (COES)</h3>
                <p className="text-sm text-gray-600">
                  State electrical compliance certificate
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold mb-1">CEC Compliance Statement</h3>
                <p className="text-sm text-gray-600">
                  Required for STC rebate claims
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold mb-1">Test Results & Commissioning</h3>
                <p className="text-sm text-gray-600">
                  All electrical test results and commissioning reports
                </p>
              </div>
            </div>

            <div className="mt-6">
              <Link href="/installer/dashboard/jobs">
                <Button>
                  Go to My Jobs
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
