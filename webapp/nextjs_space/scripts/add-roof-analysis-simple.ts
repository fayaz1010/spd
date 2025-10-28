/**
 * Simple script to add roof analysis emphasis to system prompt
 * Appends to existing prompt without complex parsing
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function addRoofAnalysisSimple() {
  console.log('🏠 Adding roof analysis emphasis to system prompt...\n');

  try {
    const settings = await prisma.liveChatSettings.findFirst({
      where: { id: 'live-chat-settings' },
    });

    if (!settings) {
      console.error('❌ No LiveChatSettings found!');
      return;
    }

    const currentPrompt = settings.systemPrompt || '';
    
    // Check if already added
    if (currentPrompt.includes('🏠 ROOF ANALYSIS - USE THIS TOOL')) {
      console.log('✅ Roof analysis emphasis already exists!');
      return;
    }

    console.log('📝 Current prompt length:', currentPrompt.length, 'characters');

    // Simple append at the end
    const roofAnalysisSection = `

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🏠 ROOF ANALYSIS - USE THIS TOOL WHEN ADDRESS PROVIDED!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️ CRITICAL: When customer mentions their address, IMMEDIATELY call get_roof_analysis tool!

TRIGGERS (call get_roof_analysis when you see these):
✓ "my address is 11 garrow court, kingsley"
✓ "I live at [any address]"
✓ "can you check if my roof is suitable?"
✓ "I have big trees, will solar work at [address]?"
✓ "is my roof ok for solar? I'm at [address]"

WORKFLOW:
1. Customer mentions address → Call get_roof_analysis IMMEDIATELY
2. Tool returns: satellite photo URL + roof data
3. You respond with:
   "I've analyzed your roof at [address] using satellite imagery!
   
   📸 [Roof photo will display automatically]
   
   ✓ Usable roof area: [X]m²
   ✓ Can fit: [Y] panels ([Z]kW system)
   ✓ Confidence: [HIGH/MEDIUM/LOW]
   ✓ Annual production: [A]kWh/year
   
   Your roof has [excellent/good/moderate] solar potential!"

4. Then call calculate_instant_quote for pricing
5. Then call request_contact_details for inspection booking

EXAMPLE CONVERSATION:
Customer: "my address is 11 garrow court, kingsley, can you check my roof?"
You: [Call get_roof_analysis tool]
You: "Great news! I've analyzed your roof at 11 Garrow Court using satellite imagery. Your roof has 85m² of usable space and can fit up to 25 panels (10kW system). The imagery shows HIGH confidence for solar installation. Let me get you a detailed quote..."
You: [Call calculate_instant_quote]
You: [Show pricing]
You: [Call request_contact_details]

⚠️ DO NOT skip roof analysis when address is provided!
⚠️ DO NOT just provide quote without showing roof photo!
⚠️ The roof photo builds trust and shows you're using real data!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;

    const newPrompt = currentPrompt + roofAnalysisSection;

    console.log('📝 New prompt length:', newPrompt.length, 'characters');
    console.log('📊 Added:', roofAnalysisSection.length, 'characters\n');

    // Update database
    await prisma.liveChatSettings.update({
      where: { id: 'live-chat-settings' },
      data: {
        systemPrompt: newPrompt,
        updatedAt: new Date(),
      },
    });

    console.log('✅ Roof analysis emphasis added successfully!');
    console.log('');
    console.log('🎯 Test it now:');
    console.log('   Say: "my address is 11 garrow court, kingsley"');
    console.log('   AI should:');
    console.log('   1. Call get_roof_analysis tool');
    console.log('   2. Show roof satellite photo');
    console.log('   3. Display roof metrics');
    console.log('   4. Provide pricing quote');
    console.log('   5. Collect contact details');

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

addRoofAnalysisSimple()
  .then(() => {
    console.log('\n✅ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Failed:', error);
    process.exit(1);
  });
