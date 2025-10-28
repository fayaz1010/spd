import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.sundirectpower.com.au';
    const currentDate = new Date().toISOString();

    // Define all public pages
    const pages = [
      { url: '/', priority: '1.0', changefreq: 'daily' },
      { url: '/about', priority: '0.9', changefreq: 'weekly' },
      { url: '/contact', priority: '0.9', changefreq: 'monthly' },
      { url: '/calculator-v2', priority: '1.0', changefreq: 'weekly' },
      { url: '/extra-services', priority: '0.8', changefreq: 'weekly' },
      { url: '/shop', priority: '0.8', changefreq: 'daily' },
      { url: '/gallery', priority: '0.7', changefreq: 'weekly' },
      { url: '/blog', priority: '0.8', changefreq: 'daily' },
      { url: '/careers', priority: '0.6', changefreq: 'monthly' },
      { url: '/privacy-policy', priority: '0.3', changefreq: 'yearly' },
      { url: '/terms-conditions', priority: '0.3', changefreq: 'yearly' },
      { url: '/cookie-policy', priority: '0.3', changefreq: 'yearly' },
      { url: '/sitemap-page', priority: '0.5', changefreq: 'monthly' },
    ];

    // Generate XML sitemap
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map(page => `  <url>
    <loc>${baseUrl}${page.url}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

    // Write to public directory
    const publicDir = path.join(process.cwd(), 'public');
    const sitemapPath = path.join(publicDir, 'sitemap.xml');
    
    fs.writeFileSync(sitemapPath, xml, 'utf-8');

    return NextResponse.json({
      success: true,
      message: 'Sitemap generated successfully',
      path: '/sitemap.xml',
    });
  } catch (error: any) {
    console.error('Error generating sitemap:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
