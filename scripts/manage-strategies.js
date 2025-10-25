/**
 * Manage Content Strategies
 * 
 * Interactive script to view and delete strategies
 */

const { PrismaClient } = require('@prisma/client');
const readline = require('readline');
const prisma = new PrismaClient();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function listStrategies() {
  const strategies = await prisma.contentStrategy.findMany({
    include: {
      _count: {
        select: {
          pillars: true,
        },
      },
      pillars: {
        include: {
          _count: {
            select: {
              clusters: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
  
  if (strategies.length === 0) {
    console.log('\n✅ No strategies found. Database is clean!\n');
    return [];
  }
  
  console.log('\n📋 Content Strategies:\n');
  console.log('═══════════════════════════════════════════════════════════════');
  
  strategies.forEach((strategy, index) => {
    const totalClusters = strategy.pillars.reduce((sum, p) => sum + p._count.clusters, 0);
    const totalArticles = strategy._count.pillars + totalClusters;
    
    console.log(`${index + 1}. ${strategy.mainTopic}`);
    console.log(`   ID: ${strategy.id}`);
    console.log(`   Status: ${strategy.status}`);
    console.log(`   Articles: ${totalArticles} (${strategy._count.pillars} pillars + ${totalClusters} clusters)`);
    console.log(`   Created: ${strategy.createdAt.toLocaleDateString()} ${strategy.createdAt.toLocaleTimeString()}`);
    console.log('───────────────────────────────────────────────────────────────');
  });
  
  return strategies;
}

async function deleteStrategy(strategyId) {
  const strategy = await prisma.contentStrategy.findUnique({
    where: { id: strategyId },
    include: {
      pillars: {
        include: {
          blogPost: true,
          clusters: {
            include: {
              blogPost: true,
            },
          },
        },
      },
    },
  });
  
  if (!strategy) {
    console.log('❌ Strategy not found!');
    return;
  }
  
  let deletedBlogPosts = 0;
  let deletedPillars = 0;
  let deletedClusters = 0;
  
  // Delete blog posts
  for (const pillar of strategy.pillars) {
    if (pillar.blogPostId) {
      await prisma.blogPost.delete({
        where: { id: pillar.blogPostId },
      });
      deletedBlogPosts++;
    }
    
    for (const cluster of pillar.clusters) {
      if (cluster.blogPostId) {
        await prisma.blogPost.delete({
          where: { id: cluster.blogPostId },
        });
        deletedBlogPosts++;
      }
      deletedClusters++;
    }
    
    deletedPillars++;
  }
  
  // Delete strategy
  await prisma.contentStrategy.delete({
    where: { id: strategyId },
  });
  
  console.log(`\n✅ Deleted: ${strategy.mainTopic}`);
  console.log(`   - Blog posts: ${deletedBlogPosts}`);
  console.log(`   - Pillars: ${deletedPillars}`);
  console.log(`   - Clusters: ${deletedClusters}\n`);
}

async function deleteAllStrategies(strategies) {
  console.log('\n⚠️  WARNING: This will delete ALL strategies and articles!');
  const confirm = await question('Type "DELETE ALL" to confirm: ');
  
  if (confirm !== 'DELETE ALL') {
    console.log('❌ Cancelled');
    return;
  }
  
  console.log('\n🗑️  Deleting all strategies...\n');
  
  for (const strategy of strategies) {
    await deleteStrategy(strategy.id);
  }
  
  console.log('✅ All strategies deleted!\n');
}

async function main() {
  console.log('\n🎯 Content Strategy Manager\n');
  
  const strategies = await listStrategies();
  
  if (strategies.length === 0) {
    rl.close();
    await prisma.$disconnect();
    return;
  }
  
  console.log('\nOptions:');
  console.log('  [1-N] - Delete specific strategy');
  console.log('  [ALL] - Delete all strategies');
  console.log('  [Q]   - Quit\n');
  
  const answer = await question('Your choice: ');
  
  if (answer.toUpperCase() === 'Q') {
    console.log('👋 Goodbye!');
  } else if (answer.toUpperCase() === 'ALL') {
    await deleteAllStrategies(strategies);
  } else {
    const index = parseInt(answer) - 1;
    if (index >= 0 && index < strategies.length) {
      const strategy = strategies[index];
      console.log(`\n⚠️  Delete: ${strategy.mainTopic}?`);
      const confirm = await question('Type "DELETE" to confirm: ');
      
      if (confirm === 'DELETE') {
        await deleteStrategy(strategy.id);
      } else {
        console.log('❌ Cancelled');
      }
    } else {
      console.log('❌ Invalid choice');
    }
  }
  
  rl.close();
  await prisma.$disconnect();
}

main()
  .then(() => {
    console.log('✨ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
