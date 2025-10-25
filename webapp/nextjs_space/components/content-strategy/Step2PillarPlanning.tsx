'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Sparkles, 
  Loader2, 
  ArrowRight, 
  ArrowLeft,
  Edit2, 
  Trash2, 
  Plus,
  Check,
  X
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Step2Props {
  data: any;
  onComplete: (data: any) => void;
  onBack: () => void;
}

interface Pillar {
  id: string;
  title: string;
  targetKeyword: string;
  searchVolume: number;
  competition: string;
  intent: string;
  wordCount: number;
  clusterCount: number;
  editing?: boolean;
}

export function Step2PillarPlanning({ data, onComplete, onBack }: Step2Props) {
  const [loading, setLoading] = useState(false);
  const [pillars, setPillars] = useState<Pillar[]>(data.pillars || []);
  const [generatingDetails, setGeneratingDetails] = useState(false);

  // Auto-generate pillars if coming from Step 1 with AI suggestions
  useEffect(() => {
    if (pillars.length === 0 && data.mainTopic) {
      handleGeneratePillars();
    }
  }, []);

  const handleGeneratePillars = async () => {
    setGeneratingDetails(true);
    try {
      const response = await fetch('/api/ai/strategy/generate-pillars', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mainTopic: data.mainTopic,
          targetAudience: data.targetAudience,
        }),
      });

      const result = await response.json();
      if (result.success) {
        setPillars(result.pillars.map((p: any) => ({
          ...p,
          id: Math.random().toString(36).substr(2, 9),
        })));
        toast.success('Pillar strategy generated!');
      } else {
        toast.error(result.error || 'Failed to generate pillars');
      }
    } catch (error) {
      console.error('Pillar generation error:', error);
      toast.error('Failed to generate pillars');
    } finally {
      setGeneratingDetails(false);
    }
  };

  const handleEditPillar = (id: string) => {
    setPillars(pillars.map(p => 
      p.id === id ? { ...p, editing: true } : { ...p, editing: false }
    ));
  };

  const handleSavePillar = (id: string) => {
    setPillars(pillars.map(p => 
      p.id === id ? { ...p, editing: false } : p
    ));
    toast.success('Pillar updated');
  };

  const handleDeletePillar = (id: string) => {
    setPillars(pillars.filter(p => p.id !== id));
    toast.success('Pillar removed');
  };

  const handleAddPillar = () => {
    const newPillar: Pillar = {
      id: Math.random().toString(36).substr(2, 9),
      title: '',
      targetKeyword: '',
      searchVolume: 0,
      competition: 'MEDIUM',
      intent: 'COMMERCIAL',
      wordCount: 3000,
      clusterCount: 6,
      editing: true,
    };
    setPillars([...pillars, newPillar]);
  };

  const handleUpdatePillar = (id: string, field: string, value: any) => {
    setPillars(pillars.map(p => 
      p.id === id ? { ...p, [field]: value } : p
    ));
  };

  const handleContinue = () => {
    if (pillars.length === 0) {
      toast.error('Please add at least one pillar article');
      return;
    }

    const incompletePillars = pillars.filter(p => !p.title || !p.targetKeyword);
    if (incompletePillars.length > 0) {
      toast.error('Please complete all pillar details');
      return;
    }

    onComplete({ pillars });
  };

  const totalClusters = pillars.reduce((sum, p) => sum + p.clusterCount, 0);
  const totalArticles = pillars.length + totalClusters;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-2">Step 2: Plan Your Pillar Articles</h2>
        <p className="text-gray-600">
          Pillar articles are your main "money pages" that target high-value keywords. Each pillar will have multiple cluster articles linking to it.
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-coral/10 to-orange-500/10 border-2 border-coral/20 rounded-lg p-4 text-center">
          <p className="text-3xl font-bold text-coral">{pillars.length}</p>
          <p className="text-sm text-gray-600">Pillar Articles</p>
        </div>
        <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border-2 border-blue-500/20 rounded-lg p-4 text-center">
          <p className="text-3xl font-bold text-blue-600">{totalClusters}</p>
          <p className="text-sm text-gray-600">Cluster Articles</p>
        </div>
        <div className="bg-gradient-to-br from-green-500/10 to-green-600/10 border-2 border-green-500/20 rounded-lg p-4 text-center">
          <p className="text-3xl font-bold text-green-600">{totalArticles}</p>
          <p className="text-sm text-gray-600">Total Articles</p>
        </div>
      </div>

      {/* Generate Button */}
      {pillars.length === 0 && (
        <div className="bg-gradient-to-r from-coral/10 to-orange-500/10 border-2 border-coral/20 rounded-lg p-6 text-center">
          <h3 className="font-semibold text-lg mb-2">Generate Pillar Strategy</h3>
          <p className="text-sm text-gray-600 mb-4">
            Let AI create a complete pillar strategy based on your topic: "{data.mainTopic}"
          </p>
          <Button
            onClick={handleGeneratePillars}
            disabled={generatingDetails}
            className="bg-coral hover:bg-coral/90"
          >
            {generatingDetails ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating Strategy...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Pillar Strategy
              </>
            )}
          </Button>
        </div>
      )}

      {/* Pillar List */}
      {pillars.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-lg">Your Pillar Articles</h3>
            <Button onClick={handleAddPillar} variant="outline" size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Add Pillar
            </Button>
          </div>

          {pillars.map((pillar, index) => (
            <div
              key={pillar.id}
              className="border-2 border-gray-200 rounded-lg p-6 hover:border-coral/50 transition-colors"
            >
              {pillar.editing ? (
                // Edit Mode
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-coral">Pillar {index + 1}</h4>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleSavePillar(pillar.id)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Check className="w-4 h-4 mr-1" />
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeletePillar(pillar.id)}
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Article Title *</Label>
                      <Input
                        value={pillar.title}
                        onChange={(e) => handleUpdatePillar(pillar.id, 'title', e.target.value)}
                        placeholder="e.g., Solar Panels Perth: Complete 2025 Guide"
                      />
                    </div>
                    <div>
                      <Label>Target Keyword *</Label>
                      <Input
                        value={pillar.targetKeyword}
                        onChange={(e) => handleUpdatePillar(pillar.id, 'targetKeyword', e.target.value)}
                        placeholder="e.g., solar panels perth"
                      />
                    </div>
                    <div>
                      <Label>Search Volume (monthly)</Label>
                      <Input
                        type="number"
                        value={pillar.searchVolume}
                        onChange={(e) => handleUpdatePillar(pillar.id, 'searchVolume', parseInt(e.target.value) || 0)}
                      />
                    </div>
                    <div>
                      <Label>Competition</Label>
                      <select
                        value={pillar.competition}
                        onChange={(e) => handleUpdatePillar(pillar.id, 'competition', e.target.value)}
                        className="w-full border rounded-md p-2"
                      >
                        <option value="LOW">Low</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="HIGH">High</option>
                      </select>
                    </div>
                    <div>
                      <Label>Target Word Count</Label>
                      <Input
                        type="number"
                        value={pillar.wordCount}
                        onChange={(e) => handleUpdatePillar(pillar.id, 'wordCount', parseInt(e.target.value) || 3000)}
                      />
                    </div>
                    <div>
                      <Label>Number of Cluster Articles</Label>
                      <Input
                        type="number"
                        value={pillar.clusterCount}
                        onChange={(e) => handleUpdatePillar(pillar.id, 'clusterCount', parseInt(e.target.value) || 6)}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                // View Mode
                <div>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="bg-coral text-white px-3 py-1 rounded-full text-sm font-semibold">
                          Pillar {index + 1}
                        </span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          pillar.competition === 'LOW' ? 'bg-green-100 text-green-700' :
                          pillar.competition === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {pillar.competition}
                        </span>
                      </div>
                      <h4 className="text-lg font-semibold mb-1">{pillar.title}</h4>
                      <p className="text-sm text-gray-600">
                        Target: <span className="font-medium">{pillar.targetKeyword}</span>
                        {pillar.searchVolume > 0 && (
                          <span className="ml-2">
                            ({pillar.searchVolume.toLocaleString()} searches/month)
                          </span>
                        )}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEditPillar(pillar.id)}
                    >
                      <Edit2 className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                  </div>

                  <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                    <div>
                      <p className="text-sm text-gray-600">Word Count</p>
                      <p className="font-semibold">{pillar.wordCount.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Cluster Articles</p>
                      <p className="font-semibold">{pillar.clusterCount}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Intent</p>
                      <p className="font-semibold">{pillar.intent}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between pt-6 border-t">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <Button onClick={handleContinue} className="bg-coral hover:bg-coral/90">
          Continue to Cluster Planning
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
