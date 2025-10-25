/**
 * Script to populate delivery and installation dates for existing jobs
 * Run with: npx tsx scripts/populate-schedule-dates.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function populateScheduleDates() {
  console.log('🔄 Starting to populate schedule dates...\n');

  try {
    // Get all jobs with scheduledDate but missing delivery/installation dates
    const jobs = await prisma.installationJob.findMany({
      where: {
        scheduledDate: { not: null },
        OR: [
          { deliveryDate: null },
          { installationDate: null },
        ],
      },
      select: {
        id: true,
        jobNumber: true,
        scheduledDate: true,
        deliveryDate: true,
        installationDate: true,
      },
    });

    console.log(`Found ${jobs.length} jobs to update\n`);

    let updated = 0;

    for (const job of jobs) {
      const updates: any = {};

      // Set installation date to scheduled date if not set
      if (!job.installationDate && job.scheduledDate) {
        updates.installationDate = job.scheduledDate;
      }

      // Set delivery date to 2 days before installation if not set
      if (!job.deliveryDate && (job.installationDate || job.scheduledDate)) {
        const installDate = job.installationDate || job.scheduledDate!;
        const deliveryDate = new Date(installDate);
        deliveryDate.setDate(deliveryDate.getDate() - 2);
        updates.deliveryDate = deliveryDate;
      }

      if (Object.keys(updates).length > 0) {
        await prisma.installationJob.update({
          where: { id: job.id },
          data: updates,
        });

        console.log(`✅ Updated ${job.jobNumber}:`);
        if (updates.deliveryDate) {
          console.log(`   Delivery: ${updates.deliveryDate.toISOString().split('T')[0]}`);
        }
        if (updates.installationDate) {
          console.log(`   Installation: ${updates.installationDate.toISOString().split('T')[0]}`);
        }
        console.log('');

        updated++;
      }
    }

    console.log(`\n✅ Successfully updated ${updated} jobs`);

    // Show summary
    const summary = await prisma.installationJob.groupBy({
      by: ['status'],
      where: {
        OR: [
          { deliveryDate: { not: null } },
          { installationDate: { not: null } },
        ],
      },
      _count: true,
    });

    console.log('\n📊 Summary by status:');
    summary.forEach((s) => {
      console.log(`   ${s.status}: ${s._count} jobs`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
populateScheduleDates()
  .then(() => {
    console.log('\n✅ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Failed:', error);
    process.exit(1);
  });
