import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAdminFromRequest } from '@/lib/auth-admin';

export async function POST(request: NextRequest) {
  try {
    const admin = getAdminFromRequest(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { invoiceId } = await request.json();

    // Get invoice
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        job: {
          include: {
            lead: true,
          },
        },
        items: true,
      },
    });

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    // Get Xero integration
    const integration = await prisma.integration.findFirst({
      where: {
        provider: 'XERO',
        type: 'ACCOUNTING',
        enabled: true,
      },
    });

    if (!integration) {
      return NextResponse.json({ error: 'Xero not connected' }, { status: 400 });
    }

    // Refresh token if needed
    let accessToken = integration.accessToken;
    if (integration.expiresAt && integration.expiresAt < new Date()) {
      accessToken = await refreshXeroToken(integration);
    }

    // Create or update contact in Xero
    const contact = await createOrUpdateXeroContact(
      accessToken,
      integration.tenantId!,
      invoice.job.lead
    );

    // Create invoice in Xero
    const xeroInvoice = {
      Type: 'ACCREC', // Accounts Receivable
      Contact: {
        ContactID: contact.ContactID,
      },
      Date: invoice.createdAt.toISOString().split('T')[0],
      DueDate: invoice.dueDate?.toISOString().split('T')[0],
      InvoiceNumber: invoice.invoiceNumber,
      Reference: `Job ${invoice.job.jobNumber}`,
      LineItems: invoice.items.map(item => ({
        Description: item.description,
        Quantity: item.quantity,
        UnitAmount: item.unitPrice,
        TaxType: 'OUTPUT', // GST
        AccountCode: '200', // Sales account
      })),
      Status: invoice.status === 'paid' ? 'PAID' : 'AUTHORISED',
    };

    const response = await fetch(`https://api.xero.com/api.xro/2.0/Invoices`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Xero-tenant-id': integration.tenantId!,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ Invoices: [xeroInvoice] }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Xero API error: ${JSON.stringify(error)}`);
    }

    const result = await response.json();
    const xeroInvoiceId = result.Invoices[0].InvoiceID;

    // Update invoice with Xero ID
    await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        xeroInvoiceId,
        syncedToXero: true,
        syncedToXeroAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      xeroInvoiceId,
      message: 'Invoice synced to Xero successfully',
    });
  } catch (error: any) {
    console.error('Xero sync error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to sync invoice' },
      { status: 500 }
    );
  }
}

async function refreshXeroToken(integration: any): Promise<string> {
  const response = await fetch('https://identity.xero.com/connect/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${Buffer.from(
        `${process.env.XERO_CLIENT_ID}:${process.env.XERO_CLIENT_SECRET}`
      ).toString('base64')}`,
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: integration.refreshToken,
    }),
  });

  const tokens = await response.json();

  await prisma.integration.update({
    where: { id: integration.id },
    data: {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
    },
  });

  return tokens.access_token;
}

async function createOrUpdateXeroContact(
  accessToken: string,
  tenantId: string,
  lead: any
): Promise<any> {
  // Check if contact exists
  const searchResponse = await fetch(
    `https://api.xero.com/api.xro/2.0/Contacts?where=EmailAddress=="${lead.email}"`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Xero-tenant-id': tenantId,
      },
    }
  );

  const searchResult = await searchResponse.json();

  if (searchResult.Contacts && searchResult.Contacts.length > 0) {
    return searchResult.Contacts[0];
  }

  // Create new contact
  const contact = {
    Name: lead.name,
    EmailAddress: lead.email,
    Phones: lead.phone ? [{ PhoneType: 'DEFAULT', PhoneNumber: lead.phone }] : [],
    Addresses: lead.address
      ? [
          {
            AddressType: 'STREET',
            AddressLine1: lead.address,
            City: lead.suburb || '',
            PostalCode: lead.postcode || '',
            Country: 'Australia',
          },
        ]
      : [],
  };

  const createResponse = await fetch(`https://api.xero.com/api.xro/2.0/Contacts`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Xero-tenant-id': tenantId,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ Contacts: [contact] }),
  });

  const createResult = await createResponse.json();
  return createResult.Contacts[0];
}
