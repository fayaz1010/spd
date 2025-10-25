'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Sparkles, Loader2, X, Check, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface AIBlogGeneratorProps {
  onGenerated: (data: any) => void;
  buttonText?: string;
  buttonVariant?: 'default' | 'outline' | 'secondary';
  size?: 'default' | 'sm' | 'lg';
}

interface BlogOutline {
  title: string;
  slug: string;
  metaDescription: string;
  excerpt: string;
  keywords: string[];
  hook: string;
  tone: string;
  callToAction: string;
  internalLinks: any[];
  sections: any[];
  intro: any;
  conclusion: any;
}

export function AIBlogGenerator({
  onGenerated,
  buttonText,
  buttonVariant = 'outline',
  size = 'default',
}: AIBlogGeneratorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const [outline, setOutline] = useState<BlogOutline | null>(null);
  
  const [input, setInput] = useState({
    topic: '',
    keywords: '',
    targetLength: 1200,
    tone: 'marketing' as 'professional' | 'conversational' | 'technical' | 'marketing',
    includePackages: true,
    targetAudience: 'Perth homeowners considering solar',
  });

  const handleGenerate = async () => {
    if (!input.topic) {
      toast.error('Please provide a topic');
      return;
    }

    setIsGenerating(true);
    setProgress(0);
    setCurrentStep('Initializing...');

    try {
      // Step 1: Generate outline (10%)
      setCurrentStep('Creating blog structure...');
      setProgress(10);
      
      const outlineResponse = await fetch('/api/ai/blog/outline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: input.topic,
          keywords: input.keywords ? input.keywords.split(',').map(k => k.trim()) : [],
          targetLength: input.targetLength,
          tone: input.tone,
          includePackages: input.includePackages,
          targetAudience: input.targetAudience,
        }),
      });

      const outlineData = await outlineResponse.json();
      
      if (!outlineData.success) {
        throw new Error(outlineData.error || 'Failed to generate outline');
      }

      const blogOutline: BlogOutline = outlineData.outline;
      setOutline(blogOutline);
      
      // Step 2: Generate introduction (25%)
      setCurrentStep('Writing introduction...');
      setProgress(25);
      
      const introResponse = await fetch('/api/ai/blog/section', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sectionType: 'intro',
          section: blogOutline.intro,
          context: {
            blogTitle: blogOutline.title,
            hook: blogOutline.hook,
            tone: blogOutline.tone,
            keywords: blogOutline.keywords,
          },
        }),
      });

      const introData = await introResponse.json();
      if (!introData.success) throw new Error('Failed to generate introduction');
      const intro = introData.content;

      // Step 3: Generate each section (25-75%)
      const sections: any[] = [];
      const sectionProgressStep = 50 / blogOutline.sections.length;
      
      for (let i = 0; i < blogOutline.sections.length; i++) {
        const section = blogOutline.sections[i];
        setCurrentStep(`Writing section ${i + 1}/${blogOutline.sections.length}: ${section.heading}...`);
        setProgress(25 + ((i + 1) * sectionProgressStep));
        
        const sectionResponse = await fetch('/api/ai/blog/section', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sectionType: 'section',
            section: section,
            context: {
              blogTitle: blogOutline.title,
              tone: blogOutline.tone,
              keywords: blogOutline.keywords,
            },
          }),
        });

        const sectionData = await sectionResponse.json();
        if (!sectionData.success) throw new Error(`Failed to generate section ${i + 1}`);
        
        sections.push({
          heading: section.heading,
          content: sectionData.content,
        });
      }

      // Step 4: Generate conclusion (80%)
      setCurrentStep('Writing conclusion...');
      setProgress(80);
      
      const conclusionResponse = await fetch('/api/ai/blog/section', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sectionType: 'conclusion',
          section: blogOutline.conclusion,
          context: {
            blogTitle: blogOutline.title,
            callToAction: blogOutline.callToAction,
            tone: blogOutline.tone,
          },
        }),
      });

      const conclusionData = await conclusionResponse.json();
      if (!conclusionData.success) throw new Error('Failed to generate conclusion');
      const conclusion = conclusionData.content;

      // Step 5: Compile final blog post (90%)
      setCurrentStep('Compiling and optimizing...');
      setProgress(90);
      
      const compileResponse = await fetch('/api/ai/blog/compile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          outline: blogOutline,
          intro,
          sections,
          conclusion,
        }),
      });

      const compileData = await compileResponse.json();
      if (!compileData.success) throw new Error('Failed to compile blog post');

      // Complete!
      setProgress(100);
      setCurrentStep('Complete!');
      
      toast.success(`Blog post generated! SEO Score: ${compileData.data.seoScore}/100. Scroll down to review!`, {
        duration: 5000,
      });
      onGenerated(compileData.data);
      
      // Close dialog after short delay
      setTimeout(() => {
        setIsOpen(false);
        // Reset state
        setProgress(0);
        setCurrentStep('');
        setOutline(null);
        
        // Scroll to title field to show generated content
        setTimeout(() => {
          const titleInput = document.getElementById('title');
          if (titleInput) {
            titleInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
            titleInput.focus();
          }
        }, 300);
      }, 1500);

    } catch (error: any) {
      console.error('Generation error:', error);
      toast.error(error.message || 'Failed to generate blog post');
      setCurrentStep('Error occurred');
    } finally {
      setIsGenerating(false);
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Generate Blog Post with AI</DialogTitle>
            <DialogDescription>
              Create a comprehensive, SEO-optimized blog post with detailed structure and internal linking.
            </DialogDescription>
          </DialogHeader>

          {!isGenerating ? (
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="topic">Blog Topic *</Label>
                <Input
                  id="topic"
                  value={input.topic}
                  onChange={(e) => setInput({ ...input, topic: e.target.value })}
                  placeholder="e.g., Complete Guide to Solar Battery Storage in Perth 2025"
                  className="mt-1"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Be specific and detailed for better results
                </p>
              </div>

              <div>
                <Label htmlFor="keywords">Target Keywords (comma-separated)</Label>
                <Input
                  id="keywords"
                  value={input.keywords}
                  onChange={(e) => setInput({ ...input, keywords: e.target.value })}
                  placeholder="battery storage, solar batteries, Perth energy"
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="targetLength">Target Word Count</Label>
                  <Input
                    id="targetLength"
                    type="number"
                    value={input.targetLength}
                    onChange={(e) => setInput({ ...input, targetLength: parseInt(e.target.value) || 1200 })}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="tone">Tone</Label>
                  <Select
                    value={input.tone}
                    onValueChange={(value: any) => setInput({ ...input, tone: value })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="marketing">Marketing (Persuasive)</SelectItem>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="conversational">Conversational</SelectItem>
                      <SelectItem value="technical">Technical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="targetAudience">Target Audience</Label>
                <Input
                  id="targetAudience"
                  value={input.targetAudience}
                  onChange={(e) => setInput({ ...input, targetAudience: e.target.value })}
                  placeholder="Perth homeowners considering solar"
                  className="mt-1"
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="includePackages"
                  checked={input.includePackages}
                  onChange={(e) => setInput({ ...input, includePackages: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor="includePackages" className="cursor-pointer">
                  Include product packages and internal links
                </Label>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div className="text-sm text-blue-900">
                    <p className="font-medium mb-1">Multi-Step Generation</p>
                    <p>This will create a structured outline first, then generate each section separately for the best quality. Takes 30-60 seconds.</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6 py-8">
              <div className="text-center">
                <Loader2 className="w-12 h-12 animate-spin mx-auto text-coral mb-4" />
                <h3 className="text-lg font-semibold mb-2">{currentStep}</h3>
                <p className="text-sm text-gray-600">
                  {progress < 100 ? 'Please wait, this may take up to a minute...' : 'Blog post ready!'}
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Progress</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>

              {outline && (
                <div className="bg-gray-50 rounded-lg p-4 text-sm">
                  <p className="font-medium mb-2">Generating:</p>
                  <p className="text-gray-700">{outline.title}</p>
                  <p className="text-gray-500 mt-1">{outline.sections.length} sections</p>
                </div>
              )}

              <div className="space-y-1 text-sm">
                <div className={`flex items-center gap-2 ${progress >= 10 ? 'text-green-600' : 'text-gray-400'}`}>
                  {progress >= 10 ? <Check className="w-4 h-4" /> : <div className="w-4 h-4 border-2 border-gray-300 rounded-full" />}
                  <span>Structure created</span>
                </div>
                <div className={`flex items-center gap-2 ${progress >= 25 ? 'text-green-600' : 'text-gray-400'}`}>
                  {progress >= 25 ? <Check className="w-4 h-4" /> : <div className="w-4 h-4 border-2 border-gray-300 rounded-full" />}
                  <span>Introduction written</span>
                </div>
                <div className={`flex items-center gap-2 ${progress >= 75 ? 'text-green-600' : 'text-gray-400'}`}>
                  {progress >= 75 ? <Check className="w-4 h-4" /> : <div className="w-4 h-4 border-2 border-gray-300 rounded-full" />}
                  <span>Main sections completed</span>
                </div>
                <div className={`flex items-center gap-2 ${progress >= 80 ? 'text-green-600' : 'text-gray-400'}`}>
                  {progress >= 80 ? <Check className="w-4 h-4" /> : <div className="w-4 h-4 border-2 border-gray-300 rounded-full" />}
                  <span>Conclusion written</span>
                </div>
                <div className={`flex items-center gap-2 ${progress >= 100 ? 'text-green-600' : 'text-gray-400'}`}>
                  {progress >= 100 ? <Check className="w-4 h-4" /> : <div className="w-4 h-4 border-2 border-gray-300 rounded-full" />}
                  <span>SEO optimization complete</span>
                </div>
              </div>
            </div>
          )}

          {!isGenerating && (
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setIsOpen(false)}
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button
                onClick={handleGenerate}
                className="bg-coral hover:bg-coral/90"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Blog Post
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
