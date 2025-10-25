import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PrismaClient } from '@prisma/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, ArrowRight, ArrowLeft } from 'lucide-react';
import { formatDate } from '@/lib/blog/utils';

const prisma = new PrismaClient();

async function getCategory(slug: string) {
  try {
    const category = await prisma.blogCategory.findUnique({
      where: { slug },
    });
    return category;
  } catch (error) {
    console.error('Error fetching category:', error);
    return null;
  } finally {
    await prisma.$disconnect();
  }
}

async function getCategoryPosts(categoryName: string, page: number = 1, limit: number = 12) {
  try {
    const skip = (page - 1) * limit;

    const [posts, total] = await Promise.all([
      prisma.blogPost.findMany({
        where: {
          status: 'PUBLISHED',
          category: categoryName,
        },
        orderBy: { publishedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.blogPost.count({
        where: {
          status: 'PUBLISHED',
          category: categoryName,
        },
      }),
    ]);

    return {
      posts,
      total,
      totalPages: Math.ceil(total / limit),
    };
  } catch (error) {
    console.error('Error fetching category posts:', error);
    return { posts: [], total: 0, totalPages: 0 };
  } finally {
    await prisma.$disconnect();
  }
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const category = await getCategory(params.slug);

  if (!category) {
    return {
      title: 'Category Not Found',
    };
  }

  return {
    title: category.seoTitle || `${category.name} | Sun Direct Power Blog`,
    description: category.seoDescription || category.description || `Browse ${category.name} articles and guides`,
    openGraph: {
      title: category.seoTitle || category.name,
      description: category.seoDescription || category.description || undefined,
      type: 'website',
      images: category.image ? [{ url: category.image }] : [],
    },
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { page?: string };
}) {
  const category = await getCategory(params.slug);

  if (!category) {
    notFound();
  }

  const page = parseInt(searchParams.page || '1');
  const { posts, totalPages } = await getCategoryPosts(category.name, page);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-primary to-primary-dark text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <Link href="/blog">
            <Button variant="ghost" size="sm" className="mb-6 text-white hover:bg-white/20">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to All Posts
            </Button>
          </Link>
          
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              {category.name}
            </h1>
            {category.description && (
              <p className="text-xl text-white/90 max-w-2xl mx-auto">
                {category.description}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Blog Posts Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {posts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">No posts in this category yet.</p>
            <Link href="/blog">
              <Button className="mt-4">Browse All Posts</Button>
            </Link>
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
                    {/* Category Badge */}
                    <Badge className="bg-coral hover:bg-coral-600 mb-3">
                      {category.name}
                    </Badge>

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
                  <Link href={`/blog/category/${params.slug}?page=${page - 1}`}>
                    <Button variant="outline">Previous</Button>
                  </Link>
                )}
                
                <span className="text-gray-600">
                  Page {page} of {totalPages}
                </span>

                {page < totalPages && (
                  <Link href={`/blog/category/${params.slug}?page=${page + 1}`}>
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
