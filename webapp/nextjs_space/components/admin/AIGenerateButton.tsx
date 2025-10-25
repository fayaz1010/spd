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
import { Sparkles, Loader2, X, Check } from 'lucide-react';
import { toast } from 'sonner';

interface AIGenerateButtonProps {
  type: 'blog' | 'faq' | 'case-study' | 'testimonial';
  onGenerated: (data: any) => void;
  buttonText?: string;
  buttonVariant?: 'default' | 'outline' | 'secondary';
  size?: 'default' | 'sm' | 'lg';
}

export function AIGenerateButton({
  type,
  onGenerated,
  buttonText,
  buttonVariant = 'outline',
  size = 'default',
}: AIGenerateButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [input, setInput] = useState({
    rawContent: '',
    topic: '',
    keywords: '',
    question: '',
    customerName: '',
    rating: 5,
    systemSize: 0,
    location: '',
    category: '',
  });

  const handleGenerate = async () => {
    setIsGenerating(true);

    try {
      let requestBody: any = { type };

      switch (type) {
        case 'blog':
          if (!input.rawContent && !input.topic) {
            toast.error('Please provide either raw content or a topic');
            return;
          }
          requestBody.input = {
            rawContent: input.rawContent || undefined,
            topic: input.topic || undefined,
            keywords: input.keywords ? input.keywords.split(',').map(k => k.trim()) : [],
            targetLength: 1000,
          };
          break;

        case 'faq':
          if (!input.question && !input.topic) {
            toast.error('Please provide a question or topic');
            return;
          }
          requestBody.input = {
            question: input.question || undefined,
            topic: input.topic || undefined,
            category: input.category || undefined,
          };
          break;

        case 'case-study':
          if (!input.rawContent) {
            toast.error('Please provide project notes');
            return;
          }
          requestBody.input = {
            rawNotes: input.rawContent,
            customerName: input.customerName || undefined,
            location: input.location || 'Perth, WA',
            systemSize: input.systemSize || undefined,
            category: input.category || 'Residential',
          };
          break;

        case 'testimonial':
          if (!input.rawContent || !input.customerName) {
            toast.error('Please provide customer name and review');
            return;
          }
          requestBody.input = {
            rawReview: input.rawContent,
            customerName: input.customerName,
            rating: input.rating,
            systemSize: input.systemSize || undefined,
          };
          break;
      }

      const response = await fetch('/api/ai/content/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Content generated successfully!');
        onGenerated(data.data);
        setIsOpen(false);
        // Reset form
        setInput({
          rawContent: '',
          topic: '',
          keywords: '',
          question: '',
          customerName: '',
          rating: 5,
          systemSize: 0,
          location: '',
          category: '',
        });
      } else {
        toast.error(data.error || 'Failed to generate content');
      }
    } catch (error: any) {
      console.error('Generation error:', error);
      toast.error(error.message || 'Failed to generate content');
    } finally {
      setIsGenerating(false);
    }
  };

  const getDialogTitle = () => {
    switch (type) {
      case 'blog':
        return 'Generate Blog Post with AI';
      case 'faq':
        return 'Generate FAQ with AI';
      case 'case-study':
        return 'Generate Case Study with AI';
      case 'testimonial':
        return 'Enhance Testimonial with AI';
      default:
        return 'Generate Content with AI';
    }
  };

  const getDialogDescription = () => {
    switch (type) {
      case 'blog':
        return 'Paste your raw content or provide a topic, and AI will create a professional, SEO-optimized blog post.';
      case 'faq':
        return 'Provide a question or topic, and AI will generate a comprehensive answer.';
      case 'case-study':
        return 'Provide project notes, and AI will create a compelling case study with Challenge-Solution-Results structure.';
      case 'testimonial':
        return 'Provide the raw review, and AI will enhance it while maintaining authenticity.';
      default:
        return 'Generate professional content with AI assistance.';
    }
  };

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        variant={buttonVariant}
        size={size}
        className="gap-2"
      >
        <Sparkles className="w-4 h-4" />
        {buttonText || 'Generate with AI'}
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{getDialogTitle()}</DialogTitle>
            <DialogDescription>{getDialogDescription()}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Blog Post Fields */}
            {type === 'blog' && (
              <>
                <div>
                  <Label htmlFor="rawContent">Raw Content / SEO Text</Label>
                  <Textarea
                    id="rawContent"
                    value={input.rawContent}
                    onChange={(e) => setInput({ ...input, rawContent: e.target.value })}
                    placeholder="Paste your SEO-optimized text here, or leave blank to generate from topic..."
                    rows={8}
                    className="mt-1"
                  />
                </div>

                <div className="text-center text-sm text-gray-500">OR</div>

                <div>
                  <Label htmlFor="topic">Topic (if no raw content)</Label>
                  <Input
                    id="topic"
                    value={input.topic}
                    onChange={(e) => setInput({ ...input, topic: e.target.value })}
                    placeholder="e.g., Benefits of Solar Panels in Perth"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="keywords">Target Keywords (comma-separated)</Label>
                  <Input
                    id="keywords"
                    value={input.keywords}
                    onChange={(e) => setInput({ ...input, keywords: e.target.value })}
                    placeholder="solar panels Perth, solar energy WA, solar savings"
                    className="mt-1"
                  />
                </div>
              </>
            )}

            {/* FAQ Fields */}
            {type === 'faq' && (
              <>
                <div>
                  <Label htmlFor="question">Question</Label>
                  <Input
                    id="question"
                    value={input.question}
                    onChange={(e) => setInput({ ...input, question: e.target.value })}
                    placeholder="e.g., How much do solar panels cost in Perth?"
                    className="mt-1"
                  />
                </div>

                <div className="text-center text-sm text-gray-500">OR</div>

                <div>
                  <Label htmlFor="topic">Topic (generates 5 FAQs)</Label>
                  <Input
                    id="topic"
                    value={input.topic}
                    onChange={(e) => setInput({ ...input, topic: e.target.value })}
                    placeholder="e.g., Solar Battery Storage"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="category">Category</Label>
                  <Input
                    id="category"
                    value={input.category}
                    onChange={(e) => setInput({ ...input, category: e.target.value })}
                    placeholder="e.g., Pricing, Installation, Technology"
                    className="mt-1"
                  />
                </div>
              </>
            )}

            {/* Case Study Fields */}
            {type === 'case-study' && (
              <>
                <div>
                  <Label htmlFor="rawContent">Project Notes *</Label>
                  <Textarea
                    id="rawContent"
                    value={input.rawContent}
                    onChange={(e) => setInput({ ...input, rawContent: e.target.value })}
                    placeholder="Describe the project: customer situation, challenges, solution provided, results achieved..."
                    rows={8}
                    className="mt-1"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="customerName">Customer Name</Label>
                    <Input
                      id="customerName"
                      value={input.customerName}
                      onChange={(e) => setInput({ ...input, customerName: e.target.value })}
                      placeholder="John Smith"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={input.location}
                      onChange={(e) => setInput({ ...input, location: e.target.value })}
                      placeholder="Joondalup, WA"
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="systemSize">System Size (kW)</Label>
                    <Input
                      id="systemSize"
                      type="number"
                      step="0.1"
                      value={input.systemSize}
                      onChange={(e) => setInput({ ...input, systemSize: parseFloat(e.target.value) || 0 })}
                      placeholder="6.6"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Input
                      id="category"
                      value={input.category}
                      onChange={(e) => setInput({ ...input, category: e.target.value })}
                      placeholder="Residential, Commercial"
                      className="mt-1"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Testimonial Fields */}
            {type === 'testimonial' && (
              <>
                <div>
                  <Label htmlFor="customerName">Customer Name *</Label>
                  <Input
                    id="customerName"
                    value={input.customerName}
                    onChange={(e) => setInput({ ...input, customerName: e.target.value })}
                    placeholder="Sarah Thompson"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="rawContent">Raw Review *</Label>
                  <Textarea
                    id="rawContent"
                    value={input.rawContent}
                    onChange={(e) => setInput({ ...input, rawContent: e.target.value })}
                    placeholder="great service saved money happy with panels"
                    rows={4}
                    className="mt-1"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="rating">Rating</Label>
                    <Input
                      id="rating"
                      type="number"
                      min="1"
                      max="5"
                      value={input.rating}
                      onChange={(e) => setInput({ ...input, rating: parseInt(e.target.value) || 5 })}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="systemSize">System Size (kW)</Label>
                    <Input
                      id="systemSize"
                      type="number"
                      step="0.1"
                      value={input.systemSize}
                      onChange={(e) => setInput({ ...input, systemSize: parseFloat(e.target.value) || 0 })}
                      placeholder="6.6"
                      className="mt-1"
                    />
                  </div>
                </div>
              </>
            )}
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
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
