import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import ProposalView from '@/components/proposal/ProposalView';

// Force dynamic rendering and disable all caching
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

interface ProposalPageProps {
  params: {
    token: string;
  };
}

async function getProposalData(quoteId: string) {
  try {
    // Fetch quote directly by ID (token is actually the quote ID)
    let quote = await prisma.customerQuote.findUnique({
      where: {
        id: quoteId,
      },
      include: {
        lead: true,
        signature: true,
      },
    });

    if (!quote) {
      return null;
    }

    // AUTO-FIX: If production data is missing, calculate it now
    if ((!quote.annualProductionKwh || quote.annualProductionKwh === 0) && quote.systemSizeKw) {
      console.log(`Quote ${quoteId}: Missing production data, calculating...`);
      
      // Estimate: systemSize (kW) × 1,400 hours (Perth average)
      const estimatedAnnualProduction = quote.systemSizeKw * 1400;
      
      // Generate monthly production data based on Perth seasonal patterns
      const seasonalFactors = [
        0.095, 0.090, 0.088, 0.080, 0.070, 0.065,
        0.068, 0.075, 0.082, 0.090, 0.095, 0.102
      ];
      const monthlyData = seasonalFactors.map(factor => 
        Math.round(estimatedAnnualProduction * factor)
      );
      
      // Update the quote in database
      quote = await prisma.customerQuote.update({
        where: { id: quoteId },
        data: {
          annualProductionKwh: estimatedAnnualProduction,
          monthlyProductionData: JSON.stringify(monthlyData),
          updatedAt: new Date(),
        },
        include: {
          lead: true,
          signature: true,
        },
      });
      
      console.log(`Quote ${quoteId}: Production data updated - ${estimatedAnnualProduction} kWh/year`);
    }

    // Check if quote is expired
    if (quote.validUntil && new Date() > quote.validUntil) {
      return { expired: true, quote };
    }

    return { expired: false, quote };
  } catch (error) {
    console.error('Error fetching proposal:', error);
    return null;
  }
}

export default async function ProposalPage({ params }: ProposalPageProps) {
  const data = await getProposalData(params.token);

  if (!data) {
    notFound();
  }

  if (data.expired) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="text-red-500 text-5xl mb-4">⏰</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Proposal Expired
          </h1>
          <p className="text-gray-600 mb-6">
            This proposal has expired. Please contact us for an updated quote.
          </p>
          <a
            href="mailto:info@sundirectpower.com.au"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Contact Us
          </a>
        </div>
      </div>
    );
  }

  return <ProposalView quote={data.quote} token={params.token} />;
}

export async function generateMetadata({ params }: ProposalPageProps) {
  const data = await getProposalData(params.token);

  if (!data || !data.quote) {
    return {
      title: 'Proposal Not Found',
    };
  }

  const { quote } = data;
  const customerName = quote.lead?.name || 'Customer';

  return {
    title: `Solar Proposal for ${customerName} - Sun Direct Power`,
    description: `${quote.systemSizeKw}kW solar system proposal with ${quote.panelCount} panels${quote.batterySizeKwh ? ` and ${quote.batterySizeKwh}kWh battery` : ''}`,
  };
}
