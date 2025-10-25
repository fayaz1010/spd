import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const signature = await prisma.quoteSignature.findUnique({
      where: { id },
      include: {
        quote: {
          select: {
            id: true,
            systemSizeKw: true,
            totalCostAfterRebates: true,
          },
        },
      },
    });

    if (!signature) {
      return NextResponse.json(
        { success: false, error: 'Signature not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      signature: {
        id: signature.id,
        quoteId: signature.quoteId,
        signedBy: signature.signedBy,
        signedAt: signature.signedAt,
        signatureData: signature.signatureData,
        quote: signature.quote,
      },
    });
  } catch (error) {
    console.error('Error fetching signature:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch signature' },
      { status: 500 }
    );
  }
}
