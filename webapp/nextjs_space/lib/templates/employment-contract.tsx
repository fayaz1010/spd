import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 20,
    textAlign: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 12,
    marginBottom: 5,
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#2563eb',
  },
  paragraph: {
    marginBottom: 8,
    lineHeight: 1.4,
    textAlign: 'justify',
  },
  clause: {
    marginBottom: 10,
  },
  clauseNumber: {
    fontWeight: 'bold',
  },
  table: {
    marginVertical: 10,
    borderWidth: 1,
    borderColor: '#000',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#000',
  },
  tableCell: {
    padding: 6,
    flex: 1,
    borderRightWidth: 1,
    borderRightColor: '#000',
  },
  tableCellLast: {
    borderRightWidth: 0,
  },
  tableCellLabel: {
    backgroundColor: '#f3f4f6',
    fontWeight: 'bold',
  },
  signature: {
    marginTop: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  signatureBox: {
    width: '45%',
  },
  signatureLine: {
    borderTop: '1 solid #000',
    marginTop: 40,
    paddingTop: 5,
  },
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 40,
    right: 40,
    fontSize: 8,
    color: '#666',
    textAlign: 'center',
    borderTop: '1 solid #e5e7eb',
    paddingTop: 10,
  },
});

interface EmploymentContractProps {
  application: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  position: {
    title: string;
    department: string;
    level: string;
    description?: string;
    responsibilities?: any;
    essentialRequirements?: any;
    desirableRequirements?: any;
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

export const EmploymentContractPDF: React.FC<EmploymentContractProps> = ({
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

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>EMPLOYMENT CONTRACT</Text>
          <Text style={styles.subtitle}>{companySettings.businessName}</Text>
        </View>

        {/* Parties */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>PARTIES</Text>
          <View style={styles.table}>
            <View style={styles.tableRow}>
              <View style={[styles.tableCell, styles.tableCellLabel]}>
                <Text>Employer</Text>
              </View>
              <View style={[styles.tableCell, styles.tableCellLast]}>
                <Text>{companySettings.businessName}</Text>
                {companySettings.businessABN && <Text>ABN: {companySettings.businessABN}</Text>}
                {companySettings.businessAddress && <Text>{companySettings.businessAddress}</Text>}
              </View>
            </View>
            <View style={styles.tableRow}>
              <View style={[styles.tableCell, styles.tableCellLabel]}>
                <Text>Employee</Text>
              </View>
              <View style={[styles.tableCell, styles.tableCellLast]}>
                <Text>{application.firstName} {application.lastName}</Text>
                <Text>{application.email}</Text>
                <Text>{application.phone}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Position Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. POSITION AND DUTIES</Text>
          <View style={styles.clause}>
            <Text style={styles.paragraph}>
              <Text style={styles.clauseNumber}>1.1 Position: </Text>
              The Employee is employed as {position.title} in the {position.department} department.
            </Text>
          </View>
          <View style={styles.clause}>
            <Text style={styles.paragraph}>
              <Text style={styles.clauseNumber}>1.2 Duties: </Text>
              The Employee shall perform all duties reasonably required by the Employer in connection 
              with this position and as may be assigned from time to time.
            </Text>
          </View>
        </View>

        {/* Commencement */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. COMMENCEMENT AND PROBATION</Text>
          <View style={styles.clause}>
            <Text style={styles.paragraph}>
              <Text style={styles.clauseNumber}>2.1 Start Date: </Text>
              Employment commences on {formatDate(offer.startDate)}.
            </Text>
          </View>
          <View style={styles.clause}>
            <Text style={styles.paragraph}>
              <Text style={styles.clauseNumber}>2.2 Probation: </Text>
              The first {offer.probationPeriod} months of employment constitute a probationary period. 
              During this period, either party may terminate employment with 1 week's notice.
            </Text>
          </View>
        </View>

        {/* Remuneration */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. REMUNERATION AND BENEFITS</Text>
          <View style={styles.clause}>
            <Text style={styles.paragraph}>
              <Text style={styles.clauseNumber}>3.1 Salary: </Text>
              The Employee's annual salary is {formatCurrency(offer.salary)}, paid fortnightly.
            </Text>
          </View>
          <View style={styles.clause}>
            <Text style={styles.paragraph}>
              <Text style={styles.clauseNumber}>3.2 Superannuation: </Text>
              The Employer will contribute superannuation at the statutory rate to the Employee's 
              nominated superannuation fund.
            </Text>
          </View>
          <View style={styles.clause}>
            <Text style={styles.paragraph}>
              <Text style={styles.clauseNumber}>3.3 Leave: </Text>
              The Employee is entitled to annual leave, personal leave, and other leave entitlements 
              in accordance with the National Employment Standards.
            </Text>
          </View>
        </View>

        {/* Hours of Work */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. HOURS OF WORK</Text>
          <View style={styles.clause}>
            <Text style={styles.paragraph}>
              <Text style={styles.clauseNumber}>4.1 </Text>
              The ordinary hours of work are 38 hours per week, Monday to Friday, or as otherwise 
              agreed between the parties.
            </Text>
          </View>
        </View>
      </Page>

      {/* Page 2 */}
      <Page size="A4" style={styles.page}>
        {/* Confidentiality */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. CONFIDENTIALITY</Text>
          <View style={styles.clause}>
            <Text style={styles.paragraph}>
              <Text style={styles.clauseNumber}>5.1 </Text>
              The Employee must not disclose any confidential information of the Employer to any 
              third party without prior written consent, both during and after employment.
            </Text>
          </View>
        </View>

        {/* Termination */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>6. TERMINATION</Text>
          <View style={styles.clause}>
            <Text style={styles.paragraph}>
              <Text style={styles.clauseNumber}>6.1 Notice Period: </Text>
              After the probation period, either party may terminate employment by providing 4 weeks' 
              written notice, or payment in lieu.
            </Text>
          </View>
          <View style={styles.clause}>
            <Text style={styles.paragraph}>
              <Text style={styles.clauseNumber}>6.2 Summary Dismissal: </Text>
              The Employer may terminate employment immediately without notice for serious misconduct.
            </Text>
          </View>
        </View>

        {/* Workplace Health and Safety */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>7. WORKPLACE HEALTH AND SAFETY</Text>
          <View style={styles.clause}>
            <Text style={styles.paragraph}>
              <Text style={styles.clauseNumber}>7.1 </Text>
              The Employee must comply with all workplace health and safety policies and procedures, 
              and report any hazards or incidents immediately.
            </Text>
          </View>
        </View>

        {/* Special Conditions */}
        {offer.specialConditions && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>8. SPECIAL CONDITIONS</Text>
            <Text style={styles.paragraph}>{offer.specialConditions}</Text>
          </View>
        )}

        {/* Governing Law */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>9. GOVERNING LAW</Text>
          <Text style={styles.paragraph}>
            This contract is governed by the laws of the State/Territory where the Employee is 
            primarily based and the Fair Work Act 2009 (Cth).
          </Text>
        </View>

        {/* Entire Agreement */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>10. ENTIRE AGREEMENT</Text>
          <Text style={styles.paragraph}>
            This contract constitutes the entire agreement between the parties and supersedes all 
            prior negotiations, representations, and agreements.
          </Text>
        </View>

        {/* Signatures */}
        <View style={styles.signature}>
          <View style={styles.signatureBox}>
            <Text style={{ fontWeight: 'bold', marginBottom: 5 }}>EMPLOYER</Text>
            <View style={styles.signatureLine}>
              <Text>Signature</Text>
            </View>
            <Text style={{ marginTop: 15 }}>Name: _____________________</Text>
            <Text style={{ marginTop: 5 }}>Date: _____________________</Text>
          </View>
          <View style={styles.signatureBox}>
            <Text style={{ fontWeight: 'bold', marginBottom: 5 }}>EMPLOYEE</Text>
            <View style={styles.signatureLine}>
              <Text>Signature</Text>
            </View>
            <Text style={{ marginTop: 15 }}>Name: {application.firstName} {application.lastName}</Text>
            <Text style={{ marginTop: 5 }}>Date: _____________________</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>This is a legally binding contract. Both parties should seek independent legal advice if required.</Text>
        </View>
      </Page>

      {/* Page 3 - Annex: Position Description */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>ANNEX A</Text>
          <Text style={styles.subtitle}>Position Description</Text>
        </View>

        {/* Position Overview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>POSITION DETAILS</Text>
          <View style={styles.table}>
            <View style={styles.tableRow}>
              <View style={[styles.tableCell, styles.tableCellLabel]}>
                <Text>Position Title</Text>
              </View>
              <View style={[styles.tableCell, styles.tableCellLast]}>
                <Text>{position.title}</Text>
              </View>
            </View>
            <View style={styles.tableRow}>
              <View style={[styles.tableCell, styles.tableCellLabel]}>
                <Text>Department</Text>
              </View>
              <View style={[styles.tableCell, styles.tableCellLast]}>
                <Text>{position.department}</Text>
              </View>
            </View>
            <View style={styles.tableRow}>
              <View style={[styles.tableCell, styles.tableCellLabel]}>
                <Text>Level</Text>
              </View>
              <View style={[styles.tableCell, styles.tableCellLast]}>
                <Text>{position.level}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Position Description */}
        {position.description && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>POSITION DESCRIPTION</Text>
            <Text style={styles.paragraph}>{position.description}</Text>
          </View>
        )}

        {/* Key Responsibilities */}
        {position.responsibilities && Array.isArray(position.responsibilities) && position.responsibilities.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>KEY RESPONSIBILITIES</Text>
            {position.responsibilities.map((resp: string, idx: number) => (
              <Text key={idx} style={styles.paragraph}>• {resp}</Text>
            ))}
          </View>
        )}

        {/* Essential Requirements */}
        {position.essentialRequirements && Array.isArray(position.essentialRequirements) && position.essentialRequirements.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>ESSENTIAL REQUIREMENTS</Text>
            {position.essentialRequirements.map((req: string, idx: number) => (
              <Text key={idx} style={styles.paragraph}>• {req}</Text>
            ))}
          </View>
        )}

        {/* Desirable Requirements */}
        {position.desirableRequirements && Array.isArray(position.desirableRequirements) && position.desirableRequirements.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>DESIRABLE REQUIREMENTS</Text>
            {position.desirableRequirements.map((req: string, idx: number) => (
              <Text key={idx} style={styles.paragraph}>• {req}</Text>
            ))}
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text>Annex A - Position Description</Text>
        </View>
      </Page>
    </Document>
  );
};
