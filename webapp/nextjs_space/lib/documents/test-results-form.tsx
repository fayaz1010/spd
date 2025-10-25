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
    width: '50%',
    fontSize: 9,
    color: '#4b5563',
  },
  value: {
    width: '30%',
    fontSize: 9,
    fontWeight: 'bold',
  },
  result: {
    width: '20%',
    fontSize: 9,
    fontWeight: 'bold',
    textAlign: 'right',
  },
  passResult: {
    color: '#059669',
  },
  failResult: {
    color: '#dc2626',
  },
  testTable: {
    marginTop: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#1f2937',
    padding: 8,
    borderRadius: 3,
    marginBottom: 5,
  },
  tableHeaderText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: 'bold',
  },
  tableRow: {
    flexDirection: 'row',
    padding: 6,
    borderBottom: '1 solid #e5e7eb',
  },
  summaryBox: {
    marginTop: 15,
    padding: 12,
    backgroundColor: '#ecfdf5',
    border: '2 solid #10b981',
    borderRadius: 3,
  },
  summaryText: {
    fontSize: 11,
    color: '#065f46',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  failBox: {
    marginTop: 15,
    padding: 12,
    backgroundColor: '#fee2e2',
    border: '2 solid #ef4444',
    borderRadius: 3,
  },
  failText: {
    fontSize: 11,
    color: '#991b1b',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  notesBox: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#fef3c7',
    border: '1 solid #f59e0b',
    borderRadius: 3,
  },
  notesText: {
    fontSize: 9,
    color: '#92400e',
    lineHeight: 1.4,
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
});

interface TestResultsData {
  // Job details
  jobNumber: string;
  installationAddress: string;
  testingDate: string;
  
  // System details
  systemSize: number;
  panelCount: number;
  inverterModel: string;
  
  // Tester details
  testerName: string;
  testerLicense: string;
  
  // Customer details
  customerName: string;
  
  // Pre-installation tests
  preInstallation: {
    roofCondition: 'PASS' | 'FAIL';
    roofConditionNotes?: string;
    structuralIntegrity: 'PASS' | 'FAIL';
    structuralNotes?: string;
    electricalSupply: 'PASS' | 'FAIL';
    electricalNotes?: string;
    earthingSystem: 'PASS' | 'FAIL';
    earthingNotes?: string;
  };
  
  // DC tests
  dcTests: {
    openCircuitVoltage: number;
    openCircuitVoltageExpected: number;
    shortCircuitCurrent: number;
    shortCircuitCurrentExpected: number;
    insulationResistance: number;
    insulationTestVoltage: number;
    polarity: 'CORRECT' | 'INCORRECT';
  };
  
  // AC tests
  acTests: {
    voltageL1N: number;
    voltageL2N?: number;
    voltageL3N?: number;
    frequency: number;
    insulationResistance: number;
    earthContinuity: number;
    earthLoopImpedance: number;
    rcdTest: 'PASS' | 'FAIL';
    rcdTripTime?: number;
  };
  
  // Functional tests
  functionalTests: {
    inverterStartup: 'PASS' | 'FAIL';
    gridConnection: 'PASS' | 'FAIL';
    antiIslanding: 'PASS' | 'FAIL';
    overVoltageProtection: 'PASS' | 'FAIL';
    underVoltageProtection: 'PASS' | 'FAIL';
    overFrequencyProtection: 'PASS' | 'FAIL';
    underFrequencyProtection: 'PASS' | 'FAIL';
    monitoring: 'PASS' | 'FAIL';
  };
  
  // Performance tests
  performanceTests: {
    powerOutput: number;
    powerOutputExpected: number;
    efficiency: number;
    voltageRise: number;
  };
  
  // Additional notes
  notes?: string;
  
  // Signature
  testerSignature?: string;
  
  // Company
  companyName: string;
  companyLogo?: string;
}

