'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  ArrowLeft,
  Phone,
  Save,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  PhoneCall,
  PhoneIncoming,
  PhoneOutgoing
} from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/components/ui/use-toast';

export default function CallLogging() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [customerPhone, setCustomerPhone] = useState(searchParams.get('phone') || '');
  const [customerName, setCustomerName] = useState('');
  const [direction, setDirection] = useState<'OUTBOUND' | 'INBOUND'>('OUTBOUND');
  const [duration, setDuration] = useState('');
  const [outcome, setOutcome] = useState('');
  const [notes, setNotes] = useState('');
  const [followUpRequired, setFollowUpRequired] = useState(false);
  const [followUpDate, setFollowUpDate] = useState('');

  useEffect(() => {
    // Pre-fill from query params
    const dealId = searchParams.get('dealId');
    const leadId = searchParams.get('leadId');
    if (dealId || leadId) {
      fetchCustomerData(dealId, leadId);
    }
  }, []);

  const fetchCustomerData = async (dealId: string | null, leadId: string | null) => {
    try {
      const token = localStorage.getItem('admin_token');
      const endpoint = dealId 
        ? `/api/crm/deals/${dealId}`
        : `/api/admin/leads/${leadId}`;
      
      const response = await fetch(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (response.ok) {
        const data = await response.json();
        const customer = data.deal || data.lead;
        if (customer.phone) setCustomerPhone(customer.phone);
        if (customer.name || customer.customerName) {
          setCustomerName(customer.name || customer.customerName);
        }
      }
    } catch (error) {
      console.error('Failed to fetch customer data:', error);
    }
  };

  const handleSave = async () => {
    if (!customerPhone || !outcome) {
      toast({
        title: 'Missing Fields',
        description: 'Please fill in phone number and outcome',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch('/api/crm/calls/log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          phone: customerPhone,
          customerName,
          direction,
          duration: duration ? parseInt(duration) : null,
          outcome,
          notes,
          followUpRequired,
          followUpDate: followUpDate ? new Date(followUpDate) : null,
          dealId: searchParams.get('dealId'),
          leadId: searchParams.get('leadId'),
        }),
      });

      if (response.ok) {
        toast({
          title: 'Call Logged',
          description: 'Call has been logged successfully',
        });
        
        // Clear form
        setCustomerPhone('');
        setCustomerName('');
        setDuration('');
        setOutcome('');
        setNotes('');
        setFollowUpRequired(false);
        setFollowUpDate('');
        
        // Redirect to activities
        setTimeout(() => router.push('/admin/crm/activities'), 1500);
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to log call');
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to log call',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Link href="/admin/crm/activities">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-bold text-primary">Log Call</h1>
                <p className="text-xs text-gray-500">Record customer phone conversation</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={handleSave}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Save className="h-4 w-4 mr-2" />
                {loading ? 'Saving...' : 'Save Call Log'}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Call Form */}
          <Card className="p-6 lg:col-span-2">
            <div className="space-y-6">
              {/* Call Direction */}
              <div>
                <Label>Call Direction *</Label>
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <button
                    onClick={() => setDirection('OUTBOUND')}
                    className={`p-4 border-2 rounded-lg flex items-center justify-center gap-2 transition-all ${
                      direction === 'OUTBOUND'
                        ? 'border-blue-600 bg-blue-50 text-blue-700'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <PhoneOutgoing className="h-5 w-5" />
                    <span className="font-medium">Outbound</span>
                  </button>
                  <button
                    onClick={() => setDirection('INBOUND')}
                    className={`p-4 border-2 rounded-lg flex items-center justify-center gap-2 transition-all ${
                      direction === 'INBOUND'
                        ? 'border-green-600 bg-green-50 text-green-700'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <PhoneIncoming className="h-5 w-5" />
                    <span className="font-medium">Inbound</span>
                  </button>
                </div>
              </div>

              {/* Customer Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="+61 4XX XXX XXX"
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="name">Customer Name</Label>
                  <Input
                    id="name"
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="John Smith"
                    className="mt-2"
                  />
                </div>
              </div>

              {/* Duration */}
              <div>
                <Label htmlFor="duration">Call Duration (minutes)</Label>
                <Input
                  id="duration"
                  type="number"
                  min="0"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="5"
                  className="mt-2"
                />
              </div>

              {/* Outcome */}
              <div>
                <Label htmlFor="outcome">Call Outcome *</Label>
                <select
                  id="outcome"
                  value={outcome}
                  onChange={(e) => setOutcome(e.target.value)}
                  className="w-full mt-2 p-2 border border-gray-300 rounded-md"
                >
                  <option value="">Select outcome...</option>
                  <option value="ANSWERED">Answered - Conversation completed</option>
                  <option value="NO_ANSWER">No answer</option>
                  <option value="VOICEMAIL">Left voicemail</option>
                  <option value="BUSY">Line busy</option>
                  <option value="WRONG_NUMBER">Wrong number</option>
                  <option value="INTERESTED">Interested - Follow-up required</option>
                  <option value="NOT_INTERESTED">Not interested</option>
                  <option value="CALLBACK_REQUESTED">Callback requested</option>
                  <option value="QUOTE_SENT">Quote sent</option>
                  <option value="MEETING_SCHEDULED">Meeting scheduled</option>
                </select>
              </div>

              {/* Notes */}
              <div>
                <Label htmlFor="notes">Call Notes</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Key discussion points, customer requirements, concerns..."
                  rows={6}
                  className="mt-2"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {notes.length} characters
                </p>
              </div>

              {/* Follow-up */}
              <div className="border-t pt-4">
                <div className="flex items-center gap-2 mb-4">
                  <input
                    type="checkbox"
                    id="followUp"
                    checked={followUpRequired}
                    onChange={(e) => setFollowUpRequired(e.target.checked)}
                    className="h-4 w-4 text-blue-600 rounded"
                  />
                  <Label htmlFor="followUp" className="cursor-pointer">
                    Follow-up required
                  </Label>
                </div>

                {followUpRequired && (
                  <div>
                    <Label htmlFor="followUpDate">Follow-up Date</Label>
                    <Input
                      id="followUpDate"
                      type="datetime-local"
                      value={followUpDate}
                      onChange={(e) => setFollowUpDate(e.target.value)}
                      className="mt-2"
                    />
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Call Tips */}
            <Card className="p-4">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <PhoneCall className="h-4 w-4 text-blue-600" />
                Call Logging Tips
              </h3>
              <div className="space-y-2 text-sm text-gray-600">
                <p>• Log calls immediately after</p>
                <p>• Note key discussion points</p>
                <p>• Record customer concerns</p>
                <p>• Set follow-up reminders</p>
                <p>• Track call outcomes</p>
              </div>
            </Card>

            {/* Quick Outcomes */}
            <Card className="p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Common Outcomes</h3>
              <div className="space-y-2">
                <button
                  onClick={() => setOutcome('INTERESTED')}
                  className="w-full text-left p-2 text-sm rounded hover:bg-green-50 border border-transparent hover:border-green-200"
                >
                  <CheckCircle className="h-4 w-4 inline mr-2 text-green-600" />
                  Interested
                </button>
                <button
                  onClick={() => setOutcome('CALLBACK_REQUESTED')}
                  className="w-full text-left p-2 text-sm rounded hover:bg-blue-50 border border-transparent hover:border-blue-200"
                >
                  <Clock className="h-4 w-4 inline mr-2 text-blue-600" />
                  Callback Requested
                </button>
                <button
                  onClick={() => setOutcome('NOT_INTERESTED')}
                  className="w-full text-left p-2 text-sm rounded hover:bg-red-50 border border-transparent hover:border-red-200"
                >
                  <XCircle className="h-4 w-4 inline mr-2 text-red-600" />
                  Not Interested
                </button>
                <button
                  onClick={() => setOutcome('VOICEMAIL')}
                  className="w-full text-left p-2 text-sm rounded hover:bg-orange-50 border border-transparent hover:border-orange-200"
                >
                  <AlertCircle className="h-4 w-4 inline mr-2 text-orange-600" />
                  Voicemail
                </button>
              </div>
            </Card>

            {/* Call Stats */}
            <Card className="p-4">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Clock className="h-4 w-4 text-green-600" />
                Today's Stats
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Calls Made</span>
                  <span className="font-medium text-gray-900">0</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Avg Duration</span>
                  <span className="font-medium text-gray-900">0 min</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Contact Rate</span>
                  <span className="font-medium text-gray-900">0%</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
