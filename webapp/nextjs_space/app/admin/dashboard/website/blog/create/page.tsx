'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  ArrowLeft,
  Save,
  Eye,
  Calendar,
  Loader2,
  FileText,
  Image as ImageIcon,
  Link as LinkIcon,
  Search
} from 'lucide-react';
import { RichTextEditor } from '@/components/blog/RichTextEditor';
import { AIBlogGenerator } from '@/components/admin/AIBlogGenerator';
import toast from 'react-hot-toast';

interface Category {
  id: string;
  name: string;
  slug: string;
}

export default function CreateBlogPostPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);

  // Form state
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [content, setContent] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [featuredImage, setFeaturedImage] = useState('');
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [keywords, setKeywords] = useState('');
  const [canonicalUrl, setCanonicalUrl] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState('');
  const [author, setAuthor] = useState('Sun Direct Power');
  const [status, setStatus] = useState<'DRAFT' | 'PUBLISHED'>('DRAFT');
  const [autoSaving, setAutoSaving] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    // Auto-generate slug from title
    if (title && !slug) {
      const generatedSlug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      setSlug(generatedSlug);
    }
  }, [title]);

  useEffect(() => {
    // Auto-generate meta title from title
    if (title && !metaTitle) {
      setMetaTitle(title);
    }
  }, [title]);

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/blog/categories');
      const data = await res.json();
      setCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleSave = async (publishNow: boolean = false) => {
    // Validation
    if (!title || !slug || !content || !excerpt || !metaTitle || !metaDescription) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSaving(true);
    try {
      const postStatus = publishNow ? 'PUBLISHED' : status;

      const res = await fetch('/api/blog/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          slug,
          content,
          excerpt,
          featuredImage: featuredImage || null,
          metaTitle,
          metaDescription,
          keywords: keywords ? keywords.split(',').map(k => k.trim()) : [],
          canonicalUrl: canonicalUrl || null,
          category: category || null,
          tags: tags ? tags.split(',').map(t => t.trim()) : [],
          author,
          status: postStatus,
          publishedAt: publishNow ? new Date().toISOString() : null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create post');
      }

      toast.success(publishNow ? 'Post published successfully!' : 'Post saved as draft');
      router.push('/admin/dashboard/website/blog');
    } catch (error: any) {
      toast.error(error.message || 'Failed to save post');
    } finally {
      setSaving(false);
    }
  };

  const calculateReadingTime = () => {
    const wordsPerMinute = 200;
    const wordCount = content.trim().split(/\s+/).length;
    const readingTime = Math.ceil(wordCount / wordsPerMinute);
    return readingTime;
  };

  const autoSaveDraft = async () => {
    if (!title || !content) return;
    
    setAutoSaving(true);
    try {
      const res = await fetch('/api/blog/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          slug,
          content,
          excerpt,
          featuredImage: featuredImage || null,
          metaTitle,
          metaDescription,
          keywords: keywords ? keywords.split(',').map(k => k.trim()) : [],
          canonicalUrl: canonicalUrl || null,
          category: category || null,
          tags: tags ? tags.split(',').map(t => t.trim()) : [],
          author,
          status: 'DRAFT',
          publishedAt: null,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success('AI-generated blog saved as draft! You can find it in the blog list.');
        // Redirect to edit page so user can continue editing
        setTimeout(() => {
          router.push(`/admin/dashboard/website/blog/edit/${data.id}`);
        }, 1500);
      }
    } catch (error: any) {
      console.error('Auto-save error:', error);
      toast.error('Failed to auto-save. Please save manually.');
    } finally {
      setAutoSaving(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/dashboard/website/blog">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Blog
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Create Blog Post</h1>
            <p className="text-gray-600">Write and publish a new blog post</p>
          </div>
        </div>
        <div className="flex gap-2">
          <AIBlogGenerator
            onGenerated={(data) => {
              setTitle(data.title);
              setSlug(data.slug);
              setMetaTitle(data.title);
              setMetaDescription(data.metaDescription);
              setContent(data.content);
              setExcerpt(data.excerpt);
              setKeywords(data.keywords.join(', '));
              toast.success(`Blog post generated! SEO Score: ${data.seoScore}/100. Auto-saving...`);
              // Auto-save as draft so content isn't lost
              setTimeout(() => autoSaveDraft(), 2000);
            }}
            buttonText="Generate with AI"
            buttonVariant="secondary"
          />
          <Button
            variant="outline"
            onClick={() => handleSave(false)}
            disabled={saving}
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Draft
              </>
            )}
          </Button>
          <Button
            onClick={() => handleSave(true)}
            disabled={saving}
            className="bg-gradient-to-r from-blue-600 to-purple-600"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Publishing...
              </>
            ) : (
              <>
                <Calendar className="w-4 h-4 mr-2" />
                Publish Now
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content - Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter post title..."
                  required
                />
              </div>

              <div>
                <Label htmlFor="slug">URL Slug *</Label>
                <Input
                  id="slug"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="post-url-slug"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Auto-generated from title. Will be used in URL: /blog/{slug}
                </p>
              </div>

              <div>
                <Label htmlFor="excerpt">Excerpt *</Label>
                <Textarea
                  id="excerpt"
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  placeholder="Brief summary of the post (150-160 characters recommended)"
                  rows={3}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  {excerpt.length} characters
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Content Editor */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Content *</span>
                <Badge variant="outline">
                  {calculateReadingTime()} min read
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RichTextEditor
                content={content}
                onChange={setContent}
                placeholder="Write your blog post content here..."
              />
            </CardContent>
          </Card>

          {/* SEO Settings */}
          <Card>
            <CardHeader>
              <CardTitle>SEO Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="metaTitle">Meta Title *</Label>
                <Input
                  id="metaTitle"
                  value={metaTitle}
                  onChange={(e) => setMetaTitle(e.target.value)}
                  placeholder="SEO title for search engines"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  {metaTitle.length}/60 characters (optimal: 50-60)
                </p>
              </div>

              <div>
                <Label htmlFor="metaDescription">Meta Description *</Label>
                <Textarea
                  id="metaDescription"
                  value={metaDescription}
                  onChange={(e) => setMetaDescription(e.target.value)}
                  placeholder="Brief description for search results"
                  rows={3}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  {metaDescription.length}/160 characters (optimal: 150-160)
                </p>
              </div>

              <div>
                <Label htmlFor="keywords">Keywords (comma-separated)</Label>
                <Input
                  id="keywords"
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                  placeholder="solar panels, perth, installation"
                />
              </div>

              <div>
                <Label htmlFor="canonicalUrl">Canonical URL (optional)</Label>
                <Input
                  id="canonicalUrl"
                  value={canonicalUrl}
                  onChange={(e) => setCanonicalUrl(e.target.value)}
                  placeholder="https://example.com/original-article"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Use if this content is republished from another source
                </p>
              </div>

              {/* SEO Preview */}
              <div className="border rounded-lg p-4 bg-gray-50">
                <p className="text-xs text-gray-500 mb-2">Search Result Preview:</p>
                <div className="space-y-1">
                  <p className="text-blue-600 text-sm font-medium">{metaTitle || 'Your Post Title'}</p>
                  <p className="text-green-700 text-xs">
                    sundirectpower.com.au › blog › {slug || 'post-slug'}
                  </p>
                  <p className="text-sm text-gray-600">
                    {metaDescription || 'Your meta description will appear here...'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Right Column */}
        <div className="space-y-6">
          {/* Featured Image */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="w-5 h-5" />
                Featured Image
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="featuredImage">Image URL</Label>
                <Input
                  id="featuredImage"
                  value={featuredImage}
                  onChange={(e) => setFeaturedImage(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                />
              </div>
              {featuredImage && (
                <div className="border rounded-lg overflow-hidden">
                  <img
                    src={featuredImage}
                    alt="Featured"
                    className="w-full h-auto"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/placeholder-image.jpg';
                    }}
                  />
                </div>
              )}
              <p className="text-xs text-gray-500">
                Recommended size: 1200x630px
              </p>
            </CardContent>
          </Card>

          {/* Organization */}
          <Card>
            <CardHeader>
              <CardTitle>Organization</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="category">Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Uncategorized</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.slug}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="tags">Tags (comma-separated)</Label>
                <Input
                  id="tags"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="solar, batteries, rebates"
                />
              </div>

              <div>
                <Label htmlFor="author">Author</Label>
                <Input
                  id="author"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder="Author name"
                />
              </div>
            </CardContent>
          </Card>

          {/* Publishing Status */}
          <Card>
            <CardHeader>
              <CardTitle>Publishing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Status</Label>
                <Select value={status} onValueChange={(val: any) => setStatus(val)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DRAFT">Draft</SelectItem>
                    <SelectItem value="PUBLISHED">Published</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Tip:</strong> Save as draft to preview before publishing, or click "Publish Now" to make it live immediately.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
