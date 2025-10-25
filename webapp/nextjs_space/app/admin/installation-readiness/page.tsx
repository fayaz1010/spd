'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  CheckCircle, 
  Clock, 
  Shield, 
  Users, 
  Package, 
  Calendar, 
  FileCheck, 
  ArrowLeft,
  Loader2 
} from 'lucide-react';
import Link from 'next/link';

interface Lead {
  id: string;
  name: string;
  address: string;
  systemSizeKw: number;
  batterySizeKwh: number;
  quoteReference: string;
}

interface ReadinessData {
  applicationsApproved: Lead[];
  teamAssigned: Lead[];
  materialsOrdered: Lead[];
  scheduled: Lead[];
  completed: Lead[];
  documentationSubmitted: Lead[];
  metrics: {
    totalAccepted: number;
    applicationsApprovedCount: number;
    teamAssignedCount: number;
    materialsOrderedCount: number;
    scheduledCount: number;
    completedCount: number;
    documentationSubmittedCount: number;
  };
}

export default function InstallationReadinessPage() {
  const router = useRouter();
  const [data, setData] = useState<ReadinessData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReadinessData();
  }, []);

  const fetchReadinessData = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch('/api/admin/installation-readiness/summary', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        setData(result);
      }
    } catch (error) {
      console.error('Error fetching readiness data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  const sections = [
    {
      title: 'Applications Approved',
      description: 'All regulatory, rebate & loan approvals complete',
      icon: Shield,
      color: 'blue',
      leads: data?.applicationsApproved || [],
    },
    {
      title: 'Team Assigned',
      description: 'Installation team allocated',
      icon: Users,
      color: 'purple',
      leads: data?.teamAssigned || [],
    },
    {
      title: 'Materials Ordered',
      description: 'Equipment purchase orders sent',
      icon: Package,
      color: 'orange',
      leads: data?.materialsOrdered || [],
    },
    {
      title: 'Scheduled',
      description: 'Installation date confirmed',
      icon: Calendar,
      color: 'green',
      leads: data?.scheduled || [],
    },
    {
      title: 'Completed',
      description: 'Installation finished',
      icon: CheckCircle,
      color: 'emerald',
      leads: data?.completed || [],
    },
    {
      title: 'Documentation Submitted',
      description: 'Compliance docs uploaded',
      icon: FileCheck,
      color: 'indigo',
      leads: data?.documentationSubmitted || [],
    },
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <Link href="/admin/dashboard">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Installation Readiness & Compliance</h1>
        <p className="text-muted-foreground mt-1">
          Track customers who have accepted proposals through to completion
        </p>
      </div>

      {/* Metrics Summary */}
      {data?.metrics && (
        <div className="grid gap-4 md:grid-cols-4 lg:grid-cols-7">
          <Card className="p-4 bg-gradient-to-br from-blue-50 to-white border-blue-200">
            <p className="text-sm text-muted-foreground mb-1">Total Accepted</p>
            <p className="text-3xl font-bold text-blue-600">{data.metrics.totalAccepted}</p>
          </Card>
          <Card className="p-4 bg-gradient-to-br from-green-50 to-white border-green-200">
            <p className="text-sm text-muted-foreground mb-1">Approvals Done</p>
            <p className="text-3xl font-bold text-green-600">{data.metrics.applicationsApprovedCount}</p>
          </Card>
          <Card className="p-4 bg-gradient-to-br from-purple-50 to-white border-purple-200">
            <p className="text-sm text-muted-foreground mb-1">Team Assigned</p>
            <p className="text-3xl font-bold text-purple-600">{data.metrics.teamAssignedCount}</p>
          </Card>
          <Card className="p-4 bg-gradient-to-br from-orange-50 to-white border-orange-200">
            <p className="text-sm text-muted-foreground mb-1">Materials</p>
            <p className="text-3xl font-bold text-orange-600">{data.metrics.materialsOrderedCount}</p>
          </Card>
          <Card className="p-4 bg-gradient-to-br from-emerald-50 to-white border-emerald-200">
            <p className="text-sm text-muted-foreground mb-1">Scheduled</p>
            <p className="text-3xl font-bold text-emerald-600">{data.metrics.scheduledCount}</p>
          </Card>
          <Card className="p-4 bg-gradient-to-br from-teal-50 to-white border-teal-200">
            <p className="text-sm text-muted-foreground mb-1">Completed</p>
            <p className="text-3xl font-bold text-teal-600">{data.metrics.completedCount}</p>
          </Card>
          <Card className="p-4 bg-gradient-to-br from-indigo-50 to-white border-indigo-200">
            <p className="text-sm text-muted-foreground mb-1">Docs Done</p>
            <p className="text-3xl font-bold text-indigo-600">{data.metrics.documentationSubmittedCount}</p>
          </Card>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <Card key={section.title} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 bg-${section.color}-100 rounded-lg flex items-center justify-center`}>
                      <Icon className={`h-6 w-6 text-${section.color}-600`} />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{section.title}</CardTitle>
                      <p className="text-sm text-muted-foreground">{section.description}</p>
                    </div>
                  </div>
                  <Badge className={`bg-${section.color}-600 text-white text-lg px-3 py-1`}>
                    {section.leads.length}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {section.leads.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No leads in this stage
                  </p>
                ) : (
                  <div className="space-y-2">
                    {section.leads.slice(0, 5).map((lead) => (
                      <Link key={lead.id} href={`/admin/leads/${lead.id}`}>
                        <div className="p-3 bg-gray-50 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{lead.name}</p>
                              <p className="text-xs text-muted-foreground truncate">{lead.address}</p>
                            </div>
                            <Badge variant="outline" className="ml-2 text-xs">
                              {lead.systemSizeKw}kW
                              {lead.batterySizeKwh > 0 && ` + ${lead.batterySizeKwh}kWh`}
                            </Badge>
                          </div>
                        </div>
                      </Link>
                    ))}
                    {section.leads.length > 5 && (
                      <p className="text-xs text-center text-muted-foreground pt-2">
                        +{section.leads.length - 5} more
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
