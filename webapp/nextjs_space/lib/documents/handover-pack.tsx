import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 20,
    borderBottom: '3 solid #000',
    paddingBottom: 15,
  },
  logo: {
    width: 120,
    height: 40,
    marginBottom: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 3,
    color: '#6b7280',
  },
  welcomeBox: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#ecfdf5',
    border: '2 solid #10b981',
    borderRadius: 3,
  },
  welcomeText: {
    fontSize: 11,
    lineHeight: 1.6,
    color: '#065f46',
    marginBottom: 4,
  },
  section: {
    marginBottom: 15,
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 3,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#1f2937',
    borderBottom: '2 solid #e5e7eb',
    paddingBottom: 4,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  label: {
    width: '40%',
    fontSize: 9,
    color: '#4b5563',
  },
  value: {
    width: '60%',
    fontSize: 9,
    fontWeight: 'bold',
  },
  documentList: {
    marginTop: 8,
  },
  documentItem: {
    flexDirection: 'row',
    marginBottom: 6,
    alignItems: 'center',
  },
  documentIcon: {
    width: 16,
    height: 16,
    backgroundColor: '#10b981',
    borderRadius: 2,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  documentIconText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  documentText: {
    fontSize: 9,
    flex: 1,
  },
  contactBox: {
    marginTop: 15,
    padding: 12,
    backgroundColor: '#dbeafe',
    border: '2 solid #3b82f6',
    borderRadius: 3,
  },
  contactTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#1e40af',
  },
  contactText: {
    fontSize: 9,
    lineHeight: 1.5,
    color: '#1e3a8a',
    marginBottom: 3,
  },
  warningBox: {
    marginTop: 15,
    padding: 12,
    backgroundColor: '#fef3c7',
    border: '2 solid #f59e0b',
    borderRadius: 3,
  },
  warningTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 6,
    color: '#92400e',
  },
  warningText: {
    fontSize: 9,
    lineHeight: 1.5,
    color: '#78350f',
    marginBottom: 3,
  },
  maintenanceBox: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#f0fdf4',
    border: '1 solid #22c55e',
    borderRadius: 3,
  },
  maintenanceItem: {
    fontSize: 9,
    lineHeight: 1.5,
    marginBottom: 4,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    borderTop: '1 solid #d1d5db',
    paddingTop: 10,
    fontSize: 7,
    color: '#6b7280',
    textAlign: 'center',
  },
  qrCode: {
    width: 80,
    height: 80,
    marginTop: 10,
  },
});

interface HandoverPackData {
  // Job details
  jobNumber: string;
  installationAddress: string;
  installationDate: string;
  handoverDate: string;
  
  // System details
  systemSize: number;
  panelCount: number;
  panelModel: string;
  panelWarranty: string;
  inverterModel: string;
  inverterWarranty: string;
  batteryModel?: string;
  batteryWarranty?: string;
  estimatedAnnualGeneration: number;
  
  // Customer details
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  
  // Documents included
  documentsIncluded: {
    singleLineDiagram: boolean;
    electricalCertificate: boolean;
    complianceStatement: boolean;
    testResults: boolean;
    customerDeclaration: boolean;
    panelWarranty: boolean;
    inverterWarranty: boolean;
    batteryWarranty: boolean;
    installationManual: boolean;
    operationGuide: boolean;
    maintenanceSchedule: boolean;
    gridApproval: boolean;
    insuranceValuation: boolean;
  };
  
  // System access
  monitoringUrl?: string;
  monitoringUsername?: string;
  monitoringQRCode?: string;
  
  // Installer details
  installerName: string;
  installerPhone: string;
  installerEmail: string;
  
  // Company
  companyName: string;
  companyLogo?: string;
  companyPhone: string;
  companyEmail: string;
  companyWebsite: string;
  emergencyPhone: string;
  
  // Maintenance
  nextMaintenanceDate?: string;
  warrantyExpiryDate: string;
}

