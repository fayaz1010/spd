import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('👥 Listing All Team Members...\n');

  const teams = await prisma.team.findMany({
    include: {
      members: {
        orderBy: { name: 'asc' },
      },
    },
    orderBy: { name: 'asc' },
  });

  console.log(`Found ${teams.length} teams\n`);
  console.log('═══════════════════════════════════════════════════════════════════════════════');

  for (const team of teams) {
    console.log(`\n🏢 ${team.name} (${team.isActive ? 'Active' : 'Inactive'})`);
    console.log(`   ID: ${team.id}`);
    console.log(`   Description: ${team.description || 'N/A'}`);
    console.log(`   Members: ${team.members.length}`);
    
    if (team.members.length > 0) {
      console.log('\n   Team Members:');
      console.log('   ─────────────────────────────────────────────────────────────────────────────');
      
      let teamTotalRate = 0;
      
      for (const member of team.members) {
        console.log(`\n   👤 ${member.name} (${member.role})`);
        console.log(`      ID: ${member.id}`);
        console.log(`      Email: ${member.email}`);
        console.log(`      Phone: ${member.phone}`);
        console.log(`      Status: ${member.isActive ? 'Active' : 'Inactive'}`);
        console.log(`      Hourly Rate: $${member.hourlyRate || 0}/hr`);
        console.log(`      Cost Multiplier: ${member.costMultiplier || 0}x`);
        console.log(`      True Cost/Hour: $${member.trueCostPerHour || 0}/hr`);
        
        if (member.trueCostPerHour) {
          teamTotalRate += member.trueCostPerHour;
        }
        
        // Additional employment details if available
        if (member.employeeNumber) {
          console.log(`      Employee #: ${member.employeeNumber}`);
        }
        if (member.employmentType) {
          console.log(`      Employment: ${member.employmentType}`);
        }
        if (member.baseSalary) {
          console.log(`      Base Salary: $${member.baseSalary}/year`);
        }
        
        // Performance metrics if available
        if (member.totalInstallations > 0) {
          console.log(`      Total Installations: ${member.totalInstallations}`);
          console.log(`      Total Hours: ${member.totalInstallHours}`);
          console.log(`      Total kW Installed: ${member.totalSystemsKw}`);
          if (member.averageInstallSpeed) {
            console.log(`      Avg Speed: ${member.averageInstallSpeed} hrs/kW`);
          }
        }
      }
      
      console.log(`\n   💰 Team Total Rate: $${teamTotalRate.toFixed(2)}/hr (all members combined)`);
    } else {
      console.log('   No members in this team');
    }
    
    console.log('   ─────────────────────────────────────────────────────────────────────────────');
  }

  console.log('\n═══════════════════════════════════════════════════════════════════════════════');
  
  // Summary
  const totalMembers = teams.reduce((sum, team) => sum + team.members.length, 0);
  const activeMembers = teams.reduce((sum, team) => 
    sum + team.members.filter(m => m.isActive).length, 0
  );
  
  console.log('\n📊 SUMMARY:');
  console.log(`   Total Teams: ${teams.length}`);
  console.log(`   Total Members: ${totalMembers}`);
  console.log(`   Active Members: ${activeMembers}`);
  console.log(`   Inactive Members: ${totalMembers - activeMembers}`);
  
  // Calculate average rates
  const allMembers = teams.flatMap(t => t.members);
  const avgHourlyRate = allMembers.reduce((sum, m) => sum + (m.hourlyRate || 0), 0) / allMembers.length;
  const avgTrueCost = allMembers.reduce((sum, m) => sum + (m.trueCostPerHour || 0), 0) / allMembers.length;
  
  console.log(`\n   Average Hourly Rate: $${avgHourlyRate.toFixed(2)}/hr`);
  console.log(`   Average True Cost: $${avgTrueCost.toFixed(2)}/hr`);
  console.log(`   Average Cost Multiplier: ${(avgTrueCost / avgHourlyRate).toFixed(2)}x`);
  
  console.log('\n');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
