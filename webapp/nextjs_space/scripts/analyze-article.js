/**
 * Analyze a specific article to diagnose issues
 * Usage: node scripts/analyze-article.js "Article Title"
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function analyzeArticle(titleQuery) {
  try {
    console.log(`\n🔍 Searching for article: "${titleQuery}"\n`);

    // Find the article
    const article = await prisma.blogPost.findFirst({
      where: {
        title: {
          contains: titleQuery,
          mode: 'insensitive',
        },
      },
    });

    if (!article) {
      console.log('❌ Article not found');
      return;
    }

    console.log('✅ Article found!\n');
    console.log('📊 ARTICLE DETAILS:');
    console.log('─'.repeat(80));
    console.log(`Title: ${article.title}`);
    console.log(`Status: ${article.status}`);
    console.log(`Created: ${article.createdAt}`);
    console.log(`Updated: ${article.updatedAt}`);
    console.log(`Last Scanned: ${article.lastScannedAt || 'Never'}`);
    console.log('─'.repeat(80));

    console.log('\n📈 QUALITY METRICS:');
    console.log('─'.repeat(80));
    console.log(`Quality Score: ${article.qualityScore || 'Not scanned'}%`);
    console.log(`SEO Score: ${article.seoScore || 'Not scanned'}%`);
    console.log(`SEO Grade: ${article.seoGrade || 'Not graded'}`);
    console.log(`Keyword Density: ${article.keywordDensity || 'Not calculated'}%`);
    console.log('─'.repeat(80));

    console.log('\n📝 CONTENT ANALYSIS:');
    console.log('─'.repeat(80));
    const contentLength = article.content.length;
    const wordCount = article.content.split(/\s+/).length;
    const hasImages = article.content.includes('<img') || article.content.includes('![');
    const hasTables = article.content.includes('<table');
    const hasCTAs = article.content.includes('Discover Your Solar Potential') || 
                    article.content.includes('Calculate My Savings');
    const hasSchema = article.content.includes('application/ld+json');
    
    console.log(`Content Length: ${contentLength} characters`);
    console.log(`Word Count: ${wordCount} words`);
    console.log(`Reading Time: ${article.readingTime || Math.ceil(wordCount / 200)} minutes`);
    console.log(`Has Images: ${hasImages ? '✅' : '❌'}`);
    console.log(`Has Tables: ${hasTables ? '✅' : '❌'}`);
    console.log(`Has CTAs: ${hasCTAs ? '✅' : '❌'}`);
    console.log(`Has Schema: ${hasSchema ? '✅' : '❌'}`);
    console.log('─'.repeat(80));

    console.log('\n🔍 CONTENT STRUCTURE:');
    console.log('─'.repeat(80));
    const headings = article.content.match(/<h[1-6][^>]*>.*?<\/h[1-6]>/gi) || [];
    const paragraphs = article.content.match(/<p[^>]*>.*?<\/p>/gi) || [];
    const lists = article.content.match(/<ul[^>]*>.*?<\/ul>/gi) || [];
    
    console.log(`Headings: ${headings.length}`);
    console.log(`Paragraphs: ${paragraphs.length}`);
    console.log(`Lists: ${lists.length}`);
    
    if (headings.length > 0) {
      console.log('\nHeadings found:');
      headings.slice(0, 10).forEach((h, i) => {
        const text = h.replace(/<[^>]*>/g, '').substring(0, 60);
        console.log(`  ${i + 1}. ${text}${text.length === 60 ? '...' : ''}`);
      });
      if (headings.length > 10) {
        console.log(`  ... and ${headings.length - 10} more`);
      }
    }
    console.log('─'.repeat(80));

    console.log('\n⚠️ POTENTIAL ISSUES:');
    console.log('─'.repeat(80));
    
    const issues = [];
    
    // Check for abrupt cutoff
    const lastChars = article.content.slice(-200);
    const hasProperEnding = lastChars.includes('</p>') || 
                           lastChars.includes('</div>') || 
                           lastChars.includes('</section>');
    if (!hasProperEnding) {
      issues.push('❌ Content may be cut off abruptly (no proper closing tags)');
    }
    
    // Check content length
    if (contentLength < 1000) {
      issues.push(`❌ Content very short (${contentLength} chars)`);
    } else if (contentLength < 3000) {
      issues.push(`⚠️ Content somewhat short (${contentLength} chars)`);
    }
    
    // Check quality score
    if (article.qualityScore !== null && article.qualityScore < 50) {
      issues.push(`❌ Very low quality score (${article.qualityScore}%)`);
    }
    
    // Check for incomplete HTML
    const openTags = (article.content.match(/<(?!\/)[^>]+>/g) || []).length;
    const closeTags = (article.content.match(/<\/[^>]+>/g) || []).length;
    if (Math.abs(openTags - closeTags) > 5) {
      issues.push(`⚠️ Possible unclosed HTML tags (${openTags} open, ${closeTags} close)`);
    }
    
    if (issues.length === 0) {
      console.log('✅ No obvious issues detected');
    } else {
      issues.forEach(issue => console.log(issue));
    }
    console.log('─'.repeat(80));

    console.log('\n📋 QUALITY ISSUES (from scan):');
    console.log('─'.repeat(80));
    if (article.qualityIssues && Array.isArray(article.qualityIssues)) {
      if (article.qualityIssues.length === 0) {
        console.log('✅ No quality issues found');
      } else {
        article.qualityIssues.forEach((issue, i) => {
          console.log(`${i + 1}. [${issue.severity}] ${issue.type}`);
          console.log(`   ${issue.description}`);
        });
      }
    } else {
      console.log('⚠️ No quality scan data available');
    }
    console.log('─'.repeat(80));

    console.log('\n📋 SEO ISSUES (from scan):');
    console.log('─'.repeat(80));
    if (article.seoIssues && Array.isArray(article.seoIssues)) {
      if (article.seoIssues.length === 0) {
        console.log('✅ No SEO issues found');
      } else {
        article.seoIssues.forEach((issue, i) => {
          console.log(`${i + 1}. ${issue}`);
        });
      }
    } else {
      console.log('⚠️ No SEO scan data available');
    }
    console.log('─'.repeat(80));

    console.log('\n🔚 CONTENT ENDING (last 500 chars):');
    console.log('─'.repeat(80));
    console.log(article.content.slice(-500));
    console.log('─'.repeat(80));

    console.log('\n✅ Analysis complete!\n');

  } catch (error) {
    console.error('Error analyzing article:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Get title from command line
const titleQuery = process.argv[2] || 'Perth Solar Battery Installation';

analyzeArticle(titleQuery);
