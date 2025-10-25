'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Smile,
  Meh,
  Frown,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Mail,
  MessageSquare
} from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/components/ui/use-toast';

interface Communication {
  id: string;
  type: string;
  subject?: string;
  body: string;
  sentiment?: string;
  sentimentScore?: number;
  leadName: string;
  createdAt: string;
}

export default function SentimentAnalysisPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [communications, setCommunications] = useState<Communication[]>([]);
  const [stats, setStats] = useState({
    positive: 0,
    neutral: 0,
    negative: 0,
    total: 0,
  });

  useEffect(() => {
    fetchCommunications();
  }, []);

  const fetchCommunications = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch('/api/crm/communications?withSentiment=true&limit=50', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        const comms = data.communications || [];
        setCommunications(comms);

        // Calculate stats
        const positive = comms.filter((c: any) => c.sentiment === 'POSITIVE').length;
        const neutral = comms.filter((c: any) => c.sentiment === 'NEUTRAL').length;
        const negative = comms.filter((c: any) => c.sentiment === 'NEGATIVE').length;

        setStats({
          positive,
          neutral,
          negative,
          total: comms.length,
        });
      }
    } catch (error) {
      console.error('Failed to fetch communications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBatchAnalyze = async () => {
    setAnalyzing(true);
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch('/api/crm/sentiment/analyze?days=7', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        toast({
          title: 'Analysis Complete',
          description: `Analyzed ${data.analyzed} communications`,
        });
        fetchCommunications();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to analyze sentiment',
        variant: 'destructive',
      });
    } finally {
      setAnalyzing(false);
    }
  };

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'POSITIVE':
        return <Smile className="h-5 w-5 text-green-600" />;
      case 'NEGATIVE':
        return <Frown className="h-5 w-5 text-red-600" />;
      default:
        return <Meh className="h-5 w-5 text-gray-600" />;
    }
  };

  const getSentimentBadge = (sentiment: string) => {
    switch (sentiment) {
      case 'POSITIVE':
        return <Badge className="bg-green-100 text-green-700">Positive</Badge>;
      case 'NEGATIVE':
        return <Badge className="bg-red-100 text-red-700">Negative</Badge>;
      default:
        return <Badge variant="outline">Neutral</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-600">Loading sentiment analysis...</p>
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
                <h1 className="text-xl font-bold text-primary">Sentiment Analysis</h1>
                <p className="text-xs text-gray-500">AI-powered customer sentiment tracking</p>
              </div>
            </div>
            <Button onClick={handleBatchAnalyze} disabled={analyzing} variant="outline">
              <RefreshCw className={`h-4 w-4 mr-2 ${analyzing ? 'animate-spin' : ''}`} />
              {analyzing ? 'Analyzing...' : 'Analyze Recent'}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Analyzed</p>
                <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-600" />
            </div>
          </Card>

          <Card className="p-6 bg-green-50 border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-700 mb-1">Positive</p>
                <p className="text-3xl font-bold text-green-600">{stats.positive}</p>
                <p className="text-xs text-green-600 mt-1">
                  {stats.total > 0 ? Math.round((stats.positive / stats.total) * 100) : 0}%
                </p>
              </div>
              <Smile className="h-8 w-8 text-green-600" />
            </div>
          </Card>

          <Card className="p-6 bg-gray-50 border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-700 mb-1">Neutral</p>
                <p className="text-3xl font-bold text-gray-600">{stats.neutral}</p>
                <p className="text-xs text-gray-600 mt-1">
                  {stats.total > 0 ? Math.round((stats.neutral / stats.total) * 100) : 0}%
                </p>
              </div>
              <Meh className="h-8 w-8 text-gray-600" />
            </div>
          </Card>

          <Card className="p-6 bg-red-50 border-red-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-700 mb-1">Negative</p>
                <p className="text-3xl font-bold text-red-600">{stats.negative}</p>
                <p className="text-xs text-red-600 mt-1">
                  {stats.total > 0 ? Math.round((stats.negative / stats.total) * 100) : 0}%
                </p>
              </div>
              <Frown className="h-8 w-8 text-red-600" />
            </div>
          </Card>
        </div>

        {/* Negative Sentiment Alerts */}
        {communications.filter(c => c.sentiment === 'NEGATIVE').length > 0 && (
          <Card className="p-6 mb-6 border-red-200 bg-red-50">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-red-900 mb-1">
                  Negative Sentiment Detected
                </h3>
                <p className="text-sm text-red-700">
                  {communications.filter(c => c.sentiment === 'NEGATIVE').length} customer
                  communication(s) with negative sentiment require attention
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Communications List */}
        <Card className="p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Recent Communications</h3>
          <div className="space-y-4">
            {communications.length === 0 ? (
              <p className="text-center text-gray-500 py-8">
                No analyzed communications yet. Click "Analyze Recent" to start.
              </p>
            ) : (
              communications.map((comm) => (
                <div
                  key={comm.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      {comm.type === 'EMAIL_RECEIVED' ? (
                        <Mail className="h-5 w-5 text-blue-600" />
                      ) : (
                        <MessageSquare className="h-5 w-5 text-purple-600" />
                      )}
                      <div>
                        <p className="font-medium text-gray-900">{comm.leadName}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(comm.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {comm.sentiment && getSentimentBadge(comm.sentiment)}
                      {comm.sentimentScore && (
                        <Badge variant="outline">{comm.sentimentScore}% confident</Badge>
                      )}
                    </div>
                  </div>

                  {comm.subject && (
                    <p className="font-medium text-gray-900 mb-2">{comm.subject}</p>
                  )}

                  <p className="text-sm text-gray-600 line-clamp-2">{comm.body}</p>

                  {comm.sentiment === 'NEGATIVE' && (
                    <div className="mt-3 pt-3 border-t border-red-200 bg-red-50 -mx-4 -mb-4 px-4 py-3 rounded-b-lg">
                      <p className="text-sm text-red-700">
                        <strong>Action Required:</strong> Follow up with customer to address
                        concerns
                      </p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Info Card */}
        <Card className="mt-6 p-6 bg-blue-50 border-blue-200">
          <h3 className="font-semibold text-blue-900 mb-2">About Sentiment Analysis</h3>
          <p className="text-sm text-blue-700">
            Our AI analyzes customer emails and SMS messages to detect sentiment (positive,
            neutral, or negative). Negative sentiment triggers automatic alerts so your team can
            respond quickly to at-risk customers. Analysis is powered by Google Gemini AI.
          </p>
        </Card>
      </main>
    </div>
  );
}
