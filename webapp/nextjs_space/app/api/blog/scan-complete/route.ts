import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { batchScanBlogPosts } from '@/lib/blog-quality-scanner';
import { batchScanBlogSEO } from '@/lib/blog-seo-scanner';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * Complete scan: Quality + SEO + Strategy info
 * GET /api/blog/scan-complete
 */
export async function GET(request: NextRequest) {
  try {
    // Get all blog posts with strategy relations
    const posts = await prisma.blogPost.findMany({
      select: {
        id: true,
        title: true,
        slug: true,
        content: true,
        status: true,
        metaTitle: true,
        metaDescription: true,
        keywords: true,
        pillar: {
          select: {
            id: true,
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
            targetKeyword: true,
            pillar: {
              select: {
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
      orderBy: {
        createdAt: 'desc',
      },
    });

    console.log(`📊 Complete scan: ${posts.length} blog posts...`);

    // Scan quality issues
    const qualityReports = await batchScanBlogPosts(
      posts.map(p => ({ id: p.id, title: p.title, content: p.content }))
    );

    // Scan SEO
    const seoReports = await batchScanBlogSEO(
      posts.map(p => ({
        id: p.id,
        title: p.title,
        content: p.content,
        metaTitle: p.metaTitle,
        metaDescription: p.metaDescription,
        keywords: p.keywords,
        slug: p.slug,
        targetKeyword: p.pillar?.targetKeyword || p.cluster?.targetKeyword || p.keywords?.[0],
      }))
    );

    // Combine reports with strategy info
    const combinedReports = posts.map((post, index) => {
      const qualityReport = qualityReports[index];
      const seoReport = seoReports[index];

      // Get strategy name (with proper type checking)
      let strategyName: string | null = null;
      let strategyId: string | null = null;
      let targetKeyword: string | null = null;
      
      if (post.pillar && post.pillar.strategy) {
        strategyName = post.pillar.strategy.name;
        strategyId = post.pillar.strategy.id;
        targetKeyword = post.pillar.targetKeyword;
      } else if (post.cluster && post.cluster.pillar && post.cluster.pillar.strategy) {
        strategyName = post.cluster.pillar.strategy.name;
        strategyId = post.cluster.pillar.strategy.id;
        targetKeyword = post.cluster.targetKeyword;
      }
      
      // Fallback to first keyword if no target keyword
      if (!targetKeyword && post.keywords && post.keywords.length > 0) {
        targetKeyword = post.keywords[0];
      }

      return {
        postId: post.id,
        postTitle: post.title,
        postSlug: post.slug,
        postStatus: post.status,
        strategyName,
        strategyId,
        targetKeyword,
        
        // Quality metrics
        qualityScore: qualityReport.overallScore,
        qualityIssues: qualityReport.issues.length,
        requiredActions: qualityReport.requiredActions,
        needsRegeneration: qualityReport.needsRegeneration,
        needsEnhancement: qualityReport.needsEnhancement,
        needsManualFix: qualityReport.needsManualFix,
        
        // SEO metrics
        seoScore: seoReport.seoScore,
        seoGrade: seoReport.grade,
        seoIssues: seoReport.issues.length,
        keywordDensity: seoReport.keywordDensity,
        
        // Full reports
        qualityReport,
        seoReport,
      };
    });

    // Calculate summary stats
    const summary = {
      totalPosts: posts.length,
      
      // Quality stats
      postsWithQualityIssues: qualityReports.filter(r => r.issues.length > 0).length,
      needsRegeneration: qualityReports.filter(r => r.needsRegeneration).length,
      needsEnhancement: qualityReports.filter(r => r.needsEnhancement).length,
      needsManualFix: qualityReports.filter(r => r.needsManualFix).length,
      averageQualityScore: Math.round(
        qualityReports.reduce((sum, r) => sum + r.overallScore, 0) / qualityReports.length
      ),
      
      // SEO stats
      postsWithSEOIssues: seoReports.filter(r => r.issues.length > 0).length,
      averageSEOScore: Math.round(
        seoReports.reduce((sum, r) => sum + r.seoScore, 0) / seoReports.length
      ),
      seoGrades: {
        'A+': seoReports.filter(r => r.grade === 'A+').length,
        'A': seoReports.filter(r => r.grade === 'A').length,
        'B': seoReports.filter(r => r.grade === 'B').length,
        'C': seoReports.filter(r => r.grade === 'C').length,
        'D': seoReports.filter(r => r.grade === 'D').length,
        'F': seoReports.filter(r => r.grade === 'F').length,
      },
      
      // Strategy stats
      postsWithStrategy: combinedReports.filter(r => r.strategyName).length,
      postsWithoutStrategy: combinedReports.filter(r => !r.strategyName).length,
      
      // By strategy
      byStrategy: {} as Record<string, { count: number; avgQuality: number; avgSEO: number }>,
    };

    // Calculate per-strategy stats
    combinedReports.forEach(report => {
      if (report.strategyName) {
        if (!summary.byStrategy[report.strategyName]) {
          summary.byStrategy[report.strategyName] = {
            count: 0,
            avgQuality: 0,
            avgSEO: 0,
          };
        }
        summary.byStrategy[report.strategyName].count++;
        summary.byStrategy[report.strategyName].avgQuality += report.qualityScore;
        summary.byStrategy[report.strategyName].avgSEO += report.seoScore;
      }
    });

    // Calculate averages
    Object.keys(summary.byStrategy).forEach(strategyName => {
      const stats = summary.byStrategy[strategyName];
      stats.avgQuality = Math.round(stats.avgQuality / stats.count);
      stats.avgSEO = Math.round(stats.avgSEO / stats.count);
    });

    console.log(`✅ Complete scan done:`);
    console.log(`   - Quality: ${summary.postsWithQualityIssues}/${summary.totalPosts} posts have issues`);
    console.log(`   - SEO: ${summary.postsWithSEOIssues}/${summary.totalPosts} posts have issues`);
    console.log(`   - Avg Quality: ${summary.averageQualityScore}/100`);
    console.log(`   - Avg SEO: ${summary.averageSEOScore}/100`);

    return NextResponse.json({
      success: true,
      summary,
      reports: combinedReports,
      scannedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Complete scan error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to scan blog posts' 
      },
      { status: 500 }
    );
  }
}
