'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  DollarSign, 
  CheckCircle2, 
  AlertCircle, 
  Clock,
  FileText,
  Send
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { calculateSTCs } from '@/lib/compliance-scoring';

interface RebateSubmissionProps {
  jobId: string;
  systemSize: number;
  postcode: string;
  panelCount: number;
}

interface RebateData {
  id?: string;
  rebateType: string;
  stcCount?: number;
  stcValue?: number;
  stcStatus: string;
  panelSerials?: string[];
  panelValidated: boolean;
  inverterValidated: boolean;
  batteryValidated: boolean;
  submittedToCER: boolean;
  cerReferenceNumber?: string;
}

export function RebateSubmission({ 
  jobId, 
  systemSize, 
  postcode,
  panelCount 
}: RebateSubmissionProps) {
  const [rebates, setRebates] = useState<RebateData[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const [newRebate, setNewRebate] = useState({
    rebateType: 'FEDERAL_SRES',
    inverterSerial: '',
    inverterModel: '',
    batterySerial: '',
    batteryModel: '',
    batteryCapacity: '',
  });

  useEffect(() => {
    fetchRebates();
  }, [jobId]);

  const fetchRebates = async () => {
    try {
      const response = await fetch(`/api/rebate/submissions/${jobId}`);
      if (response.ok) {
        const data = await response.json();
        setRebates(data.rebates || []);
      }
    } catch (error) {
      console.error('Failed to fetch rebates:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateSTCValue = () => {
    const stcCount = calculateSTCs(systemSize, postcode);
    const stcPrice = 38; // Average STC price in AUD
    return {
      count: stcCount,
      value: stcCount * stcPrice,
    };
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const stcData = calculateSTCValue();
      
      const response = await fetch('/api/rebate/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId,
          ...newRebate,
          stcCount: stcData.count,
          stcValue: stcData.value,
        }),
      });

      if (!response.ok) throw new Error('Submission failed');

      toast({
        title: 'Rebate Submitted',
        description: 'Your rebate submission has been created',
      });

      fetchRebates();
      
      // Reset form
      setNewRebate({
        rebateType: 'FEDERAL_SRES',
        inverterSerial: '',
        inverterModel: '',
        batterySerial: '',
        batteryModel: '',
        batteryCapacity: '',
      });
    } catch (error) {
      toast({
        title: 'Submission Failed',
        description: 'Failed to submit rebate application',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
      case 'PAID':
        return 'bg-green-100 text-green-800';
      case 'SUBMITTED':
        return 'bg-blue-100 text-blue-800';
      case 'VALIDATED':
        return 'bg-purple-100 text-purple-800';
      case 'REJECTED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'APPROVED':
      case 'PAID':
        return <CheckCircle2 className="h-4 w-4" />;
      case 'REJECTED':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const stcData = calculateSTCValue();

  if (loading) {
    return <div className="p-6 text-center">Loading rebates...</div>;
  }

  return (
    <div className="space-y-6">
      {/* STC Calculator Card */}
      <Card className="p-6 bg-gradient-to-br from-green-50 to-blue-50">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-green-600 rounded-full p-3">
            <DollarSign className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-lg">Estimated STC Value</h3>
            <p className="text-sm text-gray-600">Federal SRES Rebate</p>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-lg">
            <p className="text-sm text-gray-600">System Size</p>
            <p className="text-2xl font-bold text-primary">{systemSize}kW</p>
          </div>
          <div className="bg-white p-4 rounded-lg">
            <p className="text-sm text-gray-600">STC Count</p>
            <p className="text-2xl font-bold text-blue-600">{stcData.count}</p>
          </div>
          <div className="bg-white p-4 rounded-lg">
            <p className="text-sm text-gray-600">Estimated Value</p>
            <p className="text-2xl font-bold text-green-600">
              ${stcData.value.toLocaleString()}
            </p>
          </div>
        </div>
      </Card>

      {/* Existing Rebates */}
      {rebates.length > 0 && (
        <Card className="p-6">
          <h3 className="font-bold text-lg mb-4">Rebate Submissions</h3>
          <div className="space-y-3">
            {rebates.map((rebate, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  {getStatusIcon(rebate.stcStatus)}
                  <div>
                    <p className="font-medium">
                      {rebate.rebateType.replace(/_/g, ' ')}
                    </p>
                    <p className="text-sm text-gray-600">
                      {rebate.stcCount} STCs × ${(rebate.stcValue! / rebate.stcCount!).toFixed(2)} = ${rebate.stcValue?.toLocaleString()}
                    </p>
                    {rebate.cerReferenceNumber && (
                      <p className="text-xs text-gray-500">
                        CER Ref: {rebate.cerReferenceNumber}
                      </p>
                    )}
                  </div>
                </div>
                <Badge className={getStatusColor(rebate.stcStatus)}>
                  {rebate.stcStatus}
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* New Rebate Submission Form */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <FileText className="h-6 w-6 text-primary" />
          <div>
            <h3 className="font-bold text-lg">Submit New Rebate</h3>
            <p className="text-sm text-gray-600">Create a new rebate submission</p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Rebate Type */}
          <div>
            <Label>Rebate Type</Label>
            <Select
              value={newRebate.rebateType}
              onValueChange={(value) => setNewRebate({ ...newRebate, rebateType: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="FEDERAL_SRES">Federal SRES (STCs)</SelectItem>
                <SelectItem value="FEDERAL_BATTERY">Federal Battery Rebate</SelectItem>
                <SelectItem value="WA_BATTERY_SCHEME">WA Battery Scheme</SelectItem>
                <SelectItem value="STATE_REBATE">State Rebate</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Inverter Details */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Inverter Serial Number</Label>
              <Input
                value={newRebate.inverterSerial}
                onChange={(e) => setNewRebate({ ...newRebate, inverterSerial: e.target.value })}
                placeholder="INV123456"
              />
            </div>
            <div>
              <Label>Inverter Model</Label>
              <Input
                value={newRebate.inverterModel}
                onChange={(e) => setNewRebate({ ...newRebate, inverterModel: e.target.value })}
                placeholder="Fronius Primo 5.0"
              />
            </div>
          </div>

          {/* Battery Details (if applicable) */}
          {(newRebate.rebateType === 'FEDERAL_BATTERY' || newRebate.rebateType === 'WA_BATTERY_SCHEME') && (
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <Label>Battery Serial Number</Label>
                <Input
                  value={newRebate.batterySerial}
                  onChange={(e) => setNewRebate({ ...newRebate, batterySerial: e.target.value })}
                  placeholder="BAT123456"
                />
              </div>
              <div>
                <Label>Battery Model</Label>
                <Input
                  value={newRebate.batteryModel}
                  onChange={(e) => setNewRebate({ ...newRebate, batteryModel: e.target.value })}
                  placeholder="Tesla Powerwall 2"
                />
              </div>
              <div>
                <Label>Capacity (kWh)</Label>
                <Input
                  type="number"
                  value={newRebate.batteryCapacity}
                  onChange={(e) => setNewRebate({ ...newRebate, batteryCapacity: e.target.value })}
                  placeholder="13.5"
                />
              </div>
            </div>
          )}

          {/* Validation Status */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm font-medium text-blue-800 mb-2">
              Validation Requirements
            </p>
            <div className="space-y-1 text-sm text-blue-700">
              <p>✓ {panelCount} panels validated</p>
              <p>• Inverter serial number required</p>
              {(newRebate.rebateType === 'FEDERAL_BATTERY' || newRebate.rebateType === 'WA_BATTERY_SCHEME') && (
                <p>• Battery details required</p>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <Button
            onClick={handleSubmit}
            disabled={submitting || !newRebate.inverterSerial}
            className="w-full bg-gradient-primary"
          >
            <Send className="h-4 w-4 mr-2" />
            {submitting ? 'Submitting...' : 'Submit Rebate Application'}
          </Button>
        </div>
      </Card>
    </div>
  );
}
