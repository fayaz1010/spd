'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Sparkles, Loader2, X, Zap } from 'lucide-react';
import { toast } from 'sonner';

interface BulkAIGenerateButtonProps {
  type: 'faq' | 'case-study' | 'testimonial';
  onGenerated: (data: any[]) => void;
  buttonText?: string;
  buttonVariant?: 'default' | 'outline' | 'secondary';
  size?: 'default' | 'sm' | 'lg';
}

export function BulkAIGenerateButton({
  type,
  onGenerated,
  buttonText,
  buttonVariant = 'default',
  size = 'default',
}: BulkAIGenerateButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [count, setCount] = useState(10);
  const [instructions, setInstructions] = useState('');

  const handleGenerate = async () => {
    if (count < 1 || count > 50) {
      toast.error('Count must be between 1 and 50');
      return;
    }

    setIsGenerating(true);

    try {
      const response = await fetch('/api/ai/content/generate-bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          count,
          instructions: instructions.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(`Generated ${data.count} ${type}s successfully!`);
        onGenerated(data.data);
        setIsOpen(false);
        setInstructions('');
      } else {
        toast.error(data.error || 'Failed to generate content');
      }
    } catch (error: any) {
      console.error('Bulk generation error:', error);
      toast.error(error.message || 'Failed to generate content');
    } finally {
      setIsGenerating(false);
    }
  };

  const getDialogTitle = () => {
    switch (type) {
      case 'faq':
        return 'Generate Market-Relevant FAQs with AI';
      case 'case-study':
        return 'Generate Realistic Case Studies with AI';
      case 'testimonial':
        return 'Generate Authentic Testimonials with AI';
      default:
        return 'Bulk Generate Content with AI';
    }
  };

  const getDialogDescription = () => {
    switch (type) {
      case 'faq':
        return 'AI will generate common questions about solar in Perth with comprehensive answers based on current market data, pricing, and rebates.';
      case 'case-study':
        return 'AI will create realistic customer success stories with Perth suburbs, typical system sizes, challenges, solutions, and measurable results.';
      case 'testimonial':
        return 'AI will generate authentic-sounding customer reviews with natural language, specific details, and varied ratings.';
      default:
        return 'Generate multiple pieces of content automatically with AI.';
    }
  };

  const getPlaceholder = () => {
    switch (type) {
      case 'faq':
        return 'Optional: Focus on specific topics like "battery storage", "commercial solar", "rebates and financing", etc.';
      case 'case-study':
        return 'Optional: Focus on specific scenarios like "large commercial installations", "battery retrofits", "challenging roof conditions", etc.';
      case 'testimonial':
        return 'Optional: Focus on specific aspects like "installation experience", "cost savings", "customer service", etc.';
      default:
        return 'Optional: Add specific instructions for AI...';
    }
  };

  const getDefaultCount = () => {
    switch (type) {
      case 'faq':
        return 20;
      case 'case-study':
        return 10;
      case 'testimonial':
        return 15;
      default:
        return 10;
    }
  };

  return (
    <>
      <Button
        onClick={() => {
          setCount(getDefaultCount());
          setIsOpen(true);
        }}
        variant={buttonVariant}
        size={size}
        className="gap-2"
      >
        <Zap className="w-4 h-4" />
        {buttonText || `Bulk Generate ${type}s`}
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-coral" />
              {getDialogTitle()}
            </DialogTitle>
            <DialogDescription>{getDialogDescription()}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="count">How many to generate?</Label>
              <Input
                id="count"
                type="number"
                min="1"
                max="50"
                value={count}
                onChange={(e) => setCount(parseInt(e.target.value) || 1)}
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">
                Recommended: {getDefaultCount()} (max 50)
              </p>
            </div>

            <div>
              <Label htmlFor="instructions">Additional Instructions (Optional)</Label>
              <Textarea
                id="instructions"
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder={getPlaceholder()}
                rows={4}
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">
                Leave blank for AI to generate diverse, market-relevant content automatically
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800 font-medium mb-2">
                ✨ AI will automatically include:
              </p>
              <ul className="text-sm text-blue-700 space-y-1">
                {type === 'faq' && (
                  <>
                    <li>• Perth-specific pricing and rebate information</li>
                    <li>• Common customer questions and concerns</li>
                    <li>• Technical details and installation process</li>
                    <li>• ROI calculations and savings estimates</li>
                  </>
                )}
                {type === 'case-study' && (
                  <>
                    <li>• Real Perth suburbs and Australian names</li>
                    <li>• Typical system sizes (6.6kW, 10kW, 13.2kW)</li>
                    <li>• Realistic challenges and solutions</li>
                    <li>• Specific savings and payback periods</li>
                  </>
                )}
                {type === 'testimonial' && (
                  <>
                    <li>• Natural, authentic-sounding reviews</li>
                    <li>• Mix of detailed and brief testimonials</li>
                    <li>• Specific benefits and experiences</li>
                    <li>• Varied ratings (mostly 5-star)</li>
                  </>
                )}
              </ul>
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isGenerating}
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="bg-coral hover:bg-coral/90"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating {count} {type}s...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate {count} {type}s
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
