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
  declarationBox: {
    marginTop: 15,
    padding: 15,
    backgroundColor: '#fef3c7',
    border: '2 solid #f59e0b',
    borderRadius: 3,
  },
  declarationTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#92400e',
  },
  declarationText: {
    fontSize: 9,
    lineHeight: 1.6,
    marginBottom: 6,
    color: '#78350f',
  },
  checkboxSection: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#fff',
    border: '1 solid #d1d5db',
    borderRadius: 3,
  },
  checkboxItem: {
    flexDirection: 'row',
    marginBottom: 8,
    alignItems: 'flex-start',
  },
  checkbox: {
    width: 14,
    height: 14,
    border: '2 solid #000',
    marginRight: 10,
    marginTop: 2,
    backgroundColor: '#10b981',
  },
  checkmark: {
    fontSize: 11,
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 1.2,
  },
  checkboxText: {
    fontSize: 9,
    flex: 1,
    lineHeight: 1.5,
  },
  importantBox: {
    marginTop: 15,
    padding: 12,
    backgroundColor: '#fee2e2',
    border: '2 solid #ef4444',
    borderRadius: 3,
  },
  importantText: {
    fontSize: 9,
    color: '#991b1b',
    lineHeight: 1.5,
    marginBottom: 4,
  },
  signature: {
    marginTop: 20,
    padding: 15,
    border: '3 solid #000',
    borderRadius: 3,
  },
  signatureImage: {
    width: 200,
    height: 80,
    marginBottom: 10,
  },
  signatureLine: {
    borderBottom: '1 solid #000',
    marginBottom: 8,
    paddingBottom: 2,
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
  stcInfoBox: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#dbeafe',
    border: '1 solid #3b82f6',
    borderRadius: 3,
  },
  stcInfoText: {
    fontSize: 8,
    color: '#1e40af',
    lineHeight: 1.4,
    marginBottom: 3,
  },
});

interface CustomerDeclarationData {
  // Job details
  jobNumber: string;
  installationAddress: string;
  installationDate: string;
  
  // System details
  systemSize: number;
  panelCount: number;
  panelModel: string;
  inverterModel: string;
  estimatedAnnualGeneration: number;
  
  // Customer details
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress: string;
  
  // STC details
  stcEligible: boolean;
  estimatedSTCs?: number;
  stcValue?: number;
  stcAssignmentMethod: 'UPFRONT_DISCOUNT' | 'CUSTOMER_CLAIMS' | 'SPLIT';
  
  // Declarations (all must be true)
  declarations: {
    systemOwnership: boolean;
    residentialProperty: boolean;
    newInstallation: boolean;
    gridConnected: boolean;
    notPreviouslyClaimed: boolean;
    accurateInformation: boolean;
    authorizeAssignment: boolean;
    understandWarranties: boolean;
    receivedDocumentation: boolean;
    systemDemonstrated: boolean;
  };
  
  // Acknowledgments
  acknowledgments: {
    coolingOffPeriod: boolean;
    warrantyTerms: boolean;
    maintenanceRequirements: boolean;
    gridExportLimits: boolean;
    insuranceNotification: boolean;
  };
  
  // Signature
  customerSignature?: string;
  signatureDate: string;
  
  // Witness (installer)
  witnessName: string;
  witnessSignature?: string;
  
  // Company
  companyName: string;
  companyLogo?: string;
  companyABN: string;
}

