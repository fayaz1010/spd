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
import {
  ArrowLeft,
  Save,
  Eye,
  Calendar,
  Loader2,
  FileText,
  Image as ImageIcon,
  ExternalLink,
  Sparkles
} from 'lucide-react';
import { RichTextEditor } from '@/components/blog/RichTextEditor';
import toast from 'react-hot-toast';

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  featuredImage: string | null;
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
  canonicalUrl: string | null;
  category: string | null;
  tags: string[];
  author: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  publishedAt: string | null;
  viewCount: number;
  readingTime: number;
  createdAt: string;
  updatedAt: string;
}

export default function EditBlogPostPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [enhancing, setEnhancing] = useState(false);
  const [post, setPost] = useState<BlogPost | null>(null);
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
  const [author, setAuthor] = useState('');
  const [status, setStatus] = useState<'DRAFT' | 'PUBLISHED' | 'ARCHIVED'>('DRAFT');

  useEffect(() => {
    fetchData();
  }, [params.id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [postRes, categoriesRes] = await Promise.all([
        fetch(`/api/blog/posts/${params.id}`),
        fetch('/api/blog/categories'),
      ]);

      const postData = await postRes.json();
      const categoriesData = await categoriesRes.json();

      if (!postRes.ok) {
        throw new Error('Post not found');
      }

      const fetchedPost = postData.post || postData;
      setPost(fetchedPost);
      setCategories(categoriesData);

      // Populate form
      setTitle(fetchedPost.title);
      setSlug(fetchedPost.slug);
      setContent(fetchedPost.content);
      setExcerpt(fetchedPost.excerpt);
      setFeaturedImage(fetchedPost.featuredImage || '');
      setMetaTitle(fetchedPost.metaTitle);
      setMetaDescription(fetchedPost.metaDescription);
      setKeywords(fetchedPost.keywords.join(', '));
      setCanonicalUrl(fetchedPost.canonicalUrl || '');
      setCategory(fetchedPost.category || '');
      setTags(fetchedPost.tags.join(', '));
      setAuthor(fetchedPost.author);
      setStatus(fetchedPost.status);
    } catch (error) {
      console.error('Error fetching post:', error);
      toast.error('Failed to load post');
      router.push('/admin/dashboard/website/blog');
    } finally {
      setLoading(false);
    }
  };

  const handleEnhance = async () => {
    if (!post) return;

    setEnhancing(true);
    try {
      const response = await fetch(`/api/blog/posts/${post.id}/enhance`, {
        method: 'POST',
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Article enhanced successfully!');
        // Reload the post to show enhanced content
        await fetchData();
      } else {
        toast.error(data.error || 'Failed to enhance article');
      }
    } catch (error) {
      console.error('Error enhancing article:', error);
      toast.error('Failed to enhance article');
    } finally {
      setEnhancing(false);
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

      const res = await fetch(`/api/blog/posts/${params.id}`, {
        method: 'PUT',
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
          publishedAt: publishNow && status !== 'PUBLISHED' ? new Date().toISOString() : undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to update post');
      }

      toast.success('Post updated successfully!');
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

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-gray-400" />
          <p className="text-gray-600 mt-4">Loading post...</p>
        </div>
      </div>
    );
  }

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
            <h1 className="text-3xl font-bold">Edit Blog Post</h1>
            <p className="text-gray-600">Update your blog post</p>
          </div>
        </div>
        <div className="flex gap-2">
          {status === 'PUBLISHED' && (
            <Button
              variant="outline"
              onClick={() => window.open(`/blog/${slug}`, '_blank')}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              View Live
            </Button>
          )}
          <Button
            onClick={handleEnhance}
            disabled={enhancing || saving}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {enhancing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Enhancing...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Enhance Article
              </>
            )}
          </Button>
          <Button
            variant="outline"
            onClick={() => handleSave(false)}
            disabled={saving || enhancing}
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
          {status !== 'PUBLISHED' && (
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
          )}
        </div>
      </div>

      {/* Stats */}
      {post && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-gray-600">Status</p>
              <Badge className={
                status === 'PUBLISHED' ? 'bg-green-100 text-green-800' :
                status === 'DRAFT' ? 'bg-yellow-100 text-yellow-800' :
                'bg-gray-100 text-gray-800'
              }>
                {status}
              </Badge>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-gray-600">Views</p>
              <p className="text-2xl font-bold">{post.viewCount}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-gray-600">Reading Time</p>
              <p className="text-2xl font-bold">{calculateReadingTime()} min</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-gray-600">Published</p>
              <p className="text-sm font-medium">
                {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString() : 'Not published'}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

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
                  Will be used in URL: /blog/{slug}
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
                <Select value={category || "none"} onValueChange={(val) => setCategory(val === "none" ? "" : val)}>
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
                    <SelectItem value="ARCHIVED">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
