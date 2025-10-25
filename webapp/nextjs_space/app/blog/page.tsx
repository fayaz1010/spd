import { Metadata } from 'next';
import Link from 'next/link';
import { PrismaClient } from '@prisma/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, ArrowRight } from 'lucide-react';
import { formatDate } from '@/lib/blog/utils';
import { BlogHeader } from '@/components/blog/BlogHeader';

const prisma = new PrismaClient();

export const metadata: Metadata = {
  title: 'Solar Blog | Expert Advice for Perth Homeowners | Sun Direct Power',
  description: 'Get expert solar advice, installation tips, and industry insights for Perth homes. Learn about solar panels, batteries, rebates, and more from Western Australia\'s solar experts.',
  openGraph: {
    title: 'Solar Blog | Sun Direct Power',
    description: 'Expert solar advice for Perth homeowners',
    type: 'website',
  },
};

async function getPosts(page: number = 1, limit: number = 12) {
  try {
    const skip = (page - 1) * limit;

    const [posts, total] = await Promise.all([
      prisma.blogPost.findMany({
        where: { status: 'PUBLISHED' },
        orderBy: { publishedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.blogPost.count({
        where: { status: 'PUBLISHED' },
      }),
    ]);

    return {
      posts,
      total,
      totalPages: Math.ceil(total / limit),
    };
  } catch (error) {
    console.error('Error fetching posts:', error);
    return { posts: [], total: 0, totalPages: 0 };
  } finally {
    await prisma.$disconnect();
  }
}

async function getCategories() {
  try {
    const categories = await prisma.blogCategory.findMany({
      orderBy: { sortOrder: 'asc' },
    });
    return categories;
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  } finally {
    await prisma.$disconnect();
  }
}

export default async function BlogPage({
  searchParams,
}: {
  searchParams: { page?: string };
}) {
  const page = parseInt(searchParams.page || '1');
  const { posts, totalPages } = await getPosts(page);
  const categories = await getCategories();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <BlogHeader />

      {/* Hero Section */}
      <div className="bg-gradient-to-br from-primary to-primary-dark text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Solar Insights & Expert Advice
            </h1>
            <p className="text-xl text-white/90 max-w-2xl mx-auto">
              Your trusted source for solar information in Perth. Get expert tips, industry news, and practical guides.
            </p>
          </div>
        </div>
      </div>

      {/* Categories */}
      {categories.length > 0 && (
        <div className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex flex-wrap gap-2 justify-center">
              <Link href="/blog">
                <Badge variant="outline" className="cursor-pointer hover:bg-coral hover:text-white transition-colors">
                  All Posts
                </Badge>
              </Link>
              {categories.map((category) => (
                <Link key={category.id} href={`/blog/category/${category.slug}`}>
                  <Badge variant="outline" className="cursor-pointer hover:bg-coral hover:text-white transition-colors">
                    {category.name}
                  </Badge>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Blog Posts Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {posts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">No blog posts yet. Check back soon!</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {posts.map((post) => (
                <article
                  key={post.id}
                  className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
                >
                  {/* Featured Image */}
                  {post.featuredImage && (
                    <Link href={`/blog/${post.slug}`}>
                      <div className="relative h-48 overflow-hidden">
                        <img
                          src={post.featuredImage}
                          alt={post.title}
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    </Link>
                  )}

                  <div className="p-6">
                    {/* Category */}
                    {post.category && (
                      <Link href={`/blog/category/${post.category.toLowerCase().replace(/\s+/g, '-')}`}>
                        <Badge className="bg-coral hover:bg-coral-600 mb-3">
                          {post.category}
                        </Badge>
                      </Link>
                    )}

                    {/* Title */}
                    <Link href={`/blog/${post.slug}`}>
                      <h2 className="text-xl font-bold text-gray-900 mb-3 hover:text-coral transition-colors line-clamp-2">
                        {post.title}
                      </h2>
                    </Link>

                    {/* Excerpt */}
                    <p className="text-gray-600 mb-4 line-clamp-3">
                      {post.excerpt}
                    </p>

                    {/* Meta */}
                    <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {formatDate(post.publishedAt || post.createdAt)}
                      </div>
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        {post.readingTime} min read
                      </div>
                    </div>

                    {/* Read More */}
                    <Link href={`/blog/${post.slug}`}>
                      <Button variant="outline" className="w-full group">
                        Read More
                        <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </Link>
                  </div>
                </article>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 mt-12">
                {page > 1 && (
                  <Link href={`/blog?page=${page - 1}`}>
                    <Button variant="outline">Previous</Button>
                  </Link>
                )}
                
                <span className="text-gray-600">
                  Page {page} of {totalPages}
                </span>

                {page < totalPages && (
                  <Link href={`/blog?page=${page + 1}`}>
                    <Button variant="outline">Next</Button>
                  </Link>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
