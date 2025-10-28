/**
 * Enhanced Chat API v2 - With Settings Integration
 * This is a new version that integrates with LiveChatSettings
 * Once tested, can replace the original /api/chatbot/chat
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { GoogleGenerativeAI } from '@google/generative-ai';
import jwt from 'jsonwebtoken';
import { chatbotTools, executeToolCall } from '@/lib/chatbot-tools';
import {
  getChatSettings,
  buildEnhancedSystemPrompt,
  shouldTransferToStaff,
  notifyStaffAboutTransfer,
  getAIModelConfig,
  getDefaultSystemPrompt,
} from '@/lib/chat-settings-manager';

// Decrypt API key helper
function decryptKey(encryptedKey: string): string {
  if (!encryptedKey) return '';
  try {
    return Buffer.from(encryptedKey, 'base64').toString('utf-8');
  } catch {
    return '';
  }
}

// Decrypt multiple Gemini API keys from JSON array
function decryptGeminiKeys(encryptedData: string | null): string[] {
  if (!encryptedData) return [];
  try {
    const encryptedKeys = JSON.parse(encryptedData);
    if (!Array.isArray(encryptedKeys)) return [];
    return encryptedKeys.map(key => decryptKey(key)).filter(key => key);
  } catch {
    const singleKey = decryptKey(encryptedData);
    return singleKey ? [singleKey] : [];
  }
}

// Round-robin key selector - cycles through all available keys
let keyIndex = 0;
function getNextApiKey(keys: string[]): string {
  if (keys.length === 0) return '';
  if (keys.length === 1) return keys[0];
  
  // Round-robin: cycle through all keys
  const key = keys[keyIndex % keys.length];
  keyIndex = (keyIndex + 1) % keys.length;
  
  console.log(`🔑 Using API key ${(keyIndex === 0 ? keys.length : keyIndex)} of ${keys.length}`);
  return key;
}

export async function POST(request: NextRequest) {
  try {
    console.log('🤖 Enhanced Chatbot API v2 called');
    const { message, context, customerId, leadId, conversationHistory } = await request.json();
    console.log('📝 Message:', message);

    if (!message) {
      return NextResponse.json({ error: 'Message required' }, { status: 400 });
    }

    // ============================================================================
    // 1. FETCH CHAT SETTINGS
    // ============================================================================
    console.log('⚙️ Fetching chat settings...');
    const chatSettings = await getChatSettings();
    console.log('⚙️ Chat settings loaded:', !!chatSettings);

    // Check if chat is enabled
    if (chatSettings && !chatSettings.enabled) {
      return NextResponse.json({
        response: "Our chat service is currently unavailable. Please contact us directly at 1300-SOLAR-WA or email info@sundirectpower.com.au for immediate assistance.",
      });
    }

    // ============================================================================
    // 2. GET GEMINI API KEY (from existing apiSettings)
    // ============================================================================
    console.log('🔑 Fetching Gemini API key...');
    const apiSettings = await prisma.apiSettings.findFirst({
      where: { active: true },
      orderBy: { createdAt: 'desc' },
    });
    
    if (!apiSettings || !apiSettings.geminiEnabled || !apiSettings.geminiApiKey) {
      console.error('❌ No active Gemini API key configured');
      return NextResponse.json(
        { 
          error: 'AI service not configured',
          response: "I'm sorry, our AI service is currently unavailable. Please contact us directly at 1300-SOLAR-WA or email info@sundirectpower.com.au for immediate assistance."
        },
        { status: 500 }
      );
    }

    const keys = decryptGeminiKeys(apiSettings.geminiApiKey);
    const geminiApiKey = getNextApiKey(keys); // Round-robin through all keys
    console.log('🔑 API key exists:', !!geminiApiKey);
    console.log('🔑 Total keys available:', keys.length);
    
    if (!geminiApiKey) {
      console.error('❌ Failed to decrypt Gemini API key');
      return NextResponse.json(
        { 
          error: 'AI service not configured',
          response: "I'm sorry, our AI service is currently unavailable. Please contact us directly."
        },
        { status: 500 }
      );
    }

    // ============================================================================
    // 3. FETCH COMPANY INFORMATION
    // ============================================================================
    let companyInfo = {
      phone: '08 6156 6747',
      email: 'sales@sundirectpower.com.au',
      website: 'https://sundirectpower.com.au',
      name: 'Sun Direct Power Pty Ltd',
      abn: '12 345 678 901',
      address: '1st Floor, 32 Prindiville Drive, Wangara WA 6065',
    };

    try {
      // Fetch the first active settings record (don't rely on specific ID)
      const companySettings = await prisma.apiSettings.findFirst({
        where: { active: true },
        orderBy: { createdAt: 'desc' },
      });
      
      if (companySettings) {
        companyInfo = {
          phone: companySettings.businessPhone || companyInfo.phone,
          email: companySettings.businessEmail || companyInfo.email,
          website: companySettings.businessWebsite || companyInfo.website,
          name: companySettings.businessName || companyInfo.name,
          abn: companySettings.businessABN || '',
          address: companySettings.businessAddress || '',
        };
      }
    } catch (error) {
      console.error('Failed to fetch company info:', error);
    }

    // ============================================================================
    // 4. FETCH DYNAMIC DATABASE DATA (packages, rebates, costs)
    // ============================================================================
    let packagesData = '';
    let installationCosts = '';
    let rebatesData = '';
    
    try {
      // Get active calculator packages
      const packages = await prisma.calculatorPackageTemplate.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
      });

      if (packages.length > 0) {
        packagesData = `\n\nCURRENT PACKAGES (from our database):\n` + packages.map((pkg: any) => `
- ${pkg.displayName}:
  * Solar Coverage: ${pkg.solarCoverage}%
  * Battery Strategy: ${pkg.batteryStrategy}
  * Profit Margin: ${pkg.profitMargin}%
  * ${pkg.badge ? `Badge: ${pkg.badge}` : ''}
  * Description: ${pkg.description || 'Premium solar package'}
`).join('\n');
      }

      // Get installation costs
      const costs = await prisma.installationCostItem.findMany({
        where: { isActive: true },
        orderBy: { name: 'asc' },
        take: 20,
      });

      if (costs.length > 0) {
        installationCosts = `\n\nINSTALLATION COSTS & ADD-ONS (from our database):\n` + costs.map((cost: any) => `
- ${cost.name}: Base rate $${cost.baseRate?.toLocaleString()}
  * Category: ${cost.category}
  * Code: ${cost.code}
`).join('\n');
      }

      // Get active rebate configurations
      const rebates = await prisma.rebateConfig.findMany({
        where: { active: true },
        orderBy: { type: 'asc' },
      });

      if (rebates.length > 0) {
        rebatesData = `\n\nCURRENT REBATES (from our database):\n` + rebates.map((rebate: any) => `
- ${rebate.name} (${rebate.type}):
  * Calculation: ${rebate.calculationType}
  * Value: ${rebate.value}${rebate.calculationType === 'PERCENTAGE' ? '%' : rebate.calculationType === 'PER_KW' ? '/kW' : ''}
  * ${rebate.maxAmount ? `Max Amount: $${rebate.maxAmount.toLocaleString()}` : ''}
  * Formula: ${rebate.formula || 'N/A'}
  * Eligibility: ${rebate.eligibilityCriteria}
  * Description: ${rebate.description}
`).join('\n');
      }

      // Get postcode zone ratings for STC calculations
      const zoneRatings = await prisma.postcodeZoneRating.findMany({
        where: { state: 'WA' },
        orderBy: { zone: 'asc' },
        take: 5,
      });

      if (zoneRatings.length > 0) {
        rebatesData += `\n\nSTC ZONE RATINGS (WA):\n` + zoneRatings.map((zone: any) => `
- Zone ${zone.zone}: Rating ${zone.zoneRating} (Postcodes ${zone.postcodeStart}-${zone.postcodeEnd})
`).join('\n');
      }
    } catch (error) {
      console.error('Failed to fetch packages/rates/rebates:', error);
    }

    // ============================================================================
    // 5. GET CUSTOMER CONTEXT (if authenticated)
    // ============================================================================
    let customerContext = '';
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (token && context === 'portal') {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;
        
        const lead = await prisma.lead.findUnique({
          where: { id: decoded.leadId },
          include: {
            CustomerQuote: true,
            InstallationJob: {
              include: {
                team: true,
              },
            },
          },
        });

        if (lead) {
          customerContext = `
Customer Context:
- Name: ${lead.name}
- Email: ${lead.email}
- Phone: ${lead.phone || 'Not provided'}
- Address: ${lead.address || 'Not provided'}

${lead.CustomerQuote ? `
Quote Information:
- Quote Number: ${lead.CustomerQuote.quoteReference}
- System Size: ${lead.systemSizeKw}kW solar
- Battery: ${lead.batterySizeKwh > 0 ? `${lead.batterySizeKwh}kWh` : 'None'}
- Total Cost: $${lead.CustomerQuote.totalCostAfterRebates?.toLocaleString()}
- Status: ${lead.CustomerQuote.status}
- Deposit Paid: ${lead.depositPaid ? 'Yes' : 'No'}
` : ''}

${lead.InstallationJob ? `
Installation Job:
- Job Number: ${lead.InstallationJob.jobNumber}
- Status: ${lead.InstallationJob.status}
- Scheduled Date: ${lead.InstallationJob.scheduledDate ? new Date(lead.InstallationJob.scheduledDate).toLocaleDateString() : 'Not scheduled yet'}
- Team: ${lead.InstallationJob.team?.name || 'Not assigned yet'}
` : ''}
`;
        }
      } catch (error) {
        console.error('Failed to get customer context:', error);
      }
    }

    // ============================================================================
    // 6. CHECK FOR STAFF TRANSFER KEYWORDS
    // ============================================================================
    const transferCheck = shouldTransferToStaff(message, chatSettings);
    if (transferCheck.shouldTransfer) {
      console.log('🔔 Transfer keyword detected:', transferCheck.keyword);
      await notifyStaffAboutTransfer({
        sessionId: `${Date.now()}-${customerId || leadId || 'anon'}`,
        message,
        keyword: transferCheck.keyword,
        customerId,
        leadId,
      });
    }

    // ============================================================================
    // 7. BUILD ENHANCED SYSTEM PROMPT
    // ============================================================================
    const history = conversationHistory
      ?.slice(-5)
      .map((msg: any) => `${msg.role === 'user' ? 'Customer' : 'Assistant'}: ${msg.content}`)
      .join('\n') || '';

    const defaultPrompt = getDefaultSystemPrompt(companyInfo);
    const systemPrompt = buildEnhancedSystemPrompt(defaultPrompt, chatSettings, companyInfo);

    const fullPrompt = `${systemPrompt}

${packagesData}
${installationCosts}
${rebatesData}

${customerContext}

RECENT CONVERSATION:
${history}

IMPORTANT TOOLS:
- Use calculate_instant_quote to get real pricing for any system configuration
- Use request_contact_details when customer wants a quote or callback
- Use get_customer_quote if customer asks about their existing quote (portal only)
- Use get_installation_status if customer asks about installation (portal only)

Customer's message: ${message}

Provide a helpful, accurate response. Use tools when needed for real data.`;

    // ============================================================================
    // 8. GET AI MODEL CONFIGURATION FROM SETTINGS
    // ============================================================================
    const modelConfig = getAIModelConfig(chatSettings);
    console.log('🤖 Using model:', modelConfig.model);
    console.log('🌡️ Temperature:', modelConfig.temperature);
    console.log('📏 Max tokens:', modelConfig.maxTokens);

    // ============================================================================
    // 9. CALL GEMINI API (Using v1's successful pattern)
    // ============================================================================
    console.log('🤖 Initializing Gemini AI with function calling...');
    const genAI = new GoogleGenerativeAI(geminiApiKey);
    
    // Map our model names to Gemini model names
    // Using gemini-2.5-flash (latest stable model)
    const geminiModelMap: Record<string, string> = {
      'gpt-4': 'gemini-2.5-flash',
      'gpt-4-turbo': 'gemini-2.5-flash',
      'gpt-3.5-turbo': 'gemini-2.5-flash',
      'claude-3': 'gemini-2.5-flash',
    };

    const geminiModel = geminiModelMap[modelConfig.model] || 'gemini-2.5-flash';
    
    let model = genAI.getGenerativeModel({
      model: geminiModel,
      tools: [{ functionDeclarations: chatbotTools }],
    });
    
    console.log('🤖 Sending prompt to Gemini...');
    let result;
    let retries = 0;
    const maxRetries = keys.length; // Try all available keys
    
    while (retries < maxRetries) {
      try {
        result = await model.generateContent(fullPrompt);
        console.log('✅ Received response from Gemini');
        break; // Success, exit loop
      } catch (error: any) {
        // Check if it's a retryable error (429 quota or 503 overloaded)
        const isRetryable = (error.status === 429 || error.status === 503) && retries < maxRetries - 1;
        
        if (isRetryable) {
          const errorType = error.status === 429 ? 'quota limit' : 'overloaded';
          console.log(`⚠️ Key ${keyIndex} ${errorType}, trying next key...`);
          retries++;
          
          // Get next key and create new model
          const nextKey = getNextApiKey(keys);
          const genAI = new GoogleGenerativeAI(nextKey);
          model = genAI.getGenerativeModel({
            model: geminiModel,
            tools: [{ functionDeclarations: chatbotTools }],
          });
          
          // Wait a bit before retry (longer for 503)
          const waitTime = error.status === 503 ? 1000 : 500;
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        }
        // Not a retryable error or no more retries, throw it
        throw error;
      }
    }
    
    if (!result) {
      throw new Error('Failed to get response after trying all keys');
    }
    
    let response = result.response;
    let finalText = '';
    const toolCalls: any[] = [];

    // ============================================================================
    // 10. HANDLE TOOL CALLS (Using v1's successful pattern)
    // ============================================================================
    const functionCalls = response.functionCalls();
    if (functionCalls && functionCalls.length > 0) {
      console.log('🔧 AI requested function calls:', functionCalls.length);
      
      // Execute all function calls
      const functionResponses = await Promise.all(
        functionCalls.map(async (call: any) => {
          console.log('🔧 Executing:', call.name, call.args);
          const toolResult = await executeToolCall(call.name, call.args, { leadId, customerId });
          toolCalls.push({ name: call.name, args: call.args, result: toolResult });
          
          return {
            functionResponse: {
              name: call.name,
              response: toolResult,
            },
          };
        })
      );

      // Send function results back to AI for final response (v1 pattern)
      console.log('🤖 Sending function results back to AI...');
      const chat = model.startChat({
        history: [
          {
            role: 'user',
            parts: [{ text: fullPrompt }],
          },
          {
            role: 'model',
            parts: response.candidates?.[0]?.content?.parts || [],
          },
        ],
      });

      const finalResult = await chat.sendMessage(functionResponses);
      finalText = finalResult.response.text();
      console.log('✅ Got final response after function calls');
    } else {
      // No function calls, use direct response
      finalText = response.text();
    }

    console.log('📝 Response length:', finalText?.length || 0);

    if (!finalText) {
      throw new Error('Empty response from AI');
    }

    // Check if any tool requested to show lead form
    const showLeadForm = toolCalls.some(call => 
      call.result?.action === 'SHOW_LEAD_FORM'
    );
    const leadFormData = toolCalls.find(call => 
      call.result?.action === 'SHOW_LEAD_FORM'
    )?.result;

    // ============================================================================
    // 11. RETURN RESPONSE
    // ============================================================================
    console.log('✅ Chatbot response successful');
    return NextResponse.json({
      response: finalText,
      timestamp: new Date().toISOString(),
      toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
      showLeadForm,
      leadFormData: showLeadForm ? leadFormData : undefined,
      modelUsed: geminiModel,
      temperature: modelConfig.temperature,
    });

  } catch (error: any) {
    console.error('❌ Chatbot error:', error);
    return NextResponse.json(
      {
        error: 'Failed to process message',
        response: "I'm sorry, I encountered an error. Please try again or contact us directly at 1300-SOLAR-WA.",
      },
      { status: 500 }
    );
  }
}
