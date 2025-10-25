'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  AlertTriangle,
  Users,
  Mail,
  Phone,
  MapPin,
  Merge,
  RefreshCw
} from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/components/ui/use-toast';

interface DuplicateGroup {
  leads: any[];
  count: number;
}

export default function DuplicatesPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [duplicateGroups, setDuplicateGroups] = useState<DuplicateGroup[]>([]);
  const [selectedLeads, setSelectedLeads] = useState<Record<string, string[]>>({});

  useEffect(() => {
    scanDuplicates();
  }, []);

  const scanDuplicates = async () => {
    setScanning(true);
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch('/api/crm/leads/detect-duplicates', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setDuplicateGroups(data.duplicateGroups || []);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to scan for duplicates',
        variant: 'destructive',
      });
    } finally {
      setScanning(false);
      setLoading(false);
    }
  };

  const handleSelectPrimary = (groupIndex: number, leadId: string) => {
    setSelectedLeads({
      ...selectedLeads,
      [groupIndex]: [leadId],
    });
  };

  const handleMerge = async (groupIndex: number) => {
    const group = duplicateGroups[groupIndex];
    const primaryLeadId = selectedLeads[groupIndex]?.[0];

    if (!primaryLeadId) {
      toast({
        title: 'Select Primary Lead',
        description: 'Please select which lead to keep',
        variant: 'destructive',
      });
      return;
    }

    const duplicateLeadIds = group.leads
      .filter(l => l.id !== primaryLeadId)
      .map(l => l.id);

    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch('/api/crm/leads/merge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ primaryLeadId, duplicateLeadIds }),
      });

      if (response.ok) {
        toast({
          title: 'Leads Merged',
          description: `Successfully merged ${duplicateLeadIds.length} duplicate(s)`,
        });
        
        // Remove merged group
        setDuplicateGroups(duplicateGroups.filter((_, i) => i !== groupIndex));
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to merge leads',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-600">Scanning for duplicates...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Link href="/admin/crm/dashboard">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-bold text-primary">Duplicate Detection</h1>
                <p className="text-xs text-gray-500">
                  {duplicateGroups.length} duplicate groups found
                </p>
              </div>
            </div>
            <Button onClick={scanDuplicates} disabled={scanning} variant="outline">
              <RefreshCw className={`h-4 w-4 mr-2 ${scanning ? 'animate-spin' : ''}`} />
              {scanning ? 'Scanning...' : 'Rescan'}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {duplicateGroups.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="bg-green-100 rounded-full p-6 w-24 h-24 mx-auto mb-4 flex items-center justify-center">
              <Users className="h-12 w-12 text-green-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">No Duplicates Found</h3>
            <p className="text-sm text-gray-600 mb-4">
              Your database is clean! No duplicate leads detected.
            </p>
          </Card>
        ) : (
          <div className="space-y-6">
            {duplicateGroups.map((group, groupIndex) => (
              <Card key={groupIndex} className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-orange-600" />
                    <h3 className="font-semibold text-gray-900">
                      Duplicate Group {groupIndex + 1}
                    </h3>
                    <Badge variant="outline">{group.count} leads</Badge>
                  </div>
                  <Button
                    onClick={() => handleMerge(groupIndex)}
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Merge className="h-4 w-4 mr-2" />
                    Merge Selected
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {group.leads.map((lead) => (
                    <div
                      key={lead.id}
                      className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                        selectedLeads[groupIndex]?.[0] === lead.id
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => handleSelectPrimary(groupIndex, lead.id)}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-gray-900">{lead.name}</h4>
                        {selectedLeads[groupIndex]?.[0] === lead.id && (
                          <Badge className="bg-blue-600 text-white">Primary</Badge>
                        )}
                      </div>

                      <div className="space-y-2 text-sm">
                        {lead.email && (
                          <div className="flex items-center text-gray-600">
                            <Mail className="h-4 w-4 mr-2 flex-shrink-0" />
                            <span className="truncate">{lead.email}</span>
                          </div>
                        )}
                        {lead.phone && (
                          <div className="flex items-center text-gray-600">
                            <Phone className="h-4 w-4 mr-2 flex-shrink-0" />
                            <span>{lead.phone}</span>
                          </div>
                        )}
                        {lead.address && (
                          <div className="flex items-start text-gray-600">
                            <MapPin className="h-4 w-4 mr-2 flex-shrink-0 mt-0.5" />
                            <span className="text-xs">{lead.address}</span>
                          </div>
                        )}
                      </div>

                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <p className="text-xs text-gray-500">
                          Created: {new Date(lead.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    <strong>Note:</strong> Select the lead you want to keep as primary. All
                    activities, quotes, and jobs from other leads will be merged into it.
                  </p>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Stats */}
        {duplicateGroups.length > 0 && (
          <Card className="mt-6 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Duplicate Statistics</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-3xl font-bold text-orange-600">{duplicateGroups.length}</p>
                <p className="text-sm text-gray-600 mt-1">Duplicate Groups</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-red-600">
                  {duplicateGroups.reduce((sum, g) => sum + g.count, 0)}
                </p>
                <p className="text-sm text-gray-600 mt-1">Total Duplicates</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-blue-600">
                  {duplicateGroups.reduce((sum, g) => sum + g.count - 1, 0)}
                </p>
                <p className="text-sm text-gray-600 mt-1">Can Be Merged</p>
              </div>
            </div>
          </Card>
        )}
      </main>
    </div>
  );
}
