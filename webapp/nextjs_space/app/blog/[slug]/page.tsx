import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PrismaClient } from '@prisma/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, ArrowLeft, Share2, Facebook, Twitter, Linkedin } from 'lucide-react';
import { formatDate } from '@/lib/blog/utils';

const prisma = new PrismaClient();

async function getPost(slug: string) {
  try {
    const post = await prisma.blogPost.findUnique({
      where: { slug, status: 'PUBLISHED' },
    });

    if (post) {
      // Increment view count
      await prisma.blogPost.update({
        where: { id: post.id },
        data: { viewCount: { increment: 1 } },
      });
    }

    return post;
  } catch (error) {
    console.error('Error fetching post:', error);
    return null;
  } finally {
    await prisma.$disconnect();
  }
}

async function getRelatedPosts(slug: string, category: string | null, limit: number = 3) {
  try {
    const where: any = {
      slug: { not: slug },
      status: 'PUBLISHED',
    };

    if (category) {
      where.category = category;
    }

    const posts = await prisma.blogPost.findMany({
      where,
      orderBy: { publishedAt: 'desc' },
      take: limit,
    });

    return posts;
  } catch (error) {
    console.error('Error fetching related posts:', error);
    return [];
  } finally {
    await prisma.$disconnect();
  }
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const post = await getPost(params.slug);

  if (!post) {
    return {
      title: 'Post Not Found',
    };
  }

  const url = `https://sundirectpower.com.au/blog/${post.slug}`;

  return {
    title: post.metaTitle,
    description: post.metaDescription,
    keywords: post.keywords,
    authors: [{ name: post.author }],
    openGraph: {
      title: post.metaTitle,
      description: post.metaDescription,
      url,
      type: 'article',
      publishedTime: post.publishedAt?.toISOString(),
      modifiedTime: post.updatedAt.toISOString(),
      authors: [post.author],
      images: post.featuredImage ? [{ url: post.featuredImage }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.metaTitle,
      description: post.metaDescription,
      images: post.featuredImage ? [post.featuredImage] : [],
    },
    alternates: {
      canonical: url,
    },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: { slug: string };
}) {
  const post = await getPost(params.slug);

  if (!post) {
    notFound();
  }

  const relatedPosts = await getRelatedPosts(post.slug, post.category);
  const shareUrl = `https://sundirectpower.com.au/blog/${post.slug}`;

  // Generate JSON-LD structured data
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.excerpt,
    image: post.featuredImage || undefined,
    datePublished: post.publishedAt?.toISOString(),
    dateModified: post.updatedAt.toISOString(),
    author: {
      '@type': 'Organization',
      name: post.author,
      url: 'https://sundirectpower.com.au',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Sun Direct Power',
      logo: {
        '@type': 'ImageObject',
        url: 'https://sundirectpower.com.au/logo.png',
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': shareUrl,
    },
  };

  return (
    <>
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <div className="bg-white border-b">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Link href="/blog">
              <Button variant="ghost" size="sm" className="mb-6">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Blog
              </Button>
            </Link>

            {/* Category */}
            {post.category && (
              <Badge className="bg-coral hover:bg-coral-600 mb-4">
                {post.category}
              </Badge>
            )}

            {/* Title */}
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              {post.title}
            </h1>

            {/* Meta Info */}
            <div className="flex flex-wrap items-center gap-6 text-gray-600 mb-6">
              <div className="flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                {formatDate(post.publishedAt || post.createdAt)}
              </div>
              <div className="flex items-center">
                <Clock className="h-5 w-5 mr-2" />
                {post.readingTime} min read
              </div>
              <div className="text-sm">
                By {post.author}
              </div>
            </div>

            {/* Featured Image */}
            {post.featuredImage && (
              <div className="relative h-96 rounded-lg overflow-hidden mb-8">
                <img
                  src={post.featuredImage}
                  alt={post.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-white rounded-lg shadow-lg p-8 md:p-12">
            {/* Article Content */}
            <div
              className="prose prose-lg max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-a:text-coral prose-a:no-underline hover:prose-a:underline prose-strong:text-gray-900 prose-img:rounded-lg"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />

            {/* Tags */}
            {post.tags && post.tags.length > 0 && (
              <div className="mt-12 pt-8 border-t">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {post.tags.map((tag) => (
                    <Badge key={tag} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Share Buttons */}
            <div className="mt-8 pt-8 border-t">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Share this article</h3>
              <div className="flex gap-3">
                <a
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Facebook className="h-5 w-5" />
                  Facebook
                </a>
                <a
                  href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(post.title)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors"
                >
                  <Twitter className="h-5 w-5" />
                  Twitter
                </a>
                <a
                  href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition-colors"
                >
                  <Linkedin className="h-5 w-5" />
                  LinkedIn
                </a>
              </div>
            </div>
          </div>

          {/* Related Posts */}
          {relatedPosts.length > 0 && (
            <div className="mt-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Related Articles</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {relatedPosts.map((relatedPost) => (
                  <Link
                    key={relatedPost.id}
                    href={`/blog/${relatedPost.slug}`}
                    className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
                  >
                    {relatedPost.featuredImage && (
                      <div className="relative h-40 overflow-hidden">
                        <img
                          src={relatedPost.featuredImage}
                          alt={relatedPost.title}
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    )}
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 hover:text-coral transition-colors">
                        {relatedPost.title}
                      </h3>
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {relatedPost.excerpt}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* CTA Section */}
          <div className="mt-12 bg-gradient-to-br from-coral to-orange-600 rounded-lg p-8 text-center text-white">
            <h2 className="text-2xl font-bold mb-4">Ready to Go Solar?</h2>
            <p className="text-lg mb-6 text-white/90">
              Get a personalized quote for your Perth home in minutes
            </p>
            <Link href="/calculator-v2">
              <Button size="lg" className="bg-white text-coral hover:bg-gray-100">
                Calculate My System
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
