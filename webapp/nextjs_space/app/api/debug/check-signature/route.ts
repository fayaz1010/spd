import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const quoteId = searchParams.get('quoteId');

    if (!quoteId) {
      return NextResponse.json({ error: 'quoteId required' }, { status: 400 });
    }

    const signature = await prisma.quoteSignature.findUnique({
      where: { quoteId }
    });

    return NextResponse.json({ 
      exists: !!signature,
      signature 
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
