import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image, Font } from '@react-pdf/renderer';

// Define styles for PDF
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 12,
    fontFamily: 'Helvetica',
    backgroundColor: '#ffffff',
  },
  header: {
    marginBottom: 30,
    borderBottom: '2 solid #2563eb',
    paddingBottom: 20,
  },
  logo: {
    width: 120,
    height: 40,
    marginBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2563eb',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 10,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e40af',
    marginBottom: 10,
    borderBottom: '1 solid #e5e7eb',
    paddingBottom: 5,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  label: {
    fontSize: 11,
    color: '#666666',
  },
  value: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#111827',
  },
  highlight: {
    backgroundColor: '#eff6ff',
    padding: 15,
    borderRadius: 5,
    marginBottom: 15,
  },
  highlightRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  highlightLabel: {
    fontSize: 12,
    color: '#1e40af',
  },
  highlightValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  total: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  grid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  gridItem: {
    width: '30%',
    padding: 10,
    backgroundColor: '#f9fafb',
    borderRadius: 5,
  },
  gridLabel: {
    fontSize: 10,
    color: '#666666',
    marginBottom: 5,
  },
  gridValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
  },
  gridSubtext: {
    fontSize: 9,
    color: '#999999',
    marginTop: 3,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    borderTop: '1 solid #e5e7eb',
    paddingTop: 10,
    fontSize: 9,
    color: '#666666',
    textAlign: 'center',
  },
  greenText: {
    color: '#059669',
  },
  savingsBox: {
    backgroundColor: '#d1fae5',
    padding: 15,
    borderRadius: 5,
    marginBottom: 15,
  },
  environmentBox: {
    backgroundColor: '#dcfce7',
    padding: 15,
    borderRadius: 5,
    marginBottom: 15,
  },
  signatureSection: {
    marginTop: 30,
    padding: 15,
    border: '1 solid #e5e7eb',
    borderRadius: 5,
  },
  signatureImage: {
    width: 200,
    height: 80,
    marginVertical: 10,
  },
  signatureText: {
    fontSize: 10,
    color: '#666666',
    marginTop: 5,
  },
});

interface QuotePDFProps {
  quoteData: any;
  companySettings?: {
    companyName?: string;
    logoUrl?: string;
    primaryColor?: string;
  };
  signature?: {
    signatureData: string;
    signedBy: string;
    signedAt: string;
  };
}

