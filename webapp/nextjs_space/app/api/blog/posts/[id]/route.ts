import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

// GET - Get single blog post by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const post = await prisma.blogPost.findUnique({
      where: { id },
    });

    if (!post) {
      return NextResponse.json(
        { error: 'Blog post not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      post,
    });
  } catch (error: any) {
    console.error('Error fetching blog post:', error);
    return NextResponse.json(
      { error: 'Failed to fetch blog post', details: error.message },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// PUT - Update blog post
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
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

    // Check if post exists
    const existingPost = await prisma.blogPost.findUnique({
      where: { id },
    });

    if (!existingPost) {
      return NextResponse.json(
        { error: 'Blog post not found' },
        { status: 404 }
      );
    }

    // If slug is being changed, check if new slug already exists
    if (slug && slug !== existingPost.slug) {
      const slugExists = await prisma.blogPost.findUnique({
        where: { slug },
      });

      if (slugExists) {
        return NextResponse.json(
          { error: 'A post with this slug already exists' },
          { status: 400 }
        );
      }
    }

    // Calculate reading time if content changed
    const calculatedReadingTime = content 
      ? (readingTime || calculateReadingTime(content))
      : existingPost.readingTime;

    // If status is changing to PUBLISHED and no publishedAt date, set it now
    const newPublishedAt = 
      status === 'PUBLISHED' && existingPost.status !== 'PUBLISHED' && !publishedAt
        ? new Date()
        : publishedAt !== undefined
        ? publishedAt
        : existingPost.publishedAt;

    // Update post
    const post = await prisma.blogPost.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(slug !== undefined && { slug }),
        ...(content !== undefined && { content }),
        ...(excerpt !== undefined && { excerpt }),
        ...(featuredImage !== undefined && { featuredImage }),
        ...(metaTitle !== undefined && { metaTitle }),
        ...(metaDescription !== undefined && { metaDescription }),
        ...(keywords !== undefined && { keywords }),
        ...(canonicalUrl !== undefined && { canonicalUrl }),
        ...(category !== undefined && { category }),
        ...(tags !== undefined && { tags }),
        ...(author !== undefined && { author }),
        ...(authorImage !== undefined && { authorImage }),
        ...(status !== undefined && { status }),
        publishedAt: newPublishedAt,
        readingTime: calculatedReadingTime,
      },
    });

    return NextResponse.json({
      success: true,
      post,
      message: 'Blog post updated successfully',
    });
  } catch (error: any) {
    console.error('Error updating blog post:', error);
    return NextResponse.json(
      { error: 'Failed to update blog post', details: error.message },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// DELETE - Delete blog post
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Check if post exists
    const existingPost = await prisma.blogPost.findUnique({
      where: { id },
    });

    if (!existingPost) {
      return NextResponse.json(
        { error: 'Blog post not found' },
        { status: 404 }
      );
    }

    // Delete post
    await prisma.blogPost.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Blog post deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting blog post:', error);
    return NextResponse.json(
      { error: 'Failed to delete blog post', details: error.message },
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
