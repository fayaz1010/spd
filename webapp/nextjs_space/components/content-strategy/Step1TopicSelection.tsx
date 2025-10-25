'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Sparkles, Loader2, ArrowRight, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

interface Step1Props {
  data: any;
  onComplete: (data: any) => void;
  onBack: () => void;
}

export function Step1TopicSelection({ data, onComplete, onBack }: Step1Props) {
  const [loading, setLoading] = useState(false);
  const [aiSuggesting, setAiSuggesting] = useState(false);
  const [formData, setFormData] = useState({
    name: data.name || '',
    mainTopic: data.mainTopic || '',
    targetAudience: data.targetAudience || 'Perth homeowners considering solar',
    businessGoals: data.businessGoals || '',
  });
  const [aiSuggestions, setAiSuggestions] = useState<any>(null);

  const handleAISuggest = async () => {
    if (!formData.mainTopic) {
      toast.error('Please enter a main topic first');
      return;
    }

    setAiSuggesting(true);
    try {
      const response = await fetch('/api/ai/strategy/suggest-topics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mainTopic: formData.mainTopic,
          targetAudience: formData.targetAudience,
        }),
      });

      const result = await response.json();
      if (result.success) {
        setAiSuggestions(result.suggestions);
        toast.success('AI suggestions generated!');
      } else {
        toast.error(result.error || 'Failed to generate suggestions');
      }
    } catch (error) {
      console.error('AI suggestion error:', error);
      toast.error('Failed to generate suggestions');
    } finally {
      setAiSuggesting(false);
    }
  };

  const handleContinue = () => {
    if (!formData.name || !formData.mainTopic) {
      toast.error('Please fill in strategy name and main topic');
      return;
    }

    onComplete(formData);
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-2">Step 1: Define Your Content Strategy</h2>
        <p className="text-gray-600">
          Let's start by defining the main topic and goals for your content strategy.
        </p>
      </div>

      <div className="space-y-6">
        {/* Strategy Name */}
        <div>
          <Label htmlFor="name">Strategy Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., Solar SEO Domination 2025"
            className="mt-1"
          />
          <p className="text-sm text-gray-500 mt-1">
            Give your strategy a memorable name
          </p>
        </div>

        {/* Main Topic */}
        <div>
          <Label htmlFor="mainTopic">Main Topic *</Label>
          <Input
            id="mainTopic"
            value={formData.mainTopic}
            onChange={(e) => setFormData({ ...formData, mainTopic: e.target.value })}
            placeholder="e.g., Solar Energy in Perth"
            className="mt-1"
          />
          <p className="text-sm text-gray-500 mt-1">
            The broad topic you want to dominate in search results
          </p>
        </div>

        {/* Target Audience */}
        <div>
          <Label htmlFor="targetAudience">Target Audience</Label>
          <Input
            id="targetAudience"
            value={formData.targetAudience}
            onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
            placeholder="e.g., Perth homeowners considering solar"
            className="mt-1"
          />
        </div>

        {/* Business Goals */}
        <div>
          <Label htmlFor="businessGoals">Business Goals</Label>
          <Textarea
            id="businessGoals"
            value={formData.businessGoals}
            onChange={(e) => setFormData({ ...formData, businessGoals: e.target.value })}
            placeholder="e.g., Generate 200 qualified leads per month, establish authority in Perth solar market, increase organic traffic by 500%"
            rows={4}
            className="mt-1"
          />
        </div>

        {/* AI Suggestion Button */}
        <div className="bg-gradient-to-r from-coral/10 to-orange-500/10 border-2 border-coral/20 rounded-lg p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-coral" />
                AI Strategy Suggestions
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Let AI analyze your topic and suggest a complete pillar/cluster strategy with keyword research and traffic estimates.
              </p>
            </div>
          </div>

          <Button
            onClick={handleAISuggest}
            disabled={aiSuggesting || !formData.mainTopic}
            className="bg-coral hover:bg-coral/90"
          >
            {aiSuggesting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Get AI Suggestions
              </>
            )}
          </Button>
        </div>

        {/* AI Suggestions Display */}
        {aiSuggestions && (
          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
            <h3 className="font-semibold text-lg mb-4">AI Recommendations</h3>
            
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Suggested Pillar Topics:</p>
                <ul className="space-y-2">
                  {aiSuggestions.pillars?.map((pillar: any, index: number) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <span className="text-coral font-bold">{index + 1}.</span>
                      <div>
                        <span className="font-medium">{pillar.title}</span>
                        <span className="text-gray-600 ml-2">
                          ({pillar.searchVolume?.toLocaleString()} searches/month)
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                <div className="text-center">
                  <p className="text-2xl font-bold text-coral">
                    {aiSuggestions.totalArticles || 0}
                  </p>
                  <p className="text-sm text-gray-600">Total Articles</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-coral">
                    {aiSuggestions.estimatedTraffic?.toLocaleString() || 0}
                  </p>
                  <p className="text-sm text-gray-600">Est. Monthly Visitors</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-coral">
                    {aiSuggestions.estimatedLeads || 0}
                  </p>
                  <p className="text-sm text-gray-600">Est. Monthly Leads</p>
                </div>
              </div>

              <p className="text-sm text-gray-600 italic">
                💡 These suggestions will be refined in the next steps. You can edit or regenerate them.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-6 border-t">
        <Button variant="outline" onClick={onBack} disabled>
          Back
        </Button>
        <Button onClick={handleContinue} className="bg-coral hover:bg-coral/90">
          Continue to Pillar Planning
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