export const QuotePDF: React.FC<QuotePDFProps> = ({ quoteData, companySettings, signature }) => {
  const companyName = companySettings?.companyName || 'Sun Direct Power';
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('en-AU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          {companySettings?.logoUrl && (
            <Image src={companySettings.logoUrl} style={styles.logo} />
          )}
          <Text style={styles.title}>Solar System Proposal</Text>
          <Text style={styles.subtitle}>
            Personalized quote for {quoteData.systemSizeKw}kW solar system
          </Text>
          <Text style={styles.subtitle}>
            Quote Reference: {quoteData.quoteReference || 'N/A'}
          </Text>
          <Text style={styles.subtitle}>
            Valid Until: {formatDate(quoteData.validUntil || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000))}
          </Text>
        </View>

        {/* System Overview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>System Overview</Text>
          <View style={styles.grid}>
            <View style={styles.gridItem}>
              <Text style={styles.gridLabel}>Solar Panels</Text>
              <Text style={styles.gridValue}>{quoteData.numPanels}</Text>
              <Text style={styles.gridSubtext}>{quoteData.panelBrand?.name || 'Premium Panels'}</Text>
              <Text style={styles.gridSubtext}>{quoteData.panelBrand?.wattage || 440}W each</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.gridLabel}>System Size</Text>
              <Text style={styles.gridValue}>{quoteData.systemSizeKw}kW</Text>
              <Text style={styles.gridSubtext}>{quoteData.inverterBrand?.name || 'Premium Inverter'}</Text>
            </View>
            {quoteData.batterySizeKwh && (
              <View style={styles.gridItem}>
                <Text style={styles.gridLabel}>Battery Storage</Text>
                <Text style={styles.gridValue}>{quoteData.batterySizeKwh}kWh</Text>
                <Text style={styles.gridSubtext}>{quoteData.batteryBrand?.name || 'Premium Battery'}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Investment Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Investment Summary</Text>
          <View style={styles.highlight}>
            <View style={styles.row}>
              <Text style={styles.label}>Solar Panel System</Text>
              <Text style={styles.value}>{formatCurrency(quoteData.solarCost || 0)}</Text>
            </View>
            {quoteData.batteryCost > 0 && (
              <View style={styles.row}>
                <Text style={styles.label}>Battery Storage</Text>
                <Text style={styles.value}>{formatCurrency(quoteData.batteryCost)}</Text>
              </View>
            )}
            {quoteData.inverterCost > 0 && (
              <View style={styles.row}>
                <Text style={styles.label}>Inverter</Text>
                <Text style={styles.value}>{formatCurrency(quoteData.inverterCost)}</Text>
              </View>
            )}
            <View style={styles.row}>
              <Text style={styles.label}>Installation</Text>
              <Text style={styles.value}>{formatCurrency(quoteData.installationCost || 0)}</Text>
            </View>
            <View style={[styles.row, { borderTop: '1 solid #d1d5db', paddingTop: 8, marginTop: 8 }]}>
              <Text style={styles.value}>Subtotal</Text>
              <Text style={styles.value}>{formatCurrency(quoteData.subtotal)}</Text>
            </View>
            <View style={styles.row}>
              <Text style={[styles.label, styles.greenText]}>Government Rebates</Text>
              <Text style={[styles.value, styles.greenText]}>-{formatCurrency(quoteData.totalRebates)}</Text>
            </View>
            <View style={[styles.row, { borderTop: '2 solid #2563eb', paddingTop: 10, marginTop: 10 }]}>
              <Text style={styles.total}>Your Investment</Text>
              <Text style={styles.total}>{formatCurrency(quoteData.finalTotal)}</Text>
            </View>
          </View>
        </View>

        {/* Rebates Breakdown */}
        {quoteData.rebates && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Government Rebates</Text>
            <View style={styles.row}>
              <Text style={styles.label}>Federal Solar Rebate (SRES)</Text>
              <Text style={styles.value}>{formatCurrency(quoteData.rebates.federalSRES || 0)}</Text>
            </View>
            {quoteData.rebates.federalBattery > 0 && (
              <View style={styles.row}>
                <Text style={styles.label}>Federal Battery Rebate</Text>
                <Text style={styles.value}>{formatCurrency(quoteData.rebates.federalBattery)}</Text>
              </View>
            )}
            {quoteData.rebates.waBatteryScheme > 0 && (
              <View style={styles.row}>
                <Text style={styles.label}>WA Battery Scheme</Text>
                <Text style={styles.value}>{formatCurrency(quoteData.rebates.waBatteryScheme)}</Text>
              </View>
            )}
          </View>
        )}

        {/* Savings Projection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Savings</Text>
          <View style={styles.savingsBox}>
            <View style={styles.highlightRow}>
              <Text style={styles.highlightLabel}>Annual Savings</Text>
              <Text style={styles.highlightValue}>{formatCurrency(quoteData.annualSavings)}</Text>
            </View>
            <View style={styles.highlightRow}>
              <Text style={styles.highlightLabel}>25-Year Savings</Text>
              <Text style={styles.highlightValue}>{formatCurrency(quoteData.savings25Years)}</Text>
            </View>
            <View style={styles.highlightRow}>
              <Text style={styles.highlightLabel}>Payback Period</Text>
              <Text style={styles.highlightValue}>{quoteData.paybackYears?.toFixed(1)} years</Text>
            </View>
          </View>
        </View>

        {/* Environmental Impact */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Environmental Impact</Text>
          <View style={styles.environmentBox}>
            <View style={styles.row}>
              <Text style={styles.label}>CO₂ Saved Annually</Text>
              <Text style={styles.value}>
                {(quoteData.systemSizeKw * 1460 * 0.7 / 1000).toFixed(1)} tonnes
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Equivalent Trees Planted</Text>
              <Text style={styles.value}>
                {Math.round(quoteData.systemSizeKw * 1460 * 0.7 / 1000 / 0.5)} trees
              </Text>
            </View>
          </View>
        </View>

        {/* Signature Section */}
        {signature && (
          <View style={styles.signatureSection}>
            <Text style={styles.sectionTitle}>Electronic Signature</Text>
            <Image src={signature.signatureData} style={styles.signatureImage} />
            <Text style={styles.signatureText}>Signed by: {signature.signedBy}</Text>
            <Text style={styles.signatureText}>Date: {formatDate(signature.signedAt)}</Text>
            <Text style={[styles.signatureText, { marginTop: 10, fontStyle: 'italic' }]}>
              This electronic signature is legally binding and has the same effect as a handwritten signature.
            </Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text>This quote is valid for 30 days from the date of issue.</Text>
          <Text style={{ marginTop: 5 }}>
            {companyName} | info@sundirectpower.com.au | 1300 XXX XXX
          </Text>
          <Text style={{ marginTop: 5 }}>
            ABN: XX XXX XXX XXX | CEC Accredited Installer
          </Text>
        </View>
      </Page>
    </Document>
  );
};
