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
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 3,
  },
  section: {
    marginBottom: 15,
    padding: 10,
    backgroundColor: '#f9fafb',
    borderRadius: 3,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
    borderBottom: '1 solid #d1d5db',
    paddingBottom: 4,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  label: {
    width: '40%',
    fontSize: 9,
    color: '#374151',
  },
  value: {
    width: '60%',
    fontSize: 9,
    fontWeight: 'bold',
  },
  testResults: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#ecfdf5',
    border: '1 solid #10b981',
    borderRadius: 3,
  },
  testRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  passIndicator: {
    color: '#059669',
    fontWeight: 'bold',
  },
  failIndicator: {
    color: '#dc2626',
    fontWeight: 'bold',
  },
  declaration: {
    marginTop: 15,
    padding: 12,
    backgroundColor: '#fef3c7',
    border: '1 solid #f59e0b',
    borderRadius: 3,
  },
  declarationText: {
    fontSize: 8,
    lineHeight: 1.4,
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
  signatureDetails: {
    fontSize: 9,
    marginBottom: 3,
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
    fontWeight: 'bold',
  },
});

interface VictoriaCOESData {
  certificateNumber: string;
  workType: 'Prescribed' | 'Non-prescribed';
  
  // Installation details
  installationAddress: string;
  installationDate: string;
  testingDate: string;
  
  // Electrician details
  electricianName: string;
  electricianLicense: string;
  electricianSignature?: string;
  
  // System details
  systemSize: number;
  systemDescription: string;
  
  // Test results
  insulationTestDC: number;
  insulationTestAC: number;
  insulationTestVoltage: number;
  earthContinuityTest: number;
  voltageRiseCalc: number;
  
  // Customer details
  customerName: string;
  customerPhone?: string;
  
  // Compliance
  complianceStandards: string[];
}

