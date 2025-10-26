import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { enhanceArticle } from '@/lib/article-enhancer';
import { generateAndUploadArticleImages } from '@/lib/image-generator';

/**
 * Enhance Single Blog Post
 * POST /api/blog/posts/[id]/enhance
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const postId = params.id;

    // Get the blog post
    const post = await prisma.blogPost.findUnique({
      where: { id: postId },
    });

    if (!post) {
      return NextResponse.json(
        { success: false, error: 'Blog post not found' },
        { status: 404 }
      );
    }

    // Step 1: Enhance content (clean HTML, add schema, credentials, etc.)
    const enhancementResult = await enhanceArticle(
      post.id,
      post.content,
      {
        title: post.title,
        description: post.metaDescription || '',
        author: post.author || 'Sun Direct Power',
        datePublished: post.createdAt,
        dateModified: new Date(),
        keywords: post.keywords || [],
      },
      []
    );

    let enhancedContent = enhancementResult.content;

    // Step 2: Generate images if they don't exist
    let heroImageUrl = post.featuredImage;
    let infographicUrl = null;

    if (!post.featuredImage) {
      const images = await generateAndUploadArticleImages(
        post.id,
        post.title,
        post.excerpt || post.title,
        undefined,
        undefined
      );
      heroImageUrl = images.heroImageUrl;
      infographicUrl = images.infographicUrl;

      // Embed images in content
      if (heroImageUrl) {
        enhancedContent = `<img src="${heroImageUrl}" alt="${post.title}" class="w-full h-auto rounded-lg mb-6" />\n\n${enhancedContent}`;
      }

      if (infographicUrl) {
        const sections = enhancedContent.split('<h2>');
        if (sections.length > 2) {
          const midPoint = Math.floor(sections.length / 2);
          sections[midPoint] = `<img src="${infographicUrl}" alt="Infographic for ${post.title}" class="w-full h-auto rounded-lg my-6" />\n\n<h2>${sections[midPoint]}`;
          enhancedContent = sections.join('<h2>');
        }
      }
    }

    // Step 3: Update the blog post with ENHANCED status
    await prisma.blogPost.update({
      where: { id: postId },
      data: {
        content: enhancedContent,
        featuredImage: heroImageUrl,
        status: 'ENHANCED',
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Article enhanced successfully',
      changes: enhancementResult.changes,
      eeatScore: enhancementResult.eeatScore,
      ymylCompliant: enhancementResult.ymylCompliant,
      heroImageGenerated: !post.featuredImage && !!heroImageUrl,
      infographicGenerated: !!infographicUrl,
    });
  } catch (error: any) {
    console.error('Error enhancing article:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to enhance article' },
      { status: 500 }
    );
  }
}
