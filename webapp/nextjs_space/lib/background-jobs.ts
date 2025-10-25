/**
 * Background Job System
 * 
 * Allows long-running tasks to execute in the background
 * Users can navigate away and check status later
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export type JobStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';

export interface BackgroundJob {
  id: string;
  type: string;
  status: JobStatus;
  progress: number;
  currentStep: string;
  result?: any;
  error?: string;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
}

// In-memory job store (replace with Redis in production)
const jobs = new Map<string, BackgroundJob>();

/**
 * Create a new background job
 */
export async function createJob(
  type: string,
  metadata?: any
): Promise<string> {
  const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const job: BackgroundJob = {
    id: jobId,
    type,
    status: 'PENDING',
    progress: 0,
    currentStep: 'Initializing...',
    createdAt: new Date(),
  };
  
  jobs.set(jobId, job);
  
  // Save to database
  await prisma.backgroundJob.create({
    data: {
      id: jobId,
      type,
      status: 'PENDING',
      progress: 0,
      currentStep: 'Initializing...',
      metadata: metadata || {},
    },
  });
  
  return jobId;
}

/**
 * Update job status
 */
export async function updateJob(
  jobId: string,
  updates: Partial<BackgroundJob>
): Promise<void> {
  const job = jobs.get(jobId);
  if (!job) return;
  
  Object.assign(job, updates);
  jobs.set(jobId, job);
  
  // Update database
  await prisma.backgroundJob.update({
    where: { id: jobId },
    data: {
      status: updates.status,
      progress: updates.progress,
      currentStep: updates.currentStep,
      result: updates.result,
      error: updates.error,
      startedAt: updates.startedAt,
      completedAt: updates.completedAt,
    },
  });
}

/**
 * Get job status
 */
export async function getJobStatus(jobId: string): Promise<BackgroundJob | null> {
  // Check memory first
  const memJob = jobs.get(jobId);
  if (memJob) return memJob;
  
  // Check database
  const dbJob = await prisma.backgroundJob.findUnique({
    where: { id: jobId },
  });
  
  if (!dbJob) return null;
  
  const job: BackgroundJob = {
    id: dbJob.id,
    type: dbJob.type,
    status: dbJob.status as JobStatus,
    progress: dbJob.progress,
    currentStep: dbJob.currentStep,
    result: dbJob.result,
    error: dbJob.error || undefined,
    createdAt: dbJob.createdAt,
    startedAt: dbJob.startedAt || undefined,
    completedAt: dbJob.completedAt || undefined,
  };
  
  // Cache in memory
  jobs.set(jobId, job);
  
  return job;
}

/**
 * Execute content generation job
 */
