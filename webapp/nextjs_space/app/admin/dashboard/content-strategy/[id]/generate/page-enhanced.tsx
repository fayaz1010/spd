'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Loader2, 
  Check, 
  AlertCircle,
  FileText,
  Link as LinkIcon,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Search,
  XCircle,
  Clock,
  CheckCircle2
} from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function GenerateContentPageEnhanced() {
  const router = useRouter();
  const params = useParams();
  const strategyId = params.id as string;

  const [strategy, setStrategy] = useState<any>(null);
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const [currentArticle, setCurrentArticle] = useState('');
  const [completed, setCompleted] = useState(false);

  // Resume options
  const [resumeOptions, setResumeOptions] = useState({
    regenerateCorrupted: true,
    generatePlanned: true,
    resetStuck: true,
    skipGenerated: true,
    fixLowQuality: false,
  });

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

  const analyzeStrategy = async () => {
    setAnalyzing(true);
    try {
      const response = await fetch(`/api/ai/strategy/${strategyId}/analyze`);
      const data = await response.json();
      setAnalysis(data);
      toast.success('Analysis complete!');
    } catch (error) {
      console.error('Analysis error:', error);
      toast.error('Failed to analyze strategy');
    } finally {
      setAnalyzing(false);
    }
  };

  const resumeGeneration = async () => {
    setGenerating(true);
    setProgress(0);
    setCurrentStep('Starting resume process...');
    setCompleted(false);

    try {
      const response = await fetch(`/api/ai/strategy/${strategyId}/resume`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ options: resumeOptions }),
      });

      if (!response.ok) {
        throw new Error('Failed to start resume');
      }

      // Stream progress updates
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n').filter(line => line.trim());

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                
                if (data.type === 'progress') {
                  setProgress(data.progress);
                  setCurrentStep(data.step);
                  setCurrentArticle(data.article || '');
                }
                
                if (data.type === 'complete') {
                  setCompleted(true);
                  setGenerating(false);
                  toast.success(`Resume complete! Generated: ${data.result.generated}, Regenerated: ${data.result.regenerated}`);
                  // Refresh analysis
                  analyzeStrategy();
                }

                if (data.type === 'error') {
                  toast.error(data.error);
                  setGenerating(false);
                }
              } catch (e) {
                console.error('Error parsing SSE data:', e);
              }
            }
          }
        }
      }
    } catch (error: any) {
      console.error('Resume error:', error);
      toast.error(error.message || 'Failed to resume generation');
      setGenerating(false);
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

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Sparkles className="w-8 h-8 text-coral" />
              {strategy.name}
            </h1>
            <p className="text-gray-600">Smart content generation with recovery</p>
          </div>
          <Link href="/admin/dashboard/content-strategy">
            <Button variant="outline">Back to Strategies</Button>
          </Link>
        </div>

        {/* Analyze Button */}
        {!analysis && !analyzing && (
          <Card>
            <CardContent className="p-8 text-center">
              <Search className="w-16 h-16 text-blue-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Analyze Current State</h2>
              <p className="text-gray-600 mb-6">
                Check the status of all {totalArticles} articles to see what needs to be done
              </p>
              <Button
                onClick={analyzeStrategy}
                className="bg-blue-600 hover:bg-blue-700 h-12 px-8"
              >
                <Search className="w-5 h-5 mr-2" />
                Analyze Strategy
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Analyzing */}
        {analyzing && (
          <Card>
            <CardContent className="p-8 text-center">
              <Loader2 className="w-16 h-16 animate-spin text-blue-600 mx-auto mb-4" />
              <h2 className="text-xl font-bold">Analyzing {totalArticles} articles...</h2>
            </CardContent>
          </Card>
        )}

        {/* Analysis Results */}
        {analysis && !generating && (
          <>
            {/* Status Breakdown */}
            <div className="grid grid-cols-5 gap-4">
              <Card className="border-2 border-blue-200">
                <CardContent className="p-4 text-center">
                  <Clock className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <p className="text-3xl font-bold text-blue-600">{analysis.planned}</p>
                  <p className="text-sm text-gray-600">Planned</p>
                </CardContent>
              </Card>
              <Card className="border-2 border-yellow-200">
                <CardContent className="p-4 text-center">
                  <Loader2 className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
                  <p className="text-3xl font-bold text-yellow-600">{analysis.generating}</p>
                  <p className="text-sm text-gray-600">Stuck</p>
                </CardContent>
              </Card>
              <Card className="border-2 border-green-200">
                <CardContent className="p-4 text-center">
                  <CheckCircle2 className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <p className="text-3xl font-bold text-green-600">{analysis.generated}</p>
                  <p className="text-sm text-gray-600">Generated</p>
                </CardContent>
              </Card>
              <Card className="border-2 border-red-200">
                <CardContent className="p-4 text-center">
                  <XCircle className="w-8 h-8 text-red-600 mx-auto mb-2" />
                  <p className="text-3xl font-bold text-red-600">{analysis.corrupted}</p>
                  <p className="text-sm text-gray-600">Corrupted</p>
                </CardContent>
              </Card>
              <Card className="border-2 border-purple-200">
                <CardContent className="p-4 text-center">
                  <Sparkles className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                  <p className="text-3xl font-bold text-purple-600">{analysis.published}</p>
                  <p className="text-sm text-gray-600">Published</p>
                </CardContent>
              </Card>
            </div>

            {/* Next Actions */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-bold mb-4">📋 Recommended Actions</h3>
                <div className="space-y-2">
                  {analysis.nextActions.map((action: string, index: number) => (
                    <div key={index} className="flex items-start gap-2 text-sm">
                      <span className="mt-0.5">•</span>
                      <span>{action}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Resume Options */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-bold mb-4">⚙️ Resume Options</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={resumeOptions.regenerateCorrupted}
                      onCheckedChange={(checked) =>
                        setResumeOptions({ ...resumeOptions, regenerateCorrupted: !!checked })
                      }
                    />
                    <label className="text-sm">
                      <strong>Regenerate Corrupted</strong> ({analysis.corrupted} articles) - Fix broken HTML
                    </label>
                  </div>
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={resumeOptions.resetStuck}
                      onCheckedChange={(checked) =>
                        setResumeOptions({ ...resumeOptions, resetStuck: !!checked })
                      }
                    />
                    <label className="text-sm">
                      <strong>Reset Stuck</strong> ({analysis.generating} articles) - Retry stuck articles
                    </label>
                  </div>
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={resumeOptions.generatePlanned}
                      onCheckedChange={(checked) =>
                        setResumeOptions({ ...resumeOptions, generatePlanned: !!checked })
                      }
                    />
                    <label className="text-sm">
                      <strong>Generate Planned</strong> ({analysis.planned} articles) - Generate not-started articles
                    </label>
                  </div>
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={resumeOptions.skipGenerated}
                      onCheckedChange={(checked) =>
                        setResumeOptions({ ...resumeOptions, skipGenerated: !!checked })
                      }
                    />
                    <label className="text-sm">
                      <strong>Skip Generated</strong> ({analysis.generated} articles) - Don't touch completed articles
                    </label>
                  </div>
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={resumeOptions.fixLowQuality}
                      onCheckedChange={(checked) =>
                        setResumeOptions({ ...resumeOptions, fixLowQuality: !!checked })
                      }
                    />
                    <label className="text-sm">
                      <strong>Fix Low Quality</strong> - Regenerate articles with low SEO scores or word counts
                    </label>
                  </div>
                </div>

                <div className="mt-6 flex gap-4">
                  <Button
                    onClick={resumeGeneration}
                    className="bg-coral hover:bg-coral/90 h-12 px-8 flex-1"
                  >
                    <RefreshCw className="w-5 h-5 mr-2" />
                    Resume Generation
                  </Button>
                  <Button
                    onClick={analyzeStrategy}
                    variant="outline"
                    className="h-12 px-6"
                  >
                    <Search className="w-5 h-5 mr-2" />
                    Re-analyze
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Article List (collapsed by default) */}
            <details className="group">
              <summary className="cursor-pointer">
                <Card className="hover:bg-gray-50">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-bold">📄 View All {analysis.totalArticles} Articles</h3>
                      <span className="text-sm text-gray-500">Click to expand</span>
                    </div>
                  </CardContent>
                </Card>
              </summary>
              <Card className="mt-2">
                <CardContent className="p-6">
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {analysis.articles.map((article: any, index: number) => (
                      <div
                        key={index}
                        className={`flex items-center justify-between p-3 rounded-lg border-2 ${
                          article.stage === 'CORRUPTED'
                            ? 'border-red-200 bg-red-50'
                            : article.stage === 'PLANNED'
                            ? 'border-blue-200 bg-blue-50'
                            : article.stage === 'GENERATING'
                            ? 'border-yellow-200 bg-yellow-50'
                            : article.stage === 'GENERATED'
                            ? 'border-green-200 bg-green-50'
                            : 'border-purple-200 bg-purple-50'
                        }`}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold px-2 py-1 rounded bg-white">
                              {article.type}
                            </span>
                            <span className="font-medium">{article.title}</span>
                          </div>
                          {article.issues.length > 0 && (
                            <div className="text-xs text-gray-600 mt-1">
                              Issues: {article.issues.join(', ')}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          {article.wordCount && (
                            <span className="text-gray-600">{article.wordCount} words</span>
                          )}
                          {article.seoScore && (
                            <span className="font-semibold">SEO: {article.seoScore}</span>
                          )}
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              article.stage === 'CORRUPTED'
                                ? 'bg-red-600 text-white'
                                : article.stage === 'PLANNED'
                                ? 'bg-blue-600 text-white'
                                : article.stage === 'GENERATING'
                                ? 'bg-yellow-600 text-white'
                                : article.stage === 'GENERATED'
                                ? 'bg-green-600 text-white'
                                : 'bg-purple-600 text-white'
                            }`}
                          >
                            {article.stage}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </details>
          </>
        )}

        {/* Generation Progress */}
        {generating && (
          <Card>
            <CardContent className="p-8">
              <div className="space-y-6">
                <div className="text-center">
                  <Loader2 className="w-16 h-16 animate-spin text-coral mx-auto mb-4" />
                  <h2 className="text-2xl font-bold mb-2">Resuming Generation...</h2>
                  <p className="text-gray-600">{currentStep}</p>
                  {currentArticle && (
                    <p className="text-sm text-gray-500 mt-2">Current: {currentArticle}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Progress</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} className="h-3" />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Completion */}
        {completed && (
          <Card>
            <CardContent className="p-8 text-center">
              <Check className="w-20 h-20 text-green-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-green-600 mb-4">Resume Complete! 🎉</h2>
              <div className="flex gap-4 justify-center">
                <Link href={`/admin/dashboard/content-strategy/${strategyId}/review`}>
                  <Button className="bg-purple-600 hover:bg-purple-700">
                    <ArrowRight className="w-5 h-5 mr-2" />
                    Review Articles
                  </Button>
                </Link>
                <Button onClick={analyzeStrategy} variant="outline">
                  <Search className="w-5 h-5 mr-2" />
                  Re-analyze
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
