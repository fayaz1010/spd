'use client';

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw } from 'lucide-react';
import { NEM12Uploader } from './NEM12Uploader';
import { ConsumptionAnalysis } from './ConsumptionAnalysis';
import { ConsumptionCharts } from './ConsumptionCharts';
import { AIInsights } from './AIInsights';
import { useToast } from '@/hooks/use-toast';

interface NEM12DashboardProps {
  leadId: string;
}

export function NEM12Dashboard({ leadId }: NEM12DashboardProps) {
  const [hasData, setHasData] = useState(false);
  const [loading, setLoading] = useState(true);
  const [analysis, setAnalysis] = useState<any>(null);
  const [aiInsights, setAiInsights] = useState<any>(null);
  const [loadingAI, setLoadingAI] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    checkForData();
  }, [leadId]);

  const checkForData = async () => {
    try {
      const response = await fetch(`/api/nem12/${leadId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.uploads && data.uploads.length > 0) {
          setHasData(true);
          await loadAnalysis();
        }
      }
    } catch (error) {
      console.error('Failed to check for NEM12 data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAnalysis = async () => {
    try {
      const response = await fetch(`/api/nem12/${leadId}/analysis`);
      if (response.ok) {
        const data = await response.json();
        setAnalysis(data.analysis);
        
        // Load AI insights if available
        loadAIInsights();
      }
    } catch (error) {
      console.error('Failed to load analysis:', error);
    }
  };

  const loadAIInsights = async () => {
    try {
      const response = await fetch(`/api/nem12/${leadId}/ai-analysis`);
      if (response.ok) {
        const data = await response.json();
        setAiInsights(data.analysis);
      }
    } catch (error) {
      // AI insights not available yet
      console.log('AI insights not available yet');
    }
  };

  const generateAIInsights = async () => {
    setLoadingAI(true);
    try {
      const response = await fetch(`/api/nem12/${leadId}/ai-analysis`, {
        method: 'POST',
      });

      if (response.ok) {
        const data = await response.json();
        setAiInsights(data.analysis);
        toast({
          title: 'AI Analysis Complete',
          description: 'Your personalized recommendations are ready',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to generate AI insights',
        variant: 'destructive',
      });
    } finally {
      setLoadingAI(false);
    }
  };

  const handleUploadComplete = () => {
    setHasData(true);
    loadAnalysis();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!hasData) {
    return <NEM12Uploader leadId={leadId} onUploadComplete={handleUploadComplete} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Smart Meter Analysis</h2>
          <p className="text-gray-600">
            Detailed consumption analysis from your NEM12 data
          </p>
        </div>
        <Button variant="outline" onClick={checkForData}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="patterns">Patterns</TabsTrigger>
          <TabsTrigger value="ai-insights">
            AI Insights
            {!aiInsights && (
              <span className="ml-2 h-2 w-2 bg-blue-600 rounded-full animate-pulse" />
            )}
          </TabsTrigger>
          <TabsTrigger value="upload">Upload New</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview">
          {analysis && <ConsumptionAnalysis analysis={analysis} />}
        </TabsContent>

        {/* Patterns Tab */}
        <TabsContent value="patterns">
          {analysis && analysis.hourlyPattern && analysis.dailyPattern && (
            <ConsumptionCharts
              hourlyPattern={analysis.hourlyPattern}
              dailyPattern={analysis.dailyPattern}
            />
          )}
        </TabsContent>

        {/* AI Insights Tab */}
        <TabsContent value="ai-insights">
          {aiInsights ? (
            <AIInsights analysis={aiInsights} />
          ) : (
            <div className="text-center py-12">
              <div className="mb-6">
                <div className="bg-purple-100 rounded-full p-6 w-24 h-24 mx-auto mb-4 flex items-center justify-center">
                  <Loader2 className="h-12 w-12 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">
                  AI Analysis Available
                </h3>
                <p className="text-gray-600 mb-6">
                  Get personalized system recommendations and energy saving tips
                  powered by AI
                </p>
              </div>

              <Button
                onClick={generateAIInsights}
                disabled={loadingAI}
                size="lg"
              >
                {loadingAI ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  'Generate AI Insights'
                )}
              </Button>
            </div>
          )}
        </TabsContent>

        {/* Upload New Tab */}
        <TabsContent value="upload">
          <NEM12Uploader leadId={leadId} onUploadComplete={handleUploadComplete} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
