'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Mail,
  MessageSquare,
  Search,
  Filter,
  Send,
  Phone,
  Clock,
  Check,
  CheckCheck,
  Eye,
  MousePointer,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

interface Thread {
  threadId: string;
  messages: any[];
  messageCount: number;
  lastMessage: {
    sentAt: string;
    subject?: string;
    body: string;
    type: string;
    direction: string;
  };
  deal: {
    title: string;
    lead: {
      name: string;
      email: string;
      phone: string;
    };
  };
  hasUnread: boolean;
  hasReplies: boolean;
}

export function CommunicationHub({ dealId }: { dealId?: string }) {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [selectedThread, setSelectedThread] = useState<Thread | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [replyMessage, setReplyMessage] = useState('');
  const [sending, setSending] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchInbox();
  }, [dealId, typeFilter, searchQuery]);

  const fetchInbox = async () => {
    try {
      const params = new URLSearchParams();
      if (dealId) params.append('dealId', dealId);
      if (typeFilter !== 'ALL') params.append('type', typeFilter);
      if (searchQuery) params.append('search', searchQuery);

      const response = await fetch(`/api/communications/inbox?${params}`);
      if (response.ok) {
        const data = await response.json();
        setThreads(data.threads || []);
      }
    } catch (error) {
      console.error('Failed to fetch inbox:', error);
      toast({
        title: 'Error',
        description: 'Failed to load messages',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReply = async () => {
    if (!selectedThread || !replyMessage.trim()) return;

    setSending(true);
    try {
      const lastMessage = selectedThread.messages[selectedThread.messages.length - 1];
      
      const response = await fetch(`/api/communications/inbox/${lastMessage.id}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: replyMessage,
          type: lastMessage.type.toLowerCase(),
        }),
      });

      if (response.ok) {
        toast({
          title: 'Reply Sent',
          description: 'Your message has been sent',
        });
        setReplyMessage('');
        fetchInbox();
      } else {
        throw new Error('Failed to send reply');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to send reply',
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  const markAsRead = async (messageId: string) => {
    try {
      await fetch(`/api/communications/inbox/${messageId}/read`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ read: true }),
      });
      fetchInbox();
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const getMessageIcon = (type: string) => {
    return type === 'EMAIL' ? Mail : MessageSquare;
  };

  const getStatusIcon = (message: any) => {
    if (message.emailTracking) {
      if (message.emailTracking.clicked) {
        return <MousePointer className="h-3 w-3 text-green-600" />;
      }
      if (message.emailTracking.opened) {
        return <Eye className="h-3 w-3 text-blue-600" />;
      }
    }
    if (message.deliveredAt) {
      return <CheckCheck className="h-3 w-3 text-gray-600" />;
    }
    if (message.sentAt) {
      return <Check className="h-3 w-3 text-gray-400" />;
    }
    return <Clock className="h-3 w-3 text-gray-400" />;
  };

  if (loading) {
    return <div className="p-6 text-center">Loading messages...</div>;
  }

  return (
    <div className="h-[calc(100vh-200px)] flex gap-4">
      {/* Inbox List */}
      <Card className="w-1/3 flex flex-col">
        {/* Search & Filter */}
        <div className="p-4 border-b space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search messages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <Tabs value={typeFilter} onValueChange={setTypeFilter}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="ALL">All</TabsTrigger>
              <TabsTrigger value="EMAIL">
                <Mail className="h-4 w-4 mr-2" />
                Email
              </TabsTrigger>
              <TabsTrigger value="SMS">
                <MessageSquare className="h-4 w-4 mr-2" />
                SMS
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Thread List */}
        <div className="flex-1 overflow-y-auto">
          {threads.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              No messages found
            </div>
          ) : (
            threads.map((thread) => {
              const Icon = getMessageIcon(thread.lastMessage.type);
              const isSelected = selectedThread?.threadId === thread.threadId;

              return (
                <div
                  key={thread.threadId}
                  onClick={() => {
                    setSelectedThread(thread);
                    if (thread.hasUnread) {
                      const lastInbound = thread.messages
                        .filter(m => m.direction === 'INBOUND')
                        .pop();
                      if (lastInbound) {
                        markAsRead(lastInbound.id);
                      }
                    }
                  }}
                  className={`p-4 border-b cursor-pointer hover:bg-gray-50 transition-colors ${
                    isSelected ? 'bg-blue-50 border-l-4 border-l-blue-600' : ''
                  } ${thread.hasUnread ? 'bg-blue-50/50' : ''}`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`mt-1 ${thread.lastMessage.type === 'EMAIL' ? 'text-blue-600' : 'text-green-600'}`}>
                      <Icon className="h-5 w-5" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className={`font-semibold truncate ${thread.hasUnread ? 'text-blue-600' : ''}`}>
                          {thread.deal.lead.name}
                        </p>
                        <span className="text-xs text-gray-500 ml-2">
                          {formatDistanceToNow(new Date(thread.lastMessage.sentAt), { addSuffix: true })}
                        </span>
                      </div>

                      {thread.lastMessage.subject && (
                        <p className="text-sm font-medium truncate mb-1">
                          {thread.lastMessage.subject}
                        </p>
                      )}

                      <p className="text-sm text-gray-600 truncate">
                        {thread.lastMessage.body}
                      </p>

                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="secondary" className="text-xs">
                          {thread.messageCount} {thread.messageCount === 1 ? 'message' : 'messages'}
                        </Badge>
                        {thread.hasReplies && (
                          <Badge variant="outline" className="text-xs">
                            Has replies
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </Card>

      {/* Message Thread */}
      <Card className="flex-1 flex flex-col">
        {selectedThread ? (
          <>
            {/* Thread Header */}
            <div className="p-4 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg">
                    {selectedThread.deal.lead.name}
                  </h3>
                  <p className="text-sm text-gray-600">{selectedThread.deal.title}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    <Phone className="h-4 w-4 mr-2" />
                    Call
                  </Button>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {selectedThread.messages.map((message) => {
                const isOutbound = message.direction === 'OUTBOUND';
                const Icon = getMessageIcon(message.type);

                return (
                  <div
                    key={message.id}
                    className={`flex ${isOutbound ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-lg p-4 ${
                        isOutbound
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Icon className="h-4 w-4" />
                        <span className="text-xs opacity-75">
                          {new Date(message.sentAt).toLocaleString()}
                        </span>
                        {isOutbound && getStatusIcon(message)}
                      </div>

                      {message.subject && (
                        <p className="font-semibold mb-2">{message.subject}</p>
                      )}

                      <div
                        className="text-sm whitespace-pre-wrap"
                        dangerouslySetInnerHTML={{ __html: message.body }}
                      />

                      {message.emailTracking && (
                        <div className="mt-2 pt-2 border-t border-white/20 text-xs opacity-75">
                          {message.emailTracking.opened && (
                            <span>Opened {message.emailTracking.openCount} times</span>
                          )}
                          {message.emailTracking.clicked && (
                            <span className="ml-2">• Clicked {message.emailTracking.clickCount} times</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Quick Reply */}
            <div className="p-4 border-t">
              <div className="flex gap-2">
                <Textarea
                  placeholder="Type your reply..."
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  rows={3}
                  className="flex-1"
                />
                <Button
                  onClick={handleReply}
                  disabled={!replyMessage.trim() || sending}
                  className="self-end"
                >
                  <Send className="h-4 w-4 mr-2" />
                  {sending ? 'Sending...' : 'Send'}
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Select a conversation to view messages</p>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
