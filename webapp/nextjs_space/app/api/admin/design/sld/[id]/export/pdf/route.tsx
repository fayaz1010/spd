import React from 'react';
import { NextRequest, NextResponse } from 'next/server';
import { renderToBuffer } from '@react-pdf/renderer';
import { Document, Page, Text, View, StyleSheet, Svg, Line, Rect } from '@react-pdf/renderer';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 10,
    fontFamily: 'Helvetica',
    backgroundColor: '#ffffff',
  },
  header: {
    marginBottom: 20,
    borderBottom: '2 solid #000000',
    paddingBottom: 15,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 3,
  },
  diagram: {
    marginVertical: 30,
    minHeight: 400,
  },
  specs: {
    marginTop: 30,
    padding: 15,
    backgroundColor: '#f9fafb',
    borderRadius: 5,
  },
  specRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  specLabel: {
    fontSize: 10,
    color: '#666666',
  },
  specValue: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 30,
    right: 30,
    borderTop: '1 solid #e5e7eb',
    paddingTop: 10,
    fontSize: 8,
    color: '#666666',
  },
});

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const jobId = params.id;
    const body = await request.json();
    const { nodes, edges, calculations } = body;

    // Fetch job data with electrician credentials
    const job = await prisma.installationJob.findUnique({
      where: { id: jobId },
      include: {
        lead: true,
        leadElectrician: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            electricalLicense: true,
            licenseNumber: true,
            licenseState: true,
            licenseExpiry: true,
            cecNumber: true,
            cecAccreditationType: true,
            cecExpiry: true,
            digitalSignature: true,
          },
        },
        team: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!job) {
      return NextResponse.json(
        { success: false, error: 'Job not found' },
        { status: 404 }
      );
    }
    
    // Get electrician info for designer section
    const designerInfo = (job as any).leadElectrician ? {
      name: `${(job as any).leadElectrician.firstName} ${(job as any).leadElectrician.lastName}`,
      license: (job as any).leadElectrician.licenseNumber || 'N/A',
      licenseState: (job as any).leadElectrician.licenseState || '',
      cecNumber: (job as any).leadElectrician.cecNumber || 'N/A',
      cecType: (job as any).leadElectrician.cecAccreditationType || '',
      signature: (job as any).leadElectrician.digitalSignature || null,
    } : {
      name: 'To Be Assigned',
      license: 'N/A',
      licenseState: '',
      cecNumber: 'N/A',
      cecType: '',
      signature: null,
    };

    // Generate PDF from interactive design
    const SLDDocument = (
      <Document>
        <Page size="A4" style={styles.page}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>SINGLE LINE DIAGRAM</Text>
            <Text style={styles.subtitle}>AS/NZS 5033:2021 Compliant - Interactive Design</Text>
            <Text style={styles.subtitle}>Job Number: {job.jobNumber}</Text>
            <Text style={styles.subtitle}>System Size: {job.systemSize}kW</Text>
            <Text style={styles.subtitle}>Installation Address: {job.lead?.address || 'N/A'}</Text>
            <Text style={styles.subtitle}>
              Generated: {new Date().toLocaleDateString('en-AU')}
            </Text>
          </View>

          {/* Diagram */}
          <View style={styles.diagram}>
            <Svg width="500" height="400">
              {/* Render nodes as rectangles */}
              {nodes.map((node: any, index: number) => {
                const x = node.position.x / 2; // Scale down for PDF
                const y = node.position.y / 2;
                const width = node.style?.width || 100;
                const height = node.style?.height || 60;
                
                return (
                  <Rect
                    key={node.id}
                    x={x}
                    y={y}
                    width={width}
                    height={height}
                    fill={node.style?.background || '#e5e7eb'}
                    stroke="#000"
                    strokeWidth="2"
                  />
                );
              })}

              {/* Render edges as lines */}
              {edges.map((edge: any) => {
                const sourceNode = nodes.find((n: any) => n.id === edge.source);
                const targetNode = nodes.find((n: any) => n.id === edge.target);
                
                if (sourceNode && targetNode) {
                  const x1 = (sourceNode.position.x + (sourceNode.style?.width || 100)) / 2;
                  const y1 = (sourceNode.position.y + (sourceNode.style?.height || 60) / 2) / 2;
                  const x2 = targetNode.position.x / 2;
                  const y2 = (targetNode.position.y + (targetNode.style?.height || 60) / 2) / 2;
                  
                  return (
                    <Line
                      key={edge.id}
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      stroke="#000"
                      strokeWidth="2"
                    />
                  );
                }
                return null;
              })}
            </Svg>
          </View>

          {/* Specifications */}
          <View style={styles.specs}>
            <Text style={{ fontSize: 12, fontWeight: 'bold', marginBottom: 10 }}>
              System Specifications
            </Text>
            
            <View style={styles.specRow}>
              <Text style={styles.specLabel}>Total System Size:</Text>
              <Text style={styles.specValue}>{job.systemSize}kW</Text>
            </View>
            
            <View style={styles.specRow}>
              <Text style={styles.specLabel}>DC Voltage:</Text>
              <Text style={styles.specValue}>{calculations.dcVoltage}V</Text>
            </View>
            
            <View style={styles.specRow}>
              <Text style={styles.specLabel}>DC Current:</Text>
              <Text style={styles.specValue}>{calculations.dcCurrent.toFixed(1)}A</Text>
            </View>
            
            <View style={styles.specRow}>
              <Text style={styles.specLabel}>AC Voltage:</Text>
              <Text style={styles.specValue}>{calculations.acVoltage}V</Text>
            </View>
            
            <View style={styles.specRow}>
              <Text style={styles.specLabel}>AC Current:</Text>
              <Text style={styles.specValue}>{calculations.acCurrent.toFixed(1)}A</Text>
            </View>
            
            <View style={styles.specRow}>
              <Text style={styles.specLabel}>Components:</Text>
              <Text style={styles.specValue}>{nodes.length}</Text>
            </View>
            
            <View style={styles.specRow}>
              <Text style={styles.specLabel}>Connections:</Text>
              <Text style={styles.specValue}>{edges.length}</Text>
            </View>
          </View>

          {/* Designer Information */}
          <View style={{ marginTop: 30, padding: 15, backgroundColor: '#f3f4f6', borderRadius: 5 }}>
            <Text style={{ fontSize: 12, fontWeight: 'bold', marginBottom: 8 }}>
              Designer Information
            </Text>
            <View style={styles.specRow}>
              <Text style={styles.specLabel}>Designer Name:</Text>
              <Text style={styles.specValue}>{designerInfo.name}</Text>
            </View>
            <View style={styles.specRow}>
              <Text style={styles.specLabel}>Electrical License:</Text>
              <Text style={styles.specValue}>
                {designerInfo.license}{designerInfo.licenseState ? ` (${designerInfo.licenseState})` : ''}
              </Text>
            </View>
            <View style={styles.specRow}>
              <Text style={styles.specLabel}>CEC Accreditation:</Text>
              <Text style={styles.specValue}>
                {designerInfo.cecNumber}{designerInfo.cecType ? ` (${designerInfo.cecType})` : ''}
              </Text>
            </View>
            {(job as any).team && (
              <View style={styles.specRow}>
                <Text style={styles.specLabel}>Installation Team:</Text>
                <Text style={styles.specValue}>{(job as any).team.name}</Text>
              </View>
            )}
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text>This Single Line Diagram complies with AS/NZS 5033:2021 standards.</Text>
            <Text style={{ marginTop: 3 }}>
              Sun Direct Power | CEC Accredited Installer | Generated: {new Date().toLocaleDateString('en-AU')}
            </Text>
            <Text style={{ marginTop: 3, fontSize: 7, color: '#999999' }}>
              Designer: {designerInfo.name} | License: {designerInfo.license} | CEC: {designerInfo.cecNumber}
            </Text>
          </View>
        </Page>
      </Document>
    );

    // Generate PDF buffer
    const pdfBuffer = await renderToBuffer(SLDDocument);

    // Return PDF as downloadable file
    return new NextResponse(Buffer.from(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="SLD-Interactive-${job.jobNumber}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Error exporting SLD to PDF:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to export PDF' },
      { status: 500 }
    );
  }
}
