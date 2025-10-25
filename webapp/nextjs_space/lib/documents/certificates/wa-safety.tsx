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
  noticeBox: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#dbeafe',
    border: '1 solid #3b82f6',
    borderRadius: 3,
  },
  noticeText: {
    fontSize: 8,
    color: '#1e40af',
    marginBottom: 3,
  },
  waLogo: {
    textAlign: 'center',
    marginBottom: 10,
  },
});

interface WASafetyData {
  certificateNumber: string;
  noticeOfCompletionNumber?: string;
  
  // Installation details
  installationAddress: string;
  installationDate: string;
  testingDate: string;
  
  // Electrician details
  electricianName: string;
  electricianLicense: string;
  electricianSignature?: string;
  contractorName?: string;
  contractorLicense?: string;
  
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
  
  // WA Battery Scheme (if applicable)
  batterySchemeEligible?: boolean;
  batteryCapacity?: number;
}

export const WASafety: React.FC<{ data: WASafetyData }> = ({ data }) => {
  const insulationPassed = data.insulationTestDC >= 1.0 && data.insulationTestAC >= 1.0;
  const earthPassed = data.earthContinuityTest <= 0.5;
  const voltageRisePassed = data.voltageRiseCalc <= 5.0;
  const allTestsPassed = insulationPassed && earthPassed && voltageRisePassed;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.waLogo}>
            <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#1e40af' }}>
              BUILDING AND ENERGY
            </Text>
            <Text style={{ fontSize: 10, color: '#6b7280' }}>
              Government of Western Australia
            </Text>
          </View>
          <Text style={styles.title}>CERTIFICATE OF ELECTRICAL SAFETY</Text>
          <Text style={styles.subtitle}>Western Australia</Text>
          <Text style={styles.subtitle}>Solar Photovoltaic Installation</Text>
        </View>

        {/* Certificate Numbers */}
        <View style={{ marginBottom: 15, textAlign: 'center' }}>
          <Text style={{ fontSize: 14, fontWeight: 'bold', marginBottom: 3 }}>
            Certificate No: {data.certificateNumber}
          </Text>
          {data.noticeOfCompletionNumber && (
            <Text style={{ fontSize: 11, color: '#6b7280' }}>
              Notice of Completion No: {data.noticeOfCompletionNumber}
            </Text>
          )}
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
            <Text style={styles.label}>Work Description:</Text>
            <Text style={styles.value}>{data.systemDescription}</Text>
          </View>
          
          <View style={styles.row}>
            <Text style={styles.label}>System Capacity:</Text>
            <Text style={styles.value}>{data.systemSize}kW Solar PV System</Text>
          </View>
          
          {data.batterySchemeEligible && data.batteryCapacity && (
            <View style={styles.row}>
              <Text style={styles.label}>Battery Storage:</Text>
              <Text style={styles.value}>
                {data.batteryCapacity}kWh (WA Battery Scheme Eligible)
              </Text>
            </View>
          )}
        </View>

        {/* Electrical Contractor Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Licensed Electrical Contractor</Text>
          
          {data.contractorName && (
            <>
              <View style={styles.row}>
                <Text style={styles.label}>Contractor Name:</Text>
                <Text style={styles.value}>{data.contractorName}</Text>
              </View>
              
              <View style={styles.row}>
                <Text style={styles.label}>Contractor License:</Text>
                <Text style={styles.value}>{data.contractorLicense}</Text>
              </View>
            </>
          )}
          
          <View style={styles.row}>
            <Text style={styles.label}>Electrician Name:</Text>
            <Text style={styles.value}>{data.electricianName}</Text>
          </View>
          
          <View style={styles.row}>
            <Text style={styles.label}>Electrician License:</Text>
            <Text style={styles.value}>{data.electricianLicense}</Text>
          </View>
        </View>

        {/* Customer Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Customer/Owner Details</Text>
          
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
            Testing and Verification Results
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
            ELECTRICAL CONTRACTOR DECLARATION
          </Text>
          <Text style={styles.declarationText}>
            I, {data.electricianName}, being a licensed electrical worker, hereby certify that:
          </Text>
          <Text style={styles.declarationText}>
            • The electrical installation work has been completed in accordance with AS/NZS 3000:2018
          </Text>
          <Text style={styles.declarationText}>
            • The solar photovoltaic installation complies with AS/NZS 5033:2021
          </Text>
          <Text style={styles.declarationText}>
            • All required testing and verification has been completed with satisfactory results
          </Text>
          <Text style={styles.declarationText}>
            • The installation is safe and complies with the Electricity (Licensing) Regulations 1991
          </Text>
          <Text style={styles.declarationText}>
            • A Notice of Completion will be submitted to Building and Energy as required
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
            <Text style={{ fontSize: 9, marginBottom: 3 }}>Name: {data.electricianName}</Text>
          </View>
          
          <View style={styles.row}>
            <Text style={{ fontSize: 9, marginBottom: 3 }}>License: {data.electricianLicense}</Text>
          </View>
          
          <View style={styles.row}>
            <Text style={{ fontSize: 9, marginBottom: 3 }}>Date: {data.testingDate}</Text>
          </View>
        </View>

        {/* WA Battery Scheme Notice */}
        {data.batterySchemeEligible && (
          <View style={styles.noticeBox}>
            <Text style={[styles.noticeText, { fontWeight: 'bold', marginBottom: 5 }]}>
              WA BATTERY SCHEME ELIGIBLE
            </Text>
            <Text style={styles.noticeText}>
              This installation includes a battery storage system that may be eligible for the 
              WA Battery Scheme rebate (up to $5,000).
            </Text>
            <Text style={styles.noticeText}>
              • Battery capacity: {data.batteryCapacity}kWh
            </Text>
            <Text style={styles.noticeText}>
              • Customer must apply separately for the WA Battery Scheme rebate
            </Text>
            <Text style={styles.noticeText}>
              • Visit www.energy.wa.gov.au for more information
            </Text>
          </View>
        )}

        {/* Notice of Completion Reminder */}
        <View style={[styles.noticeBox, { backgroundColor: '#fef3c7', borderColor: '#f59e0b' }]}>
          <Text style={[styles.noticeText, { color: '#92400e', fontWeight: 'bold' }]}>
            ⚠ IMPORTANT: Notice of Completion Required
          </Text>
          <Text style={[styles.noticeText, { color: '#92400e' }]}>
            A Notice of Completion must be submitted to Building and Energy within 28 days 
            of completing this electrical work.
          </Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>This Certificate of Electrical Safety is issued in accordance with WA Electrical Regulations</Text>
          <Text style={{ marginTop: 3 }}>
            Building and Energy | www.dmirs.wa.gov.au/building-and-energy | Phone: 1300 489 099
          </Text>
          <Text style={{ marginTop: 3 }}>
            Certificate must be retained for a minimum of 7 years
          </Text>
        </View>
      </Page>
    </Document>
  );
};
