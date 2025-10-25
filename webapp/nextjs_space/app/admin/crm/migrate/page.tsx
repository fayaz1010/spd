'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Database, CheckCircle, XCircle, Loader2, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';

export default function MigrateLeadsPage() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const { toast } = useToast();

  const runMigration = async () => {
    if (!confirm('This will create deals for all existing leads that don\'t have them. Continue?')) {
      return;
    }

    setLoading(true);
    setResults(null);

    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch('/api/admin/crm/migrate-existing-leads', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setResults(data.results);
        toast({
          title: 'Migration Complete',
          description: `Successfully created ${data.results.successful} deals`,
        });
      } else {
        throw new Error('Migration failed');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to run migration',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link href="/admin/crm/dashboard">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to CRM
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-primary">CRM Migration Tool</h1>
          <p className="text-gray-600 mt-2">
            Create deals for existing leads that don't have them yet
          </p>
        </div>

        {/* Warning Card */}
        <Card className="p-6 mb-6 bg-yellow-50 border-yellow-200">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-6 w-6 text-yellow-600 mt-1" />
            <div>
              <h3 className="font-semibold text-yellow-900 mb-2">Important Information</h3>
              <ul className="text-sm text-yellow-800 space-y-1 list-disc list-inside">
                <li>This migration will create deals for all confirmed leads (with contact info)</li>
                <li>Leads without contact information will be skipped</li>
                <li>Existing deals will not be duplicated</li>
                <li>Lead scores will be calculated automatically</li>
                <li>Deals will be assigned to sales reps using round-robin</li>
                <li>This is safe to run multiple times</li>
              </ul>
            </div>
          </div>
        </Card>

        {/* Action Card */}
        <Card className="p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 rounded-full p-3">
                <Database className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Run Migration</h3>
                <p className="text-sm text-gray-600">
                  Create deals for existing calculator-generated leads
                </p>
              </div>
            </div>
            <Button
              onClick={runMigration}
              disabled={loading}
              size="lg"
              className="bg-primary hover:bg-primary-700"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Running...
                </>
              ) : (
                <>
                  <Database className="h-4 w-4 mr-2" />
                  Run Migration
                </>
              )}
            </Button>
          </div>
        </Card>

        {/* Results Card */}
        {results && (
          <Card className="p-6">
            <h3 className="font-semibold text-lg mb-4">Migration Results</h3>
            
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-blue-50 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-600 mb-1">Total Leads</p>
                <p className="text-3xl font-bold text-blue-600">{results.total}</p>
              </div>
              <div className="bg-green-50 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-600 mb-1">Successful</p>
                <p className="text-3xl font-bold text-green-600 flex items-center justify-center gap-2">
                  <CheckCircle className="h-6 w-6" />
                  {results.successful}
                </p>
              </div>
              <div className="bg-red-50 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-600 mb-1">Failed</p>
                <p className="text-3xl font-bold text-red-600 flex items-center justify-center gap-2">
                  <XCircle className="h-6 w-6" />
                  {results.failed}
                </p>
              </div>
            </div>

            {results.errors && results.errors.length > 0 && (
              <div className="mt-6">
                <h4 className="font-semibold text-red-600 mb-3">Errors:</h4>
                <div className="space-y-2">
                  {results.errors.map((error: any, index: number) => (
                    <div key={index} className="bg-red-50 border border-red-200 rounded p-3">
                      <p className="font-medium text-sm">Lead: {error.leadName} ({error.leadId})</p>
                      <p className="text-xs text-red-600 mt-1">{error.error}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {results.successful > 0 && (
              <div className="mt-6 pt-6 border-t">
                <Link href="/admin/crm/deals">
                  <Button className="w-full bg-primary hover:bg-primary-700">
                    View Deals →
                  </Button>
                </Link>
              </div>
            )}
          </Card>
        )}

        {/* Instructions */}
        <Card className="p-6 mt-6">
          <h3 className="font-semibold mb-3">What happens during migration?</h3>
          <ol className="space-y-2 text-sm text-gray-600">
            <li className="flex items-start gap-2">
              <span className="font-bold text-primary">1.</span>
              <span>System finds all leads with contact information but no associated deal</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-primary">2.</span>
              <span>For each lead, a deal is created with:</span>
            </li>
            <li className="ml-6 flex items-start gap-2">
              <span>•</span>
              <span>Calculated lead score (0-100) based on system value, engagement, etc.</span>
            </li>
            <li className="ml-6 flex items-start gap-2">
              <span>•</span>
              <span>Automatic owner assignment using round-robin distribution</span>
            </li>
            <li className="ml-6 flex items-start gap-2">
              <span>•</span>
              <span>Initial stage set based on lead status</span>
            </li>
            <li className="ml-6 flex items-start gap-2">
              <span>•</span>
              <span>Win probability calculated from stage and score</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-primary">3.</span>
              <span>Activity log created for each new deal</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-primary">4.</span>
              <span>Results summary displayed with success/failure counts</span>
            </li>
          </ol>
        </Card>
      </div>
    </div>
  );
}
