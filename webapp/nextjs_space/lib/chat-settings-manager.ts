/**
 * Chat Settings Manager
 * Centralized module for fetching and applying AI chat settings
 * This keeps the chat API clean and avoids breaking existing functionality
 */

import { prisma } from '@/lib/db';

export interface ChatSettings {
  enabled: boolean;
  aiModel: string;
  systemPrompt: string | null;
  temperature: number;
  maxTokens: number;
  knowledgeBase: string | null;
  companyInfo: string | null;
  productInfo: string | null;
  pricingInfo: string | null;
  staffOverrideEnabled: boolean;
  autoTransferToStaff: boolean;
  transferKeywords: string | null;
  notifyStaffOnChat: boolean;
  position: string;
  welcomeMessage: string | null;
  aiName: string;
  showOnMobile: boolean;
  autoOpen: boolean;
  autoOpenDelay: number;
}

export interface PublicChatSettings {
  enabled: boolean;
  aiName: string;
  welcomeMessage: string | null;
  position: string;
  showOnMobile: boolean;
  autoOpen: boolean;
  autoOpenDelay: number;
}

/**
 * Get full chat settings (for backend use)
 */
export async function getChatSettings(): Promise<ChatSettings | null> {
  try {
    const settings = await prisma.liveChatSettings.findFirst();
    
    if (!settings) {
      return null;
    }

    return {
      enabled: settings.enabled,
      aiModel: settings.aiModel,
      systemPrompt: settings.systemPrompt,
      temperature: settings.temperature,
      maxTokens: settings.maxTokens,
      knowledgeBase: settings.knowledgeBase,
      companyInfo: settings.companyInfo,
      productInfo: settings.productInfo,
      pricingInfo: settings.pricingInfo,
      staffOverrideEnabled: settings.staffOverrideEnabled,
      autoTransferToStaff: settings.autoTransferToStaff,
      transferKeywords: settings.transferKeywords,
      notifyStaffOnChat: settings.notifyStaffOnChat,
      position: settings.position,
      welcomeMessage: settings.welcomeMessage,
      aiName: settings.aiName,
      showOnMobile: settings.showOnMobile,
      autoOpen: settings.autoOpen,
      autoOpenDelay: settings.autoOpenDelay,
    };
  } catch (error) {
    console.error('Failed to fetch chat settings:', error);
    return null;
  }
}

/**
 * Get public chat settings (for frontend use)
 */
export async function getPublicChatSettings(): Promise<PublicChatSettings> {
  try {
    const settings = await prisma.liveChatSettings.findFirst();
    
    return {
      enabled: settings?.enabled ?? true,
      aiName: settings?.aiName || 'Solar Assistant',
      welcomeMessage: settings?.welcomeMessage,
      position: settings?.position || 'bottom-right',
      showOnMobile: settings?.showOnMobile ?? true,
      autoOpen: settings?.autoOpen ?? false,
      autoOpenDelay: settings?.autoOpenDelay || 5,
    };
  } catch (error) {
    console.error('Failed to fetch public chat settings:', error);
    return {
      enabled: true,
      aiName: 'Solar Assistant',
      welcomeMessage: null,
      position: 'bottom-right',
      showOnMobile: true,
      autoOpen: false,
      autoOpenDelay: 5,
    };
  }
}

/**
 * Build enhanced system prompt with knowledge base
 */
export function buildEnhancedSystemPrompt(
  basePrompt: string,
  settings: ChatSettings | null,
  companyInfo: any
): string {
  let enhancedPrompt = basePrompt;

  // Add custom system prompt if configured
  if (settings?.systemPrompt) {
    enhancedPrompt = settings.systemPrompt;
  }

  // Add knowledge base sections
  if (settings?.companyInfo) {
    enhancedPrompt += `\n\n=== COMPANY INFORMATION ===\n${settings.companyInfo}`;
  }

  if (settings?.productInfo) {
    enhancedPrompt += `\n\n=== PRODUCT INFORMATION ===\n${settings.productInfo}`;
  }

  if (settings?.pricingInfo) {
    enhancedPrompt += `\n\n=== PRICING INFORMATION ===\n${settings.pricingInfo}`;
  }

  if (settings?.knowledgeBase) {
    enhancedPrompt += `\n\n=== ADDITIONAL KNOWLEDGE ===\n${settings.knowledgeBase}`;
  }

  // Add dynamic company contact info
  enhancedPrompt += `\n\n=== CONTACT INFORMATION ===
Company: ${companyInfo.name}
Phone: ${companyInfo.phone}
Email: ${companyInfo.email}
Website: ${companyInfo.website}
${companyInfo.address ? `Address: ${companyInfo.address}` : ''}
${companyInfo.abn ? `ABN: ${companyInfo.abn}` : ''}`;

  return enhancedPrompt;
}

/**
 * Check if message contains transfer keywords
 */
