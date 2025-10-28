'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Mail,
  Send,
  Inbox,
  RefreshCw,
  Sparkles,
  Search,
  Filter,
  Star,
  Archive,
  Trash2,
  Reply,
  Forward,
  MoreVertical,
  Paperclip,
  X,
  CheckCircle,
  AlertCircle,
  Link as LinkIcon,
  User,
  Calendar,
  Tag
} from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/components/ui/use-toast';

interface Email {
  id: string;
  messageId: string;
  threadId?: string;
  from: string;
  to: string;
  subject: string;
  body: string;
  bodyHtml?: string;
  receivedAt: string;
  isRead: boolean;
  isStarred: boolean;
  hasAttachments: boolean;
  attachments?: any[];
  labels?: string[];
  aiSummary?: string;
  detectedLeadId?: string;
  detectedQuoteId?: string;
  sentiment?: 'positive' | 'neutral' | 'negative';
}

interface EmailThread {
  threadId: string;
  subject: string;
  emails: Email[];
  participants: string[];
  lastEmailAt: string;
  unreadCount: number;
}

export default function EmailInterface() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [emails, setEmails] = useState<Email[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [view, setView] = useState<'inbox' | 'compose' | 'thread'>('inbox');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterBy, setFilterBy] = useState<'all' | 'unread' | 'starred' | 'leads'>('all');
  
  // Compose state
  const [composeTo, setComposeTo] = useState('');
  const [composeSubject, setComposeSubject] = useState('');
  const [composeBody, setComposeBody] = useState('');
  const [composeCc, setComposeCc] = useState('');
  const [composeBcc, setComposeBcc] = useState('');
  const [showCcBcc, setShowCcBcc] = useState(false);
  const [sending, setSending] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      router.push('/admin');
      return;
    }

    const compose = searchParams.get('compose');
    if (compose === 'true') {
      setView('compose');
    }

    fetchEmails();
  }, []);

  const fetchEmails = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('admin_token');
      const response = await fetch('/api/admin/communications/email/list', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setEmails(data.emails || []);
      } else {
        toast({
          title: 'Error',
          description: 'Failed to fetch emails',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Failed to fetch emails:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch emails',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const syncEmails = async () => {
    try {
      setSyncing(true);
      const token = localStorage.getItem('admin_token');
      const response = await fetch('/api/admin/communications/email/sync', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Emails synced successfully'
        });
        await fetchEmails();
      } else {
        const data = await response.json();
        toast({
          title: 'Error',
          description: data.error || 'Failed to sync emails',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Failed to sync emails:', error);
      toast({
        title: 'Error',
        description: 'Failed to sync emails',
        variant: 'destructive'
      });
    } finally {
      setSyncing(false);
    }
  };

  const handleSendEmail = async () => {
    if (!composeTo || !composeSubject || !composeBody) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive'
      });
      return;
    }

    try {
      setSending(true);
      const token = localStorage.getItem('admin_token');
      const response = await fetch('/api/admin/communications/email/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          to: composeTo,
          cc: composeCc,
          bcc: composeBcc,
          subject: composeSubject,
          body: composeBody,
          replyToId: selectedEmail?.id
        })
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Email sent successfully'
        });
        setView('inbox');
        setComposeTo('');
        setComposeSubject('');
        setComposeBody('');
        setComposeCc('');
        setComposeBcc('');
        await fetchEmails();
      } else {
        const data = await response.json();
        toast({
          title: 'Error',
          description: data.error || 'Failed to send email',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Failed to send email:', error);
      toast({
        title: 'Error',
        description: 'Failed to send email',
        variant: 'destructive'
      });
    } finally {
      setSending(false);
    }
  };

  const generateAISummary = async (emailId: string) => {
    try {
      setAiGenerating(true);
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`/api/admin/communications/email/${emailId}/summarize`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        // Update the email with AI summary
        setEmails(prev => prev.map(e => 
          e.id === emailId ? { ...e, aiSummary: data.summary, sentiment: data.sentiment } : e
        ));
        if (selectedEmail?.id === emailId) {
          setSelectedEmail(prev => prev ? { ...prev, aiSummary: data.summary, sentiment: data.sentiment } : null);
        }
        toast({
          title: 'Success',
          description: 'AI summary generated'
        });
      }
    } catch (error) {
      console.error('Failed to generate AI summary:', error);
    } finally {
      setAiGenerating(false);
    }
  };

  const markAsRead = async (emailId: string) => {
    try {
      const token = localStorage.getItem('admin_token');
      await fetch(`/api/admin/communications/email/${emailId}/read`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      setEmails(prev => prev.map(e => e.id === emailId ? { ...e, isRead: true } : e));
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const handleEmailClick = async (email: Email) => {
    setSelectedEmail(email);
    setView('thread');
    if (!email.isRead) {
      await markAsRead(email.id);
    }
    if (!email.aiSummary) {
      await generateAISummary(email.id);
    }
  };

  const handleReply = () => {
    if (selectedEmail) {
      setComposeTo(selectedEmail.from);
      setComposeSubject(`Re: ${selectedEmail.subject}`);
      setComposeBody(`\n\n---\nOn ${new Date(selectedEmail.receivedAt).toLocaleString()}, ${selectedEmail.from} wrote:\n${selectedEmail.body}`);
      setView('compose');
    }
  };

  const filteredEmails = emails.filter(email => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (!email.subject.toLowerCase().includes(query) &&
          !email.from.toLowerCase().includes(query) &&
          !email.body.toLowerCase().includes(query)) {
        return false;
      }
    }

    // Status filter
    if (filterBy === 'unread' && email.isRead) return false;
    if (filterBy === 'starred' && !email.isStarred) return false;
    if (filterBy === 'leads' && !email.detectedLeadId && !email.detectedQuoteId) return false;

    return true;
  });

  const unreadCount = emails.filter(e => !e.isRead).length;
  const leadsCount = emails.filter(e => e.detectedLeadId || e.detectedQuoteId).length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Link href="/admin/dashboard/communications">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              </Link>
              <div className="flex items-center">
                <Mail className="h-8 w-8 text-blue-600 mr-3" />
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Email</h1>
                  <p className="text-xs text-gray-500">{unreadCount} unread • {leadsCount} with leads</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={syncEmails}
                disabled={syncing}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
                Sync
              </Button>
              <Link href="/admin/dashboard/communications/email/groups">
                <Button variant="outline" size="sm">
                  <Tag className="h-4 w-4 mr-2" />
                  Groups
                </Button>
              </Link>
              <Button
                size="sm"
                onClick={() => setView('compose')}
              >
                <Send className="h-4 w-4 mr-2" />
                Compose
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-12 gap-6">
          {/* Sidebar */}
          <div className="col-span-3">
            <Card className="p-4">
              <div className="space-y-2">
                <Button
                  variant={view === 'inbox' ? 'default' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => setView('inbox')}
                >
                  <Inbox className="h-4 w-4 mr-2" />
                  Inbox
                  {unreadCount > 0 && (
                    <Badge variant="destructive" className="ml-auto">{unreadCount}</Badge>
                  )}
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => setFilterBy('starred')}
                >
                  <Star className="h-4 w-4 mr-2" />
                  Starred
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => setFilterBy('leads')}
                >
                  <Tag className="h-4 w-4 mr-2" />
                  Leads/Quotes
                  {leadsCount > 0 && (
                    <Badge variant="secondary" className="ml-auto">{leadsCount}</Badge>
                  )}
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                >
                  <Archive className="h-4 w-4 mr-2" />
                  Archive
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Trash
                </Button>
              </div>

              <div className="mt-6 pt-6 border-t">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Filters</h3>
                <div className="space-y-2">
                  <Button
                    variant={filterBy === 'all' ? 'secondary' : 'ghost'}
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => setFilterBy('all')}
                  >
                    All
                  </Button>
                  <Button
                    variant={filterBy === 'unread' ? 'secondary' : 'ghost'}
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => setFilterBy('unread')}
                  >
                    Unread
                  </Button>
                </div>
              </div>
            </Card>
          </div>

          {/* Main Content */}
          <div className="col-span-9">
            {view === 'inbox' && (
              <Card className="p-6">
                {/* Search Bar */}
                <div className="mb-6">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search emails..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Email List */}
                {loading ? (
                  <div className="text-center py-12">
                    <RefreshCw className="h-8 w-8 animate-spin text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Loading emails...</p>
                  </div>
                ) : filteredEmails.length === 0 ? (
                  <div className="text-center py-12">
                    <Mail className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600">No emails found</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredEmails.map((email) => (
                      <div
                        key={email.id}
                        onClick={() => handleEmailClick(email)}
                        className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                          email.isRead ? 'bg-white' : 'bg-blue-50 border-blue-200'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className={`text-sm truncate ${email.isRead ? 'font-normal' : 'font-bold'}`}>
                                {email.from}
                              </p>
                              {email.isStarred && <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />}
                              {email.hasAttachments && <Paperclip className="h-4 w-4 text-gray-400" />}
                              {(email.detectedLeadId || email.detectedQuoteId) && (
                                <Badge variant="secondary" className="text-xs">
                                  <Tag className="h-3 w-3 mr-1" />
                                  Lead
                                </Badge>
                              )}
                            </div>
                            <p className={`text-sm mb-1 truncate ${email.isRead ? 'font-normal' : 'font-semibold'}`}>
                              {email.subject}
                            </p>
                            <p className="text-xs text-gray-600 truncate">{email.body.substring(0, 100)}...</p>
                            
                            {email.aiSummary && (
                              <div className="mt-2 p-2 bg-purple-50 border border-purple-200 rounded text-xs">
                                <div className="flex items-center gap-1 mb-1">
                                  <Sparkles className="h-3 w-3 text-purple-600" />
                                  <span className="font-semibold text-purple-900">AI Summary:</span>
                                </div>
                                <p className="text-purple-800">{email.aiSummary}</p>
                              </div>
                            )}
                          </div>
                          <div className="ml-4 text-right">
                            <p className="text-xs text-gray-500">
                              {new Date(email.receivedAt).toLocaleDateString()}
                            </p>
                            <p className="text-xs text-gray-400">
                              {new Date(email.receivedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            )}

            {view === 'thread' && selectedEmail && (
              <Card className="p-6">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">{selectedEmail.subject}</h2>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <span>{selectedEmail.from}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>{new Date(selectedEmail.receivedAt).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={handleReply}>
                      <Reply className="h-4 w-4 mr-2" />
                      Reply
                    </Button>
                    <Button variant="outline" size="sm">
                      <Forward className="h-4 w-4 mr-2" />
                      Forward
                    </Button>
                  </div>
                </div>

                {/* AI Summary Section */}
                {selectedEmail.aiSummary && (
                  <div className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-200 rounded-lg">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-purple-600" />
                        <h3 className="font-bold text-purple-900">AI Summary</h3>
                      </div>
                      {selectedEmail.sentiment && (
                        <Badge variant={
                          selectedEmail.sentiment === 'positive' ? 'default' :
                          selectedEmail.sentiment === 'negative' ? 'destructive' : 'secondary'
                        }>
                          {selectedEmail.sentiment}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-purple-900 mb-3">{selectedEmail.aiSummary}</p>
                    
                    {(selectedEmail.detectedLeadId || selectedEmail.detectedQuoteId) && (
                      <div className="flex items-center gap-2 pt-3 border-t border-purple-200">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-semibold text-green-900">
                          {selectedEmail.detectedLeadId ? 'Linked to Lead' : 'Linked to Quote'}
                        </span>
                        <Button variant="link" size="sm" className="ml-auto">
                          <LinkIcon className="h-3 w-3 mr-1" />
                          View Details
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {/* Email Body */}
                <div className="prose max-w-none">
                  {selectedEmail.bodyHtml ? (
                    <div dangerouslySetInnerHTML={{ __html: selectedEmail.bodyHtml }} />
                  ) : (
                    <div className="whitespace-pre-wrap text-gray-700">{selectedEmail.body}</div>
                  )}
                </div>

                {/* Attachments */}
                {selectedEmail.hasAttachments && selectedEmail.attachments && (
                  <div className="mt-6 pt-6 border-t">
                    <h3 className="font-semibold text-gray-900 mb-3">Attachments</h3>
                    <div className="space-y-2">
                      {selectedEmail.attachments.map((attachment: any, idx: number) => (
                        <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                          <Paperclip className="h-5 w-5 text-gray-400" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">{attachment.filename}</p>
                            <p className="text-xs text-gray-500">{attachment.size}</p>
                          </div>
                          <Button variant="outline" size="sm">Download</Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            )}

            {view === 'compose' && (
              <Card className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Compose Email</h2>
                  <Button variant="ghost" size="sm" onClick={() => setView('inbox')}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="to">To *</Label>
                    <Input
                      id="to"
                      type="email"
                      placeholder="recipient@example.com"
                      value={composeTo}
                      onChange={(e) => setComposeTo(e.target.value)}
                    />
                  </div>

                  {!showCcBcc && (
                    <Button
                      variant="link"
                      size="sm"
                      onClick={() => setShowCcBcc(true)}
                      className="px-0"
                    >
                      Add Cc/Bcc
                    </Button>
                  )}

                  {showCcBcc && (
                    <>
                      <div>
                        <Label htmlFor="cc">Cc</Label>
                        <Input
                          id="cc"
                          type="email"
                          placeholder="cc@example.com"
                          value={composeCc}
                          onChange={(e) => setComposeCc(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="bcc">Bcc</Label>
                        <Input
                          id="bcc"
                          type="email"
                          placeholder="bcc@example.com"
                          value={composeBcc}
                          onChange={(e) => setComposeBcc(e.target.value)}
                        />
                      </div>
                    </>
                  )}

                  <div>
                    <Label htmlFor="subject">Subject *</Label>
                    <Input
                      id="subject"
                      placeholder="Email subject"
                      value={composeSubject}
                      onChange={(e) => setComposeSubject(e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="body">Message *</Label>
                    <Textarea
                      id="body"
                      placeholder="Type your message here..."
                      rows={12}
                      value={composeBody}
                      onChange={(e) => setComposeBody(e.target.value)}
                    />
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">
                        <Paperclip className="h-4 w-4 mr-2" />
                        Attach
                      </Button>
                      <Button variant="outline" size="sm" disabled={aiGenerating}>
                        <Sparkles className="h-4 w-4 mr-2" />
                        AI Enhance
                      </Button>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" onClick={() => setView('inbox')}>
                        Cancel
                      </Button>
                      <Button onClick={handleSendEmail} disabled={sending}>
                        {sending ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            Sending...
                          </>
                        ) : (
                          <>
                            <Send className="h-4 w-4 mr-2" />
                            Send
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
