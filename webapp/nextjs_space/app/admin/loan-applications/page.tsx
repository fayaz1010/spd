'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, ExternalLink, Clock } from 'lucide-react';
import Link from 'next/link';

export default function LoanApplicationsPage() {
  const [loans, setLoans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/loan-applications')
      .then(res => res.json())
      .then(data => {
        setLoans(data.loans || []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error:', err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <Clock className="w-8 h-8 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <FileText className="h-8 w-8" />
          WA Interest-Free Loan Applications
        </h1>
        <p className="text-muted-foreground">
          Track 0% interest battery loan applications via Plenti
        </p>
      </div>

      <Card className="p-6 bg-blue-50 border-blue-200">
        <h3 className="text-lg font-semibold mb-2">Plenti Loan Portal</h3>
        <p className="text-sm text-muted-foreground mb-4">
          WA Government 0% interest loans for battery systems ($2,001 - $10,000)
        </p>
        <a 
          href="https://portal.plenti.com.au/" 
          target="_blank" 
          rel="noopener noreferrer"
        >
          <Button>
            <ExternalLink className="w-4 h-4 mr-2" />
            Open Plenti Vendor Portal
          </Button>
        </a>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Loan Applications</h3>
        <div className="space-y-3">
          {loans.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No loan applications yet. Applications will appear here once submitted.
            </p>
          ) : (
            loans.map((loan: any) => (
              <div key={loan.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">{loan.leadName}</p>
                  <p className="text-sm text-muted-foreground">
                    Amount: ${loan.loanAmount} | Term: {loan.loanTerm} months
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Income: ${loan.householdIncome} | Dependents: {loan.numberOfDependents}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={loan.status === 'APPROVED' ? 'default' : 'secondary'}>
                    {loan.status || 'Pending'}
                  </Badge>
                  <Link href={`/admin/leads/${loan.leadId}`}>
                    <Button variant="outline" size="sm">View</Button>
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      <Card className="p-6 bg-yellow-50 border-yellow-200">
        <h3 className="text-lg font-semibold mb-2">⚠️ Important Requirements</h3>
        <ul className="text-sm space-y-1 text-gray-700">
          <li>• Household income must be under $210,000</li>
          <li>• Minimum 5kWh battery system required</li>
          <li>• VPP connection mandatory (Synergy or Plico)</li>
          <li>• Loan approval is a GATE for installation scheduling</li>
          <li>• Installer applies on behalf of customer</li>
        </ul>
      </Card>
    </div>
  );
}
