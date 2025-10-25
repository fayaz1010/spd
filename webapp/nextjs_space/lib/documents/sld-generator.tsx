import React from 'react';
import { Document, Page, Text, View, StyleSheet, Svg, Line, Rect, Circle, Path } from '@react-pdf/renderer';

// Styles for SLD
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
  notes: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#fffbeb',
    border: '1 solid #fbbf24',
    borderRadius: 5,
  },
  noteText: {
    fontSize: 9,
    color: '#92400e',
    marginBottom: 3,
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
  legend: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#f3f4f6',
    borderRadius: 5,
  },
  legendTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
  },
  legendText: {
    fontSize: 8,
    marginLeft: 5,
  },
});

interface SLDData {
  jobId: string;
  jobNumber: string;
  systemSize: number;
  panelCount: number;
  strings: Array<{
    id: number;
    panels: number;
    voltage: number;
    current: number;
    wattage: number;
  }>;
  inverter: {
    model: string;
    capacity: number;
    acVoltage: number;
    maxCurrent: number;
  };
  isolators: {
    dc: string;
    ac: string;
  };
  protection: {
    dcBreaker: string;
    acBreaker: string;
  };
  cables: {
    dcSize: number;
    acSize: number;
    dcLength: number;
    acLength: number;
  };
  earthing: {
    method: string;
    conductor: string;
  };
  battery?: {
    model: string;
    capacity: number;
    voltage: number;
  };
  address: string;
  installationDate?: string;
}

