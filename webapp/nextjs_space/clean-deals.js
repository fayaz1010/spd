const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function cleanDeals() {
  try {
    console.log('🧹 Cleaning deals and quotes only...');
    console.log('📦 Keeping: Staff, Products, Installation Costs, Settings');
    
    // Delete all deals (cascades to activities, proposals, communications via foreign keys)
    const deletedDeals = await prisma.deal.deleteMany({});
    console.log(`✅ Deleted ${deletedDeals.count} deals`);
    
    // Delete customer quotes
    const deletedQuotes = await prisma.customerQuote.deleteMany({});
    console.log(`✅ Deleted ${deletedQuotes.count} customer quotes`);
    
    // Delete quote signatures
    const deletedSignatures = await prisma.quoteSignature.deleteMany({});
    console.log(`✅ Deleted ${deletedSignatures.count} signatures`);
    
    // Delete leads (optional - uncomment if you want to delete leads too)
    // const deletedLeads = await prisma.lead.deleteMany({});
    // console.log(`✅ Deleted ${deletedLeads.count} leads`);
    
    console.log('✅ Deals and quotes cleaned successfully!');
    console.log('✅ Staff, products, and settings preserved!');
    
  } catch (error) {
    console.error('❌ Error cleaning data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanDeals();
