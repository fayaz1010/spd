
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAdminFromRequest } from '@/lib/auth-admin';

// Simple encryption (in production, use proper encryption like AES-256)
function encryptKey(key: string): string {
  if (!key) return '';
  // For production, use proper encryption library
  // For now, just base64 encode (NOT SECURE - replace with proper encryption)
  return Buffer.from(key).toString('base64');
}

function decryptKey(encryptedKey: string): string {
  if (!encryptedKey) return '';
  try {
    return Buffer.from(encryptedKey, 'base64').toString('utf-8');
  } catch {
    return '';
  }
}

// Encrypt multiple Gemini API keys as JSON array
function encryptGeminiKeys(keys: string[]): string {
  if (!keys || !Array.isArray(keys)) return '';
  // Filter out empty keys and masked keys
  const validKeys = keys.filter(key => key && key.trim() && !key.startsWith('••••'));
  if (validKeys.length === 0) return '';
  
  // Encrypt each key individually, then store as JSON
  const encryptedKeys = validKeys.map(key => encryptKey(key));
  return JSON.stringify(encryptedKeys);
}

// Decrypt multiple Gemini API keys from JSON array
function decryptGeminiKeys(encryptedData: string): string[] {
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

// GET - Retrieve API settings
export async function GET(request: NextRequest) {
  const admin = getAdminFromRequest(request);
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    let settings = await prisma.apiSettings.findFirst({
      where: { active: true },
      orderBy: { createdAt: 'desc' },
    });

    if (!settings) {
      // Create default settings if none exist
      settings = await prisma.apiSettings.create({
        data: {
          id: `api_settings_${Date.now()}`,
          active: true,
          updatedAt: new Date(),
        },
      });
    }

    // Decrypt sensitive keys before sending to frontend
    const decryptedSettings = {
      ...settings,
      stripeSecretKey: settings.stripeSecretKey ? decryptKey(settings.stripeSecretKey) : '',
      openaiApiKey: settings.openaiApiKey ? decryptKey(settings.openaiApiKey) : '',
      abacusApiKey: settings.abacusApiKey ? decryptKey(settings.abacusApiKey) : '',
      geminiApiKey: settings.geminiApiKey ? decryptGeminiKeys(settings.geminiApiKey) : [],
      googleMapsApiKey: settings.googleMapsApiKey ? decryptKey(settings.googleMapsApiKey) : '',
      sendgridApiKey: settings.sendgridApiKey ? decryptKey(settings.sendgridApiKey) : '',
      twilioAuthToken: settings.twilioAuthToken ? decryptKey(settings.twilioAuthToken) : '',
      smtpPassword: settings.smtpPassword ? decryptKey(settings.smtpPassword) : '',
      stripeWebhookSecret: settings.stripeWebhookSecret ? decryptKey(settings.stripeWebhookSecret) : '',
      // NEW: Facebook
      facebookAppSecret: settings.facebookAppSecret ? decryptKey(settings.facebookAppSecret) : '',
      facebookPageAccessToken: settings.facebookPageAccessToken ? decryptKey(settings.facebookPageAccessToken) : '',
      // NEW: Google
      googleAdsWebhookSecret: settings.googleAdsWebhookSecret ? decryptKey(settings.googleAdsWebhookSecret) : '',
      googleClientSecret: settings.googleClientSecret ? decryptKey(settings.googleClientSecret) : '',
      googleRefreshToken: settings.googleRefreshToken ? decryptKey(settings.googleRefreshToken) : '',
      googleAdsDeveloperToken: settings.googleAdsDeveloperToken ? decryptKey(settings.googleAdsDeveloperToken) : '',
      // NEW: WhatsApp
      whatsappAccessToken: settings.whatsappAccessToken ? decryptKey(settings.whatsappAccessToken) : '',
      // Microsoft 365 OAuth
      microsoftClientSecret: settings.microsoftClientSecret ? decryptKey(settings.microsoftClientSecret) : '',
    };

    // Mask the keys partially for display (show only last 4 chars)
    const maskedSettings = {
      ...decryptedSettings,
      stripeSecretKey: maskKey(decryptedSettings.stripeSecretKey),
      openaiApiKey: maskKey(decryptedSettings.openaiApiKey),
      abacusApiKey: maskKey(decryptedSettings.abacusApiKey),
      geminiApiKey: Array.isArray(decryptedSettings.geminiApiKey) ? decryptedSettings.geminiApiKey.map(maskKey) : [],
      googleMapsApiKey: maskKey(decryptedSettings.googleMapsApiKey),
      sendgridApiKey: maskKey(decryptedSettings.sendgridApiKey),
      twilioAuthToken: maskKey(decryptedSettings.twilioAuthToken),
      smtpPassword: maskKey(decryptedSettings.smtpPassword),
      stripeWebhookSecret: maskKey(decryptedSettings.stripeWebhookSecret),
      // NEW: Facebook
      facebookAppSecret: maskKey(decryptedSettings.facebookAppSecret),
      facebookPageAccessToken: maskKey(decryptedSettings.facebookPageAccessToken),
      // NEW: Google
      googleAdsWebhookSecret: maskKey(decryptedSettings.googleAdsWebhookSecret),
      googleClientSecret: maskKey(decryptedSettings.googleClientSecret),
      googleRefreshToken: maskKey(decryptedSettings.googleRefreshToken),
      googleAdsDeveloperToken: maskKey(decryptedSettings.googleAdsDeveloperToken),
      // NEW: WhatsApp
      whatsappAccessToken: maskKey(decryptedSettings.whatsappAccessToken),
      // Microsoft 365 OAuth
      microsoftClientSecret: maskKey(decryptedSettings.microsoftClientSecret),
    };

    return NextResponse.json(maskedSettings);
  } catch (error: any) {
    console.error('Error fetching API settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch API settings', details: error.message },
      { status: 500 }
    );
  }
}

