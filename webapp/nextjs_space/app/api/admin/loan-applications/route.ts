import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const loans = await prisma.loanApplication.findMany({
      include: {
        lead: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const formattedLoans = loans.map(loan => ({
      id: loan.id,
      leadId: loan.leadId,
      leadName: loan.lead.name,
      loanAmount: loan.loanAmount,
      loanTerm: loan.loanTerm,
      householdIncome: loan.householdIncome,
      numberOfDependents: loan.numberOfDependents,
      status: loan.status,
      submittedAt: loan.submittedAt,
      approvedAt: loan.approvedAt,
    }));

    return NextResponse.json({ loans: formattedLoans });
  } catch (error) {
    console.error('Error fetching loan applications:', error);
    return NextResponse.json({ loans: [] }, { status: 500 });
  }
}
