const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixFormatting() {
  const { marked } = await import('marked');
  
  // Configure marked for better HTML output
  marked.setOptions({
    gfm: true,
    breaks: false, // Don't convert single line breaks to <br>
    headerIds: false,
    mangle: false,
  });

  try {
    console.log('🔧 Fixing article formatting...\n');

    const posts = await prisma.blogPost.findMany();
    
    let fixed = 0;

    for (const post of posts) {
      console.log(`📝 Processing: ${post.title.substring(0, 60)}...`);
      
      let content = post.content;
      
      // Step 1: Convert markdown to HTML properly
      content = marked.parse(content);
      
      // Step 2: Add proper spacing between elements
      content = addProperSpacing(content);
      
      // Step 3: Clean up any remaining markdown artifacts
      content = cleanMarkdownArtifacts(content);
      
      // Update the post
      await prisma.blogPost.update({
        where: { id: post.id },
        data: { content },
      });
      
      fixed++;
    }

    console.log(`\n✅ Fixed ${fixed} articles!\n`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

function addProperSpacing(html) {
  let spaced = html;
  
  // Add spacing after headings
  spaced = spaced.replace(/<\/h1>/g, '</h1>\n\n');
  spaced = spaced.replace(/<\/h2>/g, '</h2>\n\n');
  spaced = spaced.replace(/<\/h3>/g, '</h3>\n\n');
  spaced = spaced.replace(/<\/h4>/g, '</h4>\n\n');
  
  // Add spacing between paragraphs
  spaced = spaced.replace(/<\/p>/g, '</p>\n\n');
  
  // Add spacing around lists
  spaced = spaced.replace(/<ul>/g, '\n<ul>');
  spaced = spaced.replace(/<\/ul>/g, '</ul>\n\n');
  spaced = spaced.replace(/<ol>/g, '\n<ol>');
  spaced = spaced.replace(/<\/ol>/g, '</ol>\n\n');
  
  // Add spacing around blockquotes
  spaced = spaced.replace(/<blockquote>/g, '\n<blockquote>');
  spaced = spaced.replace(/<\/blockquote>/g, '</blockquote>\n\n');
  
  // Clean up excessive spacing
  spaced = spaced.replace(/\n{3,}/g, '\n\n');
  
  return spaced.trim();
}

function cleanMarkdownArtifacts(html) {
  let cleaned = html;
  
  // Remove any remaining markdown headers
  cleaned = cleaned.replace(/^#{1,6}\s+/gm, '');
  
  // Remove markdown bold/italic that wasn't converted
  cleaned = cleaned.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  cleaned = cleaned.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  
  // Remove markdown links that weren't converted
  cleaned = cleaned.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
  
  // Remove markdown list markers that weren't converted
  cleaned = cleaned.replace(/^[-*+]\s+/gm, '');
  
  return cleaned;
}

fixFormatting();
