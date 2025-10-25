'use client';

import { useState, useEffect } from 'react';
import { CheckCircle2, Clock, XCircle, AlertCircle, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface NetworkApprovalTrackerProps {
  jobId: string;
}

type ApprovalStatus = 'PENDING' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'RESUBMITTED';

export function NetworkApprovalTracker({ jobId }: NetworkApprovalTrackerProps) {
  const [approval, setApproval] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    networkProvider: '',
    applicationNumber: '',
    applicationDate: '',
    systemSize: '',
    exportLimit: '',
    status: 'PENDING' as ApprovalStatus,
    approvalDate: '',
    notes: '',
  });

  useEffect(() => {
    fetchApproval();
  }, [jobId]);

  const fetchApproval = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/network-approval?jobId=${jobId}`);
      const data = await response.json();

      if (data.success && data.approval) {
        setApproval(data.approval);
        setFormData({
          networkProvider: data.approval.networkProvider || '',
          applicationNumber: data.approval.applicationNumber || '',
          applicationDate: data.approval.applicationDate ? new Date(data.approval.applicationDate).toISOString().split('T')[0] : '',
          systemSize: data.approval.systemSize?.toString() || '',
          exportLimit: data.approval.exportLimit?.toString() || '',
          status: data.approval.status || 'PENDING',
          approvalDate: data.approval.approvalDate ? new Date(data.approval.approvalDate).toISOString().split('T')[0] : '',
          notes: data.approval.notes || '',
        });
      }
    } catch (error) {
      console.error('Error fetching approval:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const url = approval ? '/api/network-approval' : '/api/network-approval';
      const method = approval ? 'PUT' : 'POST';
      const body = approval
        ? { id: approval.id, ...formData }
        : { jobId, ...formData };

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to save approval');
      }

      setApproval(data.approval);
      setEditing(false);
      alert('Network approval saved successfully');
    } catch (error: any) {
      alert(error.message || 'Failed to save approval');
    }
  };

  const getStatusIcon = (status: ApprovalStatus) => {
    switch (status) {
      case 'APPROVED':
        return <CheckCircle2 className="h-6 w-6 text-green-600" />;
      case 'REJECTED':
        return <XCircle className="h-6 w-6 text-red-600" />;
      case 'SUBMITTED':
      case 'RESUBMITTED':
        return <Clock className="h-6 w-6 text-blue-600" />;
      default:
        return <AlertCircle className="h-6 w-6 text-yellow-600" />;
    }
  };

  const getStatusColor = (status: ApprovalStatus) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'REJECTED':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'SUBMITTED':
      case 'RESUBMITTED':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      default:
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
    }
  };

  const getStatusText = (status: ApprovalStatus) => {
    switch (status) {
      case 'APPROVED':
        return 'Approved - Ready for Grid Connection';
      case 'REJECTED':
        return 'Rejected - Requires Resubmission';
      case 'SUBMITTED':
        return 'Submitted - Awaiting Approval';
      case 'RESUBMITTED':
        return 'Resubmitted - Awaiting Approval';
      default:
        return 'Pending - Not Yet Submitted';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!editing && approval) {
    return (
      <div className="space-y-4">
        {/* Status Banner */}
        <div className={`p-4 rounded-lg border-2 flex items-center gap-3 ${getStatusColor(approval.status)}`}>
          {getStatusIcon(approval.status)}
          <div className="flex-1">
            <h3 className="font-semibold text-lg">{getStatusText(approval.status)}</h3>
            <p className="text-sm mt-1">Network Provider: {approval.networkProvider}</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
            Update
          </Button>
        </div>

        {/* Details */}
        <div className="bg-white rounded-lg border-2 border-gray-200 p-6">
          <h3 className="font-semibold text-lg mb-4">Application Details</h3>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Application Number</p>
              <p className="font-medium">{approval.applicationNumber || 'Not provided'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Application Date</p>
              <p className="font-medium">
                {approval.applicationDate ? new Date(approval.applicationDate).toLocaleDateString() : 'Not provided'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">System Size</p>
              <p className="font-medium">{approval.systemSize ? `${approval.systemSize} kW` : 'Not provided'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Export Limit</p>
              <p className="font-medium">{approval.exportLimit ? `${approval.exportLimit} kW` : 'No limit'}</p>
            </div>
            {approval.approvalDate && (
              <div>
                <p className="text-sm text-gray-600">Approval Date</p>
                <p className="font-medium">{new Date(approval.approvalDate).toLocaleDateString()}</p>
              </div>
            )}
          </div>

          {approval.notes && (
            <div className="mt-4">
              <p className="text-sm text-gray-600">Notes</p>
              <p className="text-sm mt-1 bg-gray-50 p-3 rounded">{approval.notes}</p>
            </div>
          )}
        </div>

        {/* Common Network Providers Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800 font-medium mb-2">Common Network Providers:</p>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• <strong>WA:</strong> Western Power</li>
            <li>• <strong>VIC:</strong> AusNet Services, CitiPower, Powercor, Jemena, United Energy</li>
            <li>• <strong>NSW:</strong> Ausgrid, Endeavour Energy, Essential Energy</li>
            <li>• <strong>QLD:</strong> Energex, Ergon Energy</li>
            <li>• <strong>SA:</strong> SA Power Networks</li>
          </ul>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white rounded-lg border-2 border-gray-200 p-6">
        <h3 className="font-semibold text-lg mb-4">
          {approval ? 'Update Network Approval' : 'Add Network Approval'}
        </h3>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <Label htmlFor="networkProvider">Network Provider *</Label>
            <Input
              id="networkProvider"
              value={formData.networkProvider}
              onChange={(e) => setFormData({ ...formData, networkProvider: e.target.value })}
              placeholder="e.g., Western Power, Ausgrid"
              required
            />
          </div>

          <div>
            <Label htmlFor="applicationNumber">Application Number</Label>
            <Input
              id="applicationNumber"
              value={formData.applicationNumber}
              onChange={(e) => setFormData({ ...formData, applicationNumber: e.target.value })}
              placeholder="e.g., APP-2024-12345"
            />
          </div>

          <div>
            <Label htmlFor="applicationDate">Application Date</Label>
            <Input
              id="applicationDate"
              type="date"
              value={formData.applicationDate}
              onChange={(e) => setFormData({ ...formData, applicationDate: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="systemSize">System Size (kW)</Label>
            <Input
              id="systemSize"
              type="number"
              step="0.01"
              value={formData.systemSize}
              onChange={(e) => setFormData({ ...formData, systemSize: e.target.value })}
              placeholder="e.g., 6.6"
            />
          </div>

          <div>
            <Label htmlFor="exportLimit">Export Limit (kW)</Label>
            <Input
              id="exportLimit"
              type="number"
              step="0.01"
              value={formData.exportLimit}
              onChange={(e) => setFormData({ ...formData, exportLimit: e.target.value })}
              placeholder="e.g., 5.0 (leave empty if no limit)"
            />
          </div>

          <div>
            <Label htmlFor="status">Status *</Label>
            <select
              id="status"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as ApprovalStatus })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              required
            >
              <option value="PENDING">Pending</option>
              <option value="SUBMITTED">Submitted</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
              <option value="RESUBMITTED">Resubmitted</option>
            </select>
          </div>

          <div>
            <Label htmlFor="approvalDate">Approval Date</Label>
            <Input
              id="approvalDate"
              type="date"
              value={formData.approvalDate}
              onChange={(e) => setFormData({ ...formData, approvalDate: e.target.value })}
              disabled={formData.status !== 'APPROVED'}
            />
          </div>

          <div className="md:col-span-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Any additional information or requirements..."
              rows={3}
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <Button type="submit" className="flex-1 bg-primary hover:bg-primary/90">
            {approval ? 'Update Approval' : 'Save Approval'}
          </Button>
          {approval && (
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setEditing(false);
                fetchApproval();
              }}
            >
              Cancel
            </Button>
          )}
        </div>
      </div>
    </form>
  );
}
