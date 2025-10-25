'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Sparkles, 
  Loader2, 
  ArrowRight, 
  ArrowLeft,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Step3Props {
  data: any;
  onComplete: (data: any) => void;
  onBack: () => void;
}

export function Step3ClusterPlanning({ data, onComplete, onBack }: Step3Props) {
  const [loading, setLoading] = useState(false);
  const [expandedPillar, setExpandedPillar] = useState<string | null>(null);
  const [clusters, setClusters] = useState<any>(data.clusters || {});

  const handleGenerateClusters = async (pillarId: string, pillarTitle: string, pillarKeyword: string) => {
    setLoading(true);
    try {
      const response = await fetch('/api/ai/strategy/generate-clusters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pillarTitle,
          pillarKeyword,
          targetAudience: data.targetAudience,
          clusterCount: data.pillars.find((p: any) => p.id === pillarId)?.clusterCount || 6,
        }),
      });

      const result = await response.json();
      if (result.success) {
        setClusters({
          ...clusters,
          [pillarId]: result.clusters.map((c: any) => ({
            ...c,
            id: Math.random().toString(36).substr(2, 9),
          })),
        });
        toast.success(`${result.clusters.length} cluster articles generated!`);
      } else {
        toast.error(result.error || 'Failed to generate clusters');
      }
    } catch (error) {
      console.error('Cluster generation error:', error);
      toast.error('Failed to generate clusters');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCluster = (pillarId: string, clusterId: string) => {
    setClusters({
      ...clusters,
      [pillarId]: clusters[pillarId].filter((c: any) => c.id !== clusterId),
    });
    toast.success('Cluster removed');
  };

  const handleAddCluster = (pillarId: string) => {
    const newCluster = {
      id: Math.random().toString(36).substr(2, 9),
      title: '',
      targetKeyword: '',
      searchVolume: 0,
      intent: 'INFORMATIONAL',
      wordCount: 1500,
    };
    setClusters({
      ...clusters,
      [pillarId]: [...(clusters[pillarId] || []), newCluster],
    });
  };

  const handleUpdateCluster = (pillarId: string, clusterId: string, field: string, value: any) => {
    setClusters({
      ...clusters,
      [pillarId]: clusters[pillarId].map((c: any) =>
        c.id === clusterId ? { ...c, [field]: value } : c
      ),
    });
  };

  const handleContinue = () => {
    const totalClusters = Object.values(clusters).reduce((sum: number, arr: any) => sum + arr.length, 0);
    
    if (totalClusters === 0) {
      toast.error('Please generate clusters for at least one pillar');
      return;
    }

    onComplete({ clusters });
  };

  const totalClusters = Object.values(clusters).reduce((sum: number, arr: any) => sum + arr.length, 0);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-2">Step 3: Plan Your Cluster Articles</h2>
        <p className="text-gray-600">
          Cluster articles support your pillars by targeting related keywords and linking back to the main pillar page.
        </p>
      </div>

      {/* Summary */}
      <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border-2 border-blue-500/20 rounded-lg p-6">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-3xl font-bold text-blue-600">{data.pillars?.length || 0}</p>
            <p className="text-sm text-gray-600">Pillars</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-blue-600">{totalClusters}</p>
            <p className="text-sm text-gray-600">Clusters</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-blue-600">
              {(data.pillars?.length || 0) + totalClusters}
            </p>
            <p className="text-sm text-gray-600">Total Articles</p>
          </div>
        </div>
      </div>

      {/* Pillars with Clusters */}
      <div className="space-y-4">
        {data.pillars?.map((pillar: any, index: number) => {
          const pillarClusters = clusters[pillar.id] || [];
          const isExpanded = expandedPillar === pillar.id;

          return (
            <div key={pillar.id} className="border-2 border-gray-200 rounded-lg overflow-hidden">
              {/* Pillar Header */}
              <div
                className="bg-gradient-to-r from-coral/10 to-orange-500/10 p-4 cursor-pointer hover:from-coral/20 hover:to-orange-500/20 transition-colors"
                onClick={() => setExpandedPillar(isExpanded ? null : pillar.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="bg-coral text-white px-3 py-1 rounded-full text-sm font-semibold">
                        Pillar {index + 1}
                      </span>
                      <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                        {pillarClusters.length} Clusters
                      </span>
                    </div>
                    <h3 className="font-semibold text-lg">{pillar.title}</h3>
                    <p className="text-sm text-gray-600">Target: {pillar.targetKeyword}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {pillarClusters.length === 0 && (
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleGenerateClusters(pillar.id, pillar.title, pillar.targetKeyword);
                        }}
                        disabled={loading}
                        className="bg-coral hover:bg-coral/90"
                      >
                        {loading ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Sparkles className="w-4 h-4 mr-2" />
                        )}
                        Generate Clusters
                      </Button>
                    )}
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-gray-600" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-600" />
                    )}
                  </div>
                </div>
              </div>

              {/* Cluster List */}
              {isExpanded && (
                <div className="p-4 space-y-3 bg-gray-50">
                  {pillarClusters.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <p className="mb-4">No clusters yet. Generate them with AI!</p>
                      <Button
                        onClick={() => handleGenerateClusters(pillar.id, pillar.title, pillar.targetKeyword)}
                        disabled={loading}
                        className="bg-coral hover:bg-coral/90"
                      >
                        {loading ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Sparkles className="w-4 h-4 mr-2" />
                        )}
                        Generate Clusters
                      </Button>
                    </div>
                  ) : (
                    <>
                      {pillarClusters.map((cluster: any, clusterIndex: number) => (
                        <div key={cluster.id} className="bg-white border rounded-lg p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-sm font-medium text-gray-500">
                                  Cluster {clusterIndex + 1}
                                </span>
                                <span className={`px-2 py-1 rounded text-xs font-medium ${
                                  cluster.intent === 'INFORMATIONAL' ? 'bg-blue-100 text-blue-700' :
                                  cluster.intent === 'COMMERCIAL' ? 'bg-green-100 text-green-700' :
                                  'bg-purple-100 text-purple-700'
                                }`}>
                                  {cluster.intent}
                                </span>
                              </div>
                              <Input
                                value={cluster.title}
                                onChange={(e) => handleUpdateCluster(pillar.id, cluster.id, 'title', e.target.value)}
                                placeholder="Cluster article title"
                                className="mb-2"
                              />
                              <div className="grid grid-cols-2 gap-2">
                                <Input
                                  value={cluster.targetKeyword}
                                  onChange={(e) => handleUpdateCluster(pillar.id, cluster.id, 'targetKeyword', e.target.value)}
                                  placeholder="Target keyword"
                                  className="text-sm"
                                />
                                <Input
                                  type="number"
                                  value={cluster.searchVolume}
                                  onChange={(e) => handleUpdateCluster(pillar.id, cluster.id, 'searchVolume', parseInt(e.target.value) || 0)}
                                  placeholder="Search volume"
                                  className="text-sm"
                                />
                              </div>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteCluster(pillar.id, cluster.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                          <p className="text-xs text-gray-500">
                            {cluster.searchVolume > 0 && `${cluster.searchVolume.toLocaleString()} searches/month • `}
                            {cluster.wordCount} words
                          </p>
                        </div>
                      ))}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAddCluster(pillar.id)}
                        className="w-full"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Cluster Article
                      </Button>
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-6 border-t">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <Button onClick={handleContinue} className="bg-coral hover:bg-coral/90">
          Continue to Funnel Integration
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
