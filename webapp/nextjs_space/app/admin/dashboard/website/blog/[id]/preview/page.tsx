'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Edit,
  Eye,
  Calendar,
  Clock,
  User,
  Tag,
  Image as ImageIcon,
  Loader2
} from 'lucide-react';
import toast from 'react-hot-toast';
import Image from 'next/image';

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
  category: string | null;
  tags: string[];
  author: string;
  status: 'DRAFT' | 'ENHANCED' | 'PUBLISHED' | 'ARCHIVED';
  publishedAt: string | null;
  readingTime: number;
  createdAt: string;
  updatedAt: string;
}

export default function PreviewBlogPostPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [post, setPost] = useState<BlogPost | null>(null);
  const [showImages, setShowImages] = useState(true);

  useEffect(() => {
    fetchPost();
  }, [params.id]);

  const fetchPost = async () => {
    setLoading(true);
    try {
      // Add cache busting to force fresh data
      const response = await fetch(`/api/blog/posts/${params.id}?t=${Date.now()}`, {
        cache: 'no-store',
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error('Post not found');
      }

      // API returns { success: true, post: {...} }
      setPost(data.post || data);
    } catch (error) {
      console.error('Error fetching post:', error);
      toast.error('Failed to load post');
      router.push('/admin/dashboard/website/blog');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-coral" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-gray-600">Post not found</p>
            <Link href="/admin/dashboard/website/blog">
              <Button className="mt-4">Back to Blog</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    const styles = {
      PUBLISHED: 'bg-green-100 text-green-800',
      ENHANCED: 'bg-purple-100 text-purple-800',
      DRAFT: 'bg-yellow-100 text-yellow-800',
      ARCHIVED: 'bg-gray-100 text-gray-800',
    };
    return styles[status as keyof typeof styles] || styles.DRAFT;
  };

  // Extract images from content
  const imageMatches = post.content?.match(/<img[^>]+src="([^">]+)"/g) || [];
  const images = imageMatches.map(img => {
    const srcMatch = img.match(/src="([^">]+)"/);
    const altMatch = img.match(/alt="([^">]+)"/);
    return {
      src: srcMatch ? srcMatch[1] : '',
      alt: altMatch ? altMatch[1] : 'Article image',
    };
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/admin/dashboard/website/blog">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-bold">Article Preview</h1>
                <p className="text-sm text-gray-600">Review before publishing</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => setShowImages(!showImages)}
              >
                <ImageIcon className="w-4 h-4 mr-2" />
                {showImages ? 'Hide' : 'Show'} Images
              </Button>
              <Link href={`/admin/dashboard/website/blog/${post.id}`}>
                <Button>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Article
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <Card>
              <CardContent className="p-8">
                {/* Article Header */}
                <div className="mb-6">
                  <Badge className={getStatusBadge(post.status)}>
                    {post.status}
                  </Badge>
                  <h1 className="text-4xl font-bold mt-4 mb-4">{post.title}</h1>
                  <p className="text-xl text-gray-600 mb-6">{post.excerpt}</p>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      {post.author}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {post.readingTime} min read
                    </div>
                    {post.publishedAt && (
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(post.publishedAt).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>

                {/* Article Content */}
                <div 
                  className="prose prose-lg max-w-none 
                    [&_h1]:hidden
                    [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:mt-8 [&_h2]:mb-4 [&_h2]:text-gray-900
                    [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:mt-6 [&_h3]:mb-3 [&_h3]:text-gray-800
                    [&_h4]:text-lg [&_h4]:font-semibold [&_h4]:mt-5 [&_h4]:mb-2 [&_h4]:text-gray-800
                    [&_p]:mb-4 [&_p]:leading-relaxed [&_p]:text-gray-700
                    [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:my-4 
                    [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:my-4 
                    [&_li]:my-2 [&_li]:text-gray-700
                    [&_strong]:font-bold [&_strong]:text-gray-900
                    [&_em]:italic
                    [&_a]:text-coral [&_a]:underline [&_a]:hover:text-coral/80
                    [&_blockquote]:border-l-4 [&_blockquote]:border-coral [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-gray-600"
                  dangerouslySetInnerHTML={{ 
                    __html: showImages 
                      ? (post.content || '<p>No content available</p>') 
                      : (post.content?.replace(/<img[^>]*>/g, '<div class="bg-gray-200 p-4 rounded text-center text-gray-600">[Image Hidden]</div>') || '<p>No content available</p>')
                  }}
                />
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Images */}
            {images.length > 0 && (
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <ImageIcon className="w-4 h-4" />
                    Images ({images.length})
                  </h3>
                  <div className="space-y-3">
                    {images.map((img, index) => (
                      <div key={index} className="border rounded-lg overflow-hidden">
                        <div className="relative h-32 bg-gray-100">
                          <Image
                            src={img.src}
                            alt={img.alt}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="p-2 bg-gray-50">
                          <p className="text-xs text-gray-600 truncate">{img.alt}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Metadata */}
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-3">Metadata</h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="text-gray-600 font-medium">Meta Title</p>
                    <p>{post.metaTitle}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 font-medium">Meta Description</p>
                    <p className="text-gray-700">{post.metaDescription}</p>
                  </div>
                  {post.category && (
                    <div>
                      <p className="text-gray-600 font-medium">Category</p>
                      <Badge variant="outline">{post.category}</Badge>
                    </div>
                  )}
                  {post.keywords && Array.isArray(post.keywords) && post.keywords.length > 0 && (
                    <div>
                      <p className="text-gray-600 font-medium mb-2">Keywords</p>
                      <div className="flex flex-wrap gap-1">
                        {post.keywords.map((keyword, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {keyword}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {post.tags && Array.isArray(post.tags) && post.tags.length > 0 && (
                    <div>
                      <p className="text-gray-600 font-medium mb-2">Tags</p>
                      <div className="flex flex-wrap gap-1">
                        {post.tags.map((tag, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            <Tag className="w-3 h-3 mr-1" />
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Stats */}
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-3">Statistics</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Word Count</span>
                    <span className="font-medium">
                      {(post.content || '').replace(/<[^>]*>/g, '').split(/\s+/).filter(w => w.length > 0).length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Reading Time</span>
                    <span className="font-medium">{post.readingTime} min</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Images</span>
                    <span className="font-medium">{images.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Last Updated</span>
                    <span className="font-medium">
                      {new Date(post.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
