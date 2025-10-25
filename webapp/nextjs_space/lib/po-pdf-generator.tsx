/**
 * Purchase Order PDF Generator
 * 
 * Generates professional PDF purchase orders for suppliers
 * Uses @react-pdf/renderer
 */

import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 11,
    fontFamily: 'Helvetica',
    backgroundColor: '#ffffff',
  },
  header: {
    marginBottom: 30,
    borderBottom: '3 solid #2563eb',
    paddingBottom: 20,
  },
  companyName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2563eb',
    marginBottom: 5,
  },
  companyDetails: {
    fontSize: 10,
    color: '#666666',
    marginBottom: 3,
  },
  poTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1e40af',
    marginTop: 20,
    marginBottom: 10,
  },
  poNumber: {
    fontSize: 14,
    color: '#666666',
  },
  infoSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  infoBox: {
    width: '48%',
  },
  infoTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1e40af',
    marginBottom: 8,
    borderBottom: '1 solid #e5e7eb',
    paddingBottom: 4,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  infoLabel: {
    fontSize: 10,
    color: '#666666',
    width: '40%',
  },
  infoValue: {
    fontSize: 10,
    color: '#111827',
    width: '60%',
  },
  table: {
    marginTop: 20,
    marginBottom: 30,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#2563eb',
    padding: 10,
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 10,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '1 solid #e5e7eb',
    padding: 10,
    fontSize: 10,
  },
  tableRowAlt: {
    flexDirection: 'row',
    borderBottom: '1 solid #e5e7eb',
    padding: 10,
    fontSize: 10,
    backgroundColor: '#f9fafb',
  },
  colItem: {
    width: '40%',
  },
  colQty: {
    width: '15%',
    textAlign: 'right',
  },
  colUnit: {
    width: '15%',
    textAlign: 'center',
  },
  colPrice: {
    width: '15%',
    textAlign: 'right',
  },
  colTotal: {
    width: '15%',
    textAlign: 'right',
  },
  totalsSection: {
    marginLeft: 'auto',
    width: '40%',
    marginTop: 20,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingHorizontal: 10,
  },
  totalLabel: {
    fontSize: 11,
    color: '#666666',
  },
  totalValue: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#111827',
  },
  grandTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#eff6ff',
    padding: 12,
    borderRadius: 5,
    marginTop: 10,
  },
  grandTotalLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1e40af',
  },
  grandTotalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  notesSection: {
    marginTop: 30,
    padding: 15,
    backgroundColor: '#fff3cd',
    borderLeft: '4 solid #ffc107',
    borderRadius: 5,
  },
  notesTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#856404',
    marginBottom: 8,
  },
  notesText: {
    fontSize: 10,
    color: '#856404',
    lineHeight: 1.5,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    borderTop: '1 solid #e5e7eb',
    paddingTop: 15,
    fontSize: 9,
    color: '#666666',
    textAlign: 'center',
  },
});

interface POItem {
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  total: number;
  sku?: string;
}

interface POData {
  poNumber: string;
  date: string;
  jobNumber?: string;
  customerName?: string;
  deliveryAddress?: string;
  supplierName: string;
  supplierEmail?: string;
  supplierPhone?: string;
  supplierAddress?: string;
  items: POItem[];
  subtotal: number;
  tax: number;
  total: number;
  notes?: string;
  expectedDelivery?: string;
  paymentTerms?: string;
}