export const VictoriaCOES: React.FC<{ data: VictoriaCOESData }> = ({ data }) => {
  const insulationPassed = data.insulationTestDC >= 1.0 && data.insulationTestAC >= 1.0;
  const earthPassed = data.earthContinuityTest <= 0.5;
  const voltageRisePassed = data.voltageRiseCalc <= 5.0;
  const allTestsPassed = insulationPassed && earthPassed && voltageRisePassed;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>CERTIFICATE OF ELECTRICAL SAFETY</Text>
          <Text style={styles.subtitle}>Victoria - Energy Safe Victoria</Text>
          <Text style={styles.subtitle}>Certificate Type: {data.workType}</Text>
        </View>

        {/* Certificate Number */}
        <View style={{ marginBottom: 15, textAlign: 'center' }}>
          <Text style={{ fontSize: 14, fontWeight: 'bold' }}>
            Certificate No: {data.certificateNumber}
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
            <Text style={styles.label}>Testing Date:</Text>
            <Text style={styles.value}>{data.testingDate}</Text>
          </View>
          
          <View style={styles.row}>
            <Text style={styles.label}>System Description:</Text>
            <Text style={styles.value}>{data.systemDescription}</Text>
          </View>
          
          <View style={styles.row}>
            <Text style={styles.label}>System Size:</Text>
            <Text style={styles.value}>{data.systemSize}kW Solar PV System</Text>
          </View>
        </View>

        {/* Electrician Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Licensed Electrical Worker</Text>
          
          <View style={styles.row}>
            <Text style={styles.label}>Name:</Text>
            <Text style={styles.value}>{data.electricianName}</Text>
          </View>
          
          <View style={styles.row}>
            <Text style={styles.label}>License Number:</Text>
            <Text style={styles.value}>{data.electricianLicense}</Text>
          </View>
        </View>

        {/* Customer Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Customer Details</Text>
          
          <View style={styles.row}>
            <Text style={styles.label}>Name:</Text>
            <Text style={styles.value}>{data.customerName}</Text>
          </View>
          
          {data.customerPhone && (
            <View style={styles.row}>
              <Text style={styles.label}>Phone:</Text>
              <Text style={styles.value}>{data.customerPhone}</Text>
            </View>
          )}
        </View>

        {/* Test Results */}
        <View style={styles.testResults}>
          <Text style={[styles.sectionTitle, { borderBottom: 'none', color: '#065f46' }]}>
            Test Results
          </Text>
          
          <View style={styles.testRow}>
            <Text style={styles.label}>Insulation Resistance (DC):</Text>
            <Text style={styles.value}>{data.insulationTestDC.toFixed(2)} MΩ</Text>
            <Text style={insulationPassed ? styles.passIndicator : styles.failIndicator}>
              {insulationPassed ? '✓ PASS' : '✗ FAIL'}
            </Text>
          </View>
          
          <View style={styles.testRow}>
            <Text style={styles.label}>Insulation Resistance (AC):</Text>
            <Text style={styles.value}>{data.insulationTestAC.toFixed(2)} MΩ</Text>
            <Text style={insulationPassed ? styles.passIndicator : styles.failIndicator}>
              {insulationPassed ? '✓ PASS' : '✗ FAIL'}
            </Text>
          </View>
          
          <View style={styles.testRow}>
            <Text style={styles.label}>Test Voltage:</Text>
            <Text style={styles.value}>{data.insulationTestVoltage}V DC</Text>
            <Text style={{ fontSize: 9 }}>-</Text>
          </View>
          
          <View style={styles.testRow}>
            <Text style={styles.label}>Earth Continuity:</Text>
            <Text style={styles.value}>{data.earthContinuityTest.toFixed(3)} Ω</Text>
            <Text style={earthPassed ? styles.passIndicator : styles.failIndicator}>
              {earthPassed ? '✓ PASS' : '✗ FAIL'}
            </Text>
          </View>
          
          <View style={styles.testRow}>
            <Text style={styles.label}>Voltage Rise:</Text>
            <Text style={styles.value}>{data.voltageRiseCalc.toFixed(2)}%</Text>
            <Text style={voltageRisePassed ? styles.passIndicator : styles.failIndicator}>
              {voltageRisePassed ? '✓ PASS' : '✗ FAIL'}
            </Text>
          </View>
          
          <View style={{ marginTop: 10, paddingTop: 10, borderTop: '1 solid #10b981' }}>
            <Text style={{ fontSize: 11, fontWeight: 'bold', textAlign: 'center' }}>
              Overall Result: {allTestsPassed ? '✓ ALL TESTS PASSED' : '✗ TESTS FAILED'}
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

        {/* Declaration */}
        <View style={styles.declaration}>
          <Text style={[styles.declarationText, { fontWeight: 'bold', marginBottom: 6 }]}>
            DECLARATION
          </Text>
          <Text style={styles.declarationText}>
            I, {data.electricianName}, being a licensed electrical worker, hereby certify that:
          </Text>
          <Text style={styles.declarationText}>
            • The electrical installation work described above has been completed
          </Text>
          <Text style={styles.declarationText}>
            • The work complies with the requirements of the Electricity Safety Act 1998
          </Text>
          <Text style={styles.declarationText}>
            • The work complies with AS/NZS 3000:2018 and AS/NZS 5033:2021
          </Text>
          <Text style={styles.declarationText}>
            • All required testing has been completed with satisfactory results
          </Text>
          <Text style={styles.declarationText}>
            • The installation is safe for connection to the electricity supply
          </Text>
        </View>

        {/* Signature */}
        <View style={styles.signature}>
          <Text style={[styles.sectionTitle, { borderBottom: 'none' }]}>
            Licensed Electrical Worker Signature
          </Text>
          
          {data.electricianSignature && (
            <Image src={data.electricianSignature} style={styles.signatureImage} />
          )}
          
          <View style={styles.row}>
            <Text style={styles.signatureDetails}>Name: {data.electricianName}</Text>
          </View>
          
          <View style={styles.row}>
            <Text style={styles.signatureDetails}>License: {data.electricianLicense}</Text>
          </View>
          
          <View style={styles.row}>
            <Text style={styles.signatureDetails}>Date: {data.testingDate}</Text>
          </View>
        </View>

        {/* Warning for Prescribed Work */}
        {data.workType === 'Prescribed' && (
          <View style={styles.warningBox}>
            <Text style={styles.warningText}>
              ⚠ PRESCRIBED WORK - This certificate must be submitted to Energy Safe Victoria 
              within 30 days and BEFORE the installation is connected to the electricity supply.
            </Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text>This Certificate of Electrical Safety is issued in accordance with the Electricity Safety Act 1998</Text>
          <Text style={{ marginTop: 3 }}>
            Energy Safe Victoria | www.esv.vic.gov.au | Phone: 03 9203 9700
          </Text>
          <Text style={{ marginTop: 3 }}>
            Certificate must be retained for a minimum of 5 years
          </Text>
        </View>
      </Page>
    </Document>
  );
};
