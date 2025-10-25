import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyJWT } from '@/lib/auth';

// GET /api/admin/staff/[id]/certifications
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await verifyJWT(req);
    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const cert = await prisma.staffCertification.findUnique({
      where: { staffId: params.id },
      include: {
        staff: {
          select: {
            name: true,
            email: true,
            role: true
          }
        }
      }
    });

    if (!cert) {
      // Return empty cert structure if none exists
      return NextResponse.json({
        success: true,
        certifications: null,
        complianceScore: {
          overall: 0,
          breakdown: {
            cecAccreditation: 0,
            electricalLicense: 0,
            safetyCertifications: 0,
            specializedTraining: 0
          },
          status: 'non_compliant',
          issues: ['No certifications on file']
        }
      });
    }

    // Calculate compliance score
    const complianceScore = calculateComplianceScore(cert);

    return NextResponse.json({
      success: true,
      certifications: cert,
      complianceScore
    });
  } catch (error) {
    console.error('Error fetching certifications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch certifications' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/staff/[id]/certifications
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

    // Convert date strings to Date objects
    const dateFields = [
      'cecIssueDate', 'cecExpiryDate',
      'licenseIssueDate', 'licenseExpiryDate',
      'whiteCardIssueDate', 'whiteCardExpiry',
      'workingAtHeightsIssue', 'workingAtHeightsExpiry',
      'firstAidIssue', 'firstAidExpiry',
      'batteryInstallIssue', 'batteryInstallExpiry',
      'evChargerIssue', 'evChargerExpiry',
      'solarDesignIssue', 'solarDesignExpiry'
    ];

    dateFields.forEach(field => {
      if (body[field]) {
        body[field] = new Date(body[field]);
      }
    });

    const updated = await prisma.staffCertification.upsert({
      where: { staffId: params.id },
      create: {
        staffId: params.id,
        ...body
      },
      update: body
    });

    const complianceScore = calculateComplianceScore(updated);

    return NextResponse.json({
      success: true,
      certifications: updated,
      complianceScore
    });
  } catch (error) {
    console.error('Error updating certifications:', error);
    return NextResponse.json(
      { error: 'Failed to update certifications' },
      { status: 500 }
    );
  }
}

// Helper function to calculate compliance score
function calculateComplianceScore(cert: any) {
  const today = new Date();
  let score = 0;
  const issues: string[] = [];

  // CEC Accreditation (30 points)
  if (cert.cecAccreditationNumber && cert.cecExpiryDate) {
    const daysUntilExpiry = Math.floor(
      (new Date(cert.cecExpiryDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    if (daysUntilExpiry > 90) {
      score += 30;
    } else if (daysUntilExpiry > 30) {
      score += 20;
      issues.push(`CEC accreditation expires in ${daysUntilExpiry} days`);
    } else if (daysUntilExpiry > 0) {
      score += 10;
      issues.push(`CEC accreditation expires in ${daysUntilExpiry} days - URGENT`);
    } else {
      issues.push('CEC accreditation EXPIRED');
    }
  } else {
    issues.push('No CEC accreditation on file');
  }

  // Electrical License (30 points)
  if (cert.electricalLicenseNumber && cert.licenseExpiryDate) {
    const daysUntilExpiry = Math.floor(
      (new Date(cert.licenseExpiryDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    if (daysUntilExpiry > 90) {
      score += 30;
    } else if (daysUntilExpiry > 30) {
      score += 20;
      issues.push(`Electrical license expires in ${daysUntilExpiry} days`);
    } else if (daysUntilExpiry > 0) {
      score += 10;
      issues.push(`Electrical license expires in ${daysUntilExpiry} days - URGENT`);
    } else {
      issues.push('Electrical license EXPIRED');
    }
  } else {
    issues.push('No electrical license on file');
  }

  // Safety Certifications (20 points)
  if (cert.whiteCardNumber) {
    score += 10;
  } else {
    issues.push('No White Card on file');
  }

  if (cert.workingAtHeights && cert.workingAtHeightsExpiry) {
    const daysUntilExpiry = Math.floor(
      (new Date(cert.workingAtHeightsExpiry).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysUntilExpiry > 0) {
      score += 5;
    } else {
      issues.push('Working at Heights certification expired');
    }
  } else {
    issues.push('No Working at Heights certification');
  }

  if (cert.firstAidCert && cert.firstAidExpiry) {
    const daysUntilExpiry = Math.floor(
      (new Date(cert.firstAidExpiry).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysUntilExpiry > 0) {
      score += 5;
    } else {
      issues.push('First Aid certification expired');
    }
  }

  // Specialized Training (20 points)
  if (cert.batteryInstallCert && cert.batteryInstallExpiry) {
    const daysUntilExpiry = Math.floor(
      (new Date(cert.batteryInstallExpiry).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysUntilExpiry > 0) score += 10;
  }

  if (cert.evChargerCert && cert.evChargerExpiry) {
    const daysUntilExpiry = Math.floor(
      (new Date(cert.evChargerExpiry).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysUntilExpiry > 0) score += 5;
  }

  if (cert.solarDesignCert && cert.solarDesignExpiry) {
    const daysUntilExpiry = Math.floor(
      (new Date(cert.solarDesignExpiry).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysUntilExpiry > 0) score += 5;
  }

  let status: 'compliant' | 'at_risk' | 'non_compliant';
  if (score >= 80) {
    status = 'compliant';
  } else if (score >= 60) {
    status = 'at_risk';
  } else {
    status = 'non_compliant';
  }

  const cecScore = Math.min(score, 30);
  const licenseScore = Math.min(Math.max(score - 30, 0), 30);
  const safetyScore = Math.min(Math.max(score - 60, 0), 20);
  const specializedScore = Math.min(Math.max(score - 80, 0), 20);

  return {
    overall: score,
    breakdown: {
      cecAccreditation: cecScore,
      electricalLicense: licenseScore,
      safetyCertifications: safetyScore,
      specializedTraining: specializedScore
    },
    status,
    issues
  };
}