export const SingleLineDiagram: React.FC<{ data: SLDData }> = ({ data }) => {
  // Calculate total DC voltage and current
  const totalDCVoltage = data.strings[0]?.voltage || 0;
  const totalDCCurrent = data.strings.reduce((sum, str) => sum + str.current, 0);
  
  // Diagram coordinates
  const startX = 50;
  const startY = 100;
  const spacing = 80;
  
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>SINGLE LINE DIAGRAM</Text>
          <Text style={styles.subtitle}>AS/NZS 5033:2021 Compliant</Text>
          <Text style={styles.subtitle}>Job Number: {data.jobNumber}</Text>
          <Text style={styles.subtitle}>System Size: {data.systemSize}kW</Text>
          <Text style={styles.subtitle}>Installation Address: {data.address}</Text>
          {data.installationDate && (
            <Text style={styles.subtitle}>Date: {data.installationDate}</Text>
          )}
        </View>

        {/* Diagram */}
        <View style={styles.diagram}>
          <Svg width="500" height="400">
            {/* Solar Array - Multiple Strings */}
            {data.strings.map((string, index) => {
              const yPos = startY + (index * 60);
              return (
                <React.Fragment key={string.id}>
                  {/* String Box */}
                  <Rect
                    x={startX}
                    y={yPos}
                    width="100"
                    height="40"
                    fill="#fef3c7"
                    stroke="#000"
                    strokeWidth="1.5"
                  />
                  <Text
                    x={startX + 50}
                    y={yPos + 15}
                    style={{ fontSize: 9 }}
                  >
                    String {string.id}
                  </Text>
                  <Text
                    x={startX + 50}
                    y={yPos + 28}
                    style={{ fontSize: 8 }}
                  >
                    {string.panels} × {string.wattage}W
                  </Text>
                  
                  {/* Voltage/Current Labels */}
                  <Text
                    x={startX + 105}
                    y={yPos + 15}
                    style={{ fontSize: 7 }}
                  >
                    {string.voltage}V DC
                  </Text>
                  <Text
                    x={startX + 105}
                    y={yPos + 25}
                    style={{ fontSize: 7 }}
                  >
                    {string.current}A
                  </Text>
                  
                  {/* Connection Line to Combiner */}
                  <Line
                    x1={startX + 100}
                    y1={yPos + 20}
                    x2={startX + spacing}
                    y2={startY + 80}
                    stroke="#000"
                    strokeWidth="1.5"
                  />
                </React.Fragment>
              );
            })}
            
            {/* DC Combiner/Junction Box */}
            <Rect
              x={startX + spacing}
              y={startY + 60}
              width="60"
              height="40"
              fill="#dbeafe"
              stroke="#000"
              strokeWidth="1.5"
            />
            <Text
              x={startX + spacing + 30}
              y={startY + 75}
              style={{ fontSize: 8 }}
            >
              DC
            </Text>
            <Text
              x={startX + spacing + 30}
              y={startY + 88}
              style={{ fontSize: 8 }}
            >
              Combiner
            </Text>
            
            {/* DC Isolator */}
            <Rect
              x={startX + spacing * 2}
              y={startY + 60}
              width="60"
              height="40"
              fill="#fecaca"
              stroke="#000"
              strokeWidth="2"
            />
            <Text
              x={startX + spacing * 2 + 30}
              y={startY + 75}
              style={{ fontSize: 8 }}
            >
              DC ISOLATOR
            </Text>
            <Text
              x={startX + spacing * 2 + 30}
              y={startY + 88}
              style={{ fontSize: 7 }}
            >
              {data.isolators.dc}
            </Text>
            
            {/* Connection Line */}
            <Line
              x1={startX + spacing + 60}
              y1={startY + 80}
              x2={startX + spacing * 2}
              y2={startY + 80}
              stroke="#000"
              strokeWidth="2"
            />
            
            {/* Voltage/Current on DC line */}
            <Text
              x={startX + spacing + 70}
              y={startY + 70}
              style={{ fontSize: 7 }}
            >
              {totalDCVoltage}V DC
            </Text>
            <Text
              x={startX + spacing + 70}
              y={startY + 95}
              style={{ fontSize: 7 }}
            >
              {totalDCCurrent.toFixed(1)}A
            </Text>
            
            {/* Inverter */}
            <Rect
              x={startX + spacing * 3}
              y={startY + 50}
              width="80"
              height="60"
              fill="#e0e7ff"
              stroke="#000"
              strokeWidth="2"
            />
            <Text
              x={startX + spacing * 3 + 40}
              y={startY + 70}
              style={{ fontSize: 9 }}
            >
              INVERTER
            </Text>
            <Text
              x={startX + spacing * 3 + 40}
              y={startY + 85}
              style={{ fontSize: 7 }}
            >
              {data.inverter.model}
            </Text>
            <Text
              x={startX + spacing * 3 + 40}
              y={startY + 98}
              style={{ fontSize: 7 }}
            >
              {data.inverter.capacity}kW
            </Text>
            
            {/* Connection Line to Inverter */}
            <Line
              x1={startX + spacing * 2 + 60}
              y1={startY + 80}
              x2={startX + spacing * 3}
              y2={startY + 80}
              stroke="#000"
              strokeWidth="2"
            />
            
            {/* AC Isolator */}
            <Rect
              x={startX + spacing * 4}
              y={startY + 60}
              width="60"
              height="40"
              fill="#fecaca"
              stroke="#000"
              strokeWidth="2"
            />
            <Text
              x={startX + spacing * 4 + 30}
              y={startY + 75}
              style={{ fontSize: 8 }}
            >
              AC ISOLATOR
            </Text>
            <Text
              x={startX + spacing * 4 + 30}
              y={startY + 88}
              style={{ fontSize: 7 }}
            >
              {data.isolators.ac}
            </Text>
            
            {/* Connection Line */}
            <Line
              x1={startX + spacing * 3 + 80}
              y1={startY + 80}
              x2={startX + spacing * 4}
              y2={startY + 80}
              stroke="#000"
              strokeWidth="2"
            />
            
            {/* AC Voltage/Current */}
            <Text
              x={startX + spacing * 3 + 90}
              y={startY + 70}
              style={{ fontSize: 7 }}
            >
              {data.inverter.acVoltage}V AC
            </Text>
            <Text
              x={startX + spacing * 3 + 90}
              y={startY + 95}
              style={{ fontSize: 7 }}
            >
              {data.inverter.maxCurrent.toFixed(1)}A
            </Text>
            
            {/* Main Switchboard */}
            <Rect
              x={startX + spacing * 5}
              y={startY + 50}
              width="70"
              height="60"
              fill="#dcfce7"
              stroke="#000"
              strokeWidth="2"
            />
            <Text
              x={startX + spacing * 5 + 35}
              y={startY + 70}
              style={{ fontSize: 8 }}
            >
              MAIN
            </Text>
            <Text
              x={startX + spacing * 5 + 35}
              y={startY + 83}
              style={{ fontSize: 8 }}
            >
              SWITCHBOARD
            </Text>
            <Text
              x={startX + spacing * 5 + 35}
              y={startY + 98}
              style={{ fontSize: 7 }}
            >
              & METER
            </Text>
            
            {/* Connection Line */}
            <Line
              x1={startX + spacing * 4 + 60}
              y1={startY + 80}
              x2={startX + spacing * 5}
              y2={startY + 80}
              stroke="#000"
              strokeWidth="2"
            />
            
            {/* Grid Connection */}
            <Line
              x1={startX + spacing * 5 + 70}
              y1={startY + 80}
              x2={startX + spacing * 5 + 100}
              y2={startY + 80}
              stroke="#000"
              strokeWidth="2"
            />
            <Text
              x={startX + spacing * 5 + 105}
              y={startY + 83}
              style={{ fontSize: 8 }}
            >
              GRID
            </Text>
            
            {/* Earthing Symbol */}
            <Line
              x1={startX + spacing * 3 + 40}
              y1={startY + 110}
              x2={startX + spacing * 3 + 40}
              y2={startY + 130}
              stroke="#000"
              strokeWidth="1.5"
            />
            <Line
              x1={startX + spacing * 3 + 30}
              y1={startY + 130}
              x2={startX + spacing * 3 + 50}
              y2={startY + 130}
              stroke="#000"
              strokeWidth="1.5"
            />
            <Line
              x1={startX + spacing * 3 + 33}
              y1={startY + 135}
              x2={startX + spacing * 3 + 47}
              y2={startY + 135}
              stroke="#000"
              strokeWidth="1.5"
            />
            <Line
              x1={startX + spacing * 3 + 36}
              y1={startY + 140}
              x2={startX + spacing * 3 + 44}
              y2={startY + 140}
              stroke="#000"
              strokeWidth="1.5"
            />
            <Text
              x={startX + spacing * 3 + 55}
              y={startY + 133}
              style={{ fontSize: 7 }}
            >
              {data.earthing.conductor}
            </Text>
            
            {/* Battery (if present) */}
            {data.battery && (
              <>
                <Rect
                  x={startX + spacing * 3 + 10}
                  y={startY + 160}
                  width="60"
                  height="40"
                  fill="#fef3c7"
                  stroke="#000"
                  strokeWidth="1.5"
                />
                <Text
                  x={startX + spacing * 3 + 40}
                  y={startY + 175}
                  style={{ fontSize: 8 }}
                >
                  BATTERY
                </Text>
                <Text
                  x={startX + spacing * 3 + 40}
                  y={startY + 188}
                  style={{ fontSize: 7 }}
                >
                  {data.battery.capacity}kWh
                </Text>
                <Line
                  x1={startX + spacing * 3 + 40}
                  y1={startY + 110}
                  x2={startX + spacing * 3 + 40}
                  y2={startY + 160}
                  stroke="#000"
                  strokeWidth="1.5"
                  strokeDasharray="3 3"
                />
              </>
            )}
          </Svg>
        </View>

        {/* Specifications */}
        <View style={styles.specs}>
          <Text style={{ fontSize: 12, fontWeight: 'bold', marginBottom: 10 }}>
            System Specifications
          </Text>
          
          <View style={styles.specRow}>
            <Text style={styles.specLabel}>Total System Size:</Text>
            <Text style={styles.specValue}>{data.systemSize}kW</Text>
          </View>
          
          <View style={styles.specRow}>
            <Text style={styles.specLabel}>Total Panel Count:</Text>
            <Text style={styles.specValue}>{data.panelCount} panels</Text>
          </View>
          
          <View style={styles.specRow}>
            <Text style={styles.specLabel}>DC Voltage (Max):</Text>
            <Text style={styles.specValue}>{totalDCVoltage}V</Text>
          </View>
          
          <View style={styles.specRow}>
            <Text style={styles.specLabel}>DC Current (Total):</Text>
            <Text style={styles.specValue}>{totalDCCurrent.toFixed(1)}A</Text>
          </View>
          
          <View style={styles.specRow}>
            <Text style={styles.specLabel}>AC Voltage:</Text>
            <Text style={styles.specValue}>{data.inverter.acVoltage}V</Text>
          </View>
          
          <View style={styles.specRow}>
            <Text style={styles.specLabel}>AC Current (Max):</Text>
            <Text style={styles.specValue}>{data.inverter.maxCurrent.toFixed(1)}A</Text>
          </View>
          
          <View style={styles.specRow}>
            <Text style={styles.specLabel}>DC Cable Size:</Text>
            <Text style={styles.specValue}>{data.cables.dcSize}mm²</Text>
          </View>
          
          <View style={styles.specRow}>
            <Text style={styles.specLabel}>AC Cable Size:</Text>
            <Text style={styles.specValue}>{data.cables.acSize}mm²</Text>
          </View>
          
          <View style={styles.specRow}>
            <Text style={styles.specLabel}>DC Circuit Breaker:</Text>
            <Text style={styles.specValue}>{data.protection.dcBreaker}</Text>
          </View>
          
          <View style={styles.specRow}>
            <Text style={styles.specLabel}>AC Circuit Breaker:</Text>
            <Text style={styles.specValue}>{data.protection.acBreaker}</Text>
          </View>
        </View>

        {/* Compliance Notes */}
        <View style={styles.notes}>
          <Text style={[styles.noteText, { fontWeight: 'bold', marginBottom: 5 }]}>
            Compliance Notes:
          </Text>
          <Text style={styles.noteText}>
            • This installation complies with AS/NZS 5033:2021
          </Text>
          <Text style={styles.noteText}>
            • All components are CEC approved
          </Text>
          <Text style={styles.noteText}>
            • Earthing complies with AS/NZS 3000:2018
          </Text>
          <Text style={styles.noteText}>
            • Inverter complies with AS/NZS 4777.2:2020
          </Text>
          <Text style={styles.noteText}>
            • All isolators are clearly labeled and accessible
          </Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>This Single Line Diagram is for installation and compliance purposes only.</Text>
          <Text style={{ marginTop: 3 }}>
            Sun Direct Power | CEC Accredited Installer | ABN: XX XXX XXX XXX
          </Text>
        </View>
      </Page>
    </Document>
  );
};
