/**
 * Image Generation with Gemini (Nano Banana)
 * 
 * Generates hero images and infographics for blog articles
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import path from 'path';

/**
 * Get Gemini API key
 */
async function getGeminiKey(): Promise<string> {
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();
  
  try {
    const settings = await prisma.apiSettings.findFirst({
      where: { active: true },
      orderBy: { createdAt: 'desc' },
    });

    if (!settings?.geminiApiKey) {
      throw new Error('No Gemini API keys configured');
    }

    const decryptKey = (encrypted: string) => {
      try {
        return Buffer.from(encrypted, 'base64').toString('utf-8');
      } catch {
        return '';
      }
    };

    const encryptedKeys = JSON.parse(settings.geminiApiKey);
    const keys = Array.isArray(encryptedKeys) 
      ? encryptedKeys.map(k => decryptKey(k)).filter(Boolean)
      : [decryptKey(settings.geminiApiKey)].filter(Boolean);

    return keys[0]; // Use first key for images
  } finally {
    await prisma.$disconnect();
  }
}

export interface GeneratedImage {
  buffer: Buffer;
  mimeType: string;
  size: number;
}

/**
 * Generate image from prompt
 */
export async function generateImage(
  prompt: string
): Promise<GeneratedImage> {
  const apiKey = await getGeminiKey();
  const genAI = new GoogleGenerativeAI(apiKey);
  
  const model = genAI.getGenerativeModel({ 
    model: 'gemini-2.5-flash-image' 
  });

  const result = await model.generateContent(prompt);
  const response = result.response;
  
  // Extract image from response
  const candidates = response.candidates;
  if (!candidates || candidates.length === 0) {
    throw new Error('No image generated');
  }
  
  const parts = candidates[0].content.parts;
  
  for (const part of parts) {
    if (part.inlineData) {
      const buffer = Buffer.from(part.inlineData.data, 'base64');
      return {
        buffer,
        mimeType: part.inlineData.mimeType || 'image/png',
        size: buffer.length,
      };
    }
  }
  
  throw new Error('No image data found in response');
}

/**
 * Generate hero image for article
 */
export async function generateHeroImage(
  articleTitle: string,
  customPrompt?: string
): Promise<GeneratedImage> {
  const prompt = customPrompt || `Professional photograph of a modern Perth home with solar panels installed on the roof. 
Australian suburban architecture with Colorbond or terracotta roof. 
Solar panels clearly visible and professionally installed.
Bright sunny day with blue sky and white clouds.
Well-maintained lawn and garden.
High quality, photorealistic, 16:9 aspect ratio.
Context: ${articleTitle}`;

  return generateImage(prompt);
}

/**
 * Generate infographic for article
 */
export async function generateInfographic(
  topic: string,
  customPrompt?: string
): Promise<GeneratedImage> {
  const prompt = customPrompt || `Clean modern infographic about ${topic}.
Blue and orange color scheme (solar energy theme).
Clear title at the top.
Simple icons and visual elements.
Data visualization with charts or diagrams.
Clear labels and text.
Professional layout.
Vertical orientation (9:16 aspect ratio).
Easy to understand and visually appealing.`;

  return generateImage(prompt);
}

/**
 * Generate both hero image and infographic
 */
export async function generateArticleImages(
  articleTitle: string,
  topic: string,
  heroPrompt?: string,
  infographicPrompt?: string
): Promise<{
  heroImage: GeneratedImage;
  infographic: GeneratedImage;
}> {
  console.log(`🎨 Generating images for: ${articleTitle}`);
  
  // Generate in parallel
  const [heroImage, infographic] = await Promise.all([
    generateHeroImage(articleTitle, heroPrompt),
    generateInfographic(topic, infographicPrompt),
  ]);
  
  console.log(`✅ Hero image: ${(heroImage.size / 1024 / 1024).toFixed(2)}MB`);
  console.log(`✅ Infographic: ${(infographic.size / 1024 / 1024).toFixed(2)}MB`);
  
  return {
    heroImage,
    infographic,
  };
}

/**
 * Save image to temporary file (for testing)
 */
export async function saveImageToFile(
  image: GeneratedImage,
  filename: string
): Promise<string> {
  const outputPath = path.join(process.cwd(), 'public', 'temp', filename);
  
  // Ensure directory exists
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  fs.writeFileSync(outputPath, image.buffer);
  
  return outputPath;
}

/**
 * Upload image to storage (placeholder - implement with Cloudflare R2, S3, etc.)
 */
export async function uploadImage(
  image: GeneratedImage,
  key: string
): Promise<string> {
  // TODO: Implement actual upload to Cloudflare R2 or S3
  // For now, save to public folder
  
  const filename = `${key}.png`;
  const outputPath = path.join(process.cwd(), 'public', 'blog-images', filename);
  
  // Ensure directory exists
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  fs.writeFileSync(outputPath, image.buffer);
  
  // Return public URL
  return `/blog-images/${filename}`;
}

/**
 * Generate and upload article images
 */
export async function generateAndUploadArticleImages(
  articleId: string,
  articleTitle: string,
  topic: string,
  heroPrompt?: string,
  infographicPrompt?: string
): Promise<{
  heroImageUrl: string;
  infographicUrl: string;
}> {
  // Generate images
  const { heroImage, infographic } = await generateArticleImages(
    articleTitle,
    topic,
    heroPrompt,
    infographicPrompt
  );
  
  // Upload images
  const [heroImageUrl, infographicUrl] = await Promise.all([
    uploadImage(heroImage, `${articleId}-hero`),
    uploadImage(infographic, `${articleId}-infographic`),
  ]);
  
  return {
    heroImageUrl,
    infographicUrl,
  };
}
