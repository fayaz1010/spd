/**
 * Safely add roof analysis emphasis to system prompt
 * This script inserts roof analysis instructions without breaking existing prompt
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function addRoofAnalysisEmphasis() {
  console.log('🏠 Adding roof analysis emphasis to system prompt...\n');

  try {
    // Get current settings
    const settings = await prisma.liveChatSettings.findFirst({
      where: { id: 'live-chat-settings' },
    });

    if (!settings) {
      console.error('❌ No LiveChatSettings found!');
      return;
    }

    const currentPrompt = settings.systemPrompt || '';
    
    // Check if roof analysis instructions already exist
    if (currentPrompt.includes('get_roof_analysis') && currentPrompt.includes('ROOF ANALYSIS')) {
      console.log('✅ Roof analysis emphasis already exists in prompt!');
      console.log('   No update needed.');
      return;
    }

    console.log('📝 Current prompt length:', currentPrompt.length, 'characters');

    // Find the insertion point (after YOUR CAPABILITIES section)
    const insertionMarker = 'YOUR CAPABILITIES:';
    const insertionIndex = currentPrompt.indexOf(insertionMarker);

    if (insertionIndex === -1) {
      console.error('❌ Could not find insertion point in prompt!');
      console.log('   Looking for: "YOUR CAPABILITIES:"');
      return;
    }

    // Find the end of the capabilities list (before next section)
    const capabilitiesStart = insertionIndex + insertionMarker.length;
    const nextSectionMarker = '\n\nCONVERSATION GUIDELINES:';
    const nextSectionIndex = currentPrompt.indexOf(nextSectionMarker, capabilitiesStart);

    if (nextSectionIndex === -1) {
      console.error('❌ Could not find end of capabilities section!');
      return;
    }

    // Extract the capabilities section
    const capabilitiesSection = currentPrompt.substring(capabilitiesStart, nextSectionIndex);

    // Update capabilities to mention roof analysis
    const updatedCapabilities = capabilitiesSection.replace(
      /You have access to powerful tools that let you:\n1\. Calculate instant quotes with real pricing/,
      `You have access to powerful tools that let you:
1. Calculate instant quotes with real pricing
2. **Get roof analysis with satellite photo** (USE THIS WHEN ADDRESS PROVIDED!)`
    ).replace(
      /2\. Look up customer quotes/,
      '3. Look up customer quotes'
    ).replace(
      /3\. Get product specifications/,
      '4. Get product specifications'
    ).replace(
      /4\. Check rebate eligibility/,
      '5. Check rebate eligibility'
    ).replace(
      /5\. Calculate ROI/,
      '6. Calculate ROI'
    ).replace(
      /6\. Access current packages/,
      '7. Access current packages'
    ).replace(
      /7\. Get extra services/,
      '8. Get extra services'
    ).replace(
      /8\. Request customer contact/,
      '9. Request customer contact'
    );

    // Add roof analysis emphasis section
    const roofAnalysisSection = `

🏠 ROOF ANALYSIS - CRITICAL TOOL:
⚠️ When customer mentions their address, IMMEDIATELY call get_roof_analysis tool!

Triggers for roof analysis:
- Customer provides full address: "my address is 11 garrow court, kingsley"
- Customer asks about roof: "can you check if my roof is suitable?"
- Customer mentions location: "I live at [address]"
- Customer asks about shading: "I have big trees, will solar work?"

After calling get_roof_analysis:
1. Tool returns satellite photo URL and roof data
2. Explain roof suitability: "Great news! Your roof at [address] has excellent solar potential"
3. Mention specifics: "Usable area: [X]m², Can fit [Y] panels ([Z]kW system)"
4. Show confidence: "Based on satellite imagery, your roof is [HIGH/MEDIUM] confidence"
5. Then provide pricing quote using calculate_instant_quote
6. Finally collect contact details using request_contact_details

Example response:
"I've analyzed your roof at 11 Garrow Court, Kingsley using satellite imagery. Your roof has 85m² of usable space and can accommodate up to 25 panels (10kW system). The imagery shows [HIGH] confidence for solar installation. Let me get you a detailed quote..."`;

    // Construct new prompt
    const beforeCapabilities = currentPrompt.substring(0, capabilitiesStart);
    const afterCapabilities = currentPrompt.substring(nextSectionIndex);
    
    const newPrompt = beforeCapabilities + updatedCapabilities + roofAnalysisSection + afterCapabilities;

    console.log('📝 New prompt length:', newPrompt.length, 'characters');
    console.log('📊 Added:', newPrompt.length - currentPrompt.length, 'characters\n');

    // Show preview of what will be added
    console.log('📋 Preview of roof analysis section:');
    console.log('━'.repeat(60));
    console.log(roofAnalysisSection.trim());
    console.log('━'.repeat(60));
    console.log('');

    // Update database
    await prisma.liveChatSettings.update({
      where: { id: 'live-chat-settings' },
      data: {
        systemPrompt: newPrompt,
        updatedAt: new Date(),
      },
    });

    console.log('✅ System prompt updated successfully!');
    console.log('');
    console.log('📝 Changes made:');
    console.log('   ✓ Updated capabilities list (renumbered 1-9)');
    console.log('   ✓ Added roof analysis emphasis section');
    console.log('   ✓ Added trigger examples');
    console.log('   ✓ Added response template');
    console.log('');
    console.log('🎯 Next steps:');
    console.log('   1. Test chat: "my address is 11 garrow court, kingsley"');
    console.log('   2. AI should call get_roof_analysis tool');
    console.log('   3. Roof photo and data should display');
    console.log('   4. Then pricing quote');
    console.log('   5. Then contact form');

  } catch (error) {
    console.error('❌ Error updating prompt:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
addRoofAnalysisEmphasis()
  .then(() => {
    console.log('\n✅ Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
