'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Calendar, 
  Lock,
  Loader2,
  RefreshCw
} from 'lucide-react';

interface Approval {
  type: string;
  status: 'pending' | 'approved';
  label: string;
}

interface InstallationReadinessWidgetProps {
  leadId: string;
  onScheduleClick?: () => void;
}

export function InstallationReadinessWidget({ 
  leadId, 
  onScheduleClick 
}: InstallationReadinessWidgetProps) {
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [readiness, setReadiness] = useState<any>(null);
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [job, setJob] = useState<any>(null);

  useEffect(() => {
    fetchReadiness();
  }, [leadId]);

  async function fetchReadiness() {
    setLoading(true);
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`/api/admin/leads/${leadId}/check-readiness`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setReadiness(data.readiness);
        setApprovals(data.approvals);
        setJob(data.job);
      }
    } catch (error) {
      console.error('Error fetching readiness:', error);
    } finally {
      setLoading(false);
    }
  }

  async function recheckReadiness() {
    setChecking(true);
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`/api/admin/leads/${leadId}/check-readiness`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setReadiness(data.readiness);
        setApprovals(data.approvals);
        
        if (data.readiness.statusChanged && data.readiness.ready) {
          // Show success message
          alert('✓ All approvals received! Installation can now be scheduled.');
        }
        
        // Refresh to get updated job
        await fetchReadiness();
      }
    } catch (error) {
      console.error('Error rechecking readiness:', error);
    } finally {
      setChecking(false);
    }
  }

  if (loading) {
    return (
      <Card className="border-2 border-gray-200">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const pendingCount = approvals.filter(a => a.status === 'pending').length;
  const approvedCount = approvals.filter(a => a.status === 'approved').length;

  return (
    <Card className={`border-2 ${readiness?.ready ? 'border-green-500' : 'border-orange-500'}`}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            {readiness?.ready ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : (
              <AlertCircle className="h-5 w-5 text-orange-600" />
            )}
            Installation Readiness
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={recheckReadiness}
            disabled={checking}
          >
            {checking ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Status Summary */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <div className="text-sm text-gray-600">Approval Status</div>
              <div className="text-lg font-semibold">
                {approvedCount} of {approvals.length} Approved
              </div>
            </div>
            {job && (
              <div className="text-right">
                <div className="text-sm text-gray-600">Job Number</div>
                <div className="text-lg font-semibold">{job.jobNumber}</div>
              </div>
            )}
          </div>

          {/* Approval Checklist */}
          <div className="space-y-2">
            {approvals.map((approval) => (
              <div
                key={approval.type}
                className="flex items-center justify-between p-2 rounded hover:bg-gray-50"
              >
                <span className="text-sm font-medium">{approval.label}</span>
                {approval.status === 'approved' ? (
                  <Badge className="bg-green-600">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Approved
                  </Badge>
                ) : (
                  <Badge variant="destructive">
                    <XCircle className="h-3 w-3 mr-1" />
                    Pending
                  </Badge>
                )}
              </div>
            ))}
          </div>

          <Separator />

          {/* Overall Status */}
          {readiness?.ready ? (
            <div className="text-center space-y-3">
              <Badge className="bg-green-600 text-lg py-2 px-4">
                <CheckCircle className="h-4 w-4 mr-2" />
                Ready for Installation
              </Badge>
              {readiness.readySince && (
                <p className="text-xs text-gray-600">
                  Ready since {new Date(readiness.readySince).toLocaleDateString()}
                </p>
              )}
              {onScheduleClick && (
                <Button 
                  className="w-full mt-4"
                  onClick={onScheduleClick}
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Schedule Installation
                </Button>
              )}
            </div>
          ) : (
            <div className="text-center space-y-3">
              <Badge variant="destructive" className="text-lg py-2 px-4">
                <Lock className="h-4 w-4 mr-2" />
                Installation Blocked
              </Badge>
              {readiness?.reason && (
                <p className="text-sm text-gray-600 mt-2">
                  <strong>Reason:</strong> {readiness.reason}
                </p>
              )}
              <p className="text-xs text-gray-500 mt-2">
                {pendingCount} approval{pendingCount !== 1 ? 's' : ''} pending
              </p>
              <Button 
                className="w-full mt-4"
                variant="outline"
                disabled
              >
                <Lock className="h-4 w-4 mr-2" />
                Cannot Schedule Yet
              </Button>
            </div>
          )}

          {/* Job Status */}
          {job && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <div className="text-sm">
                <strong>Job Status:</strong>{' '}
                <Badge variant="outline" className="ml-2">
                  {job.status.replace(/_/g, ' ')}
                </Badge>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
