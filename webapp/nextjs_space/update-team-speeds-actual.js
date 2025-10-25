const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * ACTUAL PERFORMANCE DATA FROM SUN DIRECT POWER
 * 
 * Real-world data: 6.6kW system (15 panels) = 4 hours average
 * This means: 15 panels ÷ 4 hours = 3.75 panels/hour
 * 
 * This is MUCH FASTER than industry standard (2.0-2.5 panels/hr)
 * Your teams are performing 50-85% faster than average!
 */

async function updateTeamSpeedsActual() {
  try {
    console.log('\n🚀 UPDATING TEAM SPEEDS WITH ACTUAL PERFORMANCE DATA\n');
    console.log('Based on: 6.6kW (15 panels) = 4 hours average\n');
    
    // Calculate actual speed
    const panels = 15;
    const hours = 4;
    const actualSpeed = panels / hours;
    
    console.log(`📊 Calculated Speed: ${actualSpeed} panels/hour\n`);
    
    // Team Alpha - Residential specialists (your best team)
    await prisma.team.update({
      where: { id: 'team_alpha' },
      data: {
        solarInstallSpeed: 3.75,  // actual measured speed
        batteryInstallSpeed: 3.0, // keep battery time (3 hours is good)
      }
    });
    console.log('✅ Team Alpha: 3.75 panels/hr, 3.0 hrs/battery (Residential - Actual Data)');
    
    // Team Bravo - Commercial (slightly slower due to complexity)
    await prisma.team.update({
      where: { id: 'team_bravo' },
      data: {
        solarInstallSpeed: 3.5,   // slightly slower for commercial
        batteryInstallSpeed: 3.5, // commercial battery takes longer
      }
    });
    console.log('✅ Team Bravo: 3.5 panels/hr, 3.5 hrs/battery (Commercial)');
    
    // Team Charlie - Complex/Fast (experienced team)
    await prisma.team.update({
      where: { id: 'team_charlie' },
      data: {
        solarInstallSpeed: 4.0,   // your fastest team
        batteryInstallSpeed: 2.5, // very efficient with batteries
      }
    });
    console.log('✅ Team Charlie: 4.0 panels/hr, 2.5 hrs/battery (Fast/Complex)');
    
    // Team Beta - Standard/New team
    await prisma.team.update({
      where: { id: 'team_beta' },
      data: {
        solarInstallSpeed: 3.0,   // slower, still learning
        batteryInstallSpeed: 4.0, // takes longer with batteries
      }
    });
    console.log('✅ Team Beta: 3.0 panels/hr, 4.0 hrs/battery (Standard/Training)');
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 INSTALLATION TIME EXAMPLES');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // Calculate examples for common system sizes
    const systems = [
      { size: '6.6kW', panels: 15 },
      { size: '10kW', panels: 23 },
      { size: '13.2kW', panels: 30 },
    ];
    
    const teams = await prisma.team.findMany({
      where: { id: { in: ['team_alpha', 'team_bravo', 'team_charlie'] } },
      select: { id: true, name: true, solarInstallSpeed: true, batteryInstallSpeed: true }
    });
    
    systems.forEach(sys => {
      console.log(`\n${sys.size} System (${sys.panels} panels):`);
      teams.forEach(team => {
        const solarHours = sys.panels / team.solarInstallSpeed;
        const batteryHours = team.batteryInstallSpeed;
        const totalWithBattery = solarHours + batteryHours;
        
        console.log(`  ${team.name}:`);
        console.log(`    Solar only: ${solarHours.toFixed(1)} hours`);
        console.log(`    + 10kWh Battery: ${totalWithBattery.toFixed(1)} hours total`);
      });
    });
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('💰 COST COMPARISON (6.6kW + 10kWh Battery)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    // Get team member costs
    const teamsWithMembers = await prisma.team.findMany({
      where: { id: { in: ['team_alpha', 'team_bravo', 'team_charlie'] } },
      include: { members: true }
    });
    
    teamsWithMembers.forEach(team => {
      const solarHours = 15 / team.solarInstallSpeed;
      const batteryHours = team.batteryInstallSpeed;
      const totalHours = solarHours + batteryHours;
      
      const teamCostPerHour = team.members.reduce((sum, m) => 
        sum + (m.trueCostPerHour || 0), 0
      );
      
      const laborCost = totalHours * teamCostPerHour;
      const materialsCost = 800; // estimated
      const totalCost = laborCost + materialsCost;
      
      console.log(`${team.name}:`);
      console.log(`  Time: ${totalHours.toFixed(1)} hours`);
      console.log(`  Labor: ${totalHours.toFixed(1)} hrs × $${teamCostPerHour.toFixed(0)}/hr = $${laborCost.toFixed(0)}`);
      console.log(`  Materials: $${materialsCost}`);
      console.log(`  TOTAL: $${totalCost.toFixed(0)}`);
      console.log('');
    });
    
    console.log('✅ All teams updated with actual performance data!\n');
    
    // Verification
    const updatedTeams = await prisma.team.findMany({
      select: {
        name: true,
        solarInstallSpeed: true,
        batteryInstallSpeed: true,
      }
    });
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ VERIFICATION - UPDATED SPEEDS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    updatedTeams.forEach(team => {
      console.log(`${team.name}:`);
      console.log(`  Solar: ${team.solarInstallSpeed} panels/hour`);
      console.log(`  Battery: ${team.batteryInstallSpeed} hours/unit`);
      
      // Calculate 6.6kW time
      const time66 = 15 / team.solarInstallSpeed;
      console.log(`  6.6kW (15 panels): ${time66.toFixed(1)} hours`);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Error updating team speeds:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

updateTeamSpeedsActual();
