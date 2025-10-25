/**
 * Check if there are jobs assigned to Team Bravo
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Checking Team Bravo and its jobs...\n');

  // Find Team Bravo
  const teamBravo = await prisma.team.findFirst({
    where: { name: 'Team Bravo' },
    include: {
      members: {
        include: {
          electrician: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      },
    },
  });

  if (!teamBravo) {
    console.log('❌ Team Bravo not found!');
    return;
  }

  console.log(`✅ Team Bravo found:`);
  console.log(`   ID: ${teamBravo.id}`);
  console.log(`   Name: ${teamBravo.name}`);
  console.log(`   Members: ${teamBravo.members.length}\n`);

  console.log('👥 Team Members:');
  for (const member of teamBravo.members) {
    console.log(`   - ${member.name} (${member.role})`);
    if (member.electrician) {
      console.log(`     Electrician: ${member.electrician.firstName} ${member.electrician.lastName}`);
      console.log(`     Electrician ID: ${member.electrician.id}`);
    }
  }

  // Check jobs assigned to Team Bravo
  const jobs = await prisma.installationJob.findMany({
    where: {
      teamId: teamBravo.id,
    },
    include: {
      lead: {
        select: {
          name: true,
          address: true,
        },
      },
    },
  });

  console.log(`\n📋 Jobs assigned to Team Bravo: ${jobs.length}`);
  
  if (jobs.length === 0) {
    console.log('\n⚠️  No jobs assigned to Team Bravo!');
    console.log('   You need to assign a job to Team Bravo from the admin portal.\n');
  } else {
    console.log('');
    for (const job of jobs) {
      console.log(`   Job ${job.jobNumber}:`);
      console.log(`     Customer: ${job.lead.name}`);
      console.log(`     Address: ${job.lead.address}`);
      console.log(`     Status: ${job.status}`);
      console.log(`     Scheduled: ${job.scheduledDate || 'Not scheduled'}`);
      console.log('');
    }
  }
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
