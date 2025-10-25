/**
 * Queensland Electrical Compliance Certificate
 * Certificate of Testing and Compliance for Solar PV Installation
 * Electrical Safety Office Queensland
 */

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
    borderBottom: '2 solid #000',
    paddingBottom: 10,
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
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
    backgroundColor: '#f0f0f0',
    padding: 5,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  label: {
    width: '40%',
    fontWeight: 'bold',
  },
  value: {
    width: '60%',
  },
  grid: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  gridItem: {
    width: '50%',
  },
  table: {
    marginTop: 10,
    marginBottom: 10,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '1 solid #ddd',
    paddingVertical: 5,
  },
  tableHeader: {
    backgroundColor: '#333',
    color: '#fff',
    fontWeight: 'bold',
  },
  tableCol: {
    width: '33.33%',
    paddingHorizontal: 5,
  },
  checkbox: {
    width: 12,
    height: 12,
    border: '1 solid #000',
    marginRight: 5,
  },
  checkboxChecked: {
    width: 12,
    height: 12,
    border: '1 solid #000',
    backgroundColor: '#000',
    marginRight: 5,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  signatureBox: {
    marginTop: 10,
    border: '1 solid #000',
    padding: 10,
    minHeight: 60,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    fontSize: 8,
    textAlign: 'center',
    color: '#666',
  },
  warningBox: {
    backgroundColor: '#fff3cd',
    border: '1 solid #ffc107',
    padding: 10,
    marginVertical: 10,
  },
  warningText: {
    fontSize: 9,
    color: '#856404',
  },
});

interface QLDComplianceProps {
  // Installation Details
  installationAddress: string;
  installationDate: string;
  customerName: string;
  customerPhone: string;
  
  // System Details
  systemSize: number;
  panelCount: number;
  panelManufacturer: string;
  panelModel: string;
  inverterManufacturer: string;
  inverterModel: string;
  inverterCapacity: number;
  
  // Electrical Details
  meterNumber: string;
  supplyVoltage: string;
  earthingSystem: string;
  
  // Test Results
  insulationResistanceDC: number;
  insulationResistanceAC: number;
  earthContinuity: number;
  voltageRise: number;
  
  // Contractor Details
  contractorName: string;
  contractorLicense: string;
  contractorCompany: string;
  contractorPhone: string;
  
  // Electrician Details
  electricianName: string;
  electricianLicense: string;
  
  // Signatures
  electricianSignature?: string;
  customerSignature?: string;
  
  // Certificate Details
  certificateNumber?: string;
  issueDate: string;
}

