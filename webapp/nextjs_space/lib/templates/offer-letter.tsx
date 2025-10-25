import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    padding: 50,
    fontSize: 11,
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 30,
  },
  companyName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2563eb',
    marginBottom: 5,
  },
  date: {
    fontSize: 10,
    color: '#666',
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  section: {
    marginBottom: 15,
  },
  paragraph: {
    marginBottom: 10,
    lineHeight: 1.5,
    textAlign: 'justify',
  },
  bold: {
    fontWeight: 'bold',
  },
  table: {
    marginVertical: 15,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tableCell: {
    padding: 8,
    flex: 1,
  },
  tableCellLabel: {
    backgroundColor: '#f3f4f6',
    fontWeight: 'bold',
  },
  signature: {
    marginTop: 40,
    borderTop: '1 solid #000',
    paddingTop: 10,
    width: 200,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 50,
    right: 50,
    fontSize: 9,
    color: '#666',
    textAlign: 'center',
  },
});

interface OfferLetterProps {
  application: {
    firstName: string;
    lastName: string;
    email: string;
  };
  position: {
    title: string;
    department: string;
  };
  offer: {
    salary: number;
    startDate: string;
    probationPeriod: number;
    specialConditions?: string;
  };
  companySettings: {
    businessName: string;
    businessAddress?: string;
    businessABN?: string;
  };
}

export const OfferLetterPDF: React.FC<OfferLetterProps> = ({
  application,
  position,
  offer,
  companySettings,
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-AU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const today = new Date().toLocaleDateString('en-AU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.companyName}>{companySettings.businessName}</Text>
          {companySettings.businessAddress && (
            <Text style={styles.date}>{companySettings.businessAddress}</Text>
          )}
          <Text style={styles.date}>{today}</Text>
        </View>

        {/* Recipient */}
        <View style={styles.section}>
          <Text>{application.firstName} {application.lastName}</Text>
          <Text>{application.email}</Text>
        </View>

        {/* Title */}
        <Text style={styles.title}>OFFER OF EMPLOYMENT</Text>

        {/* Opening */}
        <View style={styles.section}>
          <Text style={styles.paragraph}>
            Dear {application.firstName},
          </Text>
          <Text style={styles.paragraph}>
            We are pleased to offer you the position of <Text style={styles.bold}>{position.title}</Text> in 
            our {position.department} department at {companySettings.businessName}.
          </Text>
        </View>

        {/* Position Details */}
        <View style={styles.section}>
          <Text style={[styles.paragraph, styles.bold]}>Position Details:</Text>
          <View style={styles.table}>
            <View style={styles.tableRow}>
              <View style={[styles.tableCell, styles.tableCellLabel]}>
                <Text>Position Title</Text>
              </View>
              <View style={styles.tableCell}>
                <Text>{position.title}</Text>
              </View>
            </View>
            <View style={styles.tableRow}>
              <View style={[styles.tableCell, styles.tableCellLabel]}>
                <Text>Department</Text>
              </View>
              <View style={styles.tableCell}>
                <Text>{position.department}</Text>
              </View>
            </View>
            <View style={styles.tableRow}>
              <View style={[styles.tableCell, styles.tableCellLabel]}>
                <Text>Annual Salary</Text>
              </View>
              <View style={styles.tableCell}>
                <Text>{formatCurrency(offer.salary)}</Text>
              </View>
            </View>
            <View style={styles.tableRow}>
              <View style={[styles.tableCell, styles.tableCellLabel]}>
                <Text>Start Date</Text>
              </View>
              <View style={styles.tableCell}>
                <Text>{formatDate(offer.startDate)}</Text>
              </View>
            </View>
            <View style={styles.tableRow}>
              <View style={[styles.tableCell, styles.tableCellLabel]}>
                <Text>Probation Period</Text>
              </View>
              <View style={styles.tableCell}>
                <Text>{offer.probationPeriod} months</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Special Conditions */}
        {offer.specialConditions && (
          <View style={styles.section}>
            <Text style={[styles.paragraph, styles.bold]}>Special Conditions:</Text>
            <Text style={styles.paragraph}>{offer.specialConditions}</Text>
          </View>
        )}

        {/* Standard Terms */}
        <View style={styles.section}>
          <Text style={[styles.paragraph, styles.bold]}>Employment Terms:</Text>
          <Text style={styles.paragraph}>
            • This offer is subject to satisfactory reference checks and verification of qualifications.
          </Text>
          <Text style={styles.paragraph}>
            • You will be required to provide proof of your right to work in Australia.
          </Text>
          <Text style={styles.paragraph}>
            • A formal employment contract will be provided upon acceptance of this offer.
          </Text>
          <Text style={styles.paragraph}>
            • This position includes superannuation at the statutory rate.
          </Text>
        </View>

        {/* Acceptance */}
        <View style={styles.section}>
          <Text style={styles.paragraph}>
            Please confirm your acceptance of this offer by signing and returning this letter by email 
            to {companySettings.businessName} within 5 business days.
          </Text>
          <Text style={styles.paragraph}>
            We look forward to welcoming you to our team!
          </Text>
        </View>

        {/* Signature */}
        <View style={styles.section}>
          <Text style={styles.paragraph}>Yours sincerely,</Text>
          <View style={styles.signature}>
            <Text>_____________________</Text>
            <Text style={{ marginTop: 5 }}>{companySettings.businessName}</Text>
          </View>
        </View>

        {/* Acceptance Section */}
        <View style={{ marginTop: 30, borderTop: '1 solid #000', paddingTop: 20 }}>
          <Text style={[styles.paragraph, styles.bold]}>ACCEPTANCE</Text>
          <Text style={styles.paragraph}>
            I, {application.firstName} {application.lastName}, accept the above offer of employment 
            on the terms and conditions stated.
          </Text>
          <View style={styles.signature}>
            <Text>_____________________</Text>
            <Text style={{ marginTop: 5 }}>Signature</Text>
          </View>
          <View style={[styles.signature, { marginTop: 20 }]}>
            <Text>_____________________</Text>
            <Text style={{ marginTop: 5 }}>Date</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          {companySettings.businessABN && (
            <Text>ABN: {companySettings.businessABN}</Text>
          )}
        </View>
      </Page>
    </Document>
  );
};
