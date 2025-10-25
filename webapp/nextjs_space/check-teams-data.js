const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkTeamsData() {
  try {
    console.log('\n🔍 CHECKING EXISTING TEAMS & SUBCONTRACTORS DATA\n');
    
    // Check Teams
    const teams = await prisma.team.findMany({
      include: {
        members: {
          select: {
            name: true,
            role: true,
            hourlyRate: true,
            trueCostPerHour: true,
            averageInstallSpeed: true,
          }
        }
      }
    });
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 INTERNAL TEAMS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Found ${teams.length} teams\n`);
    
    teams.forEach(team => {
      console.log(`Team: ${team.name}`);
      console.log(`  ID: ${team.id}`);
      console.log(`  Type: ${team.teamType}`);
      console.log(`  Active: ${team.isActive}`);
      console.log(`  Max Concurrent Jobs: ${team.maxConcurrentJobs}`);
      console.log(`  Specialization: ${team.specialization.join(', ') || 'None'}`);
      console.log(`  Members: ${team.members.length}`);
      
      if (team.members.length > 0) {
        team.members.forEach(member => {
          console.log(`    - ${member.name} (${member.role})`);
          console.log(`      Hourly Rate: $${member.hourlyRate || 'N/A'}`);
          console.log(`      True Cost: $${member.trueCostPerHour || 'N/A'}/hr`);
          console.log(`      Install Speed: ${member.averageInstallSpeed || 'NOT SET'} hrs/kW`);
        });
      }
      console.log('');
    });
    
    // Check Subcontractors
    const subbies = await prisma.subcontractor.findMany();
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔧 SUBCONTRACTORS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Found ${subbies.length} subcontractors\n`);
    
    subbies.forEach(sub => {
      console.log(`Subbie: ${sub.companyName}`);
      console.log(`  ID: ${sub.id}`);
      console.log(`  Contact: ${sub.contactName}`);
      console.log(`  Active: ${sub.isActive}`);
      console.log(`  Rates:`);
      console.log(`    Per Watt: $${sub.perWattRate || 'NOT SET'}/watt`);
      console.log(`    Battery Base: $${sub.batteryBaseRate || 'NOT SET'}`);
      console.log(`    Battery Per kWh: $${sub.batteryPerKwhRate || 'NOT SET'}/kWh`);
      console.log(`    Hourly: $${sub.hourlyRate || 'NOT SET'}/hr`);
      console.log(`    Day Rate: $${sub.dayRate || 'NOT SET'}/day`);
      console.log('');
    });
    
    // Summary
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 SUMMARY');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Total Teams: ${teams.length}`);
    console.log(`Total Team Members: ${teams.reduce((sum, t) => sum + t.members.length, 0)}`);
    console.log(`Total Subcontractors: ${subbies.length}`);
    console.log('');
    
    // Check what's missing
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('⚠️  MISSING DATA');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const missingSpeed = teams.flatMap(t => 
      t.members.filter(m => !m.averageInstallSpeed).map(m => `${t.name} - ${m.name}`)
    );
    
    if (missingSpeed.length > 0) {
      console.log('\n❌ Team members missing install speed:');
      missingSpeed.forEach(m => console.log(`   - ${m}`));
    }
    
    const missingRates = teams.flatMap(t => 
      t.members.filter(m => !m.hourlyRate || !m.trueCostPerHour).map(m => `${t.name} - ${m.name}`)
    );
    
    if (missingRates.length > 0) {
      console.log('\n❌ Team members missing hourly rates:');
      missingRates.forEach(m => console.log(`   - ${m}`));
    }
    
    const subbiesMissingRates = subbies.filter(s => !s.perWattRate);
    if (subbiesMissingRates.length > 0) {
      console.log('\n❌ Subcontractors missing per-watt rate:');
      subbiesMissingRates.forEach(s => console.log(`   - ${s.companyName}`));
    }
    
    console.log('');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTeamsData();
