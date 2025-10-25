import { prisma } from './db';

// Decrypt helper (matches API route encryption)
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
    // Fallback: treat as single key (backward compatibility)
    const singleKey = decryptKey(encryptedData);
    return singleKey ? [singleKey] : [];
  }
}

/**
 * Get API keys from database (ApiSettings table)
 * Falls back to environment variables if not found in DB
 */
export async function getApiKeys() {
  try {
    const settings = await prisma.apiSettings.findFirst({
      where: { id: 'default' },
    });

    return {
      // Google Maps & Solar API
      googleMapsApiKey: settings?.googleMapsApiKey || process.env.NEXT_PUBLIC_GOOGLE_API_KEY || '',
      googleMapsEnabled: settings?.googleMapsEnabled ?? true,
      
      // Google Gemini AI (multiple keys for rate limiting)
      geminiApiKeys: settings?.geminiApiKey ? decryptGeminiKeys(settings.geminiApiKey) : (process.env.GEMINI_API_KEY ? [process.env.GEMINI_API_KEY] : []),
      geminiModel: settings?.geminiModel || 'gemini-2.0-flash-exp',
      geminiEnabled: settings?.geminiEnabled ?? true,
      
      // Twilio SMS
      twilioAccountSid: settings?.twilioAccountSid || process.env.TWILIO_ACCOUNT_SID || '',
      twilioAuthToken: settings?.twilioAuthToken || process.env.TWILIO_AUTH_TOKEN || '',
      twilioPhoneNumber: settings?.twilioPhoneNumber || process.env.TWILIO_PHONE_NUMBER || '',
      twilioEnabled: settings?.twilioEnabled ?? false,
      
      // SendGrid Email
      sendgridApiKey: settings?.sendgridApiKey || process.env.SENDGRID_API_KEY || '',
      sendgridFromEmail: settings?.sendgridFromEmail || process.env.SENDGRID_FROM_EMAIL || '',
      sendgridEnabled: settings?.sendgridEnabled ?? false,
      
      // Stripe
      stripePublishableKey: settings?.stripePublishableKey || process.env.STRIPE_PUBLISHABLE_KEY || '',
      stripeSecretKey: settings?.stripeSecretKey || process.env.STRIPE_SECRET_KEY || '',
      stripeEnabled: settings?.stripeEnabled ?? false,
      
      // OpenAI
      openaiApiKey: settings?.openaiApiKey || process.env.OPENAI_API_KEY || '',
      openaiModel: settings?.openaiModel || 'gpt-4',
      openaiEnabled: settings?.openaiEnabled ?? false,
    };
  } catch (error) {
    console.error('Failed to get API keys from database:', error);
    // Fallback to environment variables
    return {
      googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_API_KEY || '',
      googleMapsEnabled: true,
      geminiApiKeys: process.env.GEMINI_API_KEY ? [process.env.GEMINI_API_KEY] : [],
      geminiModel: 'gemini-2.0-flash-exp',
      geminiEnabled: true,
      twilioAccountSid: process.env.TWILIO_ACCOUNT_SID || '',
      twilioAuthToken: process.env.TWILIO_AUTH_TOKEN || '',
      twilioPhoneNumber: process.env.TWILIO_PHONE_NUMBER || '',
      twilioEnabled: false,
      sendgridApiKey: process.env.SENDGRID_API_KEY || '',
      sendgridFromEmail: process.env.SENDGRID_FROM_EMAIL || '',
      sendgridEnabled: false,
      stripePublishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
      stripeSecretKey: process.env.STRIPE_SECRET_KEY || '',
      stripeEnabled: false,
      openaiApiKey: process.env.OPENAI_API_KEY || '',
      openaiModel: 'gpt-4',
      openaiEnabled: false,
    };
  }
}

/**
 * Get Google Maps API key specifically
 * Used by client-side components
 */
export async function getGoogleMapsApiKey(): Promise<string> {
  const keys = await getApiKeys();
  return keys.googleMapsApiKey;
}

/**
 * Get Gemini API keys (multiple for round-robin)
 * Used by AI features
 */
export async function getGeminiApiKeys(): Promise<string[]> {
  const keys = await getApiKeys();
  return keys.geminiApiKeys;
}

/**
 * Get single Gemini API key (backward compatibility)
 * Returns first key from the array
 */
export async function getGeminiApiKey(): Promise<string> {
  const keys = await getGeminiApiKeys();
  return keys[0] || '';
}
