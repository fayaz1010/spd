'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Loader2, 
  Check, 
  AlertCircle,
  FileText,
  ArrowLeft,
  Sparkles,
  Eye,
  RefreshCw,
  XCircle
} from 'lucide-react';
import { LinkMapVisualizer } from '@/components/content-strategy/LinkMapVisualizer';
import toast from 'react-hot-toast';

export default function ReviewStrategyPage() {
  const router = useRouter();
  const params = useParams();
  const strategyId = params.id as string;

  const [strategy, setStrategy] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    fetchStrategy();
  }, [strategyId]);

  const fetchStrategy = async () => {
    try {
      const response = await fetch(`/api/ai/strategy/${strategyId}`);
      const data = await response.json();
      if (data.success) {
        setStrategy(data.strategy);
      } else {
        toast.error('Failed to load strategy');
      }
    } catch (error) {
      console.error('Error fetching strategy:', error);
      toast.error('Failed to load strategy');
    } finally {
      setLoading(false);
    }
  };

  const handlePublishAll = async () => {
    setPublishing(true);
    try {
      const response = await fetch(`/api/ai/strategy/${strategyId}/publish`, {
        method: 'POST',
      });

      const data = await response.json();
      if (data.success) {
        toast.success(`Published ${data.publishedCount} articles!`);
        router.push('/admin/dashboard/website/blog');
      } else {
        toast.error(data.error || 'Failed to publish articles');
      }
    } catch (error: any) {
      console.error('Publish error:', error);
      toast.error('Failed to publish articles');
    } finally {
      setPublishing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-coral" />
      </div>
    );
  }

  if (!strategy) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Strategy Not Found</h2>
            <Link href="/admin/dashboard/content-strategy">
              <Button>Back to Strategies</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalArticles = strategy.totalPillars + strategy.totalClusters;
  const generatedArticles = strategy.pillars.filter((p: any) => p.blogPostId).length +
    strategy.pillars.flatMap((p: any) => p.clusters).filter((c: any) => c.blogPostId).length;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Link href="/admin/dashboard/content-strategy">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              </Link>
            </div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Check className="w-8 h-8 text-green-600" />
              {strategy.name}
            </h1>
            <p className="text-gray-600">Review and publish your content strategy</p>
          </div>
          <div className="flex gap-2">
            <Link href="/admin/dashboard/website/blog">
              <Button variant="outline">
                <Eye className="w-4 h-4 mr-2" />
                Preview Articles
              </Button>
            </Link>
            <Link href={`/admin/dashboard/content-strategy/${strategyId}/enhance`}>
              <Button className="bg-purple-600 hover:bg-purple-700">
                <Sparkles className="w-4 h-4 mr-2" />
                Enhance & Polish Articles
              </Button>
            </Link>
            <Button
              onClick={handlePublishAll}
              disabled={publishing || generatedArticles === 0}
              className="bg-green-600 hover:bg-green-700"
            >
              {publishing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Publishing...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Publish All {generatedArticles} Articles
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Status Alert */}
        {generatedArticles < totalArticles && (
          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-yellow-600" />
                  <div>
                    <p className="font-semibold text-yellow-900">
                      Content Generation Incomplete
                    </p>
                    <p className="text-sm text-yellow-700">
                      {generatedArticles} of {totalArticles} articles generated. 
                      {totalArticles - generatedArticles} articles failed or pending.
                    </p>
                  </div>
                </div>
                <Link href={`/admin/dashboard/content-strategy/${strategyId}/generate`}>
                  <Button className="bg-coral hover:bg-coral/90">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Retry Failed Articles
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Summary Stats */}
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <FileText className="w-8 h-8 text-coral mx-auto mb-2" />
              <p className="text-2xl font-bold">{strategy.totalPillars}</p>
              <p className="text-sm text-gray-600">Pillar Articles</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <FileText className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <p className="text-2xl font-bold">{strategy.totalClusters}</p>
              <p className="text-sm text-gray-600">Cluster Articles</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Check className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <p className="text-2xl font-bold">{generatedArticles}</p>
              <p className="text-sm text-gray-600">Generated</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Sparkles className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <p className="text-2xl font-bold">
                {Math.round(strategy.pillars.reduce((sum: number, p: any) => 
                  sum + (p.seoScore || 0), 0) / strategy.pillars.length) || 0}
              </p>
              <p className="text-sm text-gray-600">Avg SEO Score</p>
            </CardContent>
          </Card>
        </div>

        {/* Link Map Visualizer */}
        <LinkMapVisualizer strategy={strategy} />

        {/* Article List */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">Generated Articles</h3>
            <div className="space-y-3">
              {strategy.pillars.map((pillar: any, index: number) => (
                <div key={pillar.id}>
                  {/* Pillar */}
                  <div className="flex items-center justify-between p-3 bg-coral/10 border-2 border-coral/20 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="bg-coral text-white px-2 py-1 rounded text-xs font-semibold">
                          PILLAR {index + 1}
                        </span>
                        <span className="font-medium">{pillar.title}</span>
                      </div>
                      <p className="text-sm text-gray-600">
                        {pillar.targetKeyword} • {pillar.wordCount?.toLocaleString() || 0} words
                        {pillar.seoScore && ` • SEO: ${pillar.seoScore}/100`}
                      </p>
                    </div>
                    {pillar.blogPostId ? (
                      <Check className="w-5 h-5 text-green-600" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-yellow-600" />
                    )}
                  </div>

                  {/* Clusters */}
                  {pillar.clusters?.map((cluster: any, clusterIndex: number) => (
                    <div
                      key={cluster.id}
                      className="flex items-center justify-between p-3 ml-8 mt-2 bg-blue-50 border border-blue-200 rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs text-gray-500">
                            Cluster {clusterIndex + 1}
                          </span>
                          <span className="text-sm font-medium">{cluster.title}</span>
                        </div>
                        <p className="text-xs text-gray-600">
                          {cluster.targetKeyword} • {cluster.wordCount?.toLocaleString() || 0} words
                          {cluster.seoScore && ` • SEO: ${cluster.seoScore}/100`}
                        </p>
                      </div>
                      {cluster.blogPostId ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-yellow-600" />
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Publish Section */}
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <Sparkles className="w-8 h-8 text-green-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-green-900 mb-2">
                  Ready to Publish!
                </h3>
                <p className="text-green-700">
                  {generatedArticles} articles are ready to go live. 
                  Publishing will make all articles visible on your website.
                </p>
              </div>
              <Button
                onClick={handlePublishAll}
                disabled={publishing || generatedArticles === 0}
                className="bg-green-600 hover:bg-green-700 h-12 px-8 text-lg"
              >
                {publishing ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Publishing {generatedArticles} Articles...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 mr-2" />
                    Publish All Articles
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