export const CustomerDeclaration: React.FC<{ data: CustomerDeclarationData }> = ({ data }) => {
  const allDeclarationsChecked = Object.values(data.declarations).every(v => v === true);
  const allAcknowledgmentsChecked = Object.values(data.acknowledgments).every(v => v === true);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          {data.companyLogo && (
            <Image src={data.companyLogo} style={styles.logo} />
          )}
          <Text style={styles.title}>CUSTOMER DECLARATION</Text>
          <Text style={styles.subtitle}>Solar Photovoltaic System Installation</Text>
          <Text style={styles.subtitle}>Small-scale Technology Certificate (STC) Assignment</Text>
        </View>

        {/* Job Reference */}
        <View style={{ marginBottom: 15, textAlign: 'center' }}>
          <Text style={{ fontSize: 14, fontWeight: 'bold' }}>
            Job No: {data.jobNumber}
          </Text>
          <Text style={{ fontSize: 10, color: '#6b7280', marginTop: 3 }}>
            Date: {data.signatureDate}
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
          
          <View style={styles.row}>
            <Text style={styles.label}>Est. Annual Generation:</Text>
            <Text style={styles.value}>{data.estimatedAnnualGeneration} kWh/year</Text>
          </View>
        </View>

        {/* Customer Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Customer Details</Text>
          
          <View style={styles.row}>
            <Text style={styles.label}>Full Name:</Text>
            <Text style={styles.value}>{data.customerName}</Text>
          </View>
          
          <View style={styles.row}>
            <Text style={styles.label}>Email:</Text>
            <Text style={styles.value}>{data.customerEmail}</Text>
          </View>
          
          <View style={styles.row}>
            <Text style={styles.label}>Phone:</Text>
            <Text style={styles.value}>{data.customerPhone}</Text>
          </View>
          
          <View style={styles.row}>
            <Text style={styles.label}>Address:</Text>
            <Text style={styles.value}>{data.customerAddress}</Text>
          </View>
        </View>

        {/* STC Information */}
        {data.stcEligible && (
          <View style={styles.stcInfoBox}>
            <Text style={[styles.stcInfoText, { fontWeight: 'bold', fontSize: 10, marginBottom: 5 }]}>
              Small-scale Technology Certificates (STCs)
            </Text>
            <Text style={styles.stcInfoText}>
              • Estimated STCs: {data.estimatedSTCs} certificates
            </Text>
            <Text style={styles.stcInfoText}>
              • Estimated Value: ${data.stcValue?.toLocaleString()}
            </Text>
            <Text style={styles.stcInfoText}>
              • Assignment Method: {
                data.stcAssignmentMethod === 'UPFRONT_DISCOUNT' ? 'Upfront Discount (STCs assigned to installer)' :
                data.stcAssignmentMethod === 'CUSTOMER_CLAIMS' ? 'Customer Claims (You retain STCs)' :
                'Split Assignment'
              }
            </Text>
          </View>
        )}

        {/* Customer Declarations */}
        <View style={styles.declarationBox}>
          <Text style={styles.declarationTitle}>CUSTOMER DECLARATIONS</Text>
          <Text style={[styles.declarationText, { marginBottom: 10 }]}>
            I, {data.customerName}, hereby declare that:
          </Text>
          
          <View style={styles.checkboxSection}>
            <View style={styles.checkboxItem}>
              <View style={styles.checkbox}>
                <Text style={styles.checkmark}>✓</Text>
              </View>
              <Text style={styles.checkboxText}>
                I am the owner of the property at {data.installationAddress} or have authority to install this system
              </Text>
            </View>
            
            <View style={styles.checkboxItem}>
              <View style={styles.checkbox}>
                <Text style={styles.checkmark}>✓</Text>
              </View>
              <Text style={styles.checkboxText}>
                The property is a residential premises or small business premises
              </Text>
            </View>
            
            <View style={styles.checkboxItem}>
              <View style={styles.checkbox}>
                <Text style={styles.checkmark}>✓</Text>
              </View>
              <Text style={styles.checkboxText}>
                This is a new solar PV system installation (not a replacement or upgrade of an existing system)
              </Text>
            </View>
            
            <View style={styles.checkboxItem}>
              <View style={styles.checkbox}>
                <Text style={styles.checkmark}>✓</Text>
              </View>
              <Text style={styles.checkboxText}>
                The system will be connected to the electricity grid
              </Text>
            </View>
            
            <View style={styles.checkboxItem}>
              <View style={styles.checkbox}>
                <Text style={styles.checkmark}>✓</Text>
              </View>
              <Text style={styles.checkboxText}>
                STCs have not been previously created or claimed for this system
              </Text>
            </View>
            
            <View style={styles.checkboxItem}>
              <View style={styles.checkbox}>
                <Text style={styles.checkmark}>✓</Text>
              </View>
              <Text style={styles.checkboxText}>
                All information provided is true and accurate to the best of my knowledge
              </Text>
            </View>
            
            {data.stcAssignmentMethod === 'UPFRONT_DISCOUNT' && (
              <View style={styles.checkboxItem}>
                <View style={styles.checkbox}>
                  <Text style={styles.checkmark}>✓</Text>
                </View>
                <Text style={styles.checkboxText}>
                  I authorize {data.companyName} (ABN: {data.companyABN}) to create and assign the STCs to themselves 
                  in exchange for an upfront discount on the system price
                </Text>
              </View>
            )}
            
            <View style={styles.checkboxItem}>
              <View style={styles.checkbox}>
                <Text style={styles.checkmark}>✓</Text>
              </View>
              <Text style={styles.checkboxText}>
                I understand the warranty terms and conditions for all components
              </Text>
            </View>
            
            <View style={styles.checkboxItem}>
              <View style={styles.checkbox}>
                <Text style={styles.checkmark}>✓</Text>
              </View>
              <Text style={styles.checkboxText}>
                I have received all required documentation including warranties, manuals, and compliance certificates
              </Text>
            </View>
            
            <View style={styles.checkboxItem}>
              <View style={styles.checkbox}>
                <Text style={styles.checkmark}>✓</Text>
              </View>
              <Text style={styles.checkboxText}>
                The system operation and maintenance requirements have been demonstrated and explained to me
              </Text>
            </View>
          </View>
        </View>

        {/* Acknowledgments */}
        <View style={[styles.declarationBox, { backgroundColor: '#e0f2fe', borderColor: '#0284c7' }]}>
          <Text style={[styles.declarationTitle, { color: '#0c4a6e' }]}>ACKNOWLEDGMENTS</Text>
          
          <View style={styles.checkboxSection}>
            <View style={styles.checkboxItem}>
              <View style={styles.checkbox}>
                <Text style={styles.checkmark}>✓</Text>
              </View>
              <Text style={styles.checkboxText}>
                I understand I have a 10-business-day cooling-off period from the contract date
              </Text>
            </View>
            
            <View style={styles.checkboxItem}>
              <View style={styles.checkbox}>
                <Text style={styles.checkmark}>✓</Text>
              </View>
              <Text style={styles.checkboxText}>
                I have read and understood all warranty terms and conditions
              </Text>
            </View>
            
            <View style={styles.checkboxItem}>
              <View style={styles.checkbox}>
                <Text style={styles.checkmark}>✓</Text>
              </View>
              <Text style={styles.checkboxText}>
                I understand the system requires regular maintenance and cleaning for optimal performance
              </Text>
            </View>
            
            <View style={styles.checkboxItem}>
              <View style={styles.checkbox}>
                <Text style={styles.checkmark}>✓</Text>
              </View>
              <Text style={styles.checkboxText}>
                I am aware of any export limits that may apply to my grid connection
              </Text>
            </View>
            
            <View style={styles.checkboxItem}>
              <View style={styles.checkbox}>
                <Text style={styles.checkmark}>✓</Text>
              </View>
              <Text style={styles.checkboxText}>
                I will notify my home/building insurance provider of the solar system installation
              </Text>
            </View>
          </View>
        </View>

        {/* Important Notice */}
        <View style={styles.importantBox}>
          <Text style={[styles.importantText, { fontWeight: 'bold', marginBottom: 6 }]}>
            IMPORTANT NOTICE
          </Text>
          <Text style={styles.importantText}>
            • This declaration is a legal document and forms part of your contract with {data.companyName}
          </Text>
          <Text style={styles.importantText}>
            • Providing false or misleading information may result in penalties under the Renewable Energy 
            (Electricity) Act 2000
          </Text>
          <Text style={styles.importantText}>
            • Keep a copy of this declaration for your records
          </Text>
          <Text style={styles.importantText}>
            • Contact the Clean Energy Regulator if you have questions about STCs: www.cleanenergyregulator.gov.au
          </Text>
        </View>

        {/* Customer Signature */}
        <View style={styles.signature}>
          <Text style={[styles.sectionTitle, { borderBottom: 'none', marginBottom: 10 }]}>
            Customer Signature
          </Text>
          
          {data.customerSignature ? (
            <Image src={data.customerSignature} style={styles.signatureImage} />
          ) : (
            <View style={styles.signatureLine} />
          )}
          
          <View style={styles.row}>
            <Text style={{ fontSize: 9, marginBottom: 3 }}>Name: {data.customerName}</Text>
          </View>
          
          <View style={styles.row}>
            <Text style={{ fontSize: 9, marginBottom: 3 }}>Date: {data.signatureDate}</Text>
          </View>
        </View>

        {/* Witness Signature */}
        <View style={styles.signature}>
          <Text style={[styles.sectionTitle, { borderBottom: 'none', marginBottom: 10 }]}>
            Witness Signature (Installer)
          </Text>
          
          {data.witnessSignature ? (
            <Image src={data.witnessSignature} style={styles.signatureImage} />
          ) : (
            <View style={styles.signatureLine} />
          )}
          
          <View style={styles.row}>
            <Text style={{ fontSize: 9, marginBottom: 3 }}>Name: {data.witnessName}</Text>
          </View>
          
          <View style={styles.row}>
            <Text style={{ fontSize: 9, marginBottom: 3 }}>Company: {data.companyName}</Text>
          </View>
          
          <View style={styles.row}>
            <Text style={{ fontSize: 9, marginBottom: 3 }}>Date: {data.signatureDate}</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>Customer Declaration - {data.companyName} (ABN: {data.companyABN})</Text>
          <Text style={{ marginTop: 3 }}>
            This document must be retained for a minimum of 5 years for audit purposes
          </Text>
        </View>
      </Page>
    </Document>
  );
};
