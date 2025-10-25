import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAdminFromRequest } from '@/lib/auth-admin';

// Levenshtein distance for fuzzy string matching
function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
}

function similarityScore(str1: string, str2: string): number {
  const maxLength = Math.max(str1.length, str2.length);
  if (maxLength === 0) return 1.0;
  const distance = levenshteinDistance(str1.toLowerCase(), str2.toLowerCase());
  return 1 - distance / maxLength;
}

function normalizePhone(phone: string): string {
  return phone.replace(/[\s\-\(\)]/g, '');
}

export async function POST(request: NextRequest) {
  try {
    const admin = getAdminFromRequest(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { leadId } = await request.json();

    // Get the lead to check
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
    });

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    // Get all other leads
    const allLeads = await prisma.lead.findMany({
      where: {
        id: { not: leadId },
        status: { notIn: ['CONVERTED', 'LOST'] },
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        postcode: true,
        createdAt: true,
      },
    });

    const duplicates: any[] = [];

    for (const otherLead of allLeads) {
      let matchScore = 0;
      const reasons: string[] = [];

      // Exact email match (highest priority)
      if (lead.email && otherLead.email && lead.email.toLowerCase() === otherLead.email.toLowerCase()) {
        matchScore += 50;
        reasons.push('Exact email match');
      }

      // Exact phone match
      if (lead.phone && otherLead.phone) {
        const phone1 = normalizePhone(lead.phone);
        const phone2 = normalizePhone(otherLead.phone);
        if (phone1 === phone2) {
          matchScore += 40;
          reasons.push('Exact phone match');
        }
      }

      // Fuzzy name match
      if (lead.name && otherLead.name) {
        const nameSimilarity = similarityScore(lead.name, otherLead.name);
        if (nameSimilarity > 0.8) {
          matchScore += Math.floor(nameSimilarity * 30);
          reasons.push(`Name similarity: ${Math.floor(nameSimilarity * 100)}%`);
        }
      }

      // Address match
      if (lead.address && otherLead.address) {
        const addressSimilarity = similarityScore(lead.address, otherLead.address);
        if (addressSimilarity > 0.8) {
          matchScore += Math.floor(addressSimilarity * 20);
          reasons.push(`Address similarity: ${Math.floor(addressSimilarity * 100)}%`);
        }
      }

      // Postcode match
      if (lead.postcode && otherLead.postcode && lead.postcode === otherLead.postcode) {
        matchScore += 10;
        reasons.push('Same postcode');
      }

      // If match score is significant, add to duplicates
      if (matchScore >= 50) {
        duplicates.push({
          lead: otherLead,
          matchScore,
          confidence: matchScore >= 80 ? 'HIGH' : matchScore >= 60 ? 'MEDIUM' : 'LOW',
          reasons,
        });
      }
    }

    // Sort by match score
    duplicates.sort((a, b) => b.matchScore - a.matchScore);

    return NextResponse.json({
      lead,
      duplicates,
      count: duplicates.length,
    });
  } catch (error) {
    console.error('Duplicate detection error:', error);
    return NextResponse.json(
      { error: 'Failed to detect duplicates' },
      { status: 500 }
    );
  }
}

// Batch scan all leads for duplicates
export async function GET(request: NextRequest) {
  try {
    const admin = getAdminFromRequest(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const leads = await prisma.lead.findMany({
      where: {
        status: { notIn: ['CONVERTED', 'LOST'] },
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
      },
    });

    const duplicateGroups: any[] = [];
    const processed = new Set<string>();

    for (const lead of leads) {
      if (processed.has(lead.id)) continue;

      const group: any[] = [lead];
      processed.add(lead.id);

      for (const otherLead of leads) {
        if (processed.has(otherLead.id) || lead.id === otherLead.id) continue;

        // Check for exact matches
        const emailMatch = lead.email && otherLead.email && 
          lead.email.toLowerCase() === otherLead.email.toLowerCase();
        
        const phoneMatch = lead.phone && otherLead.phone && 
          normalizePhone(lead.phone) === normalizePhone(otherLead.phone);

        if (emailMatch || phoneMatch) {
          group.push(otherLead);
          processed.add(otherLead.id);
        }
      }

      if (group.length > 1) {
        duplicateGroups.push({
          leads: group,
          count: group.length,
        });
      }
    }

    return NextResponse.json({
      duplicateGroups,
      totalGroups: duplicateGroups.length,
      totalDuplicates: duplicateGroups.reduce((sum, g) => sum + g.count, 0),
    });
  } catch (error) {
    console.error('Batch duplicate scan error:', error);
    return NextResponse.json(
      { error: 'Failed to scan for duplicates' },
      { status: 500 }
    );
  }
}