export const TestResultsForm: React.FC<{ data: TestResultsData }> = ({ data }) => {
  // Calculate pass/fail for DC tests
  const dcVocPass = Math.abs(data.dcTests.openCircuitVoltage - data.dcTests.openCircuitVoltageExpected) / data.dcTests.openCircuitVoltageExpected <= 0.1;
  const dcIscPass = Math.abs(data.dcTests.shortCircuitCurrent - data.dcTests.shortCircuitCurrentExpected) / data.dcTests.shortCircuitCurrentExpected <= 0.1;
  const dcInsulationPass = data.dcTests.insulationResistance >= 1.0;
  const dcPolarityPass = data.dcTests.polarity === 'CORRECT';
  
  // Calculate pass/fail for AC tests
  const acVoltagePass = data.acTests.voltageL1N >= 216 && data.acTests.voltageL1N <= 253;
  const acFrequencyPass = data.acTests.frequency >= 49.5 && data.acTests.frequency <= 50.5;
  const acInsulationPass = data.acTests.insulationResistance >= 1.0;
  const acEarthPass = data.acTests.earthContinuity <= 0.5;
  const acLoopPass = data.acTests.earthLoopImpedance <= 2.0;
  const acRcdPass = data.acTests.rcdTest === 'PASS';
  
  // Calculate pass/fail for performance
  const performancePass = (data.performanceTests.powerOutput / data.performanceTests.powerOutputExpected) >= 0.85;
  const voltageRisePass = data.performanceTests.voltageRise <= 5.0;
  
  // Overall result
  const preInstallPass = Object.values(data.preInstallation).every(v => v === 'PASS' || typeof v === 'string');
  const dcTestsPass = dcVocPass && dcIscPass && dcInsulationPass && dcPolarityPass;
  const acTestsPass = acVoltagePass && acFrequencyPass && acInsulationPass && acEarthPass && acLoopPass && acRcdPass;
  const functionalPass = Object.values(data.functionalTests).every(v => v === 'PASS');
  const performanceTestsPass = performancePass && voltageRisePass;
  
  const allTestsPass = preInstallPass && dcTestsPass && acTestsPass && functionalPass && performanceTestsPass;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          {data.companyLogo && (
            <Image src={data.companyLogo} style={styles.logo} />
          )}
          <Text style={styles.title}>TEST RESULTS & COMMISSIONING REPORT</Text>
          <Text style={styles.subtitle}>Solar Photovoltaic System</Text>
          <Text style={styles.subtitle}>AS/NZS 5033:2021 Compliant</Text>
        </View>

        {/* Job Reference */}
        <View style={{ marginBottom: 15, textAlign: 'center' }}>
          <Text style={{ fontSize: 14, fontWeight: 'bold' }}>
            Job No: {data.jobNumber}
          </Text>
          <Text style={{ fontSize: 10, color: '#6b7280', marginTop: 3 }}>
            Testing Date: {data.testingDate}
          </Text>
        </View>

        {/* Installation Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Installation Details</Text>
          
          <View style={styles.row}>
            <Text style={styles.label}>Installation Address:</Text>
            <Text style={[styles.value, { width: '50%' }]}>{data.installationAddress}</Text>
          </View>
          
          <View style={styles.row}>
            <Text style={styles.label}>Customer Name:</Text>
            <Text style={[styles.value, { width: '50%' }]}>{data.customerName}</Text>
          </View>
          
          <View style={styles.row}>
            <Text style={styles.label}>System Capacity:</Text>
            <Text style={[styles.value, { width: '50%' }]}>{data.systemSize}kW ({data.panelCount} panels)</Text>
          </View>
          
          <View style={styles.row}>
            <Text style={styles.label}>Inverter Model:</Text>
            <Text style={[styles.value, { width: '50%' }]}>{data.inverterModel}</Text>
          </View>
          
          <View style={styles.row}>
            <Text style={styles.label}>Tested By:</Text>
            <Text style={[styles.value, { width: '50%' }]}>{data.testerName} (Lic: {data.testerLicense})</Text>
          </View>
        </View>

        {/* Pre-Installation Tests */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pre-Installation Inspection</Text>
          
          <View style={styles.row}>
            <Text style={styles.label}>Roof Condition:</Text>
            <Text style={styles.value}>{data.preInstallation.roofCondition}</Text>
            <Text style={[styles.result, data.preInstallation.roofCondition === 'PASS' ? styles.passResult : styles.failResult]}>
              {data.preInstallation.roofCondition === 'PASS' ? '✓ PASS' : '✗ FAIL'}
            </Text>
          </View>
          
          <View style={styles.row}>
            <Text style={styles.label}>Structural Integrity:</Text>
            <Text style={styles.value}>{data.preInstallation.structuralIntegrity}</Text>
            <Text style={[styles.result, data.preInstallation.structuralIntegrity === 'PASS' ? styles.passResult : styles.failResult]}>
              {data.preInstallation.structuralIntegrity === 'PASS' ? '✓ PASS' : '✗ FAIL'}
            </Text>
          </View>
          
          <View style={styles.row}>
            <Text style={styles.label}>Electrical Supply:</Text>
            <Text style={styles.value}>{data.preInstallation.electricalSupply}</Text>
            <Text style={[styles.result, data.preInstallation.electricalSupply === 'PASS' ? styles.passResult : styles.failResult]}>
              {data.preInstallation.electricalSupply === 'PASS' ? '✓ PASS' : '✗ FAIL'}
            </Text>
          </View>
          
          <View style={styles.row}>
            <Text style={styles.label}>Earthing System:</Text>
            <Text style={styles.value}>{data.preInstallation.earthingSystem}</Text>
            <Text style={[styles.result, data.preInstallation.earthingSystem === 'PASS' ? styles.passResult : styles.failResult]}>
              {data.preInstallation.earthingSystem === 'PASS' ? '✓ PASS' : '✗ FAIL'}
            </Text>
          </View>
        </View>

        {/* DC Tests */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>DC System Tests</Text>
          
          <View style={styles.row}>
            <Text style={styles.label}>Open Circuit Voltage (Voc):</Text>
            <Text style={styles.value}>{data.dcTests.openCircuitVoltage}V (Expected: {data.dcTests.openCircuitVoltageExpected}V)</Text>
            <Text style={[styles.result, dcVocPass ? styles.passResult : styles.failResult]}>
              {dcVocPass ? '✓ PASS' : '✗ FAIL'}
            </Text>
          </View>
          
          <View style={styles.row}>
            <Text style={styles.label}>Short Circuit Current (Isc):</Text>
            <Text style={styles.value}>{data.dcTests.shortCircuitCurrent}A (Expected: {data.dcTests.shortCircuitCurrentExpected}A)</Text>
            <Text style={[styles.result, dcIscPass ? styles.passResult : styles.failResult]}>
              {dcIscPass ? '✓ PASS' : '✗ FAIL'}
            </Text>
          </View>
          
          <View style={styles.row}>
            <Text style={styles.label}>Insulation Resistance:</Text>
            <Text style={styles.value}>{data.dcTests.insulationResistance} MΩ @ {data.dcTests.insulationTestVoltage}V</Text>
            <Text style={[styles.result, dcInsulationPass ? styles.passResult : styles.failResult]}>
              {dcInsulationPass ? '✓ PASS' : '✗ FAIL'}
            </Text>
          </View>
          
          <View style={styles.row}>
            <Text style={styles.label}>Polarity Check:</Text>
            <Text style={styles.value}>{data.dcTests.polarity}</Text>
            <Text style={[styles.result, dcPolarityPass ? styles.passResult : styles.failResult]}>
              {dcPolarityPass ? '✓ PASS' : '✗ FAIL'}
            </Text>
          </View>
        </View>

        {/* AC Tests */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>AC System Tests</Text>
          
          <View style={styles.row}>
            <Text style={styles.label}>AC Voltage (L1-N):</Text>
            <Text style={styles.value}>{data.acTests.voltageL1N}V</Text>
            <Text style={[styles.result, acVoltagePass ? styles.passResult : styles.failResult]}>
              {acVoltagePass ? '✓ PASS' : '✗ FAIL'}
            </Text>
          </View>
          
          <View style={styles.row}>
            <Text style={styles.label}>Frequency:</Text>
            <Text style={styles.value}>{data.acTests.frequency}Hz</Text>
            <Text style={[styles.result, acFrequencyPass ? styles.passResult : styles.failResult]}>
              {acFrequencyPass ? '✓ PASS' : '✗ FAIL'}
            </Text>
          </View>
          
          <View style={styles.row}>
            <Text style={styles.label}>Insulation Resistance (AC):</Text>
            <Text style={styles.value}>{data.acTests.insulationResistance} MΩ</Text>
            <Text style={[styles.result, acInsulationPass ? styles.passResult : styles.failResult]}>
              {acInsulationPass ? '✓ PASS' : '✗ FAIL'}
            </Text>
          </View>
          
          <View style={styles.row}>
            <Text style={styles.label}>Earth Continuity:</Text>
            <Text style={styles.value}>{data.acTests.earthContinuity} Ω</Text>
            <Text style={[styles.result, acEarthPass ? styles.passResult : styles.failResult]}>
              {acEarthPass ? '✓ PASS' : '✗ FAIL'}
            </Text>
          </View>
          
          <View style={styles.row}>
            <Text style={styles.label}>Earth Loop Impedance:</Text>
            <Text style={styles.value}>{data.acTests.earthLoopImpedance} Ω</Text>
            <Text style={[styles.result, acLoopPass ? styles.passResult : styles.failResult]}>
              {acLoopPass ? '✓ PASS' : '✗ FAIL'}
            </Text>
          </View>
          
          <View style={styles.row}>
            <Text style={styles.label}>RCD Test:</Text>
            <Text style={styles.value}>
              {data.acTests.rcdTest} {data.acTests.rcdTripTime ? `(${data.acTests.rcdTripTime}ms)` : ''}
            </Text>
            <Text style={[styles.result, acRcdPass ? styles.passResult : styles.failResult]}>
              {acRcdPass ? '✓ PASS' : '✗ FAIL'}
            </Text>
          </View>
        </View>

        {/* Functional Tests */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Functional Tests</Text>
          
          <View style={styles.row}>
            <Text style={styles.label}>Inverter Startup:</Text>
            <Text style={styles.value}>{data.functionalTests.inverterStartup}</Text>
            <Text style={[styles.result, data.functionalTests.inverterStartup === 'PASS' ? styles.passResult : styles.failResult]}>
              {data.functionalTests.inverterStartup === 'PASS' ? '✓ PASS' : '✗ FAIL'}
            </Text>
          </View>
          
          <View style={styles.row}>
            <Text style={styles.label}>Grid Connection:</Text>
            <Text style={styles.value}>{data.functionalTests.gridConnection}</Text>
            <Text style={[styles.result, data.functionalTests.gridConnection === 'PASS' ? styles.passResult : styles.failResult]}>
              {data.functionalTests.gridConnection === 'PASS' ? '✓ PASS' : '✗ FAIL'}
            </Text>
          </View>
          
          <View style={styles.row}>
            <Text style={styles.label}>Anti-Islanding Protection:</Text>
            <Text style={styles.value}>{data.functionalTests.antiIslanding}</Text>
            <Text style={[styles.result, data.functionalTests.antiIslanding === 'PASS' ? styles.passResult : styles.failResult]}>
              {data.functionalTests.antiIslanding === 'PASS' ? '✓ PASS' : '✗ FAIL'}
            </Text>
          </View>
          
          <View style={styles.row}>
            <Text style={styles.label}>Over-Voltage Protection:</Text>
            <Text style={styles.value}>{data.functionalTests.overVoltageProtection}</Text>
            <Text style={[styles.result, data.functionalTests.overVoltageProtection === 'PASS' ? styles.passResult : styles.failResult]}>
              {data.functionalTests.overVoltageProtection === 'PASS' ? '✓ PASS' : '✗ FAIL'}
            </Text>
          </View>
          
          <View style={styles.row}>
            <Text style={styles.label}>Under-Voltage Protection:</Text>
            <Text style={styles.value}>{data.functionalTests.underVoltageProtection}</Text>
            <Text style={[styles.result, data.functionalTests.underVoltageProtection === 'PASS' ? styles.passResult : styles.failResult]}>
              {data.functionalTests.underVoltageProtection === 'PASS' ? '✓ PASS' : '✗ FAIL'}
            </Text>
          </View>
          
          <View style={styles.row}>
            <Text style={styles.label}>Over-Frequency Protection:</Text>
            <Text style={styles.value}>{data.functionalTests.overFrequencyProtection}</Text>
            <Text style={[styles.result, data.functionalTests.overFrequencyProtection === 'PASS' ? styles.passResult : styles.failResult]}>
              {data.functionalTests.overFrequencyProtection === 'PASS' ? '✓ PASS' : '✗ FAIL'}
            </Text>
          </View>
          
          <View style={styles.row}>
            <Text style={styles.label}>Under-Frequency Protection:</Text>
            <Text style={styles.value}>{data.functionalTests.underFrequencyProtection}</Text>
            <Text style={[styles.result, data.functionalTests.underFrequencyProtection === 'PASS' ? styles.passResult : styles.failResult]}>
              {data.functionalTests.underFrequencyProtection === 'PASS' ? '✓ PASS' : '✗ FAIL'}
            </Text>
          </View>
          
          <View style={styles.row}>
            <Text style={styles.label}>Monitoring System:</Text>
            <Text style={styles.value}>{data.functionalTests.monitoring}</Text>
            <Text style={[styles.result, data.functionalTests.monitoring === 'PASS' ? styles.passResult : styles.failResult]}>
              {data.functionalTests.monitoring === 'PASS' ? '✓ PASS' : '✗ FAIL'}
            </Text>
          </View>
        </View>

        {/* Performance Tests */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Performance Tests</Text>
          
          <View style={styles.row}>
            <Text style={styles.label}>Power Output:</Text>
            <Text style={styles.value}>
              {data.performanceTests.powerOutput}kW (Expected: {data.performanceTests.powerOutputExpected}kW)
            </Text>
            <Text style={[styles.result, performancePass ? styles.passResult : styles.failResult]}>
              {performancePass ? '✓ PASS' : '✗ FAIL'}
            </Text>
          </View>
          
          <View style={styles.row}>
            <Text style={styles.label}>System Efficiency:</Text>
            <Text style={styles.value}>{data.performanceTests.efficiency}%</Text>
            <Text style={styles.result}>-</Text>
          </View>
          
          <View style={styles.row}>
            <Text style={styles.label}>Voltage Rise:</Text>
            <Text style={styles.value}>{data.performanceTests.voltageRise}%</Text>
            <Text style={[styles.result, voltageRisePass ? styles.passResult : styles.failResult]}>
              {voltageRisePass ? '✓ PASS' : '✗ FAIL'}
            </Text>
          </View>
        </View>

        {/* Additional Notes */}
        {data.notes && (
          <View style={styles.notesBox}>
            <Text style={[styles.notesText, { fontWeight: 'bold', marginBottom: 4 }]}>
              Additional Notes:
            </Text>
            <Text style={styles.notesText}>{data.notes}</Text>
          </View>
        )}

        {/* Overall Result */}
        {allTestsPass ? (
          <View style={styles.summaryBox}>
            <Text style={styles.summaryText}>
              ✓ ALL TESTS PASSED
            </Text>
            <Text style={[styles.summaryText, { fontSize: 9, marginTop: 4 }]}>
              System is safe and ready for operation
            </Text>
          </View>
        ) : (
          <View style={styles.failBox}>
            <Text style={styles.failText}>
              ✗ SOME TESTS FAILED
            </Text>
            <Text style={[styles.failText, { fontSize: 9, marginTop: 4 }]}>
              System requires remediation before operation
            </Text>
          </View>
        )}

        {/* Signature */}
        <View style={styles.signature}>
          <Text style={[styles.sectionTitle, { borderBottom: 'none' }]}>
            Tester Signature
          </Text>
          
          {data.testerSignature && (
            <Image src={data.testerSignature} style={styles.signatureImage} />
          )}
          
          <View style={styles.row}>
            <Text style={{ fontSize: 9, marginBottom: 3 }}>Name: {data.testerName}</Text>
          </View>
          
          <View style={styles.row}>
            <Text style={{ fontSize: 9, marginBottom: 3 }}>License: {data.testerLicense}</Text>
          </View>
          
          <View style={styles.row}>
            <Text style={{ fontSize: 9, marginBottom: 3 }}>Date: {data.testingDate}</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>Test Results & Commissioning Report - AS/NZS 5033:2021</Text>
          <Text style={{ marginTop: 3 }}>
            {data.companyName} | Document must be retained for warranty and compliance purposes
          </Text>
        </View>
      </Page>
    </Document>
  );
};
