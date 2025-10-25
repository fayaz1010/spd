import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyJWT } from '@/lib/auth';

// GET /api/admin/staff/[id]/skills
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await verifyJWT(req);
    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const skills = await prisma.staffSkill.findMany({
      where: { staffId: params.id },
      orderBy: { skillCategory: 'asc' }
    });

    // Get related certifications for context
    const certifications = await prisma.staffCertification.findUnique({
      where: { staffId: params.id }
    });

    // Calculate skill summary
    const summary = {
      totalSkills: skills.length,
      byCategory: skills.reduce((acc, skill) => {
        acc[skill.skillCategory] = (acc[skill.skillCategory] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      byProficiency: skills.reduce((acc, skill) => {
        acc[skill.proficiencyLevel] = (acc[skill.proficiencyLevel] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      certifiedSkills: {
        battery: certifications?.batteryInstallCert || false,
        evCharger: certifications?.evChargerCert || false,
        solarDesign: certifications?.solarDesignCert || false
      }
    };

    return NextResponse.json({
      success: true,
      skills,
      summary,
      certifications
    });
  } catch (error) {
    console.error('Error fetching skills:', error);
    return NextResponse.json(
      { error: 'Failed to fetch skills' },
      { status: 500 }
    );
  }
}

// POST /api/admin/staff/[id]/skills
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await verifyJWT(req);
    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { skillName, skillCategory, proficiencyLevel, linkedCertification, notes } = body;

    const skill = await prisma.staffSkill.create({
      data: {
        staffId: params.id,
        skillName,
        skillCategory,
        proficiencyLevel,
        linkedCertification,
        notes,
        verifiedBy: user.userId,
        verifiedAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Skill added successfully',
      skill
    });
  } catch (error) {
    console.error('Error adding skill:', error);
    return NextResponse.json(
      { error: 'Failed to add skill' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/staff/[id]/skills
export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await verifyJWT(req);
    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { skillId, ...updateData } = body;

    const skill = await prisma.staffSkill.update({
      where: { id: skillId },
      data: {
        ...updateData,
        verifiedBy: user.userId,
        verifiedAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Skill updated successfully',
      skill
    });
  } catch (error) {
    console.error('Error updating skill:', error);
    return NextResponse.json(
      { error: 'Failed to update skill' },
      { status: 500 }
    );
  }
}
