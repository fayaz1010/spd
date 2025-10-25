'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Plus, 
  Sparkles, 
  FileText, 
  TrendingUp,
  Loader2,
  ArrowRight,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function ContentStrategyPage() {
  const router = useRouter();
  const [strategies, setStrategies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStrategies();
  }, []);

  const fetchStrategies = async () => {
    try {
      const response = await fetch('/api/ai/strategy/list');
      const data = await response.json();
      if (data.success) {
        setStrategies(data.strategies);
      }
    } catch (error) {
      console.error('Error fetching strategies:', error);
      toast.error('Failed to load strategies');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PLANNING':
        return (
          <span className="flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
            <Clock className="w-4 h-4" />
            Planning
          </span>
        );
      case 'GENERATING':
        return (
          <span className="flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium">
            <Loader2 className="w-4 h-4 animate-spin" />
            Generating
          </span>
        );
      case 'REVIEW':
        return (
          <span className="flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
            <AlertCircle className="w-4 h-4" />
            Review
          </span>
        );
      case 'PUBLISHED':
        return (
          <span className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
            <CheckCircle className="w-4 h-4" />
            Published
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Sparkles className="w-8 h-8 text-coral" />
            Content Strategy
          </h1>
          <p className="text-gray-600">Create and manage SEO content strategies</p>
        </div>
        <Link href="/admin/dashboard/content-strategy/wizard">
          <Button className="bg-coral hover:bg-coral/90">
            <Plus className="w-4 h-4 mr-2" />
            New Strategy
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <FileText className="w-8 h-8 text-coral mx-auto mb-2" />
            <p className="text-2xl font-bold">
              {strategies.reduce((sum, s) => sum + s.totalPillars + s.totalClusters, 0)}
            </p>
            <p className="text-sm text-gray-600">Total Articles</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Sparkles className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <p className="text-2xl font-bold">{strategies.length}</p>
            <p className="text-sm text-gray-600">Strategies</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <TrendingUp className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <p className="text-2xl font-bold">
              {strategies.reduce((sum, s) => sum + (s.estimatedTraffic || 0), 0).toLocaleString()}
            </p>
            <p className="text-sm text-gray-600">Est. Monthly Traffic</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <CheckCircle className="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <p className="text-2xl font-bold">
              {strategies.filter(s => s.status === 'PUBLISHED').length}
            </p>
            <p className="text-sm text-gray-600">Published</p>
          </CardContent>
        </Card>
      </div>

      {/* Strategies List */}
      {loading ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-coral mx-auto mb-4" />
            <p className="text-gray-600">Loading strategies...</p>
          </CardContent>
        </Card>
      ) : strategies.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Sparkles className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Strategies Yet</h3>
            <p className="text-gray-600 mb-6">
              Create your first content strategy to start dominating search results
            </p>
            <Link href="/admin/dashboard/content-strategy/wizard">
              <Button className="bg-coral hover:bg-coral/90">
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Strategy
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {strategies.map((strategy) => (
            <Card key={strategy.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold">{strategy.name}</h3>
                      {getStatusBadge(strategy.status)}
                    </div>
                    {strategy.description && (
                      <p className="text-gray-600 mb-4">{strategy.description}</p>
                    )}
                    <div className="grid grid-cols-5 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Pillars</p>
                        <p className="font-semibold">{strategy.totalPillars}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Clusters</p>
                        <p className="font-semibold">{strategy.totalClusters}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Completed</p>
                        <p className="font-semibold">
                          {strategy.completedCount}/{strategy.totalPillars + strategy.totalClusters}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Est. Traffic</p>
                        <p className="font-semibold">
                          {strategy.estimatedTraffic?.toLocaleString() || 0}/mo
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Est. Leads</p>
                        <p className="font-semibold">
                          {strategy.estimatedLeads || 0}/mo
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {strategy.status === 'PLANNING' && (
                      <Link href={`/admin/dashboard/content-strategy/${strategy.id}/generate`}>
                        <Button className="bg-coral hover:bg-coral/90">
                          <Sparkles className="w-4 h-4 mr-2" />
                          Generate Content
                        </Button>
                      </Link>
                    )}
                    {strategy.status === 'REVIEW' && (
                      <Link href={`/admin/dashboard/content-strategy/${strategy.id}/review`}>
                        <Button className="bg-purple-600 hover:bg-purple-700">
                          <AlertCircle className="w-4 h-4 mr-2" />
                          Review & Publish
                        </Button>
                      </Link>
                    )}
                    {strategy.status === 'PUBLISHED' && (
                      <Link href="/admin/dashboard/website/blog">
                        <Button variant="outline">
                          <FileText className="w-4 h-4 mr-2" />
                          View Articles
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
