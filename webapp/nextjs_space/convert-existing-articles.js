const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function isMarkdown(content) {
  const markdownPatterns = [
    /^#{1,6}\s/m,
    /\*\*.*?\*\*/,
    /\*.*?\*/,
    /^\s*[-*+]\s/m,
    /^\s*\d+\.\s/m,
    /\[.*?\]\(.*?\)/,
  ];
  return markdownPatterns.some(pattern => pattern.test(content));
}

async function convertArticles() {
  // Dynamic import for ESM module
  const { marked } = await import('marked');
  
  // Configure marked
  marked.setOptions({
    gfm: true,
    breaks: true,
    headerIds: true,
    mangle: false,
  });
  try {
    console.log('🔄 Converting Markdown articles to HTML...\n');

    const posts = await prisma.blogPost.findMany();
    
    let converted = 0;
    let alreadyHTML = 0;

    for (const post of posts) {
      if (isMarkdown(post.content)) {
        console.log(`📝 Converting: ${post.title.substring(0, 60)}...`);
        
        const htmlContent = marked.parse(post.content);
        
        await prisma.blogPost.update({
          where: { id: post.id },
          data: { content: htmlContent },
        });
        
        converted++;
      } else {
        console.log(`✅ Already HTML: ${post.title.substring(0, 60)}...`);
        alreadyHTML++;
      }
    }

    console.log(`\n✅ Conversion complete!`);
    console.log(`   Converted: ${converted} articles`);
    console.log(`   Already HTML: ${alreadyHTML} articles`);
    console.log(`   Total: ${posts.length} articles\n`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

convertArticles();
