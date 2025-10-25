'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft,
  Sparkles,
  Loader2,
  Check,
  FileText,
  Link as LinkIcon,
  Calculator,
  Package,
  TrendingUp,
  Users
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Step5Props {
  data: any;
  onComplete: (data: any) => void;
  onBack: () => void;
}

export function Step5ReviewPublish({ data, onComplete, onBack }: Step5Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [strategyId, setStrategyId] = useState<string | null>(null);

  const totalClusters = Object.values(data.clusters || {}).reduce((sum: number, arr: any) => sum + arr.length, 0);
  const totalArticles = (data.pillars?.length || 0) + totalClusters;
  
  const calculatorTouchpoints = data.funnelConfig?.calculatorEnabled 
    ? totalArticles * (data.funnelConfig?.calculatorPlacements?.length || 2)
    : 0;
  const packageTouchpoints = data.funnelConfig?.packagesEnabled ? Math.floor(totalArticles * 0.6) : 0;
  
  // Estimate internal links (each cluster links to pillar + 2 other clusters)
  const estimatedLinks = totalClusters * 3 + (data.pillars?.length || 0) * 2;

  // Estimate traffic (rough calculation)
  const totalSearchVolume = (data.pillars || []).reduce((sum: number, p: any) => {
    const pillarVolume = p.searchVolume || 0;
    const clusterVolume = (data.clusters[p.id] || []).reduce((cSum: number, c: any) => cSum + (c.searchVolume || 0), 0);
    return sum + pillarVolume + clusterVolume;
  }, 0);
  const estimatedTraffic = Math.round(totalSearchVolume * 0.4); // 40% CTR estimate
  const estimatedLeads = Math.round(estimatedTraffic * 0.02); // 2% conversion rate

  const handleSaveStrategy = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/ai/strategy/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          description: `Content strategy for ${data.mainTopic}`,
          targetAudience: data.targetAudience,
          businessGoals: data.businessGoals,
          pillars: data.pillars,
          clusters: data.clusters,
          funnelConfig: data.funnelConfig,
          estimatedTraffic,
          estimatedLeads,
        }),
      });

      const result = await response.json();
      if (result.success) {
        setStrategyId(result.strategyId);
        toast.success('Strategy saved! Ready to generate content.');
      } else {
        toast.error(result.error || 'Failed to save strategy');
      }
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Failed to save strategy');
    } finally {
      setSaving(false);
    }
  };

  const handleStartGeneration = () => {
    if (!strategyId) {
      toast.error('Please save strategy first');
      return;
    }
    
    // Redirect to generation progress page
    router.push(`/admin/dashboard/content-strategy/${strategyId}/generate`);
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-2">Step 5: Review & Launch Strategy</h2>
        <p className="text-gray-600">
          Review your complete content strategy and start generating articles.
        </p>
      </div>

      {/* Strategy Summary */}
      <div className="bg-gradient-to-br from-coral/10 to-orange-500/10 border-2 border-coral/20 rounded-lg p-6">
        <h3 className="text-xl font-bold mb-4">{data.name}</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-600">Main Topic:</p>
            <p className="font-semibold">{data.mainTopic}</p>
          </div>
          <div>
            <p className="text-gray-600">Target Audience:</p>
            <p className="font-semibold">{data.targetAudience}</p>
          </div>
        </div>
      </div>

      {/* Content Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border-2 border-gray-200 rounded-lg p-4 text-center">
          <FileText className="w-8 h-8 text-coral mx-auto mb-2" />
          <p className="text-2xl font-bold text-coral">{data.pillars?.length || 0}</p>
          <p className="text-sm text-gray-600">Pillar Articles</p>
        </div>
        <div className="bg-white border-2 border-gray-200 rounded-lg p-4 text-center">
          <FileText className="w-8 h-8 text-blue-600 mx-auto mb-2" />
          <p className="text-2xl font-bold text-blue-600">{totalClusters}</p>
          <p className="text-sm text-gray-600">Cluster Articles</p>
        </div>
        <div className="bg-white border-2 border-gray-200 rounded-lg p-4 text-center">
          <LinkIcon className="w-8 h-8 text-green-600 mx-auto mb-2" />
          <p className="text-2xl font-bold text-green-600">{estimatedLinks}</p>
          <p className="text-sm text-gray-600">Internal Links</p>
        </div>
        <div className="bg-white border-2 border-gray-200 rounded-lg p-4 text-center">
          <Calculator className="w-8 h-8 text-purple-600 mx-auto mb-2" />
          <p className="text-2xl font-bold text-purple-600">{calculatorTouchpoints}</p>
          <p className="text-sm text-gray-600">Calculator CTAs</p>
        </div>
      </div>

      {/* Pillar Overview */}
      <div className="border-2 border-gray-200 rounded-lg p-6">
        <h3 className="font-semibold text-lg mb-4">📚 Content Structure</h3>
        <div className="space-y-3">
          {data.pillars?.map((pillar: any, index: number) => {
            const clusterCount = data.clusters[pillar.id]?.length || 0;
            return (
              <div key={pillar.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="bg-coral text-white px-2 py-1 rounded text-xs font-semibold">
                      Pillar {index + 1}
                    </span>
                    <span className="text-sm font-medium">{pillar.title}</span>
                  </div>
                  <p className="text-xs text-gray-600">
                    {pillar.targetKeyword} • {clusterCount} clusters • {pillar.wordCount.toLocaleString()} words
                  </p>
                </div>
                <Check className="w-5 h-5 text-green-600" />
              </div>
            );
          })}
        </div>
      </div>

      {/* Funnel Integration */}
      <div className="border-2 border-gray-200 rounded-lg p-6">
        <h3 className="font-semibold text-lg mb-4">🎯 Funnel Integration</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              data.funnelConfig?.calculatorEnabled ? 'bg-green-100' : 'bg-gray-100'
            }`}>
              <Calculator className={`w-5 h-5 ${
                data.funnelConfig?.calculatorEnabled ? 'text-green-600' : 'text-gray-400'
              }`} />
            </div>
            <div>
              <p className="font-medium text-sm">Calculator Widget</p>
              <p className="text-xs text-gray-600">
                {data.funnelConfig?.calculatorEnabled ? `${calculatorTouchpoints} placements` : 'Disabled'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              data.funnelConfig?.packagesEnabled ? 'bg-green-100' : 'bg-gray-100'
            }`}>
              <Package className={`w-5 h-5 ${
                data.funnelConfig?.packagesEnabled ? 'text-green-600' : 'text-gray-400'
              }`} />
            </div>
            <div>
              <p className="font-medium text-sm">Package Links</p>
              <p className="text-xs text-gray-600">
                {data.funnelConfig?.packagesEnabled ? `${packageTouchpoints} links` : 'Disabled'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Estimated Results */}
      <div className="bg-gradient-to-br from-green-500/10 to-green-600/10 border-2 border-green-500/20 rounded-lg p-6">
        <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-green-600" />
          Estimated Results (6 months)
        </h3>
        <div className="grid grid-cols-3 gap-6">
          <div className="text-center">
            <p className="text-3xl font-bold text-green-600">{estimatedTraffic.toLocaleString()}</p>
            <p className="text-sm text-gray-600">Monthly Visitors</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-green-600">{estimatedLeads}</p>
            <p className="text-sm text-gray-600">Monthly Leads</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-green-600">
              ${Math.round(estimatedLeads * 0.1 * 8000).toLocaleString()}
            </p>
            <p className="text-sm text-gray-600">Est. Monthly Revenue</p>
          </div>
        </div>
        <p className="text-xs text-gray-600 text-center mt-4 italic">
          * Based on 40% CTR, 2% conversion rate, 10% close rate, $8k average deal
        </p>
      </div>

      {/* Generation Timeline */}
      <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
        <h3 className="font-semibold text-lg mb-3">⏱️ Generation Timeline</h3>
        <div className="space-y-2 text-sm">
          <p>📝 <strong>Content Generation:</strong> ~{Math.ceil(totalArticles * 1.5)} minutes ({totalArticles} articles)</p>
          <p>🔗 <strong>Internal Linking:</strong> ~5 minutes (automatic)</p>
          <p>✅ <strong>SEO Optimization:</strong> ~3 minutes (automatic)</p>
          <p className="pt-2 border-t font-semibold">
            🎉 <strong>Total Time:</strong> ~{Math.ceil(totalArticles * 1.5 + 8)} minutes to complete strategy
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-4">
        {!strategyId ? (
          <Button
            onClick={handleSaveStrategy}
            disabled={saving}
            className="w-full bg-coral hover:bg-coral/90 h-14 text-lg"
          >
            {saving ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Saving Strategy...
              </>
            ) : (
              <>
                <Check className="w-5 h-5 mr-2" />
                Save Strategy
              </>
            )}
          </Button>
        ) : (
          <Button
            onClick={handleStartGeneration}
            className="w-full bg-green-600 hover:bg-green-700 h-14 text-lg"
          >
            <Sparkles className="w-5 h-5 mr-2" />
            Start Generating Content
          </Button>
        )}

        <p className="text-center text-sm text-gray-600">
          {!strategyId 
            ? 'Save your strategy to database before generating content'
            : '🎉 Strategy saved! Click above to start generating all articles'
          }
        </p>
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-6 border-t">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div className="text-sm text-gray-500">
          Step 5 of 5 - Ready to launch! 🚀
        </div>
      </div>
    </div>
  );
}
