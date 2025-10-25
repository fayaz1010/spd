/**
 * Setup John Smith as an Electrician with Installer Portal Access
 * 
 * This script:
 * 1. Creates/updates John Smith as an Electrician
 * 2. Links him to Team Bravo
 * 3. Enables portal access with password
 * 4. Creates TeamMember record if needed
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🔧 Setting up John Smith as Installer...\n');

  // Password for installer portal
  const password = 'Installer2025!';
  const hashedPassword = await bcrypt.hash(password, 10);

  // 1. Create/Update Electrician record
  const electrician = await prisma.electrician.upsert({
    where: { email: 'john.smith@sundirectpower.com.au' },
    update: {
      portalAccess: true,
      portalPassword: hashedPassword,
      status: 'ACTIVE',
    },
    create: {
      id: 'elec_john_smith',
      type: 'IN_HOUSE',
      status: 'ACTIVE',
      firstName: 'John',
      lastName: 'Smith',
      email: 'john.smith@sundirectpower.com.au',
      phone: '+61 412 345 678',
      mobile: '+61 412 345 678',
      
      // Electrical License
      electricalLicense: 'EC License',
      licenseNumber: 'EC12351',
      licenseState: 'WA',
      licenseExpiry: new Date('2026-12-31'),
      licenseVerified: true,
      licenseVerifiedAt: new Date(),
      
      // CEC Accreditation
      cecNumber: 'A123456',
      cecAccreditationType: 'Installer',
      cecExpiry: new Date('2026-12-31'),
      cecVerified: true,
      cecVerifiedAt: new Date(),
      
      // Portal Access
      portalAccess: true,
      portalPassword: hashedPassword,
      
      // Performance
      totalJobsCompleted: 45,
      averageRating: 4.8,
      onTimePercentage: 95.0,
      
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  console.log(`✅ Electrician created: ${electrician.firstName} ${electrician.lastName}`);
  console.log(`   Email: ${electrician.email}`);
  console.log(`   License: ${electrician.licenseNumber}`);
  console.log(`   CEC: ${electrician.cecNumber}`);
  console.log(`   Portal Access: ${electrician.portalAccess ? 'ENABLED' : 'DISABLED'}\n`);

  // 2. Find Team Bravo
  const teamBravo = await prisma.team.findFirst({
    where: { name: 'Team Bravo' },
  });

  if (!teamBravo) {
    console.log('⚠️  Team Bravo not found. Creating it...');
    const newTeam = await prisma.team.create({
      data: {
        id: 'team_bravo',
        name: 'Team Bravo',
        description: 'Secondary installation team',
        color: '#10b981',
        isActive: true,
        maxConcurrentJobs: 3,
        specialization: ['solar', 'battery'],
        teamType: 'internal',
        serviceSuburbs: ['Perth Metro', 'South Perth', 'Fremantle'],
        solarInstallSpeed: 3.75,
        batteryInstallSpeed: 3.0,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
    console.log(`✅ Team Bravo created\n`);
  }

  // 3. Check if TeamMember already exists by email
  const existingTeamMember = await prisma.teamMember.findUnique({
    where: { email: 'john.smith@sundirectpower.com.au' },
  });

  let teamMember;
  
  if (existingTeamMember) {
    // Update existing team member
    teamMember = await prisma.teamMember.update({
      where: { id: existingTeamMember.id },
      data: {
        teamId: teamBravo?.id || 'team_bravo',
        electricianId: electrician.id,
        isActive: true,
        role: 'Lead Installer',
        hourlyRate: 58.0,
        costMultiplier: 1.45,
        trueCostPerHour: 84.10,
        electricalLicenseNumber: electrician.licenseNumber,
        electricalLicenseState: electrician.licenseState,
        electricalLicenseExpiry: electrician.licenseExpiry,
        cecAccreditationNumber: electrician.cecNumber,
        cecAccreditationType: electrician.cecAccreditationType,
        cecAccreditationExpiry: electrician.cecExpiry,
        updatedAt: new Date(),
      },
    });
  } else {
    // Create new team member
    teamMember = await prisma.teamMember.create({
      data: {
      id: 'tm_john_smith',
      teamId: teamBravo?.id || 'team_bravo',
      name: 'John Smith',
      email: 'john.smith@sundirectpower.com.au',
      phone: '+61 412 345 678',
      role: 'Lead Installer',
      electricianId: electrician.id,
      isActive: true,
      hourlyRate: 58.0,
      costMultiplier: 1.45,
      trueCostPerHour: 84.10,
      
      // License info
      electricalLicenseNumber: electrician.licenseNumber,
      electricalLicenseState: electrician.licenseState,
      electricalLicenseExpiry: electrician.licenseExpiry,
      cecAccreditationNumber: electrician.cecNumber,
      cecAccreditationType: electrician.cecAccreditationType,
      cecAccreditationExpiry: electrician.cecExpiry,
      
      createdAt: new Date(),
      updatedAt: new Date(),
      },
    });
  }

  console.log(`✅ Team Member ${existingTeamMember ? 'updated' : 'created'}: ${teamMember.name}`);
  console.log(`   Team: Team Bravo`);
  console.log(`   Role: ${teamMember.role}`);
  console.log(`   Hourly Rate: $${teamMember.hourlyRate}/hr\n`);

  console.log('═══════════════════════════════════════════════════════');
  console.log('✅ SETUP COMPLETE!');
  console.log('═══════════════════════════════════════════════════════');
  console.log('\n🔐 INSTALLER PORTAL LOGIN:');
  console.log('   URL: http://localhost:5123/installer');
  console.log(`   Email: ${electrician.email}`);
  console.log(`   Password: ${password}`);
  console.log('═══════════════════════════════════════════════════════\n');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
