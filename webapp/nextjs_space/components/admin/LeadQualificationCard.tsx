'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Phone, 
  Mail, 
  MapPin, 
  Calendar, 
  CheckCircle, 
  Clock,
  User,
  FileText,
  ExternalLink,
  Loader2,
  MessageSquare,
  PhoneCall,
  Send
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface LeadQualificationCardProps {
  leadId: string;
  lead: any;
  onUpdate?: () => void;
}

export function LeadQualificationCard({ leadId, lead, onUpdate }: LeadQualificationCardProps) {
  const [saving, setSaving] = useState(false);
  const [contactAttempts, setContactAttempts] = useState(0);
  const [lastContactedAt, setLastContactedAt] = useState('');
  const [firstContactedAt, setFirstContactedAt] = useState('');
  const [proposalSentAt, setProposalSentAt] = useState('');
  const [confirmedAt, setConfirmedAt] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState('new');

  useEffect(() => {
    if (lead) {
      setContactAttempts(lead.contactAttempts || 0);
      setLastContactedAt(
        lead.lastContactedAt 
          ? new Date(lead.lastContactedAt).toISOString().split('T')[0]
          : ''
      );
      setFirstContactedAt(
        lead.firstContactedAt 
          ? new Date(lead.firstContactedAt).toISOString().split('T')[0]
          : ''
      );
      setProposalSentAt(
        lead.proposalSentAt 
          ? new Date(lead.proposalSentAt).toISOString().split('T')[0]
          : ''
      );
      setConfirmedAt(
        lead.confirmedAt 
          ? new Date(lead.confirmedAt).toISOString().split('T')[0]
          : ''
      );
      setNotes(lead.notes || '');
      setStatus(lead.status || 'new');
    }
  }, [lead]);

  const handleLogContact = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('admin_token');
      const now = new Date().toISOString();
      
      const response = await fetch(`/api/admin/leads/${leadId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          contactAttempts: contactAttempts + 1,
          lastContactedAt: now,
          firstContactedAt: firstContactedAt ? new Date(firstContactedAt).toISOString() : now,
          status: 'contacted'
        })
      });

      if (!response.ok) throw new Error('Failed to log contact');
      
      setContactAttempts(contactAttempts + 1);
      setLastContactedAt(now.split('T')[0]);
      if (!firstContactedAt) setFirstContactedAt(now.split('T')[0]);
      setStatus('contacted');
      
      if (onUpdate) onUpdate();
      alert('Contact logged successfully!');
    } catch (error) {
      console.error('Error logging contact:', error);
      alert('Failed to log contact');
    } finally {
      setSaving(false);
    }
  };

  const handleSendProposal = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('admin_token');
      const now = new Date().toISOString();
      
      const response = await fetch(`/api/admin/leads/${leadId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          proposalSentAt: proposalSentAt ? new Date(proposalSentAt).toISOString() : now,
          status: 'quoted'
        })
      });

      if (!response.ok) throw new Error('Failed to mark proposal sent');
      
      setProposalSentAt(now.split('T')[0]);
      setStatus('quoted');
      
      if (onUpdate) onUpdate();
      alert('Proposal marked as sent!');
    } catch (error) {
      console.error('Error marking proposal sent:', error);
      alert('Failed to mark proposal sent');
    } finally {
      setSaving(false);
    }
  };

  const handleConfirm = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('admin_token');
      const now = new Date().toISOString();
      
      const response = await fetch(`/api/admin/leads/${leadId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          confirmedAt: confirmedAt ? new Date(confirmedAt).toISOString() : now,
          status: 'won'
        })
      });

      if (!response.ok) throw new Error('Failed to confirm customer');
      
      setConfirmedAt(now.split('T')[0]);
      setStatus('won');
      
      if (onUpdate) onUpdate();
      alert('Customer confirmed successfully!');
    } catch (error) {
      console.error('Error confirming customer:', error);
      alert('Failed to confirm customer');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNotes = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('admin_token');
      
      const response = await fetch(`/api/admin/leads/${leadId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ notes })
      });

      if (!response.ok) throw new Error('Failed to save notes');
      
      if (onUpdate) onUpdate();
      alert('Notes saved successfully!');
    } catch (error) {
      console.error('Error saving notes:', error);
      alert('Failed to save notes');
    } finally {
      setSaving(false);
    }
  };

  // Determine current stage
  const currentStage = confirmedAt ? 4 : proposalSentAt ? 2 : firstContactedAt ? 3 : 1;

  return (
    <Card className="border-2 border-blue-200">
      <CardHeader className="bg-blue-50">
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <User className="h-5 w-5 text-blue-600" />
            Lead Qualification (Stages 1-4)
          </span>
          <Badge variant={status === 'won' ? 'default' : 'secondary'}>
            {status.replace(/_/g, ' ').toUpperCase()}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        {/* Lead Source Info */}
        <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg">
          <h4 className="text-sm font-semibold mb-3">Lead Information</h4>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-gray-600">Source:</span>
              <p className="font-medium capitalize">{lead.leadSource || 'website'}</p>
            </div>
            <div>
              <span className="text-gray-600">Created:</span>
              <p className="font-medium">{new Date(lead.createdAt).toLocaleDateString()}</p>
            </div>
            {lead.leadSourceDetails && (
              <div className="col-span-2">
                <span className="text-gray-600">Details:</span>
                <p className="font-medium">{lead.leadSourceDetails}</p>
              </div>
            )}
            {lead.CustomerQuote && (
              <div className="col-span-2">
                <span className="text-gray-600">Quote:</span>
                <p className="font-medium">{lead.quoteReference}</p>
              </div>
            )}
          </div>
        </div>

        <Separator />

        {/* Stage 1: Lead - Initial Contact */}
        <div className={`p-4 rounded-lg border-2 ${currentStage >= 1 ? 'bg-green-50 border-green-500' : 'bg-gray-50 border-gray-200'}`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">1</div>
              <h3 className="text-lg font-semibold">Lead - Initial Contact</h3>
            </div>
            {currentStage >= 1 && <CheckCircle className="h-5 w-5 text-green-600" />}
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-gray-600" />
              <span>{lead.phone || 'No phone'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-gray-600" />
              <span>{lead.email || 'No email'}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-gray-600" />
              <span>{lead.address}</span>
            </div>
          </div>
        </div>

        {/* Stage 2: Qualify - Send Proposals */}
        <div className={`p-4 rounded-lg border-2 ${currentStage >= 2 ? 'bg-green-50 border-green-500' : 'bg-gray-50 border-gray-200'}`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">2</div>
              <h3 className="text-lg font-semibold">Qualify - Send Proposals</h3>
            </div>
            {currentStage >= 2 && <CheckCircle className="h-5 w-5 text-green-600" />}
          </div>
          
          {lead.CustomerQuote && (
            <div className="mb-3">
              <a 
                href={`/proposal/${lead.CustomerQuote.id}`} 
                target="_blank"
                className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800"
              >
                <ExternalLink className="h-4 w-4" />
                View/Send Proposal ({lead.quoteReference})
              </a>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="proposalSent" className="text-xs">Proposal Sent Date</Label>
              <Input
                id="proposalSent"
                type="date"
                value={proposalSentAt}
                onChange={(e) => setProposalSentAt(e.target.value)}
                className="text-sm"
              />
            </div>
            <div className="flex items-end">
              <Button
                onClick={handleSendProposal}
                disabled={saving || !lead.CustomerQuote}
                size="sm"
                className="w-full"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Mark Sent
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Stage 3: Contact - Follow-up */}
        <div className={`p-4 rounded-lg border-2 ${currentStage >= 3 ? 'bg-green-50 border-green-500' : 'bg-gray-50 border-gray-200'}`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">3</div>
              <h3 className="text-lg font-semibold">Contact - Follow-up Communication</h3>
            </div>
            {currentStage >= 3 && <CheckCircle className="h-5 w-5 text-green-600" />}
          </div>

          <div className="grid grid-cols-3 gap-3 mb-3">
            <div>
              <Label className="text-xs">Contact Attempts</Label>
              <div className="text-2xl font-bold text-blue-600">{contactAttempts}</div>
            </div>
            <div>
              <Label className="text-xs">First Contact</Label>
              <div className="text-sm font-medium">
                {firstContactedAt ? new Date(firstContactedAt).toLocaleDateString() : 'Not yet'}
              </div>
            </div>
            <div>
              <Label className="text-xs">Last Contact</Label>
              <div className="text-sm font-medium">
                {lastContactedAt ? new Date(lastContactedAt).toLocaleDateString() : 'Not yet'}
              </div>
            </div>
          </div>

          <Button
            onClick={handleLogContact}
            disabled={saving}
            size="sm"
            className="w-full"
            variant="outline"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <PhoneCall className="h-4 w-4 mr-2" />
                Log Contact Attempt
              </>
            )}
          </Button>
        </div>

        {/* Stage 4: Confirmed - Customer Agrees */}
        <div className={`p-4 rounded-lg border-2 ${currentStage >= 4 ? 'bg-green-50 border-green-500' : 'bg-gray-50 border-gray-200'}`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">4</div>
              <h3 className="text-lg font-semibold">Confirmed - Customer Agrees to Proceed</h3>
            </div>
            {currentStage >= 4 && <CheckCircle className="h-5 w-5 text-green-600" />}
          </div>

          {confirmedAt ? (
            <div className="bg-green-100 border border-green-300 p-3 rounded-lg">
              <div className="flex items-center gap-2 text-green-800">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm font-semibold">
                  Confirmed on {new Date(confirmedAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-gray-600">
                Customer has verbally agreed to proceed with the installation
              </p>
              <Button
                onClick={handleConfirm}
                disabled={saving}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Mark as Confirmed
                  </>
                )}
              </Button>
            </div>
          )}
        </div>

        <Separator />

        {/* Notes Section */}
        <div>
          <Label htmlFor="notes">Lead Notes</Label>
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add notes about this lead..."
            rows={4}
            className="mt-2"
          />
          <Button
            onClick={handleSaveNotes}
            disabled={saving}
            size="sm"
            variant="outline"
            className="mt-2"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <MessageSquare className="h-4 w-4 mr-2" />
            )}
            Save Notes
          </Button>
        </div>

        {/* Next Step Indicator */}
        {currentStage < 4 && (
          <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Next Step:</strong>{' '}
              {currentStage === 1 && 'Send proposal to customer'}
              {currentStage === 2 && 'Follow up with customer about proposal'}
              {currentStage === 3 && 'Get verbal confirmation from customer'}
            </p>
          </div>
        )}

        {currentStage === 4 && !lead.depositPaid && (
          <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>Next Step:</strong> Customer is confirmed! Now send deposit invoice (Stage 5)
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
