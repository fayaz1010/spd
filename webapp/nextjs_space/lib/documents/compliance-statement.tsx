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
    fontSize: 20,
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
  checklistItem: {
    flexDirection: 'row',
    marginBottom: 5,
    alignItems: 'center',
  },
  checkbox: {
    width: 12,
    height: 12,
    border: '1 solid #000',
    marginRight: 8,
    backgroundColor: '#10b981',
  },
  checkboxUnchecked: {
    width: 12,
    height: 12,
    border: '1 solid #000',
    marginRight: 8,
  },
  checkmark: {
    fontSize: 10,
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  itemText: {
    fontSize: 9,
    flex: 1,
  },
  declaration: {
    marginTop: 15,
    padding: 12,
    backgroundColor: '#fef3c7',
    border: '2 solid #f59e0b',
    borderRadius: 3,
  },
  declarationText: {
    fontSize: 9,
    lineHeight: 1.5,
    marginBottom: 4,
  },
  signature: {
    marginTop: 20,
    padding: 15,
    border: '2 solid #000',
    borderRadius: 3,
  },
  signatureImage: {
    width: 200,
    height: 80,
    marginBottom: 10,
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
  complianceBox: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#ecfdf5',
    border: '2 solid #10b981',
    borderRadius: 3,
  },
  complianceText: {
    fontSize: 10,
    color: '#065f46',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  warningBox: {
    marginTop: 10,
    padding: 8,
    backgroundColor: '#fee2e2',
    border: '1 solid #ef4444',
    borderRadius: 3,
  },
  warningText: {
    fontSize: 8,
    color: '#991b1b',
  },
});

interface ComplianceStatementData {
  // Job details
  jobNumber: string;
  installationAddress: string;
  installationDate: string;
  
  // System details
  systemSize: number;
  panelCount: number;
  panelModel: string;
  panelWattage: number;
  inverterModel: string;
  inverterCapacity: number;
  batteryModel?: string;
  batteryCapacity?: number;
  
  // CEC details
  cecAccreditationNumber: string;
  cecDesignerNumber?: string;
  installerName: string;
  
  // Customer details
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  
  // Compliance checklist
  complianceChecks: {
    cecApprovedComponents: boolean;
    as5033Compliant: boolean;
    as4777Compliant: boolean;
    gridApprovalObtained: boolean;
    structuralAssessment: boolean;
    electricalCertificate: boolean;
    warrantyProvided: boolean;
    customerInformed: boolean;
    documentationComplete: boolean;
  };
  
  // Standards
  complianceStandards: string[];
  
  // Signature
  installerSignature?: string;
  declarationDate: string;
  
  // Company
  companyName: string;
  companyLogo?: string;
}

