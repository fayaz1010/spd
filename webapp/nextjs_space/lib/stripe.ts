
import Stripe from 'stripe';
import { prisma } from './db';

/**
 * Get Stripe instance with API keys from database
 * Returns null if Stripe is not configured
 */
export async function getStripeInstance(): Promise<Stripe | null> {
  try {
    const settings = await prisma.apiSettings.findFirst({
      where: { active: true, stripeEnabled: true },
      orderBy: { createdAt: 'desc' },
    });

    if (!settings || !settings.stripeSecretKey) {
      console.warn('Stripe not configured');
      return null;
    }

    // Decrypt the secret key (from base64)
    const secretKey = Buffer.from(settings.stripeSecretKey, 'base64').toString('utf-8');

    return new Stripe(secretKey, {
      apiVersion: '2025-09-30.clover',
    });
  } catch (error) {
    console.error('Error initializing Stripe:', error);
    return null;
  }
}

/**
 * Get Stripe publishable key from database
 */
export async function getStripePublishableKey(): Promise<string | null> {
  try {
    const settings = await prisma.apiSettings.findFirst({
      where: { active: true, stripeEnabled: true },
      orderBy: { createdAt: 'desc' },
    });

    return settings?.stripePublishableKey || null;
  } catch (error) {
    console.error('Error fetching Stripe publishable key:', error);
    return null;
  }
}

/**
 * Get Stripe webhook secret from database
 */
export async function getStripeWebhookSecret(): Promise<string | null> {
  try {
    const settings = await prisma.apiSettings.findFirst({
      where: { active: true, stripeEnabled: true },
      orderBy: { createdAt: 'desc' },
    });

    if (!settings?.stripeWebhookSecret) {
      return null;
    }

    // Decrypt the webhook secret (from base64)
    return Buffer.from(settings.stripeWebhookSecret, 'base64').toString('utf-8');
  } catch (error) {
    console.error('Error fetching Stripe webhook secret:', error);
    return null;
  }
}

/**
 * Check if Stripe is configured and enabled
 */
export async function isStripeEnabled(): Promise<boolean> {
  try {
    const settings = await prisma.apiSettings.findFirst({
      where: { active: true, stripeEnabled: true },
      orderBy: { createdAt: 'desc' },
    });

    return !!(settings && settings.stripeSecretKey && settings.stripePublishableKey);
  } catch (error) {
    console.error('Error checking Stripe status:', error);
    return false;
  }
}
