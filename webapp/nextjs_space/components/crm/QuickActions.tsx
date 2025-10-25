'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  Mail, 
  Phone, 
  Calendar, 
  MessageSquare, 
  Send,
  X
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface QuickActionsProps {
  dealId: string;
  customerEmail: string;
  customerPhone: string;
  customerName: string;
  onActivityAdded?: () => void;
}

export function QuickActions({ 
  dealId, 
  customerEmail, 
  customerPhone, 
  customerName,
  onActivityAdded 
}: QuickActionsProps) {
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const handleCall = () => {
    window.location.href = `tel:${customerPhone}`;
    logActivity('CALL_MADE', `Called ${customerName}`, `Phone call to ${customerPhone}`);
  };

  const handleEmail = () => {
    window.location.href = `mailto:${customerEmail}`;
    logActivity('EMAIL_SENT', `Email sent to ${customerName}`, `Email to ${customerEmail}`);
  };

  const handleScheduleMeeting = () => {
    // In production, integrate with calendar API
    toast({
      title: 'Schedule Meeting',
      description: 'Calendar integration coming soon',
    });
  };

  const handleAddNote = async () => {
    if (!note.trim()) return;

    setSaving(true);
    try {
      await logActivity('NOTE_ADDED', 'Note added', note);
      setNote('');
      setShowNoteForm(false);
      toast({
        title: 'Note Added',
        description: 'Your note has been saved',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to add note',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const logActivity = async (type: string, title: string, description: string) => {
    try {
      const response = await fetch('/api/crm/activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dealId,
          type,
          title,
          description,
          performedBy: 'admin-user-id', // TODO: Get from session
          completedAt: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        onActivityAdded?.();
      }
    } catch (error) {
      console.error('Failed to log activity:', error);
    }
  };

  return (
    <Card className="p-6">
      <h3 className="font-semibold mb-4">Quick Actions</h3>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <Button
          onClick={handleCall}
          variant="outline"
          className="flex items-center gap-2"
        >
          <Phone className="h-4 w-4" />
          Call
        </Button>

        <Button
          onClick={handleEmail}
          variant="outline"
          className="flex items-center gap-2"
        >
          <Mail className="h-4 w-4" />
          Email
        </Button>

        <Button
          onClick={handleScheduleMeeting}
          variant="outline"
          className="flex items-center gap-2"
        >
          <Calendar className="h-4 w-4" />
          Schedule
        </Button>

        <Button
          onClick={() => setShowNoteForm(!showNoteForm)}
          variant="outline"
          className="flex items-center gap-2"
        >
          <MessageSquare className="h-4 w-4" />
          Add Note
        </Button>
      </div>

      {/* Note Form */}
      {showNoteForm && (
        <div className="space-y-3 pt-4 border-t border-gray-200">
          <div>
            <Label htmlFor="note">Add Note</Label>
            <Textarea
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Enter your note..."
              rows={4}
              className="mt-2"
            />
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleAddNote}
              disabled={!note.trim() || saving}
              className="flex-1"
            >
              <Send className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save Note'}
            </Button>
            <Button
              onClick={() => {
                setShowNoteForm(false);
                setNote('');
              }}
              variant="outline"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
