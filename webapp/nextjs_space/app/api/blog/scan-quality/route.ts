import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { batchScanBlogPosts, BlogQualityReport } from '@/lib/blog-quality-scanner';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * Scan all blog posts for quality issues
 * GET /api/blog/scan-quality
 */
export async function GET(request: NextRequest) {
  try {
    // Get all blog posts
    const posts = await prisma.blogPost.findMany({
      select: {
        id: true,
        title: true,
        content: true,
        status: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    console.log(`📊 Scanning ${posts.length} blog posts for quality issues...`);

    // Scan all posts
    const reports = await batchScanBlogPosts(posts);

    // Calculate summary stats
    const summary = {
      totalPosts: posts.length,
      postsWithIssues: reports.filter(r => r.issues.length > 0).length,
      needsRegeneration: reports.filter(r => r.needsRegeneration).length,
      needsEnhancement: reports.filter(r => r.needsEnhancement).length,
      averageScore: Math.round(
        reports.reduce((sum, r) => sum + r.overallScore, 0) / reports.length
      ),
      issuesByType: {
        ctaStacking: reports.filter(r => 
          r.issues.some(i => i.type === 'CTA_STACKING')
        ).length,
        purpleCardCorruption: reports.filter(r => 
          r.issues.some(i => i.type === 'PURPLE_CARD_CORRUPTION')
        ).length,
        tableFormatting: reports.filter(r => 
          r.issues.some(i => i.type === 'TABLE_FORMATTING')
        ).length,
        sourcesMissing: reports.filter(r => 
          r.issues.some(i => i.type === 'SOURCES_MISSING')
        ).length,
        sourcesDuplicates: reports.filter(r => 
          r.issues.some(i => i.type === 'SOURCES_DUPLICATES')
        ).length,
        sourcesApiUrls: reports.filter(r => 
          r.issues.some(i => i.type === 'SOURCES_API_URLS')
        ).length,
        brokenHtml: reports.filter(r => 
          r.issues.some(i => i.type === 'BROKEN_HTML')
        ).length,
        missingImages: reports.filter(r => 
          r.issues.some(i => i.type === 'MISSING_IMAGES')
        ).length,
      },
    };

    console.log(`✅ Scan complete: ${summary.postsWithIssues}/${summary.totalPosts} posts have issues`);
    console.log(`   - Needs regeneration: ${summary.needsRegeneration}`);
    console.log(`   - Needs enhancement: ${summary.needsEnhancement}`);
    console.log(`   - Average quality score: ${summary.averageScore}/100`);

    return NextResponse.json({
      success: true,
      summary,
      reports,
      scannedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Blog quality scan error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to scan blog posts' 
      },
      { status: 500 }
    );
  }
}