export const ComplianceStatement: React.FC<{ data: ComplianceStatementData }> = ({ data }) => {
  const allChecksPass = Object.values(data.complianceChecks).every(check => check === true);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          {data.companyLogo && (
            <Image src={data.companyLogo} style={styles.logo} />
          )}
          <Text style={styles.title}>COMPLIANCE STATEMENT</Text>
          <Text style={styles.subtitle}>Clean Energy Council (CEC) Compliance</Text>
          <Text style={styles.subtitle}>Solar Photovoltaic Installation</Text>
        </View>

        {/* Job Reference */}
        <View style={{ marginBottom: 15, textAlign: 'center' }}>
          <Text style={{ fontSize: 14, fontWeight: 'bold' }}>
            Job No: {data.jobNumber}
          </Text>
          <Text style={{ fontSize: 10, color: '#6b7280', marginTop: 3 }}>
            Date: {data.declarationDate}
          </Text>
        </View>

        {/* Installation Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Installation Details</Text>
          
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
          
          {data.customerPhone && (
            <View style={styles.row}>
              <Text style={styles.label}>Customer Phone:</Text>
              <Text style={styles.value}>{data.customerPhone}</Text>
            </View>
          )}
          
          {data.customerEmail && (
            <View style={styles.row}>
              <Text style={styles.label}>Customer Email:</Text>
              <Text style={styles.value}>{data.customerEmail}</Text>
            </View>
          )}
        </View>

        {/* System Specifications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>System Specifications</Text>
          
          <View style={styles.row}>
            <Text style={styles.label}>System Capacity:</Text>
            <Text style={styles.value}>{data.systemSize}kW</Text>
          </View>
          
          <View style={styles.row}>
            <Text style={styles.label}>Solar Panels:</Text>
            <Text style={styles.value}>
              {data.panelCount} × {data.panelModel} ({data.panelWattage}W)
            </Text>
          </View>
          
          <View style={styles.row}>
            <Text style={styles.label}>Inverter:</Text>
            <Text style={styles.value}>
              {data.inverterModel} ({data.inverterCapacity}kW)
            </Text>
          </View>
          
          {data.batteryModel && data.batteryCapacity && (
            <View style={styles.row}>
              <Text style={styles.label}>Battery Storage:</Text>
              <Text style={styles.value}>
                {data.batteryModel} ({data.batteryCapacity}kWh)
              </Text>
            </View>
          )}
        </View>

        {/* CEC Accreditation */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>CEC Accreditation</Text>
          
          <View style={styles.row}>
            <Text style={styles.label}>Installer Name:</Text>
            <Text style={styles.value}>{data.installerName}</Text>
          </View>
          
          <View style={styles.row}>
            <Text style={styles.label}>CEC Accreditation Number:</Text>
            <Text style={styles.value}>{data.cecAccreditationNumber}</Text>
          </View>
          
          {data.cecDesignerNumber && (
            <View style={styles.row}>
              <Text style={styles.label}>CEC Designer Number:</Text>
              <Text style={styles.value}>{data.cecDesignerNumber}</Text>
            </View>
          )}
          
          <View style={styles.row}>
            <Text style={styles.label}>Company:</Text>
            <Text style={styles.value}>{data.companyName}</Text>
          </View>
        </View>

        {/* Compliance Checklist */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Compliance Checklist</Text>
          
          <View style={styles.checklistItem}>
            <View style={data.complianceChecks.cecApprovedComponents ? styles.checkbox : styles.checkboxUnchecked}>
              {data.complianceChecks.cecApprovedComponents && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.itemText}>
              All components are CEC approved and listed on the CEC register
            </Text>
          </View>
          
          <View style={styles.checklistItem}>
            <View style={data.complianceChecks.as5033Compliant ? styles.checkbox : styles.checkboxUnchecked}>
              {data.complianceChecks.as5033Compliant && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.itemText}>
              Installation complies with AS/NZS 5033:2021 (PV arrays)
            </Text>
          </View>
          
          <View style={styles.checklistItem}>
            <View style={data.complianceChecks.as4777Compliant ? styles.checkbox : styles.checkboxUnchecked}>
              {data.complianceChecks.as4777Compliant && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.itemText}>
              Inverter complies with AS/NZS 4777.2:2020 (Grid connection)
            </Text>
          </View>
          
          <View style={styles.checklistItem}>
            <View style={data.complianceChecks.gridApprovalObtained ? styles.checkbox : styles.checkboxUnchecked}>
              {data.complianceChecks.gridApprovalObtained && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.itemText}>
              Network approval obtained from electricity distributor
            </Text>
          </View>
          
          <View style={styles.checklistItem}>
            <View style={data.complianceChecks.structuralAssessment ? styles.checkbox : styles.checkboxUnchecked}>
              {data.complianceChecks.structuralAssessment && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.itemText}>
              Structural assessment completed and roof suitable
            </Text>
          </View>
          
          <View style={styles.checklistItem}>
            <View style={data.complianceChecks.electricalCertificate ? styles.checkbox : styles.checkboxUnchecked}>
              {data.complianceChecks.electricalCertificate && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.itemText}>
              Certificate of Electrical Safety issued
            </Text>
          </View>
          
          <View style={styles.checklistItem}>
            <View style={data.complianceChecks.warrantyProvided ? styles.checkbox : styles.checkboxUnchecked}>
              {data.complianceChecks.warrantyProvided && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.itemText}>
              Product warranties and documentation provided to customer
            </Text>
          </View>
          
          <View style={styles.checklistItem}>
            <View style={data.complianceChecks.customerInformed ? styles.checkbox : styles.checkboxUnchecked}>
              {data.complianceChecks.customerInformed && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.itemText}>
              Customer informed of system operation and maintenance
            </Text>
          </View>
          
          <View style={styles.checklistItem}>
            <View style={data.complianceChecks.documentationComplete ? styles.checkbox : styles.checkboxUnchecked}>
              {data.complianceChecks.documentationComplete && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.itemText}>
              All documentation and handover pack provided
            </Text>
          </View>
        </View>

        {/* Compliance Standards */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Compliance Standards</Text>
          {data.complianceStandards.map((standard, index) => (
            <Text key={index} style={{ fontSize: 9, marginBottom: 3 }}>
              • {standard}
            </Text>
          ))}
        </View>

        {/* Overall Compliance Status */}
        {allChecksPass ? (
          <View style={styles.complianceBox}>
            <Text style={styles.complianceText}>
              ✓ ALL COMPLIANCE CHECKS PASSED
            </Text>
            <Text style={[styles.complianceText, { fontSize: 8, marginTop: 4 }]}>
              This installation meets all CEC and Australian Standards requirements
            </Text>
          </View>
        ) : (
          <View style={styles.warningBox}>
            <Text style={[styles.warningText, { fontWeight: 'bold' }]}>
              ⚠ COMPLIANCE CHECKS INCOMPLETE
            </Text>
            <Text style={styles.warningText}>
              Some compliance checks have not been completed. Please review before finalizing.
            </Text>
          </View>
        )}

        {/* Declaration */}
        <View style={styles.declaration}>
          <Text style={[styles.declarationText, { fontWeight: 'bold', marginBottom: 6 }]}>
            INSTALLER DECLARATION
          </Text>
          <Text style={styles.declarationText}>
            I, {data.installerName}, being a CEC accredited installer (No. {data.cecAccreditationNumber}), 
            hereby declare that:
          </Text>
          <Text style={styles.declarationText}>
            • This solar photovoltaic system has been installed in accordance with the Clean Energy Council 
            Guidelines for Solar PV System Installation
          </Text>
          <Text style={styles.declarationText}>
            • All components used are CEC approved and suitable for the application
          </Text>
          <Text style={styles.declarationText}>
            • The installation complies with all relevant Australian Standards
          </Text>
          <Text style={styles.declarationText}>
            • All required testing and commissioning has been completed
          </Text>
          <Text style={styles.declarationText}>
            • The customer has been provided with all necessary documentation and training
          </Text>
        </View>

        {/* Signature */}
        <View style={styles.signature}>
          <Text style={[styles.sectionTitle, { borderBottom: 'none' }]}>
            CEC Accredited Installer Signature
          </Text>
          
          {data.installerSignature && (
            <Image src={data.installerSignature} style={styles.signatureImage} />
          )}
          
          <View style={styles.row}>
            <Text style={{ fontSize: 9, marginBottom: 3 }}>Name: {data.installerName}</Text>
          </View>
          
          <View style={styles.row}>
            <Text style={{ fontSize: 9, marginBottom: 3 }}>
              CEC Accreditation: {data.cecAccreditationNumber}
            </Text>
          </View>
          
          <View style={styles.row}>
            <Text style={{ fontSize: 9, marginBottom: 3 }}>Date: {data.declarationDate}</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>
            This Compliance Statement is issued in accordance with Clean Energy Council Guidelines
          </Text>
          <Text style={{ marginTop: 3 }}>
            Clean Energy Council | www.cleanenergycouncil.org.au
          </Text>
          <Text style={{ marginTop: 3 }}>
            Document must be retained for audit purposes
          </Text>
        </View>
      </Page>
    </Document>
  );
};