export const QLDCompliance: React.FC<QLDComplianceProps> = (props) => {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>QUEENSLAND</Text>
          <Text style={styles.title}>ELECTRICAL COMPLIANCE CERTIFICATE</Text>
          <Text style={styles.subtitle}>Certificate of Testing and Compliance</Text>
          <Text style={styles.subtitle}>Solar Photovoltaic Installation</Text>
          <Text style={{ fontSize: 9, textAlign: 'center', marginTop: 5 }}>
            Electrical Safety Office Queensland
          </Text>
        </View>

        {/* Certificate Number */}
        {props.certificateNumber && (
          <View style={{ marginBottom: 15, textAlign: 'right' }}>
            <Text style={{ fontSize: 11, fontWeight: 'bold' }}>
              Certificate No: {props.certificateNumber}
            </Text>
            <Text style={{ fontSize: 9 }}>Issue Date: {props.issueDate}</Text>
          </View>
        )}

        {/* Installation Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. INSTALLATION DETAILS</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Installation Address:</Text>
            <Text style={styles.value}>{props.installationAddress}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Installation Date:</Text>
            <Text style={styles.value}>{props.installationDate}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Customer Name:</Text>
            <Text style={styles.value}>{props.customerName}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Customer Phone:</Text>
            <Text style={styles.value}>{props.customerPhone}</Text>
          </View>
        </View>

        {/* System Specifications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. SYSTEM SPECIFICATIONS</Text>
          <View style={styles.grid}>
            <View style={styles.gridItem}>
              <View style={styles.row}>
                <Text style={styles.label}>System Size:</Text>
                <Text style={styles.value}>{props.systemSize} kW</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Panel Count:</Text>
                <Text style={styles.value}>{props.panelCount}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Panel Make/Model:</Text>
                <Text style={styles.value}>{props.panelManufacturer} {props.panelModel}</Text>
              </View>
            </View>
            <View style={styles.gridItem}>
              <View style={styles.row}>
                <Text style={styles.label}>Inverter Make/Model:</Text>
                <Text style={styles.value}>{props.inverterManufacturer} {props.inverterModel}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Inverter Capacity:</Text>
                <Text style={styles.value}>{props.inverterCapacity} kW</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Meter Number:</Text>
                <Text style={styles.value}>{props.meterNumber}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Electrical Installation Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. ELECTRICAL INSTALLATION</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Supply Voltage:</Text>
            <Text style={styles.value}>{props.supplyVoltage}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Earthing System:</Text>
            <Text style={styles.value}>{props.earthingSystem}</Text>
          </View>
        </View>

        {/* Test Results */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. TEST RESULTS</Text>
          
          <View style={styles.table}>
            <View style={[styles.tableRow, styles.tableHeader]}>
              <Text style={styles.tableCol}>Test Description</Text>
              <Text style={styles.tableCol}>Result</Text>
              <Text style={styles.tableCol}>Pass/Fail</Text>
            </View>
            
            <View style={styles.tableRow}>
              <Text style={styles.tableCol}>Insulation Resistance (DC)</Text>
              <Text style={styles.tableCol}>{props.insulationResistanceDC} MΩ</Text>
              <Text style={styles.tableCol}>
                {props.insulationResistanceDC >= 1 ? '✓ PASS' : '✗ FAIL'}
              </Text>
            </View>
            
            <View style={styles.tableRow}>
              <Text style={styles.tableCol}>Insulation Resistance (AC)</Text>
              <Text style={styles.tableCol}>{props.insulationResistanceAC} MΩ</Text>
              <Text style={styles.tableCol}>
                {props.insulationResistanceAC >= 1 ? '✓ PASS' : '✗ FAIL'}
              </Text>
            </View>
            
            <View style={styles.tableRow}>
              <Text style={styles.tableCol}>Earth Continuity</Text>
              <Text style={styles.tableCol}>{props.earthContinuity} Ω</Text>
              <Text style={styles.tableCol}>
                {props.earthContinuity <= 0.5 ? '✓ PASS' : '✗ FAIL'}
              </Text>
            </View>
            
            <View style={styles.tableRow}>
              <Text style={styles.tableCol}>Voltage Rise</Text>
              <Text style={styles.tableCol}>{props.voltageRise}%</Text>
              <Text style={styles.tableCol}>
                {props.voltageRise <= 5 ? '✓ PASS' : '✗ FAIL'}
              </Text>
            </View>
          </View>
        </View>

        {/* Compliance Declaration */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. COMPLIANCE DECLARATION</Text>
          
          <View style={styles.checkboxRow}>
            <View style={styles.checkboxChecked} />
            <Text>Installation complies with AS/NZS 3000:2018 (Wiring Rules)</Text>
          </View>
          
          <View style={styles.checkboxRow}>
            <View style={styles.checkboxChecked} />
            <Text>Installation complies with AS/NZS 5033:2021 (Solar PV Arrays)</Text>
          </View>
          
          <View style={styles.checkboxRow}>
            <View style={styles.checkboxChecked} />
            <Text>Inverter complies with AS/NZS 4777.2:2020 (Grid Connection)</Text>
          </View>
          
          <View style={styles.checkboxRow}>
            <View style={styles.checkboxChecked} />
            <Text>All equipment is CEC approved</Text>
          </View>
          
          <View style={styles.checkboxRow}>
            <View style={styles.checkboxChecked} />
            <Text>Installation tested and commissioned successfully</Text>
          </View>
        </View>

        {/* Contractor Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>6. ELECTRICAL CONTRACTOR</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Company Name:</Text>
            <Text style={styles.value}>{props.contractorCompany}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Contractor Name:</Text>
            <Text style={styles.value}>{props.contractorName}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Contractor License:</Text>
            <Text style={styles.value}>{props.contractorLicense}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Contact Phone:</Text>
            <Text style={styles.value}>{props.contractorPhone}</Text>
          </View>
        </View>

        {/* Electrician Declaration */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>7. LICENSED ELECTRICIAN DECLARATION</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Electrician Name:</Text>
            <Text style={styles.value}>{props.electricianName}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>License Number:</Text>
            <Text style={styles.value}>{props.electricianLicense}</Text>
          </View>
          
          <Text style={{ marginTop: 10, fontSize: 9 }}>
            I declare that the electrical installation work described in this certificate has been carried out
            in accordance with AS/NZS 3000:2018, AS/NZS 5033:2021, and all applicable Queensland electrical
            safety legislation.
          </Text>
          
          <View style={styles.signatureBox}>
            {props.electricianSignature ? (
              <Image src={props.electricianSignature} style={{ maxHeight: 40 }} />
            ) : (
              <Text style={{ color: '#999' }}>Electrician Signature</Text>
            )}
          </View>
          <Text style={{ fontSize: 9 }}>Date: {props.issueDate}</Text>
        </View>

        {/* Customer Acknowledgment */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>8. CUSTOMER ACKNOWLEDGMENT</Text>
          <Text style={{ fontSize: 9, marginBottom: 10 }}>
            I acknowledge receipt of this certificate and confirm that the installation has been completed
            to my satisfaction.
          </Text>
          
          <View style={styles.signatureBox}>
            {props.customerSignature ? (
              <Image src={props.customerSignature} style={{ maxHeight: 40 }} />
            ) : (
              <Text style={{ color: '#999' }}>Customer Signature</Text>
            )}
          </View>
          <Text style={{ fontSize: 9 }}>Date: {props.issueDate}</Text>
        </View>

        {/* Warning */}
        <View style={styles.warningBox}>
          <Text style={styles.warningText}>
            IMPORTANT: This certificate must be submitted to the Electrical Safety Office Queensland within
            30 days of installation completion. Failure to submit may result in penalties.
          </Text>
        </View>

        {/* Footer */}
        <Text style={styles.footer}>
          Queensland Electrical Compliance Certificate | AS/NZS 3000:2018 | AS/NZS 5033:2021 | AS/NZS 4777.2:2020
        </Text>
      </Page>
    </Document>
  );
};