export const PurchaseOrderDocument = ({ data }: { data: POData }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.companyName}>Sun Direct Power</Text>
        <Text style={styles.companyDetails}>01 Whipper Street, Balcatta WA 6102</Text>
        <Text style={styles.companyDetails}>Phone: +61 (08) 9309 3209</Text>
        <Text style={styles.companyDetails}>Email: accounts@sundirectpower.com.au</Text>
        
        <Text style={styles.poTitle}>PURCHASE ORDER</Text>
        <Text style={styles.poNumber}>{data.poNumber}</Text>
      </View>

      {/* Info Section */}
      <View style={styles.infoSection}>
        {/* Supplier Info */}
        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>SUPPLIER</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Name:</Text>
            <Text style={styles.infoValue}>{data.supplierName}</Text>
          </View>
          {data.supplierEmail && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Email:</Text>
              <Text style={styles.infoValue}>{data.supplierEmail}</Text>
            </View>
          )}
          {data.supplierPhone && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Phone:</Text>
              <Text style={styles.infoValue}>{data.supplierPhone}</Text>
            </View>
          )}
          {data.supplierAddress && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Address:</Text>
              <Text style={styles.infoValue}>{data.supplierAddress}</Text>
            </View>
          )}
        </View>

        {/* Order Info */}
        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>ORDER DETAILS</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>PO Date:</Text>
            <Text style={styles.infoValue}>{data.date}</Text>
          </View>
          {data.jobNumber && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Job Number:</Text>
              <Text style={styles.infoValue}>{data.jobNumber}</Text>
            </View>
          )}
          {data.customerName && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Customer:</Text>
              <Text style={styles.infoValue}>{data.customerName}</Text>
            </View>
          )}
          {data.expectedDelivery && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Expected:</Text>
              <Text style={styles.infoValue}>{data.expectedDelivery}</Text>
            </View>
          )}
          {data.deliveryAddress && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Deliver To:</Text>
              <Text style={styles.infoValue}>{data.deliveryAddress}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Items Table */}
      <View style={styles.table}>
        {/* Table Header */}
        <View style={styles.tableHeader}>
          <Text style={styles.colItem}>ITEM DESCRIPTION</Text>
          <Text style={styles.colQty}>QTY</Text>
          <Text style={styles.colUnit}>UNIT</Text>
          <Text style={styles.colPrice}>UNIT PRICE</Text>
          <Text style={styles.colTotal}>TOTAL</Text>
        </View>

        {/* Table Rows */}
        {data.items.map((item, index) => (
          <View key={index} style={index % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
            <View style={styles.colItem}>
              <Text>{item.description}</Text>
              {item.sku && <Text style={{ fontSize: 8, color: '#999', marginTop: 2 }}>SKU: {item.sku}</Text>}
            </View>
            <Text style={styles.colQty}>{item.quantity}</Text>
            <Text style={styles.colUnit}>{item.unit}</Text>
            <Text style={styles.colPrice}>${item.unitPrice.toFixed(2)}</Text>
            <Text style={styles.colTotal}>${item.total.toFixed(2)}</Text>
          </View>
        ))}
      </View>

      {/* Totals */}
      <View style={styles.totalsSection}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Subtotal:</Text>
          <Text style={styles.totalValue}>${data.subtotal.toFixed(2)}</Text>
        </View>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>GST (10%):</Text>
          <Text style={styles.totalValue}>${data.tax.toFixed(2)}</Text>
        </View>
        <View style={styles.grandTotalRow}>
          <Text style={styles.grandTotalLabel}>TOTAL (inc GST):</Text>
          <Text style={styles.grandTotalValue}>${data.total.toFixed(2)}</Text>
        </View>
      </View>

      {/* Notes */}
      {data.notes && (
        <View style={styles.notesSection}>
          <Text style={styles.notesTitle}>Special Instructions:</Text>
          <Text style={styles.notesText}>{data.notes}</Text>
        </View>
      )}

      {/* Footer */}
      <View style={styles.footer}>
        <Text>Payment Terms: {data.paymentTerms || 'Net 30 days'}</Text>
        <Text style={{ marginTop: 5 }}>
          Please confirm receipt of this order and advise expected delivery date.
        </Text>
        <Text style={{ marginTop: 5 }}>
          For any queries, please contact accounts@sundirectpower.com.au
        </Text>
      </View>
    </Page>
  </Document>
);

/**
 * Generate PO PDF from material order
 */
export async function generatePOPDF(order: any): Promise<Buffer> {
  const { renderToBuffer } = await import('@react-pdf/renderer');
  
  // Format items
  const items: POItem[] = (order.items as any[]).map(item => ({
    description: `${item.brand} ${item.model}`,
    quantity: item.quantity,
    unit: item.unit,
    unitPrice: item.unitCost,
    total: item.totalCost,
    sku: item.sku,
  }));

  // Prepare PO data
  const poData: POData = {
    poNumber: order.poNumber,
    date: new Date(order.createdAt).toLocaleDateString('en-AU'),
    jobNumber: order.job?.jobNumber,
    customerName: order.job?.lead?.name,
    deliveryAddress: order.job?.lead?.address,
    supplierName: order.supplier.name,
    supplierEmail: order.supplier.email,
    supplierPhone: order.supplier.phone,
    supplierAddress: order.supplier.address,
    items,
    subtotal: order.subtotal,
    tax: order.tax,
    total: order.total,
    notes: order.notes,
    expectedDelivery: order.expectedDelivery 
      ? new Date(order.expectedDelivery).toLocaleDateString('en-AU')
      : undefined,
    paymentTerms: 'Net 30 days',
  };

  const doc = <PurchaseOrderDocument data={poData} />;
  const buffer = await renderToBuffer(doc);
  
  return buffer;
}
