/**
 * Title Block Generator
 * Generates professional title block for SLD header
 */

export interface TitleBlockData {
  companyName?: string;
  drawingTitle?: string;
  drawingNumber?: string;
  revision?: string;
  scale?: string;
  sheetNumber?: string;
  date?: string;
  logoUrl?: string; // Optional company logo
}

export function generateTitleBlock(
  data: TitleBlockData,
  y: number = 50,
  width: number = 2970,
  height: number = 150
): string {
  const companyName = data.companyName || 'Sun Direct Power';
  const drawingTitle = data.drawingTitle || 'SINGLE LINE DIAGRAM';
  const drawingNumber = data.drawingNumber || 'SLD-XXXX';
  const revision = data.revision || 'A';
  const scale = data.scale || 'NTS';
  const sheetNumber = data.sheetNumber || '1 of 1';
  const date = data.date || new Date().toLocaleDateString('en-AU');
  
  return `  <!-- Title Block -->
  <g id="title-block">
    <!-- Background -->
    <rect x="100" y="${y}" width="${width - 200}" height="${height}" fill="#F5F5F5" stroke="#000" stroke-width="2"/>
    
    <!-- Company Name / Logo Area -->
    <rect x="100" y="${y}" width="400" height="${height}" fill="#FFFFFF" stroke="#000" stroke-width="2"/>
    ${data.logoUrl ? `
    <!-- Company Logo -->
    <image x="120" y="${y + 20}" width="360" height="${height - 40}" href="${data.logoUrl}" preserveAspectRatio="xMidYMid meet"/>
    ` : `
    <!-- Company Name (no logo) -->
    <text x="300" y="${y + height/2 + 10}" font-family="Arial" font-size="28" font-weight="bold" text-anchor="middle" fill="#003366">${companyName}</text>
    `}
    
    <!-- Drawing Title (Center) -->
    <text x="${width/2}" y="${y + 60}" font-family="Arial" font-size="36" font-weight="bold" text-anchor="middle">${drawingTitle}</text>
    <text x="${width/2}" y="${y + 95}" font-family="Arial" font-size="16" text-anchor="middle" fill="#666">
      Installation of Photovoltaic System with Energy Storage
    </text>
    
    <!-- Drawing Details (Right) -->
    <g transform="translate(${width - 450}, ${y + 20})">
      <!-- Drawing Number -->
      <text x="0" y="0" font-family="Arial" font-size="13" font-weight="bold">Drawing No:</text>
      <text x="120" y="0" font-family="Arial" font-size="13">${drawingNumber}</text>
      
      <!-- Revision -->
      <text x="0" y="25" font-family="Arial" font-size="13" font-weight="bold">Revision:</text>
      <text x="120" y="25" font-family="Arial" font-size="13">${revision}</text>
      
      <!-- Date -->
      <text x="0" y="50" font-family="Arial" font-size="13" font-weight="bold">Date:</text>
      <text x="120" y="50" font-family="Arial" font-size="13">${date}</text>
      
      <!-- Scale -->
      <text x="0" y="75" font-family="Arial" font-size="13" font-weight="bold">Scale:</text>
      <text x="120" y="75" font-family="Arial" font-size="13">${scale}</text>
      
      <!-- Sheet -->
      <text x="0" y="100" font-family="Arial" font-size="13" font-weight="bold">Sheet:</text>
      <text x="120" y="100" font-family="Arial" font-size="13">${sheetNumber}</text>
    </g>
    
    <!-- Border line -->
    <line x1="100" y1="${y + height}" x2="${width - 100}" y2="${y + height}" stroke="#000" stroke-width="2"/>
  </g>`;
}
