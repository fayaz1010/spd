import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const applications = await prisma.regulatoryApplication.findMany({
      include: {
        lead: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const formattedApps = applications.map(app => ({
      id: app.id,
      leadId: app.leadId,
      leadName: app.lead.name,
      address: app.lead.address,
      synergyStatus: app.synergyStatus,
      westernPowerStatus: app.westernPowerStatus,
      synergySubmittedAt: app.synergySubmittedAt,
      westernPowerSubmittedAt: app.westernPowerSubmittedAt,
    }));

    return NextResponse.json({ applications: formattedApps });
  } catch (error) {
    console.error('Error fetching regulatory applications:', error);
    return NextResponse.json({ applications: [] }, { status: 500 });
  }
}
