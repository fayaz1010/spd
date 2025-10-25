import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyJWT } from '@/lib/auth';

// GET /api/admin/compliance/dashboard
export async function GET(req: Request) {
  try {
    const user = await verifyJWT(req);
    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const allStaff = await prisma.teamMember.findMany({
      where: { isActive: true },
      include: {
        Team: {
          select: {
            name: true,
            color: true
          }
        }
      }
    });
    
    // Fetch certifications separately - using any to bypass type checking for now
    const certifications = await (prisma as any).staffCertification?.findMany({
      where: {
        staffId: {
          in: allStaff.map((s: any) => s.id)
        }
      }
    }) || [];
    
    const certMap = new Map(certifications.map((c: any) => [c.staffId, c]));

    const today = new Date();
    
    const stats = {
      totalStaff: allStaff.length,
      cecValid: 0,
      cecExpiringSoon: 0,
      cecExpired: 0,
      cecMissing: 0,
      licenseValid: 0,
      licenseExpiringSoon: 0,
      licenseExpired: 0,
      licenseMissing: 0,
      whiteCardCompliant: 0,
      workingAtHeightsCompliant: 0,
      firstAidCompliant: 0,
      fullyCompliant: 0,
      atRisk: 0,
      nonCompliant: 0
    };

    const staffDetails = allStaff.map(staff => {
      const cert = certMap.get(staff.id) as any;
      let complianceScore: {
        overall: number;
        breakdown: {
          cecAccreditation: number;
          electricalLicense: number;
          safetyCertifications: number;
          specializedTraining: number;
        };
        status: 'compliant' | 'at_risk' | 'non_compliant';
        issues: string[];
      };
      
      if (cert) {
        complianceScore = calculateComplianceScore(cert);
      } else {
        complianceScore = {
          overall: 0,
          breakdown: {
            cecAccreditation: 0,
            electricalLicense: 0,
            safetyCertifications: 0,
            specializedTraining: 0
          },
          status: 'non_compliant',
          issues: ['No certifications on file']
        };
      }
      
      if (cert) {
        
        // Update stats
        if (complianceScore.status === 'compliant') stats.fullyCompliant++;
        else if (complianceScore.status === 'at_risk') stats.atRisk++;
        else stats.nonCompliant++;

        // CEC stats
        if (cert.cecExpiryDate) {
          const days = Math.floor(
            (new Date(cert.cecExpiryDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
          );
          if (days > 30) stats.cecValid++;
          else if (days > 0) stats.cecExpiringSoon++;
          else stats.cecExpired++;
        } else {
          stats.cecMissing++;
        }

        // License stats
        if (cert.licenseExpiryDate) {
          const days = Math.floor(
            (new Date(cert.licenseExpiryDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
          );
          if (days > 30) stats.licenseValid++;
          else if (days > 0) stats.licenseExpiringSoon++;
          else stats.licenseExpired++;
        } else {
          stats.licenseMissing++;
        }

        // Safety stats
        if (cert.whiteCardNumber) stats.whiteCardCompliant++;
        if (cert.workingAtHeights && cert.workingAtHeightsExpiry && 
            new Date(cert.workingAtHeightsExpiry) > today) {
          stats.workingAtHeightsCompliant++;
        }
        if (cert.firstAidCert && cert.firstAidExpiry && 
            new Date(cert.firstAidExpiry) > today) {
          stats.firstAidCompliant++;
        }
      } else {
        stats.nonCompliant++;
        stats.cecMissing++;
        stats.licenseMissing++;
      }

      return {
        id: staff.id,
        name: staff.name,
        email: staff.email,
        role: staff.role,
        team: staff.Team,
        complianceScore
      };
    });

    return NextResponse.json({
      success: true,
      stats,
      staffDetails
    });
  } catch (error) {
    console.error('Error fetching compliance dashboard:', error);
    return NextResponse.json(
      { error: 'Failed to fetch compliance data' },
      { status: 500 }
    );
  }
}

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
