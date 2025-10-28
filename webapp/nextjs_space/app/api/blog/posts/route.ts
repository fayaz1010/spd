import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

// GET - List all blog posts (with filters)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const strategyId = searchParams.get('strategyId'); // NEW: Filter by strategy
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (category) {
      where.category = category;
    }

    // NEW: Filter by strategy
    if (strategyId && strategyId !== 'all') {
      where.OR = [
        { pillar: { strategyId } },
        { cluster: { pillar: { strategyId } } },
      ];
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
        { excerpt: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Get posts with pagination and ALL fields including quality/SEO
    const [posts, total] = await Promise.all([
      prisma.blogPost.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          pillar: {
            select: {
              id: true,
              title: true,
              targetKeyword: true,
              strategy: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          cluster: {
            select: {
              id: true,
              title: true,
              targetKeyword: true,
              pillar: {
                select: {
                  id: true,
                  title: true,
                  strategy: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                },
              },
            },
          },
        },
      }),
      prisma.blogPost.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      posts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Error fetching blog posts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch blog posts', details: error.message },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// POST - Create new blog post
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      title,
      slug,
      content,
      excerpt,
      featuredImage,
      metaTitle,
      metaDescription,
      keywords,
      canonicalUrl,
      category,
      tags,
      author,
      authorImage,
      status,
      publishedAt,
      readingTime,
    } = body;

    // Validate required fields
    if (!title || !slug || !content || !excerpt || !metaTitle || !metaDescription) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if slug already exists
    const existingPost = await prisma.blogPost.findUnique({
      where: { slug },
    });

    if (existingPost) {
      return NextResponse.json(
        { error: 'A post with this slug already exists' },
        { status: 400 }
      );
    }

    // Calculate reading time if not provided
    const calculatedReadingTime = readingTime || calculateReadingTime(content);

    // Create post
    const post = await prisma.blogPost.create({
      data: {
        title,
        slug,
        content,
        excerpt,
        featuredImage: featuredImage || null,
        metaTitle,
        metaDescription,
        keywords: keywords || [],
        canonicalUrl: canonicalUrl || null,
        category: category || null,
        tags: tags || [],
        author: author || 'Sun Direct Power',
        authorImage: authorImage || null,
        status: status || 'DRAFT',
        publishedAt: status === 'PUBLISHED' && !publishedAt ? new Date() : publishedAt,
        readingTime: calculatedReadingTime,
      },
    });

    return NextResponse.json({
      success: true,
      post,
      message: 'Blog post created successfully',
    });
  } catch (error: any) {
    console.error('Error creating blog post:', error);
    return NextResponse.json(
      { error: 'Failed to create blog post', details: error.message },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// Helper function to calculate reading time
function calculateReadingTime(content: string): number {
  const wordsPerMinute = 200;
  const wordCount = content.trim().split(/\s+/).length;
  const readingTime = Math.ceil(wordCount / wordsPerMinute);
  return readingTime;
}
