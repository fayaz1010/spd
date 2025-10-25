'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Shield, ExternalLink, CheckCircle, Clock } from 'lucide-react';
import Link from 'next/link';

export default function RegulatoryApplicationsPage() {
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/regulatory-applications')
      .then(res => res.json())
      .then(data => {
        setApplications(data.applications || []);
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
          <Shield className="h-8 w-8" />
          Regulatory Applications
        </h1>
        <p className="text-muted-foreground">
          Synergy DES & Western Power applications
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Synergy DES Applications</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Distributed Energy System applications for grid connection
          </p>
          <a 
            href="https://selfserve.synergy.net.au/distributed-energy-system.html" 
            target="_blank" 
            rel="noopener noreferrer"
          >
            <Button className="w-full">
              <ExternalLink className="w-4 h-4 mr-2" />
              Open Synergy Portal
            </Button>
          </a>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Western Power Applications</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Network connection and capacity applications
          </p>
          <a 
            href="https://www.westernpower.com.au/products-and-services/" 
            target="_blank" 
            rel="noopener noreferrer"
          >
            <Button className="w-full">
              <ExternalLink className="w-4 h-4 mr-2" />
              Open Western Power Portal
            </Button>
          </a>
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Recent Applications</h3>
        <div className="space-y-3">
          {applications.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No applications yet. Applications will appear here once submitted.
            </p>
          ) : (
            applications.map((app: any) => (
              <div key={app.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">{app.leadName}</p>
                  <p className="text-sm text-muted-foreground">{app.address}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge>{app.synergyStatus || 'Pending'}</Badge>
                  <Badge>{app.westernPowerStatus || 'Pending'}</Badge>
                  <Link href={`/admin/leads/${app.leadId}`}>
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
