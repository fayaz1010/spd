import { NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { generateArticleWithCompliance } from '@/lib/gemini-grounding';
import { generateAndUploadArticleImages } from '@/lib/image-generator';
import { generateFunnelPlacements, insertFunnelElements } from '@/lib/ai-funnel-placement';
import { generateLinkStrategy, buildInternalLinks } from '@/lib/link-building-engine';
import { polishArticle } from '@/lib/article-polisher';
import { analyzeSEO } from '@/lib/seo-analyzer';
import { ensureHTML } from '@/lib/markdown-converter';
import { formatTables, validateAndFixTables } from '@/lib/table-formatter';
import { formatSources } from '@/lib/content-formatter';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes max

/**
 * COMPLETE Content Generation System
 * - Google Search grounding + E-E-A-T + YMYL
 * - Image generation (Gemini 2.5 Flash)
 * - Funnel integration
 * - Internal link building
 * - Schema markup
 * - HTML polishing
 * - SEO analysis (95%+ target)
 * 
 * POST /api/ai/strategy/[id]/start-generation-complete
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const strategyId = params.id;

  // Create a readable stream for Server-Sent Events
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (data: any) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      try {
        // Fetch strategy with pillars and clusters
        const strategy = await prisma.contentStrategy.findUnique({
          where: { id: strategyId },
          include: {
            pillars: {
              include: {
                clusters: true,
              },
            },
          },
        });

        if (!strategy) {
          throw new Error('Strategy not found');
        }

        // Calculate totals first
        const totalArticles = strategy.pillars.length + 
          strategy.pillars.reduce((sum: number, p: any) => sum + p.clusters.length, 0);
        
        // Count already generated articles (for resume)
        let completedCount = 0;
        for (const pillar of strategy.pillars) {
          if (pillar.blogPostId) completedCount++;
          for (const cluster of pillar.clusters) {
            if (cluster.blogPostId) completedCount++;
          }
        }
        
        const generatedArticles = new Map();

        console.log(`📊 Resume status: ${completedCount}/${totalArticles} articles already generated`);

        // Check if resuming from previous session
        const isResuming = strategy.generationPhase && strategy.generationPhase !== 'NOT_STARTED' && strategy.generationPhase !== 'COMPLETE';
        
        if (isResuming) {
          console.log(`📍 Resuming from phase: ${strategy.generationPhase}, progress: ${strategy.generationProgress}%`);
          sendEvent({
            progress: strategy.generationProgress || 0,
            step: `Resuming from ${strategy.generationPhase} phase... (${completedCount}/${totalArticles} already generated)`,
            summary: {
              total: totalArticles,
              completed: completedCount,
              resuming: true,
            },
          });
        }

        sendEvent({
          progress: 0,
          step: 'Starting complete content generation system...',
        });

        // Update strategy status
        await prisma.contentStrategy.update({
          where: { id: strategyId },
          data: { status: 'GENERATING' },
        });

        // ============================================
        // PHASE 1: Generate All Articles
        // ============================================
        // Update phase tracking
        await prisma.contentStrategy.update({
          where: { id: strategyId },
          data: {
            generationPhase: 'CONTENT',
            generationProgress: 5,
          },
        });

        sendEvent({
          progress: 5,
          step: 'Phase 1: Generating content with Google Search grounding...',
        });

        // Generate pillar articles
        for (const pillar of strategy.pillars) {
          let pillarSkipped = false;
          
          // Skip pillar if already generated (just check if blogPostId exists)
          if (pillar.blogPostId) {
            console.log(`⏭️ Skipping already generated pillar: ${pillar.title}`);
            pillarSkipped = true;
            
            // Load existing article
            const existingPillar = await prisma.blogPost.findUnique({
              where: { id: pillar.blogPostId },
            });
            
            if (existingPillar) {
              generatedArticles.set(pillar.id, {
                id: existingPillar.id,
                slug: existingPillar.slug,
                title: existingPillar.title,
                content: existingPillar.content,
                type: 'PILLAR',
              });
            }
            
            completedCount++;
            
            // Update progress
            const currentProgress = Math.round((completedCount / totalArticles) * 40) + 5;
            await prisma.contentStrategy.update({
              where: { id: strategyId },
              data: {
                generationProgress: currentProgress,
                lastProcessedItem: pillar.id,
              },
            });
          }
          
          // Generate pillar if not skipped
          if (!pillarSkipped) {
          try {
            sendEvent({
              progress: Math.round((completedCount / totalArticles) * 40) + 5,
              step: `Researching: ${pillar.title}`,
            });

            // Generate article with Google Search grounding, E-E-A-T, and YMYL
            const article = await generateArticleWithCompliance(
              pillar.title,
              pillar.targetKeyword,
              pillar.wordCount || 3000,
              {
                location: 'Perth, Western Australia',
                targetAudience: strategy.targetAudience || 'Perth homeowners',
              }
            );

            // Convert markdown to HTML if needed
            article.content = ensureHTML(article.content);
            
            // Format and validate tables
            article.content = validateAndFixTables(article.content);
            article.content = formatTables(article.content);

            // Skip image generation for now (can be added later)
            console.log(`⏭️ Skipping image generation for ${pillar.title} (will generate later)`);
            const images = { heroUrl: null, infographicUrl: null };

            sendEvent({
              progress: Math.round((completedCount / totalArticles) * 40) + 5,
              step: `Adding funnels: ${pillar.title}`,
            });

            // Generate funnel placements
            const funnelPlacements = await generateFunnelPlacements(
              pillar.title,
              pillar.targetKeyword,
              (pillar.intent as any) || 'COMMERCIAL',
              'PILLAR',
              strategy.targetAudience || 'Perth homeowners'
            );

            // Insert funnel elements
            let content = insertFunnelElements(article.content, funnelPlacements);

            // Add properly formatted sources (deduplicated, no API URLs)
            const sourcesSection = formatSources(article.sources || []);
            if (sourcesSection) {
              content += sourcesSection;
            }

            // Add schema markup
            content = addSchemaMarkup(content, pillar.title, 'pillar');

            // Polish HTML
            const polished = polishArticle(content);
            const polishedContent = polished.content;

            // Save article to database (upsert to handle duplicates)
            const blogPost = await prisma.blogPost.upsert({
              where: { slug: pillar.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') },
              update: {
                title: pillar.title,
                content: polishedContent,
                excerpt: article.content.substring(0, 200) + '...',
                metaTitle: pillar.title,
                metaDescription: article.content.substring(0, 160),
                keywords: [pillar.targetKeyword],
                heroImageUrl: images.heroUrl || null,
                infographicUrl: images.infographicUrl || null,
                eeatScore: article.eeatScore,
                ymylCompliant: article.ymylCompliant,
                readingTime: Math.ceil(article.metadata.wordCount / 200),
                wordCount: article.metadata.wordCount,
              },
              create: {
                title: pillar.title,
                slug: pillar.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
                content: polishedContent,
                excerpt: article.content.substring(0, 200) + '...',
                metaTitle: pillar.title,
                metaDescription: article.content.substring(0, 160),
                keywords: [pillar.targetKeyword],
                status: 'DRAFT',
                author: 'Sun Direct Power',
                heroImageUrl: images.heroUrl || null,
                infographicUrl: images.infographicUrl || null,
                eeatScore: article.eeatScore,
                ymylCompliant: article.ymylCompliant,
                readingTime: Math.ceil(article.metadata.wordCount / 200),
                wordCount: article.metadata.wordCount,
              },
            });

            // Update pillar
            await prisma.pillar.update({
              where: { id: pillar.id },
              data: {
                blogPostId: blogPost.id,
                status: 'GENERATED',
                seoScore: article.eeatScore,
                wordCount: article.metadata.wordCount,
                heroImageUrl: images.heroUrl || null,
                infographicUrl: images.infographicUrl || null,
                calculatorCtas: funnelPlacements.calculatorCtas?.length || 0,
                packageLinks: funnelPlacements.packageLinks?.length || 0,
                productLinks: funnelPlacements.productLinks?.length || 0,
              },
            });

            // Store for link building
            generatedArticles.set(pillar.id, {
              id: blogPost.id,
              slug: blogPost.slug,
              title: pillar.title,
              content,
              type: 'PILLAR',
            });

            completedCount++;

            // Update progress tracking
            const currentProgress = Math.round((completedCount / totalArticles) * 40) + 5;
            await prisma.contentStrategy.update({
              where: { id: strategyId },
              data: {
                generationProgress: currentProgress,
                lastProcessedItem: pillar.id,
                completedCount,
              },
            });

            sendEvent({
              progress: currentProgress,
              step: `Generated: ${pillar.title}`,
              article: {
                title: pillar.title,
                wordCount: article.metadata.wordCount,
                seoScore: article.eeatScore,
              },
            });
          } catch (error: any) {
            console.error(`Pillar generation error (${pillar.title}):`, error);
            sendEvent({
              error: {
                article: pillar.title,
                message: error.message,
              },
            });
          }
          } // End of if (!pillarSkipped)

            // Generate cluster articles (ALWAYS process clusters, even if pillar was skipped)
            for (const cluster of pillar.clusters) {
              // Skip if already generated (just check if blogPostId exists)
              if (cluster.blogPostId) {
                console.log(`⏭️ Skipping already generated cluster: ${cluster.title}`);
                
                // Load existing article
                const existingCluster = await prisma.blogPost.findUnique({
                  where: { id: cluster.blogPostId },
                });
                
                if (existingCluster) {
                  generatedArticles.set(cluster.id, {
                    id: existingCluster.id,
                    slug: existingCluster.slug,
                    title: existingCluster.title,
                    content: existingCluster.content,
                    type: 'CLUSTER',
                  });
                }
                
                completedCount++;
                
                // Update progress
                const currentProgress = Math.round((completedCount / totalArticles) * 40) + 5;
                await prisma.contentStrategy.update({
                  where: { id: strategyId },
                  data: {
                    generationProgress: currentProgress,
                    lastProcessedItem: cluster.id,
                  },
                });
                
                continue;
              }
              
              try {
                sendEvent({
                  progress: Math.round((completedCount / totalArticles) * 40) + 5,
                  step: `Researching: ${cluster.title}`,
                });

                // Generate cluster article
                const clusterArticle = await generateArticleWithCompliance(
                  cluster.title,
                  cluster.targetKeyword,
                  cluster.wordCount || 1500,
                  {
                    location: 'Perth, Western Australia',
                    targetAudience: strategy.targetAudience || 'Perth homeowners',
                  }
                );

                // Convert markdown to HTML if needed
                clusterArticle.content = ensureHTML(clusterArticle.content);
                
                // Format and validate tables
                clusterArticle.content = validateAndFixTables(clusterArticle.content);
                clusterArticle.content = formatTables(clusterArticle.content);

                // Skip image generation for now (can be added later)
                console.log(`⏭️ Skipping image generation for ${cluster.title} (will generate later)`);
                const clusterImages = { heroUrl: null, infographicUrl: null };

                // Generate funnel placements
                const clusterFunnels = await generateFunnelPlacements(
                  cluster.title,
                  cluster.targetKeyword,
                  (cluster.intent as any) || 'INFORMATIONAL',
                  'CLUSTER',
                  strategy.targetAudience || 'Perth homeowners'
                );

                // Insert funnels
                let clusterContent = insertFunnelElements(clusterArticle.content, clusterFunnels);

                // Add properly formatted sources (deduplicated, no API URLs)
                const clusterSourcesSection = formatSources(clusterArticle.sources || []);
                if (clusterSourcesSection) {
                  clusterContent += clusterSourcesSection;
                }

                // Add schema markup
                clusterContent = addSchemaMarkup(clusterContent, cluster.title, 'cluster');

                // Polish HTML
                const clusterPolished = polishArticle(clusterContent);
                clusterContent = clusterPolished.content;

                // Create blog post (upsert to handle duplicates)
                const clusterSlug = cluster.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
                const clusterBlogPost = await prisma.blogPost.upsert({
                  where: { slug: clusterSlug },
                  update: {
                    title: cluster.title,
                    content: clusterContent,
                    excerpt: clusterArticle.content.substring(0, 200) + '...',
                    metaTitle: cluster.title,
                    metaDescription: clusterArticle.content.substring(0, 160),
                    keywords: [cluster.targetKeyword],
                    heroImageUrl: clusterImages.heroUrl || null,
                    infographicUrl: clusterImages.infographicUrl || null,
                    eeatScore: clusterArticle.eeatScore,
                    ymylCompliant: clusterArticle.ymylCompliant,
                    readingTime: Math.ceil(clusterArticle.metadata.wordCount / 200),
                    wordCount: clusterArticle.metadata.wordCount,
                  },
                  create: {
                    title: cluster.title,
                    slug: clusterSlug,
                    content: clusterContent,
                    excerpt: clusterArticle.content.substring(0, 200) + '...',
                    metaTitle: cluster.title,
                    metaDescription: clusterArticle.content.substring(0, 160),
                    keywords: [cluster.targetKeyword],
                    status: 'DRAFT',
                    author: 'Sun Direct Power',
                    heroImageUrl: clusterImages.heroUrl || null,
                    infographicUrl: clusterImages.infographicUrl || null,
                    eeatScore: clusterArticle.eeatScore,
                    ymylCompliant: clusterArticle.ymylCompliant,
                    readingTime: Math.ceil(clusterArticle.metadata.wordCount / 200),
                    wordCount: clusterArticle.metadata.wordCount,
                  },
                });

                // Update cluster
                await prisma.cluster.update({
                  where: { id: cluster.id },
                  data: {
                    blogPostId: clusterBlogPost.id,
                    status: 'GENERATED',
                    seoScore: clusterArticle.eeatScore,
                    wordCount: clusterArticle.metadata.wordCount,
                    heroImageUrl: clusterImages.heroImageUrl,
                    infographicUrl: clusterImages.infographicUrl,
                    calculatorCtas: clusterFunnels.calculatorCtas?.length || 0,
                    packageLinks: clusterFunnels.packageLinks?.length || 0,
                    productLinks: clusterFunnels.productLinks?.length || 0,
                  },
                });

                // Store for link building
                generatedArticles.set(cluster.id, {
                  id: clusterBlogPost.id,
                  slug: clusterBlogPost.slug,
                  title: cluster.title,
                  content: clusterContent,
                  type: 'CLUSTER',
                });

                completedCount++;
                sendEvent({
                  progress: Math.round((completedCount / totalArticles) * 40) + 5,
                  article: {
                    title: cluster.title,
                    type: 'cluster',
                    wordCount: clusterArticle.metadata.wordCount,
                    seoScore: clusterArticle.eeatScore,
                  },
                });
              } catch (error: any) {
                console.error(`Cluster generation error (${cluster.title}):`, error);
                sendEvent({
                  error: {
                    article: cluster.title,
                    message: error.message,
                  },
                });
              }
            }
        }

        // ============================================
        // PHASE 2: Build Internal Links
        // ============================================
        await prisma.contentStrategy.update({
          where: { id: strategyId },
          data: {
            generationPhase: 'LINKS',
            generationProgress: 50,
          },
        });
        
        sendEvent({
          progress: 50,
          step: 'Phase 2: Building internal link structure...',
        });

        let totalLinks = 0;
        for (const pillar of strategy.pillars) {
          try {
            const pillarArticle = generatedArticles.get(pillar.id);
            if (!pillarArticle) continue;

            const clusterArticles = pillar.clusters
              .map(c => generatedArticles.get(c.id))
              .filter(Boolean) as any[];

            if (clusterArticles.length === 0) continue;

            // Generate link strategy
            const linkStrategy = generateLinkStrategy(
              { 
                id: pillar.id, 
                slug: pillarArticle.slug, 
                title: pillar.title, 
                keyword: pillar.targetKeyword 
              },
              clusterArticles.map(c => ({ 
                id: c.id, 
                slug: c.slug, 
                title: c.title, 
                keyword: pillar.targetKeyword 
              }))
            );

            // Build internal links
            const contentMap = new Map<string, string>();
            contentMap.set(pillarArticle.id, pillarArticle.content);
            clusterArticles.forEach(c => contentMap.set(c.id, c.content));

            const linkResult = await buildInternalLinks(
              linkStrategy,
              pillarArticle.content,
              contentMap
            );

            // Update pillar content with links
            await prisma.blogPost.update({
              where: { id: pillarArticle.id },
              data: { content: linkResult.updatedPillarContent },
            });

            // Update cluster contents with links
            for (const [postId, updatedContent] of linkResult.updatedClusterContents.entries()) {
              await prisma.blogPost.update({
                where: { id: postId },
                data: { content: updatedContent },
              });
            }

            // Save link records
            for (const link of linkResult.linkPlacements) {
              await prisma.internalLink.create({
                data: {
                  fromPostId: link.fromPostId,
                  toPostId: link.toPostId,
                  anchorText: link.anchorText,
                  placement: link.placement,
                },
              });
            }

            totalLinks += linkResult.linkPlacements.length;

            sendEvent({
              progress: 50 + Math.round((pillar.clusters.length / totalArticles) * 30),
              step: `Built ${linkResult.linkPlacements.length} links for ${pillar.title}`,
            });
          } catch (error: any) {
            console.error(`Link building error (${pillar.title}):`, error);
          }
        }

        // ============================================
        // PHASE 3: SEO Analysis & Validation
        // ============================================
        await prisma.contentStrategy.update({
          where: { id: strategyId },
          data: {
            generationPhase: 'SEO',
            generationProgress: 85,
          },
        });
        
        sendEvent({
          progress: 85,
          step: 'Phase 3: Analyzing SEO scores...',
        });

        let totalSeoScore = 0;
        let analyzedCount = 0;

        for (const [_, article] of generatedArticles) {
          try {
            const seoAudit = await analyzeSEO(article.content, {
              title: article.title,
              metaDescription: article.content.substring(0, 160),
              slug: article.slug,
              keywords: [article.title.split(' ')[0]],
            });

            // Update blog post with SEO score
            await prisma.blogPost.update({
              where: { id: article.id },
              data: {
                // Add seoScore field if it exists in schema
                // seoScore: seoAudit.score,
              },
            });

            totalSeoScore += seoAudit.score;
            analyzedCount++;

            sendEvent({
              progress: 85 + Math.round((analyzedCount / totalArticles) * 10),
              step: `SEO Score: ${seoAudit.score}/100 - ${article.title}`,
            });
          } catch (error: any) {
            console.error(`SEO analysis error (${article.title}):`, error);
          }
        }

        const avgSeoScore = analyzedCount > 0 ? Math.round(totalSeoScore / analyzedCount) : 0;

        // ============================================
        // PHASE 4: Generate Images (Optional - Last Step)
        // ============================================
        await prisma.contentStrategy.update({
          where: { id: strategyId },
          data: {
            generationPhase: 'IMAGES',
            generationProgress: 90,
          },
        });
        
        sendEvent({
          progress: 90,
          step: 'Phase 4: Image generation (skipped - will generate later)...',
        });
        
        // TODO: Add batch image generation here when quota is available
        // This will be a separate endpoint: /api/ai/strategy/[id]/generate-images
        console.log('📸 Image generation skipped. Run generate-images endpoint later.');

        // ============================================
        // PHASE 5: Complete
        // ============================================
        sendEvent({
          progress: 95,
          step: 'Finalizing strategy...',
        });

        // Update strategy status
        await prisma.contentStrategy.update({
          where: { id: strategyId },
          data: {
            status: 'REVIEW',
            completedCount: completedCount,
            generationPhase: 'COMPLETE',
            generationProgress: 100,
          },
        });

        sendEvent({
          completed: true,
          progress: 100,
          step: 'All articles generated successfully!',
          summary: {
            total: totalArticles,
            completed: completedCount,
            totalLinks,
            avgSeoScore,
          },
        });

        controller.close();
      } catch (error: any) {
        console.error('Generation error:', error);
        sendEvent({
          error: error.message || 'Failed to generate content',
        });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

/**
 * Add schema markup to content
 */
function addSchemaMarkup(content: string, title: string, type: 'pillar' | 'cluster'): string {
  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    author: {
      '@type': 'Organization',
      name: 'Sun Direct Power',
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
    datePublished: new Date().toISOString(),
    dateModified: new Date().toISOString(),
  };

  const schemaScript = `\n<script type="application/ld+json">\n${JSON.stringify(articleSchema, null, 2)}\n</script>\n`;
  
  return content + schemaScript;
}