export async function executeContentGenerationJob(
  jobId: string,
  strategyId: string
): Promise<void> {
  try {
    await updateJob(jobId, {
      status: 'RUNNING',
      startedAt: new Date(),
      currentStep: 'Starting content generation...',
    });
    
    // Import generation function
    const { generateArticleWithCompliance } = await import('./gemini-grounding');
    const { generateAndUploadArticleImages } = await import('./image-generator');
    const { generateFunnelPlacements, insertFunnelElements } = await import('./ai-funnel-placement');
    
    // Fetch strategy
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
    
    const totalArticles = strategy.totalPillars + strategy.totalClusters;
    let completedCount = 0;
    
    // Update strategy status
    await prisma.contentStrategy.update({
      where: { id: strategyId },
      data: { status: 'GENERATING' },
    });
    
    // Generate pillar articles
    for (const pillar of strategy.pillars) {
      await updateJob(jobId, {
        progress: Math.round((completedCount / totalArticles) * 100),
        currentStep: `Generating pillar: ${pillar.title}`,
      });
      
      try {
        // Generate article with grounding
        const article = await generateArticleWithCompliance(
          pillar.title,
          pillar.targetKeyword,
          pillar.wordCount || 3000,
          {
            location: 'Perth, Western Australia',
            targetAudience: strategy.targetAudience || 'Perth homeowners',
          }
        );
        
        // Generate images
        const images = await generateAndUploadArticleImages(
          pillar.id,
          pillar.title,
          pillar.title,
          pillar.heroImagePrompt || undefined,
          pillar.infographicPrompt || undefined
        );
        
        // Generate funnel placements
        const funnelPlacements = await generateFunnelPlacements(
          pillar.title,
          pillar.targetKeyword,
          (pillar.intent as any) || 'COMMERCIAL',
          'PILLAR',
          strategy.targetAudience || 'Perth homeowners'
        );
        
        const contentWithFunnels = insertFunnelElements(article.content, funnelPlacements);
        
        // Create blog post
        const blogPost = await prisma.blogPost.create({
          data: {
            title: pillar.title,
            slug: pillar.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            content: contentWithFunnels,
            excerpt: article.content.substring(0, 200) + '...',
            metaTitle: pillar.title,
            metaDescription: article.content.substring(0, 160),
            keywords: [pillar.targetKeyword],
            status: 'DRAFT',
            author: 'Sun Direct Power',
            featuredImage: images.heroImageUrl,
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
            heroImageUrl: images.heroImageUrl,
            infographicUrl: images.infographicUrl,
          },
        });
        
        completedCount++;
        
        // Generate clusters
        for (const cluster of pillar.clusters) {
          await updateJob(jobId, {
            progress: Math.round((completedCount / totalArticles) * 100),
            currentStep: `Generating cluster: ${cluster.title}`,
          });
          
          const clusterArticle = await generateArticleWithCompliance(
            cluster.title,
            cluster.targetKeyword,
            cluster.wordCount || 1500,
            {
              location: 'Perth, Western Australia',
              targetAudience: strategy.targetAudience || 'Perth homeowners',
            }
          );
          
          const clusterImages = await generateAndUploadArticleImages(
            cluster.id,
            cluster.title,
            cluster.title,
            cluster.heroImagePrompt || undefined,
            cluster.infographicPrompt || undefined
          );
          
          const clusterBlogPost = await prisma.blogPost.create({
            data: {
              title: cluster.title,
              slug: cluster.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
              content: clusterArticle.content,
              excerpt: clusterArticle.content.substring(0, 200) + '...',
              metaTitle: cluster.title,
              metaDescription: clusterArticle.content.substring(0, 160),
              keywords: [cluster.targetKeyword],
              status: 'DRAFT',
              author: 'Sun Direct Power',
              featuredImage: clusterImages.heroImageUrl,
            },
          });
          
          await prisma.cluster.update({
            where: { id: cluster.id },
            data: {
              blogPostId: clusterBlogPost.id,
              status: 'GENERATED',
              seoScore: clusterArticle.eeatScore,
              wordCount: clusterArticle.metadata.wordCount,
              heroImageUrl: clusterImages.heroImageUrl,
              infographicUrl: clusterImages.infographicUrl,
            },
          });
          
          completedCount++;
        }
      } catch (error: any) {
        console.error(`Error generating ${pillar.title}:`, error);
        // Continue with next article
      }
    }
    
    // Update strategy
    await prisma.contentStrategy.update({
      where: { id: strategyId },
      data: {
        status: 'COMPLETED',
        generatedArticles: completedCount,
      },
    });
    
    // Mark job as complete
    await updateJob(jobId, {
      status: 'COMPLETED',
      progress: 100,
      currentStep: 'All articles generated successfully!',
      completedAt: new Date(),
      result: {
        totalArticles,
        completedCount,
        strategyId,
      },
    });
  } catch (error: any) {
    console.error('Job execution error:', error);
    await updateJob(jobId, {
      status: 'FAILED',
      error: error.message || 'Unknown error',
      completedAt: new Date(),
    });
  }
}

/**
 * Start a background job
 */
export async function startBackgroundJob(
  type: string,
  handler: (jobId: string, ...args: any[]) => Promise<void>,
  ...args: any[]
): Promise<string> {
  const jobId = await createJob(type);
  
  // Execute in background (don't await)
  handler(jobId, ...args).catch(error => {
    console.error(`Background job ${jobId} failed:`, error);
  });
  
  return jobId;
}
