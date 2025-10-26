'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Loader2, 
  Check, 
  AlertCircle,
  FileText,
  Link as LinkIcon,
  Sparkles,
  ArrowRight,
  RefreshCw
} from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function GenerateContentPage() {
  const router = useRouter();
  const params = useParams();
  const strategyId = params.id as string;

  const [strategy, setStrategy] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const [generatedArticles, setGeneratedArticles] = useState<any[]>([]);
  const [errors, setErrors] = useState<any[]>([]);
  const [completed, setCompleted] = useState(false);
  const [generatingImages, setGeneratingImages] = useState(false);
  const [imageProgress, setImageProgress] = useState(0);
  const [imageStep, setImageStep] = useState('');
  const [initialCompletedCount, setInitialCompletedCount] = useState(0);

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

  const startGeneration = async () => {
    setGenerating(true);
    setProgress(strategy?.generationProgress || 0);
    setCurrentStep(strategy?.completedCount > 0 ? 'Resuming generation...' : 'Initializing complete content generation system...');
    
    // Store initial count but don't add placeholder articles
    setInitialCompletedCount(strategy?.completedCount || 0);
    setGeneratedArticles([]);
    setErrors([]);
    setCompleted(false);

    try {
      const response = await fetch(`/api/ai/strategy/${strategyId}/start-generation-complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error('Failed to start generation');
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
                
                if (data.progress !== undefined) {
                  setProgress(data.progress);
                }
                
                if (data.step) {
                  setCurrentStep(data.step);
                }
                
                if (data.article) {
                  setGeneratedArticles(prev => [...prev, data.article]);
                }
                
                if (data.summary) {
                  // Use backend's completed count directly
                  if (data.summary.completed !== undefined) {
                    setInitialCompletedCount(data.summary.completed);
                    setGeneratedArticles([]); // Reset to avoid double counting
                  }
                }
                
                if (data.error) {
                  setErrors(prev => [...prev, data.error]);
                }
                
                if (data.completed) {
                  setCompleted(true);
                  setGenerating(false);
                  toast.success('All articles generated successfully!');
                }
              } catch (e) {
                console.error('Error parsing SSE data:', e);
              }
            }
          }
        }
      }
    } catch (error: any) {
      console.error('Generation error:', error);
      toast.error(error.message || 'Failed to generate content');
      setGenerating(false);
    }
  };

  const generateImages = async () => {
    setGeneratingImages(true);
    setImageProgress(0);
    setImageStep('Starting image generation...');

    try {
      const response = await fetch(`/api/ai/strategy/${strategyId}/generate-images`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error('Failed to start image generation');
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
                
                if (data.progress !== undefined) {
                  setImageProgress(data.progress);
                }
                
                if (data.step) {
                  setImageStep(data.step);
                }
                
                if (data.warning) {
                  toast.error(`Warning: ${data.warning.message}`);
                }
                
                if (data.completed) {
                  setGeneratingImages(false);
                  toast.success('All images generated successfully!');
                  fetchStrategy(); // Refresh to show updated images
                }
              } catch (e) {
                console.error('Error parsing SSE data:', e);
              }
            }
          }
        }
      }
    } catch (error: any) {
      console.error('Image generation error:', error);
      toast.error(error.message || 'Failed to generate images');
      setGeneratingImages(false);
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
            <p className="text-gray-600 mb-4">The content strategy could not be loaded.</p>
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
            <p className="text-gray-600">Generate all {totalArticles} articles with AI</p>
          </div>
          <Link href="/admin/dashboard/content-strategy">
            <Button variant="outline">Back to Strategies</Button>
          </Link>
        </div>

        {/* Strategy Summary */}
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <FileText className="w-8 h-8 text-coral mx-auto mb-2" />
              <p className="text-2xl font-bold">{strategy.totalPillars}</p>
              <p className="text-sm text-gray-600">Pillars</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <FileText className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <p className="text-2xl font-bold">{strategy.totalClusters}</p>
              <p className="text-sm text-gray-600">Clusters</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <LinkIcon className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <p className="text-2xl font-bold">{strategy.totalClusters * 3}</p>
              <p className="text-sm text-gray-600">Internal Links</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Sparkles className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <p className="text-2xl font-bold">{totalArticles}</p>
              <p className="text-sm text-gray-600">Total Articles</p>
            </CardContent>
          </Card>
        </div>

        {/* Generation Control */}
        {!generating && !completed && (
          <Card>
            <CardContent className="p-8">
              <div className="text-center space-y-4">
                <div className="w-20 h-20 bg-coral/10 rounded-full flex items-center justify-center mx-auto">
                  <Sparkles className="w-10 h-10 text-coral" />
                </div>
                <h2 className="text-2xl font-bold">Ready to Generate Content</h2>
                <p className="text-gray-600 max-w-2xl mx-auto">
                  Click the button below to start the complete content generation system. 
                  This will generate all {totalArticles} articles with full SEO optimization.
                  Estimated time: {Math.ceil(totalArticles * 2)} minutes.
                </p>
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 rounded-lg p-6 max-w-2xl mx-auto">
                  <p className="text-sm font-bold text-blue-900 mb-3">
                    🚀 Complete Content Generation System:
                  </p>
                  <ul className="text-sm text-blue-800 space-y-2 text-left">
                    <li>✅ {strategy.totalPillars} pillar articles (3,000 words each)</li>
                    <li>✅ {strategy.totalClusters} cluster articles (1,500 words each)</li>
                    <li>✅ Google Search grounding (current data)</li>
                    <li>✅ AI-generated images (hero + infographic)</li>
                    <li>✅ Internal link building (pillar ↔ cluster)</li>
                    <li>✅ Schema markup (Article, FAQ, Breadcrumb)</li>
                    <li>✅ Funnel integration (calculator, packages)</li>
                    <li>✅ SEO optimization (95%+ target score)</li>
                    <li>✅ HTML polishing & modern styling</li>
                  </ul>
                </div>
                <Button
                  onClick={startGeneration}
                  className="bg-gradient-to-r from-coral to-purple-600 hover:from-coral/90 hover:to-purple-700 h-14 px-8 text-lg shadow-lg"
                >
                  <Sparkles className="w-5 h-5 mr-2" />
                  Start Complete Generation System
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Generation Progress */}
        {generating && (
          <Card>
            <CardContent className="p-8">
              <div className="space-y-6">
                <div className="text-center">
                  <Loader2 className="w-16 h-16 animate-spin text-coral mx-auto mb-4" />
                  <h2 className="text-2xl font-bold mb-2">Generating Content...</h2>
                  <p className="text-gray-600">{currentStep}</p>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Progress</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} className="h-3" />
                </div>

                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-green-600">{initialCompletedCount + generatedArticles.length}</p>
                    <p className="text-sm text-gray-600">Generated</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-blue-600">
                      {totalArticles - (initialCompletedCount + generatedArticles.length)}
                    </p>
                    <p className="text-sm text-gray-600">Remaining</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-red-600">{errors.length}</p>
                    <p className="text-sm text-gray-600">Errors</p>
                  </div>
                </div>

                {generatedArticles.length > 0 && (
                  <div className="bg-gray-50 rounded-lg p-4 max-h-60 overflow-y-auto">
                    <p className="font-semibold mb-2 text-sm">Recently Generated:</p>
                    <div className="space-y-2">
                      {generatedArticles.slice(-5).reverse().map((article, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm">
                          <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                          <span className="truncate">{article.title}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Completion */}
        {completed && (
          <Card>
            <CardContent className="p-8">
              <div className="text-center space-y-4">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <Check className="w-10 h-10 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-green-600">Content Generation Complete! 🎉</h2>
                <p className="text-gray-600 max-w-2xl mx-auto">
                  Successfully generated {initialCompletedCount + generatedArticles.length} articles with internal linking and SEO optimization.
                </p>

                <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto">
                  <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
                    <p className="text-3xl font-bold text-green-600">{initialCompletedCount + generatedArticles.length}</p>
                    <p className="text-sm text-gray-600">Articles Published</p>
                  </div>
                  <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                    <p className="text-3xl font-bold text-blue-600">
                      {generatedArticles.reduce((sum, a) => sum + (a.wordCount || 0), 0).toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-600">Total Words</p>
                  </div>
                  <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-4">
                    <p className="text-3xl font-bold text-purple-600">
                      {Math.round(generatedArticles.reduce((sum, a) => sum + (a.seoScore || 0), 0) / generatedArticles.length)}
                    </p>
                    <p className="text-sm text-gray-600">Avg SEO Score</p>
                  </div>
                </div>

                {errors.length > 0 && (
                  <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 max-w-2xl mx-auto">
                    <p className="font-semibold text-red-900 mb-2">⚠️ {errors.length} Errors Occurred</p>
                    <div className="text-sm text-red-800 space-y-1 text-left max-h-40 overflow-y-auto">
                      {errors.map((error, index) => (
                        <p key={index}>• {error}</p>
                      ))}
                    </div>
                    <Button
                      onClick={() => {
                        setCompleted(false);
                        setGenerating(true);
                        setErrors([]);
                        retryFailedArticles();
                      }}
                      className="mt-4 bg-red-600 hover:bg-red-700"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Retry Failed Articles
                    </Button>
                  </div>
                )}

                {/* Image Generation Section */}
                {!generatingImages && (
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-lg p-6 max-w-2xl mx-auto">
                    <p className="text-sm font-bold text-purple-900 mb-3">
                      📸 Generate Hero Images & Infographics
                    </p>
                    <p className="text-sm text-purple-800 mb-4">
                      Add professional AI-generated images to all {totalArticles} articles. 
                      This will create 2 images per article (hero + infographic).
                    </p>
                    <Button
                      onClick={generateImages}
                      className="w-full bg-purple-600 hover:bg-purple-700"
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generate All Images ({totalArticles * 2} images)
                    </Button>
                  </div>
                )}

                {/* Image Generation Progress */}
                {generatingImages && (
                  <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-6 max-w-2xl mx-auto">
                    <div className="flex items-center gap-3 mb-4">
                      <Loader2 className="w-5 h-5 animate-spin text-purple-600" />
                      <span className="font-semibold text-purple-900">Generating Images...</span>
                    </div>
                    <Progress value={imageProgress} className="mb-3" />
                    <p className="text-sm text-purple-800">{imageStep}</p>
                  </div>
                )}

                <div className="flex gap-4 justify-center">
                  <Link href="/admin/dashboard/website/blog">
                    <Button className="bg-green-600 hover:bg-green-700">
                      <FileText className="w-4 h-4 mr-2" />
                      View Published Articles
                    </Button>
                  </Link>
                  <Link href="/admin/dashboard/content-strategy">
                    <Button variant="outline">
                      Back to Strategies
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