// Helper to mask keys
function maskKey(key: string): string {
  if (!key || key.length < 8) return '';
  return '••••••••' + key.slice(-4);
}

// POST - Update API settings
export async function POST(request: NextRequest) {
  const admin = getAdminFromRequest(request);
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();

    // Get existing settings
    let settings = await prisma.apiSettings.findFirst({
      where: { active: true },
      orderBy: { createdAt: 'desc' },
    });

    // Prepare update data
    const updateData: any = {
      // Stripe
      stripePublishableKey: body.stripePublishableKey || null,
      stripeEnabled: body.stripeEnabled || false,
      
      // AI Keys
      openaiModel: body.openaiModel || 'gpt-4',
      openaiEnabled: body.openaiEnabled || false,
      abacusEnabled: body.abacusEnabled || false,
      geminiModel: body.geminiModel || 'gemini-2.0-flash-exp',
      geminiEnabled: body.geminiEnabled || false,
      
      // Google Maps & Solar API
      googleMapsEnabled: body.googleMapsEnabled || false,
      
      // Email/SMS
      sendgridFromEmail: body.sendgridFromEmail || null,
      sendgridEnabled: body.sendgridEnabled || false,
      twilioAccountSid: body.twilioAccountSid || null,
      twilioPhoneNumber: body.twilioPhoneNumber || null,
      twilioEnabled: body.twilioEnabled || false,
      
      // SMTP Email Server
      smtpHost: body.smtpHost || null,
      smtpPort: body.smtpPort || 587,
      smtpUser: body.smtpUser || null,
      smtpFrom: body.smtpFrom || null,
      smtpFromName: body.smtpFromName || 'Sun Direct Power',
      smtpEnabled: body.smtpEnabled || false,
      
      // NEW: Facebook Lead Ads
      facebookAppId: body.facebookAppId || null,
      facebookVerifyToken: body.facebookVerifyToken || null,
      facebookEnabled: body.facebookEnabled || false,
      
      // NEW: Google Ads
      googleClientId: body.googleClientId || null,
      googleAdsCustomerId: body.googleAdsCustomerId || null,
      googleAdsEnabled: body.googleAdsEnabled || false,
      
      // NEW: WhatsApp
      whatsappBusinessId: body.whatsappBusinessId || null,
      whatsappPhoneNumberId: body.whatsappPhoneNumberId || null,
      whatsappWebhookSecret: body.whatsappWebhookSecret || null,
      whatsappEnabled: body.whatsappEnabled || false,
      
      // Microsoft 365 OAuth
      microsoftClientId: body.microsoftClientId || null,
      microsoftTenantId: body.microsoftTenantId || null,
      microsoftObjectId: body.microsoftObjectId || null,
      microsoftEnabled: body.microsoftEnabled || false,
      
      // Business Info
      businessName: body.businessName || 'Sun Direct Power',
      businessEmail: body.businessEmail || null,
      businessPhone: body.businessPhone || null,
    };

    // Only update keys if they're provided and not masked
    if (body.stripeSecretKey && !body.stripeSecretKey.startsWith('••••')) {
      updateData.stripeSecretKey = encryptKey(body.stripeSecretKey);
    }
    if (body.stripeWebhookSecret && !body.stripeWebhookSecret.startsWith('••••')) {
      updateData.stripeWebhookSecret = encryptKey(body.stripeWebhookSecret);
    }
    if (body.openaiApiKey && !body.openaiApiKey.startsWith('••••')) {
      updateData.openaiApiKey = encryptKey(body.openaiApiKey);
    }
    if (body.abacusApiKey && !body.abacusApiKey.startsWith('••••')) {
      updateData.abacusApiKey = encryptKey(body.abacusApiKey);
    }
    if (body.geminiApiKey) {
      // Handle array of keys
      if (Array.isArray(body.geminiApiKey)) {
        const keysToEncrypt = body.geminiApiKey.filter((key: string) => key && !key.startsWith('••••'));
        if (keysToEncrypt.length > 0) {
          updateData.geminiApiKey = encryptGeminiKeys(body.geminiApiKey);
        }
      }
    }
    if (body.googleMapsApiKey && !body.googleMapsApiKey.startsWith('••••')) {
      updateData.googleMapsApiKey = encryptKey(body.googleMapsApiKey);
    }
    if (body.sendgridApiKey && !body.sendgridApiKey.startsWith('••••')) {
      updateData.sendgridApiKey = encryptKey(body.sendgridApiKey);
    }
    if (body.twilioAuthToken && !body.twilioAuthToken.startsWith('••••')) {
      updateData.twilioAuthToken = encryptKey(body.twilioAuthToken);
    }
    if (body.smtpPassword && !body.smtpPassword.startsWith('••••')) {
      updateData.smtpPassword = encryptKey(body.smtpPassword);
    }
    
    // NEW: Facebook keys
    if (body.facebookAppSecret && !body.facebookAppSecret.startsWith('••••')) {
      updateData.facebookAppSecret = encryptKey(body.facebookAppSecret);
    }
    if (body.facebookPageAccessToken && !body.facebookPageAccessToken.startsWith('••••')) {
      updateData.facebookPageAccessToken = encryptKey(body.facebookPageAccessToken);
    }
    
    // NEW: Google keys
    if (body.googleAdsWebhookSecret && !body.googleAdsWebhookSecret.startsWith('••••')) {
      updateData.googleAdsWebhookSecret = encryptKey(body.googleAdsWebhookSecret);
    }
    if (body.googleClientSecret && !body.googleClientSecret.startsWith('••••')) {
      updateData.googleClientSecret = encryptKey(body.googleClientSecret);
    }
    if (body.googleRefreshToken && !body.googleRefreshToken.startsWith('••••')) {
      updateData.googleRefreshToken = encryptKey(body.googleRefreshToken);
    }
    if (body.googleAdsDeveloperToken && !body.googleAdsDeveloperToken.startsWith('••••')) {
      updateData.googleAdsDeveloperToken = encryptKey(body.googleAdsDeveloperToken);
    }
    
    // NEW: WhatsApp keys
    if (body.whatsappAccessToken && !body.whatsappAccessToken.startsWith('••••')) {
      updateData.whatsappAccessToken = encryptKey(body.whatsappAccessToken);
    }
    
    // Microsoft 365 OAuth keys
    if (body.microsoftClientSecret && !body.microsoftClientSecret.startsWith('••••')) {
      updateData.microsoftClientSecret = encryptKey(body.microsoftClientSecret);
    }

    if (settings) {
      // Update existing settings
      settings = await prisma.apiSettings.update({
        where: { id: settings.id },
        data: updateData,
      });
    } else {
      // Create new settings
      settings = await prisma.apiSettings.create({
        data: {
          ...updateData,
          active: true,
        },
      });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'API settings updated successfully',
      settings: {
        ...settings,
        // Mask keys in response
        stripeSecretKey: maskKey(settings.stripeSecretKey || ''),
        openaiApiKey: maskKey(settings.openaiApiKey || ''),
        abacusApiKey: maskKey(settings.abacusApiKey || ''),
        sendgridApiKey: maskKey(settings.sendgridApiKey || ''),
        twilioAuthToken: maskKey(settings.twilioAuthToken || ''),
        stripeWebhookSecret: maskKey(settings.stripeWebhookSecret || ''),
      }
    });
  } catch (error: any) {
    console.error('Error updating API settings:', error);
    return NextResponse.json(
      { error: 'Failed to update API settings', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Clear specific API keys
export async function DELETE(request: NextRequest) {
  const admin = getAdminFromRequest(request);
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const keyType = searchParams.get('keyType');

    const settings = await prisma.apiSettings.findFirst({
      where: { active: true },
      orderBy: { createdAt: 'desc' },
    });

    if (!settings) {
      return NextResponse.json({ error: 'No settings found' }, { status: 404 });
    }

    const updateData: any = {};

    switch (keyType) {
      case 'stripe':
        updateData.stripePublishableKey = null;
        updateData.stripeSecretKey = null;
        updateData.stripeWebhookSecret = null;
        updateData.stripeEnabled = false;
        break;
      case 'openai':
        updateData.openaiApiKey = null;
        updateData.openaiEnabled = false;
        break;
      case 'abacus':
        updateData.abacusApiKey = null;
        updateData.abacusEnabled = false;
        break;
      case 'gemini':
        updateData.geminiApiKey = null;
        updateData.geminiEnabled = false;
        break;
      case 'googleMaps':
        updateData.googleMapsApiKey = null;
        updateData.googleMapsEnabled = false;
        break;
      case 'sendgrid':
        updateData.sendgridApiKey = null;
        updateData.sendgridFromEmail = null;
        updateData.sendgridEnabled = false;
        break;
      case 'twilio':
        updateData.twilioAccountSid = null;
        updateData.twilioAuthToken = null;
        updateData.twilioPhoneNumber = null;
        updateData.twilioEnabled = false;
        break;
      case 'facebook':
        updateData.facebookAppId = null;
        updateData.facebookAppSecret = null;
        updateData.facebookPageAccessToken = null;
        updateData.facebookVerifyToken = null;
        updateData.facebookEnabled = false;
        break;
      case 'google':
        updateData.googleAdsWebhookSecret = null;
        updateData.googleClientId = null;
        updateData.googleClientSecret = null;
        updateData.googleRefreshToken = null;
        updateData.googleAdsCustomerId = null;
        updateData.googleAdsDeveloperToken = null;
        updateData.googleAdsEnabled = false;
        break;
      case 'whatsapp':
        updateData.whatsappBusinessId = null;
        updateData.whatsappPhoneNumberId = null;
        updateData.whatsappAccessToken = null;
        updateData.whatsappWebhookSecret = null;
        updateData.whatsappEnabled = false;
        break;
      case 'microsoft':
        updateData.microsoftClientId = null;
        updateData.microsoftClientSecret = null;
        updateData.microsoftTenantId = null;
        updateData.microsoftObjectId = null;
        updateData.microsoftEnabled = false;
        break;
      default:
        return NextResponse.json({ error: 'Invalid key type' }, { status: 400 });
    }

    await prisma.apiSettings.update({
      where: { id: settings.id },
      data: updateData,
    });

    return NextResponse.json({ 
      success: true, 
      message: `${keyType} keys cleared successfully` 
    });
  } catch (error: any) {
    console.error('Error clearing API keys:', error);
    return NextResponse.json(
      { error: 'Failed to clear API keys', details: error.message },
      { status: 500 }
    );
  }
}