export const HandoverPack: React.FC<{ data: HandoverPackData }> = ({ data }) => {
  const documentCount = Object.values(data.documentsIncluded).filter(v => v === true).length;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          {data.companyLogo && (
            <Image src={data.companyLogo} style={styles.logo} />
          )}
          <Text style={styles.title}>HANDOVER PACK</Text>
          <Text style={styles.subtitle}>Solar Photovoltaic System</Text>
          <Text style={styles.subtitle}>Complete Installation Documentation</Text>
        </View>

        {/* Welcome Message */}
        <View style={styles.welcomeBox}>
          <Text style={[styles.welcomeText, { fontSize: 12, fontWeight: 'bold', marginBottom: 8 }]}>
            Congratulations on Your New Solar System!
          </Text>
          <Text style={styles.welcomeText}>
            Thank you for choosing {data.companyName} for your solar installation. This handover pack 
            contains all the documentation you need for your new {data.systemSize}kW solar system.
          </Text>
          <Text style={styles.welcomeText}>
            Please keep this pack in a safe place for future reference, warranty claims, and insurance purposes.
          </Text>
        </View>

        {/* Job Reference */}
        <View style={{ marginBottom: 15, textAlign: 'center' }}>
          <Text style={{ fontSize: 14, fontWeight: 'bold' }}>
            Job No: {data.jobNumber}
          </Text>
          <Text style={{ fontSize: 10, color: '#6b7280', marginTop: 3 }}>
            Handover Date: {data.handoverDate}
          </Text>
        </View>

        {/* Installation Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Installation Summary</Text>
          
          <View style={styles.row}>
            <Text style={styles.label}>Installation Address:</Text>
            <Text style={styles.value}>{data.installationAddress}</Text>
          </View>
          
          <View style={styles.row}>
            <Text style={styles.label}>Installation Date:</Text>
            <Text style={styles.value}>{data.installationDate}</Text>
          </View>
          
          <View style={styles.row}>
            <Text style={styles.label}>Customer Name:</Text>
            <Text style={styles.value}>{data.customerName}</Text>
          </View>
          
          <View style={styles.row}>
            <Text style={styles.label}>System Capacity:</Text>
            <Text style={styles.value}>{data.systemSize}kW</Text>
          </View>
          
          <View style={styles.row}>
            <Text style={styles.label}>Solar Panels:</Text>
            <Text style={styles.value}>{data.panelCount} × {data.panelModel}</Text>
          </View>
          
          <View style={styles.row}>
            <Text style={styles.label}>Inverter:</Text>
            <Text style={styles.value}>{data.inverterModel}</Text>
          </View>
          
          {data.batteryModel && (
            <View style={styles.row}>
              <Text style={styles.label}>Battery Storage:</Text>
              <Text style={styles.value}>{data.batteryModel}</Text>
            </View>
          )}
          
          <View style={styles.row}>
            <Text style={styles.label}>Est. Annual Generation:</Text>
            <Text style={styles.value}>{data.estimatedAnnualGeneration.toLocaleString()} kWh/year</Text>
          </View>
          
          <View style={styles.row}>
            <Text style={styles.label}>Installed By:</Text>
            <Text style={styles.value}>{data.installerName}</Text>
          </View>
        </View>

        {/* Documents Included */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Documents Included ({documentCount} documents)</Text>
          
          <View style={styles.documentList}>
            {data.documentsIncluded.singleLineDiagram && (
              <View style={styles.documentItem}>
                <View style={styles.documentIcon}>
                  <Text style={styles.documentIconText}>✓</Text>
                </View>
                <Text style={styles.documentText}>Single Line Diagram (SLD)</Text>
              </View>
            )}
            
            {data.documentsIncluded.electricalCertificate && (
              <View style={styles.documentItem}>
                <View style={styles.documentIcon}>
                  <Text style={styles.documentIconText}>✓</Text>
                </View>
                <Text style={styles.documentText}>Certificate of Electrical Safety</Text>
              </View>
            )}
            
            {data.documentsIncluded.complianceStatement && (
              <View style={styles.documentItem}>
                <View style={styles.documentIcon}>
                  <Text style={styles.documentIconText}>✓</Text>
                </View>
                <Text style={styles.documentText}>CEC Compliance Statement</Text>
              </View>
            )}
            
            {data.documentsIncluded.testResults && (
              <View style={styles.documentItem}>
                <View style={styles.documentIcon}>
                  <Text style={styles.documentIconText}>✓</Text>
                </View>
                <Text style={styles.documentText}>Test Results & Commissioning Report</Text>
              </View>
            )}
            
            {data.documentsIncluded.customerDeclaration && (
              <View style={styles.documentItem}>
                <View style={styles.documentIcon}>
                  <Text style={styles.documentIconText}>✓</Text>
                </View>
                <Text style={styles.documentText}>Customer Declaration (STC Assignment)</Text>
              </View>
            )}
            
            {data.documentsIncluded.panelWarranty && (
              <View style={styles.documentItem}>
                <View style={styles.documentIcon}>
                  <Text style={styles.documentIconText}>✓</Text>
                </View>
                <Text style={styles.documentText}>Solar Panel Warranty ({data.panelWarranty})</Text>
              </View>
            )}
            
            {data.documentsIncluded.inverterWarranty && (
              <View style={styles.documentItem}>
                <View style={styles.documentIcon}>
                  <Text style={styles.documentIconText}>✓</Text>
                </View>
                <Text style={styles.documentText}>Inverter Warranty ({data.inverterWarranty})</Text>
              </View>
            )}
            
            {data.documentsIncluded.batteryWarranty && data.batteryWarranty && (
              <View style={styles.documentItem}>
                <View style={styles.documentIcon}>
                  <Text style={styles.documentIconText}>✓</Text>
                </View>
                <Text style={styles.documentText}>Battery Warranty ({data.batteryWarranty})</Text>
              </View>
            )}
            
            {data.documentsIncluded.installationManual && (
              <View style={styles.documentItem}>
                <View style={styles.documentIcon}>
                  <Text style={styles.documentIconText}>✓</Text>
                </View>
                <Text style={styles.documentText}>Installation Manual</Text>
              </View>
            )}
            
            {data.documentsIncluded.operationGuide && (
              <View style={styles.documentItem}>
                <View style={styles.documentIcon}>
                  <Text style={styles.documentIconText}>✓</Text>
                </View>
                <Text style={styles.documentText}>System Operation Guide</Text>
              </View>
            )}
            
            {data.documentsIncluded.maintenanceSchedule && (
              <View style={styles.documentItem}>
                <View style={styles.documentIcon}>
                  <Text style={styles.documentIconText}>✓</Text>
                </View>
                <Text style={styles.documentText}>Maintenance Schedule</Text>
              </View>
            )}
            
            {data.documentsIncluded.gridApproval && (
              <View style={styles.documentItem}>
                <View style={styles.documentIcon}>
                  <Text style={styles.documentIconText}>✓</Text>
                </View>
                <Text style={styles.documentText}>Grid Connection Approval</Text>
              </View>
            )}
            
            {data.documentsIncluded.insuranceValuation && (
              <View style={styles.documentItem}>
                <View style={styles.documentIcon}>
                  <Text style={styles.documentIconText}>✓</Text>
                </View>
                <Text style={styles.documentText}>Insurance Valuation Certificate</Text>
              </View>
            )}
          </View>
        </View>

        {/* System Monitoring */}
        {data.monitoringUrl && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>System Monitoring Access</Text>
            
            <View style={styles.row}>
              <Text style={styles.label}>Monitoring Portal:</Text>
              <Text style={styles.value}>{data.monitoringUrl}</Text>
            </View>
            
            {data.monitoringUsername && (
              <View style={styles.row}>
                <Text style={styles.label}>Username:</Text>
                <Text style={styles.value}>{data.monitoringUsername}</Text>
              </View>
            )}
            
            {data.monitoringQRCode && (
              <View style={{ marginTop: 10 }}>
                <Text style={{ fontSize: 9, marginBottom: 5 }}>Scan QR code for quick access:</Text>
                <Image src={data.monitoringQRCode} style={styles.qrCode} />
              </View>
            )}
            
            <Text style={{ fontSize: 8, marginTop: 8, color: '#6b7280' }}>
              Password has been sent to your email: {data.customerEmail}
            </Text>
          </View>
        )}

        {/* Warranty Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Warranty Information</Text>
          
          <View style={styles.row}>
            <Text style={styles.label}>Solar Panels:</Text>
            <Text style={styles.value}>{data.panelWarranty}</Text>
          </View>
          
          <View style={styles.row}>
            <Text style={styles.label}>Inverter:</Text>
            <Text style={styles.value}>{data.inverterWarranty}</Text>
          </View>
          
          {data.batteryWarranty && (
            <View style={styles.row}>
              <Text style={styles.label}>Battery:</Text>
              <Text style={styles.value}>{data.batteryWarranty}</Text>
            </View>
          )}
          
          <View style={styles.row}>
            <Text style={styles.label}>Installation Workmanship:</Text>
            <Text style={styles.value}>10 years</Text>
          </View>
          
          <View style={styles.row}>
            <Text style={styles.label}>Warranty Expires:</Text>
            <Text style={styles.value}>{data.warrantyExpiryDate}</Text>
          </View>
          
          {data.nextMaintenanceDate && (
            <View style={styles.row}>
              <Text style={styles.label}>Next Maintenance Due:</Text>
              <Text style={styles.value}>{data.nextMaintenanceDate}</Text>
            </View>
          )}
        </View>

        {/* Maintenance Tips */}
        <View style={styles.maintenanceBox}>
          <Text style={[styles.sectionTitle, { borderBottom: 'none', color: '#166534', marginBottom: 8 }]}>
            Maintenance Tips
          </Text>
          
          <Text style={styles.maintenanceItem}>
            • Clean panels every 6-12 months (or after dust storms)
          </Text>
          <Text style={styles.maintenanceItem}>
            • Check inverter display regularly for error messages
          </Text>
          <Text style={styles.maintenanceItem}>
            • Monitor system performance via the monitoring app
          </Text>
          <Text style={styles.maintenanceItem}>
            • Keep vegetation trimmed to avoid shading
          </Text>
          <Text style={styles.maintenanceItem}>
            • Schedule professional inspection every 2-3 years
          </Text>
          <Text style={styles.maintenanceItem}>
            • Contact us immediately if you notice reduced performance
          </Text>
        </View>

        {/* Important Safety Information */}
        <View style={styles.warningBox}>
          <Text style={styles.warningTitle}>⚠ IMPORTANT SAFETY INFORMATION</Text>
          
          <Text style={styles.warningText}>
            • Do NOT attempt to repair or modify the system yourself
          </Text>
          <Text style={styles.warningText}>
            • Solar panels generate electricity even in low light - always dangerous
          </Text>
          <Text style={styles.warningText}>
            • Use isolator switches before any maintenance
          </Text>
          <Text style={styles.warningText}>
            • Keep children away from electrical equipment
          </Text>
          <Text style={styles.warningText}>
            • In case of fire, inform firefighters about the solar system
          </Text>
          <Text style={styles.warningText}>
            • Notify your insurance company of the solar installation
          </Text>
        </View>

        {/* Contact Information */}
        <View style={styles.contactBox}>
          <Text style={styles.contactTitle}>Contact Information</Text>
          
          <Text style={[styles.contactText, { fontWeight: 'bold', marginBottom: 6 }]}>
            {data.companyName}
          </Text>
          
          <Text style={styles.contactText}>
            📞 Phone: {data.companyPhone}
          </Text>
          <Text style={styles.contactText}>
            📧 Email: {data.companyEmail}
          </Text>
          <Text style={styles.contactText}>
            🌐 Website: {data.companyWebsite}
          </Text>
          <Text style={[styles.contactText, { marginTop: 6, fontWeight: 'bold', color: '#dc2626' }]}>
            🚨 Emergency: {data.emergencyPhone}
          </Text>
          
          <Text style={[styles.contactText, { marginTop: 8, fontSize: 8 }]}>
            Your installer: {data.installerName} - {data.installerPhone}
          </Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>Handover Pack - {data.companyName}</Text>
          <Text style={{ marginTop: 3 }}>
            Keep this document safe for warranty claims and future reference
          </Text>
          <Text style={{ marginTop: 3 }}>
            Generated: {data.handoverDate} | Job No: {data.jobNumber}
          </Text>
        </View>
      </Page>
    </Document>
  );
};
