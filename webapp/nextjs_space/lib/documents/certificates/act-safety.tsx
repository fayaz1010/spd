/**
 * Australian Capital Territory Certificate of Electrical Safety
 * Certificate of Electrical Safety for Solar PV Installation
 * Access Canberra
 */

import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: 'Helvetica' },
  header: { marginBottom: 20, borderBottom: '2 solid #000', paddingBottom: 10 },
  title: { fontSize: 18, fontWeight: 'bold', textAlign: 'center', marginBottom: 5 },
  subtitle: { fontSize: 12, textAlign: 'center', marginBottom: 3 },
  section: { marginBottom: 15 },
  sectionTitle: { fontSize: 12, fontWeight: 'bold', marginBottom: 8, backgroundColor: '#f0f0f0', padding: 5 },
  row: { flexDirection: 'row', marginBottom: 5 },
  label: { width: '40%', fontWeight: 'bold' },
  value: { width: '60%' },
  grid: { flexDirection: 'row', marginBottom: 5 },
  gridItem: { width: '50%' },
  table: { marginTop: 10, marginBottom: 10 },
  tableRow: { flexDirection: 'row', borderBottom: '1 solid #ddd', paddingVertical: 5 },
  tableHeader: { backgroundColor: '#333', color: '#fff', fontWeight: 'bold' },
  tableCol: { width: '33.33%', paddingHorizontal: 5 },
  checkboxChecked: { width: 12, height: 12, border: '1 solid #000', backgroundColor: '#000', marginRight: 5 },
  checkboxRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 5 },
  signatureBox: { marginTop: 10, border: '1 solid #000', padding: 10, minHeight: 60 },
  footer: { position: 'absolute', bottom: 30, left: 40, right: 40, fontSize: 8, textAlign: 'center', color: '#666' },
});

interface ACTSafetyProps {
  installationAddress: string;
  installationDate: string;
  customerName: string;
  systemSize: number;
  panelCount: number;
  inverterCapacity: number;
  insulationResistanceDC: number;
  earthContinuity: number;
  electricianName: string;
  electricianLicense: string;
  electricianSignature?: string;
  certificateNumber?: string;
  issueDate: string;
}

export const ACTSafety: React.FC<ACTSafetyProps> = (props) => {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>ACT CERTIFICATE OF ELECTRICAL SAFETY</Text>
          <Text style={styles.subtitle}>Solar Photovoltaic Installation</Text>
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>INSTALLATION DETAILS</Text>
          <View style={styles.row}><Text style={styles.label}>Address:</Text><Text style={styles.value}>{props.installationAddress}</Text></View>
          <View style={styles.row}><Text style={styles.label}>Date:</Text><Text style={styles.value}>{props.installationDate}</Text></View>
          <View style={styles.row}><Text style={styles.label}>Customer:</Text><Text style={styles.value}>{props.customerName}</Text></View>
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>SYSTEM SPECIFICATIONS</Text>
          <View style={styles.row}><Text style={styles.label}>System Size:</Text><Text style={styles.value}>{props.systemSize} kW</Text></View>
          <View style={styles.row}><Text style={styles.label}>Panel Count:</Text><Text style={styles.value}>{props.panelCount}</Text></View>
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ELECTRICIAN</Text>
          <View style={styles.row}><Text style={styles.label}>Name:</Text><Text style={styles.value}>{props.electricianName}</Text></View>
          <View style={styles.row}><Text style={styles.label}>License:</Text><Text style={styles.value}>{props.electricianLicense}</Text></View>
          <View style={styles.signatureBox}>{props.electricianSignature ? <Image src={props.electricianSignature} style={{ maxHeight: 40 }} /> : <Text style={{ color: '#999' }}>Signature</Text>}</View>
        </View>
        <Text style={styles.footer}>ACT Certificate | AS/NZS 3000:2018 | AS/NZS 5033:2021</Text>
      </Page>
    </Document>
  );
};
