'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DollarSign, ExternalLink, Clock } from 'lucide-react';
import Link from 'next/link';

export default function RebateTrackingPage() {
  const [rebates, setRebates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/rebate-tracking')
      .then(res => res.json())
      .then(data => {
        setRebates(data.rebates || []);
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
          <DollarSign className="h-8 w-8" />
          Rebate Tracking
        </h1>
        <p className="text-muted-foreground">
          STC, Federal & WA State battery rebates
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Greendeal STC Portal</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Small-scale Technology Certificates for solar systems
          </p>
          <a 
            href="https://www.greendeal.com.au/retailers/pvds" 
            target="_blank" 
            rel="noopener noreferrer"
          >
            <Button className="w-full">
              <ExternalLink className="w-4 h-4 mr-2" />
              Open Greendeal Portal
            </Button>
          </a>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Plenti Battery Rebate</h3>
          <p className="text-sm text-muted-foreground mb-4">
            WA State battery rebate applications
          </p>
          <a 
            href="https://portal.plenti.com.au/" 
            target="_blank" 
            rel="noopener noreferrer"
          >
            <Button className="w-full">
              <ExternalLink className="w-4 h-4 mr-2" />
              Open Plenti Portal
            </Button>
          </a>
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Rebate Applications</h3>
        <div className="space-y-3">
          {rebates.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No rebate applications yet. Applications will appear here once submitted.
            </p>
          ) : (
            rebates.map((rebate: any) => (
              <div key={rebate.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">{rebate.leadName}</p>
                  <p className="text-sm text-muted-foreground">
                    STC: ${rebate.stcAmount} | Battery: ${rebate.batteryRebate || 0}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge>{rebate.status || 'Pending'}</Badge>
                  <Link href={`/admin/leads/${rebate.leadId}`}>
                    <Button variant="outline" size="sm">View</Button>
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
