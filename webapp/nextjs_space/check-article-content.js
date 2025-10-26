const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkContent() {
  try {
    const post = await prisma.blogPost.findFirst({
      where: {
        title: {
          contains: 'Your Top 10 Questions'
        }
      }
    });

    if (post) {
      console.log('\n📄 Article Title:', post.title);
      console.log('\n📝 Content Preview (first 500 chars):\n');
      console.log(post.content.substring(0, 500));
      console.log('\n...\n');
      
      // Check for markdown artifacts
      const hasHashHeaders = post.content.includes('##');
      const hasBoldMarkdown = post.content.includes('**');
      const hasH2Tags = post.content.includes('<h2>');
      const hasH3Tags = post.content.includes('<h3>');
      const hasParagraphSpacing = post.content.includes('</p>\n\n');
      
      console.log('🔍 Format Check:');
      console.log(`   Has ## headers: ${hasHashHeaders ? '❌ YES (bad)' : '✅ NO (good)'}`);
      console.log(`   Has **bold**: ${hasBoldMarkdown ? '❌ YES (bad)' : '✅ NO (good)'}`);
      console.log(`   Has <h2> tags: ${hasH2Tags ? '✅ YES (good)' : '❌ NO (bad)'}`);
      console.log(`   Has <h3> tags: ${hasH3Tags ? '✅ YES (good)' : '❌ NO (bad)'}`);
      console.log(`   Has paragraph spacing: ${hasParagraphSpacing ? '✅ YES (good)' : '❌ NO (bad)'}`);
    } else {
      console.log('❌ Article not found');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkContent();
