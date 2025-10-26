const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkArticle() {
  try {
    const post = await prisma.blogPost.findFirst({
      where: {
        title: 'Your Top 10 Questions About Solar Power in Perth Answered'
      }
    });

    if (post) {
      console.log('\n📄 Article ID:', post.id);
      console.log('📄 Title:', post.title);
      console.log('\n📝 First 800 characters of content:\n');
      console.log(post.content.substring(0, 800));
      console.log('\n...\n');
      
      // Check for issues
      const issues = [];
      if (post.content.includes('##')) issues.push('❌ Has ## markdown headers');
      if (post.content.includes('**')) issues.push('❌ Has ** bold markdown');
      if (!post.content.includes('<h2>')) issues.push('❌ Missing <h2> tags');
      if (!post.content.includes('</p>\n\n')) issues.push('❌ Missing paragraph spacing');
      
      if (issues.length > 0) {
        console.log('🔴 Issues found:');
        issues.forEach(issue => console.log('   ' + issue));
      } else {
        console.log('✅ Content is properly formatted!');
      }
    } else {
      console.log('❌ Article not found');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkArticle();
