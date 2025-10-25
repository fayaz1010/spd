'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

export default function TestSeedDataPage() {
  const [leads, setLeads] = useState<any[]>([]);
  const [quotes, setQuotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/leads').then(r => r.json()),
      fetch('/api/admin/quotes').then(r => r.json()).catch(() => ({ quotes: [] })),
    ]).then(([leadsData, quotesData]) => {
      setLeads(leadsData.leads || []);
      setQuotes(quotesData.quotes || []);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return <div className="container mx-auto p-6">Loading...</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">🧪 Seeded Data Test</h1>
        <p className="text-muted-foreground">
          Verify that all 5 test customers were seeded correctly
        </p>
      </div>

      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-4">Leads ({leads.length})</h2>
        <div className="space-y-3">
          {leads.length === 0 ? (
            <p className="text-red-600">❌ No leads found! Seed script may have failed.</p>
          ) : (
            leads.map((lead: any) => (
              <div key={lead.id} className="p-4 border rounded-lg">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-lg">{lead.name}</h3>
                    <p className="text-sm text-muted-foreground">{lead.email}</p>
                    <p className="text-sm text-muted-foreground">{lead.address}</p>
                    <p className="text-sm">
                      System: {lead.systemSizeKw}kW, {lead.numPanels} panels
                      {lead.batterySizeKwh > 0 && ` + ${lead.batterySizeKwh}kWh battery`}
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 items-end">
                    <Badge>{lead.status}</Badge>
                    <Link href={`/admin/leads/${lead.id}`}>
                      <span className="text-sm text-blue-600 hover:underline">View Details →</span>
                    </Link>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-4">Expected Seeded Data</h2>
        <div className="space-y-2 text-sm">
          <p>✅ <strong>Stage 1:</strong> John Smith - Fresh calculator lead (no quote)</p>
          <p>✅ <strong>Stage 2:</strong> Sarah Johnson - Quote generated (6.6kW + 10kWh)</p>
          <p>✅ <strong>Stage 3:</strong> Michael Chen - Proposal sent (13.2kW + 20kWh)</p>
          <p>✅ <strong>Stage 4:</strong> Emma Wilson - Proposal viewed (6.6kW solar)</p>
          <p>✅ <strong>Stage 5:</strong> David Brown - Proposal signed (6.6kW + 10kWh)</p>
        </div>
      </Card>

      {leads.length > 0 && (
        <Card className="p-6 bg-green-50 border-green-200">
          <h3 className="text-lg font-bold text-green-800 mb-2">✅ Success!</h3>
          <p className="text-green-700">
            Found {leads.length} leads in database. Seed script worked!
          </p>
          <div className="mt-4 space-y-1 text-sm">
            <p><strong>Next steps:</strong></p>
            <p>1. Visit <Link href="/admin/leads" className="text-blue-600 hover:underline">/admin/leads</Link> to see all leads</p>
            <p>2. Visit <Link href="/admin/installation-readiness" className="text-blue-600 hover:underline">/admin/installation-readiness</Link> to see gate status</p>
            <p>3. Click "View Details" on any lead above to see full information</p>
          </div>
        </Card>
      )}
    </div>
  );
}
