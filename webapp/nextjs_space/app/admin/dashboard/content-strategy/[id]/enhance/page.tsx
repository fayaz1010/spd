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
  Sparkles,
  ArrowRight,
  Image as ImageIcon,
  Wand2,
  Shield,
  Search,
  FileCheck
} from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function EnhanceContentPage() {
  const router = useRouter();
  const params = useParams();
  const strategyId = params.id as string;

  const [strategy, setStrategy] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [enhancing, setEnhancing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const [enhancedArticles, setEnhancedArticles] = useState<any[]>([]);
  const [errors, setErrors] = useState<any[]>([]);
  const [completed, setCompleted] = useState(false);

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

  const startEnhancement = async () => {
    setEnhancing(true);
    setProgress(0);
    setCurrentStep('Initializing enhancement process...');
    setEnhancedArticles([]);
    setErrors([]);
    setCompleted(false);

    try {
      const response = await fetch(`/api/ai/strategy/${strategyId}/enhance-all`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error('Failed to start enhancement');
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
                  setEnhancedArticles(prev => [...prev, data.article]);
                }
                
                if (data.error) {
                  setErrors(prev => [...prev, data.error]);
                }
                
                if (data.completed) {
                  setCompleted(true);
                  setEnhancing(false);
                  toast.success('All articles enhanced successfully!');
                }
              } catch (e) {
                console.error('Error parsing SSE data:', e);
              }
            }
          }
        }
      }
    } catch (error: any) {
      console.error('Enhancement error:', error);
      toast.error(error.message || 'Failed to enhance content');
      setEnhancing(false);
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
              <Wand2 className="w-8 h-8 text-purple-600" />
              Enhance & Polish Articles
            </h1>
            <p className="text-gray-600">Step 2: Clean, format, add images & compliance</p>
          </div>
          <Link href={`/admin/dashboard/content-strategy/${strategyId}/generate`}>
            <Button variant="outline">Back to Generation</Button>
          </Link>
        </div>

        {/* Enhancement Steps Preview */}
        <div className="grid grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <FileCheck className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <p className="text-sm font-semibold">Clean & Format</p>
              <p className="text-xs text-gray-600 mt-1">Remove HTML tags, fix lists</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <ImageIcon className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <p className="text-sm font-semibold">Generate Images</p>
              <p className="text-xs text-gray-600 mt-1">Hero + infographic</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Wand2 className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <p className="text-sm font-semibold">Embed Images</p>
              <p className="text-xs text-gray-600 mt-1">Insert in content</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Search className="w-8 h-8 text-orange-600 mx-auto mb-2" />
              <p className="text-sm font-semibold">SEO Analysis</p>
              <p className="text-xs text-gray-600 mt-1">Keywords & optimization</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Shield className="w-8 h-8 text-red-600 mx-auto mb-2" />
              <p className="text-sm font-semibold">Add Compliance</p>
              <p className="text-xs text-gray-600 mt-1">Credentials, disclaimers</p>
            </CardContent>
          </Card>
        </div>

        {/* Enhancement Control */}
        {!enhancing && !completed && (
          <Card>
            <CardContent className="p-8">
              <div className="text-center space-y-4">
                <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto">
                  <Wand2 className="w-10 h-10 text-purple-600" />
                </div>
                <h2 className="text-2xl font-bold">Ready to Enhance All Articles</h2>
                <p className="text-gray-600 max-w-2xl mx-auto">
                  This will enhance all {totalArticles} articles with professional formatting, 
                  images, and compliance features. Estimated time: {Math.ceil(totalArticles * 2)} minutes.
                </p>
                <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-4 max-w-2xl mx-auto">
                  <p className="text-sm text-purple-900 font-semibold mb-2">
                    Enhancement Process:
                  </p>
                  <ul className="text-sm text-purple-800 space-y-2 text-left">
                    <li className="flex items-start gap-2">
                      <FileCheck className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span><strong>Clean & Format:</strong> Remove HTML tags, fix lists and headings</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <ImageIcon className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span><strong>Generate Images:</strong> AI-generated hero images and infographics</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Wand2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span><strong>Embed Images:</strong> Automatically insert images in optimal positions</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Shield className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span><strong>Add Compliance:</strong> Expert credentials, YMYL disclaimers, schema markup</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span><strong>Validation:</strong> E-E-A-T scoring and final quality check</span>
                    </li>
                  </ul>
                </div>
                <Button
                  onClick={startEnhancement}
                  className="bg-purple-600 hover:bg-purple-700 h-14 px-8 text-lg"
                >
                  <Wand2 className="w-5 h-5 mr-2" />
                  Start Enhancement Process
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Enhancement Progress */}
        {enhancing && (
          <Card>
            <CardContent className="p-8">
              <div className="space-y-6">
                <div className="text-center">
                  <Loader2 className="w-16 h-16 animate-spin text-purple-600 mx-auto mb-4" />
                  <h2 className="text-2xl font-bold mb-2">Enhancing Articles...</h2>
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
                    <p className="text-2xl font-bold text-green-600">{enhancedArticles.filter(a => a.status === 'completed').length}</p>
                    <p className="text-sm text-gray-600">Enhanced</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-blue-600">
                      {totalArticles - enhancedArticles.filter(a => a.status === 'completed').length}
                    </p>
                    <p className="text-sm text-gray-600">Remaining</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-red-600">{errors.length}</p>
                    <p className="text-sm text-gray-600">Errors</p>
                  </div>
                </div>

                {enhancedArticles.length > 0 && (
                  <div className="bg-gray-50 rounded-lg p-4 max-h-60 overflow-y-auto">
                    <p className="font-semibold mb-2 text-sm">Recently Enhanced:</p>
                    <div className="space-y-2">
                      {enhancedArticles.slice(-5).reverse().map((article, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm">
                          {article.status === 'completed' ? (
                            <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                          ) : article.status === 'error' ? (
                            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                          ) : (
                            <Loader2 className="w-4 h-4 text-blue-600 flex-shrink-0 animate-spin" />
                          )}
                          <span className="truncate">{article.title}</span>
                          {article.eeatScore && (
                            <span className="ml-auto text-xs text-gray-600">E-E-A-T: {article.eeatScore}/100</span>
                          )}
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
                <h2 className="text-2xl font-bold text-green-600">Enhancement Complete! 🎉</h2>
                <p className="text-gray-600 max-w-2xl mx-auto">
                  Successfully enhanced {enhancedArticles.filter(a => a.status === 'completed').length} articles with 
                  images, formatting, and compliance features.
                </p>

                <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto">
                  <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
                    <p className="text-3xl font-bold text-green-600">
                      {enhancedArticles.filter(a => a.status === 'completed').length}
                    </p>
                    <p className="text-sm text-gray-600">Articles Enhanced</p>
                  </div>
                  <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                    <p className="text-3xl font-bold text-blue-600">
                      {enhancedArticles.filter(a => a.status === 'completed').length * 2}
                    </p>
                    <p className="text-sm text-gray-600">Images Generated</p>
                  </div>
                  <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-4">
                    <p className="text-3xl font-bold text-purple-600">
                      {enhancedArticles.filter(a => a.eeatScore).length > 0
                        ? Math.round(
                            enhancedArticles
                              .filter(a => a.eeatScore)
                              .reduce((sum, a) => sum + a.eeatScore, 0) /
                            enhancedArticles.filter(a => a.eeatScore).length
                          )
                        : 0}
                    </p>
                    <p className="text-sm text-gray-600">Avg E-E-A-T Score</p>
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
                  </div>
                )}

                <div className="flex gap-4 justify-center">
                  <Link href="/admin/dashboard/website/blog">
                    <Button className="bg-green-600 hover:bg-green-700">
                      <FileCheck className="w-4 h-4 mr-2" />
                      View Enhanced Articles
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