export function shouldTransferToStaff(
  message: string,
  settings: ChatSettings | null
): { shouldTransfer: boolean; keyword?: string } {
  if (!settings?.autoTransferToStaff || !settings?.transferKeywords) {
    return { shouldTransfer: false };
  }

  const keywords = settings.transferKeywords
    .split(',')
    .map(k => k.trim().toLowerCase())
    .filter(k => k.length > 0);

  const messageLower = message.toLowerCase();

  for (const keyword of keywords) {
    if (messageLower.includes(keyword)) {
      return { shouldTransfer: true, keyword };
    }
  }

  return { shouldTransfer: false };
}

/**
 * Get AI model configuration from settings
 */
export function getAIModelConfig(settings: ChatSettings | null) {
  return {
    model: settings?.aiModel || 'gemini-2.0-flash-exp',
    temperature: settings?.temperature ?? 0.7,
    maxTokens: settings?.maxTokens ?? 500,
  };
}

/**
 * Notify staff about chat transfer request
 */
export async function notifyStaffAboutTransfer(data: {
  sessionId: string;
  message: string;
  keyword?: string;
  customerId?: string;
  leadId?: string;
}) {
  try {
    // TODO: Implement notification system
    // Options:
    // 1. Create ChatTransferRequest record in database
    // 2. Send email notification
    // 3. Send SMS notification
    // 4. WebSocket/real-time notification
    
    console.log('🔔 Staff transfer requested:', data);
    
    // For now, just log it
    // In future, create a notification record
    /*
    await prisma.chatTransferRequest.create({
      data: {
        sessionId: data.sessionId,
        message: data.message,
        keyword: data.keyword,
        customerId: data.customerId,
        leadId: data.leadId,
        status: 'PENDING',
      },
    });
    */
  } catch (error) {
    console.error('Failed to notify staff about transfer:', error);
  }
}

/**
 * Get default system prompt (fallback)
 */
export function getDefaultSystemPrompt(companyInfo: any): string {
  return `You are an expert solar sales consultant for ${companyInfo.name}, Western Australia's leading solar installation company. Your goal is to educate customers, build trust, overcome objections, and close deals.

COMPANY INFORMATION:
- Company: ${companyInfo.name}
- Location: Perth, Western Australia
- Services: Residential & Commercial Solar, Battery Storage, Maintenance, Monitoring
- Phone: ${companyInfo.phone}
- Email: ${companyInfo.email}
- Website: ${companyInfo.website}
- Years in business: 10+ years | Installations: 5,000+ systems
- Accreditations: CEC Approved, Clean Energy Council Member

YOUR CAPABILITIES:
You have access to powerful tools that let you:
1. Calculate instant quotes with real pricing
2. Get roof analysis with satellite photo (USE THIS WHEN ADDRESS PROVIDED!)
3. Look up customer quotes and installation status
4. Get product specifications and availability
5. Check rebate eligibility
6. Calculate ROI and payback periods
7. Access current packages and pricing
8. Get extra services information
9. Request customer contact details for quotes

⚠️ CRITICAL: When customer provides their address, ALWAYS call get_roof_analysis tool FIRST!
This shows their actual roof photo and confirms solar suitability.

CONVERSATION GUIDELINES:
- Be friendly, professional, and consultative
- Ask qualifying questions to understand needs
- Use tools to provide accurate, real-time information
- Address objections with facts and social proof
- Guide towards quote or contact capture
- Never make up information - use tools or admit uncertainty
- Keep responses concise but informative (2-3 sentences max unless providing detailed quote)
- Use Australian spelling and terminology

CRITICAL - CONTACT COLLECTION & CLOSING:
⚠️ YOUR PRIMARY GOAL IS TO COLLECT CONTACT DETAILS FOR A FREE SITE INSPECTION ⚠️

After providing pricing/system information, ALWAYS:
1. Use the request_contact_details tool to trigger the contact form
2. Explain: "I'll collect your details for a FREE, no-obligation site inspection"
3. Emphasize: "Our expert will inspect your roof, confirm system design, and provide final pricing"
4. Close with: "This ensures the system will fit perfectly and perform optimally"

WHEN TO COLLECT CONTACT:
- After showing pricing/quote (ALWAYS)
- After 3-4 messages if engaged
- When customer asks about roof suitability
- When customer shows buying intent
- When customer asks "what's next?"

CLOSING PHRASES (Use these):
- "Let me collect your details for a free inspection"
- "I'll schedule a site visit - what's your name and phone number?"
- "To proceed, I'll need your contact info for our expert to call you"
- "Ready to book your free inspection? I just need a few details"

SALES APPROACH:
1. Qualify: Understand their situation (bill amount, roof space, goals) - 1-2 messages
2. Educate: Explain solar benefits specific to their needs - 1 message
3. Calculate: Use tools to show real numbers and savings - 1 message
4. Close: COLLECT CONTACT DETAILS using request_contact_details tool - REQUIRED
5. Confirm: "Perfect! Our team will call you within 24 hours to schedule your free inspection"

⚠️ IMPORTANT: If conversation goes beyond 5 messages without contact collection, PUSH HARDER to close.
Say: "I've provided detailed information. The next step is a free site inspection. Can I collect your details?"

Remember: You're here to help customers make informed decisions about solar AND convert them to leads. Be helpful, honest, data-driven, AND persistent about collecting contact information for the free inspection.`;
}
