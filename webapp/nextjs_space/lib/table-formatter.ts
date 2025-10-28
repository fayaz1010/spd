/**
 * Table Formatter - Ensures all tables in articles are properly styled
 */

/**
 * Format all tables in HTML content with proper styling
 */
export function formatTables(htmlContent: string): string {
  let formatted = htmlContent;

  // 1. Add styling to plain <table> tags
  formatted = formatted.replace(
    /<table>/gi,
    '<table style="width: 100%; border-collapse: collapse; margin: 20px 0; background: white; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">'
  );

  // 2. Style table headers
  formatted = formatted.replace(
    /<th>/gi,
    '<th style="padding: 12px; text-align: left; border: 1px solid #e5e7eb; font-weight: 600; background: #f3f4f6;">'
  );

  // 3. Style table cells
  formatted = formatted.replace(
    /<td>/gi,
    '<td style="padding: 12px; border: 1px solid #e5e7eb;">'
  );

  // 4. Add alternating row colors
  formatted = addAlternatingRowColors(formatted);

  // 5. Fix malformed table notes (asterisk-prefixed)
  formatted = fixTableNotes(formatted);

  return formatted;
}

/**
 * Add alternating row colors to table rows
 */
function addAlternatingRowColors(html: string): string {
  // Find all <tbody> sections
  const tbodyRegex = /<tbody>([\s\S]*?)<\/tbody>/gi;
  
  return html.replace(tbodyRegex, (match, tbody) => {
    // Split into rows
    const rows = tbody.match(/<tr[^>]*>[\s\S]*?<\/tr>/gi) || [];
    
    // Add alternating background colors
    const styledRows = rows.map((row, index) => {
      if (index % 2 === 1 && !row.includes('style=')) {
        return row.replace('<tr>', '<tr style="background: #f9fafb;">');
      }
      return row;
    });
    
    return `<tbody>${styledRows.join('\n')}</tbody>`;
  });
}

/**
 * Fix table notes that use asterisks instead of proper list formatting
 */
function fixTableNotes(html: string): string {
  let fixed = html;

  // Convert *Battery Only: and *Battery + Inverter: to list items with smaller, italic styling
  fixed = fixed.replace(
    /<p>\*Battery Only:(.*?)<\/p>/gi,
    '<li style="font-size: 0.875rem; font-style: italic; color: #6b7280; line-height: 1.5;"><strong style="font-style: normal;">Battery Only:</strong>$1</li>'
  );

  fixed = fixed.replace(
    /<p>\*Battery \+ Inverter:(.*?)<\/p>/gi,
    '<li style="font-size: 0.875rem; font-style: italic; color: #6b7280; line-height: 1.5;"><strong style="font-style: normal;">Battery + Inverter:</strong>$1</li>'
  );

  // Also fix existing list items that don't have styling
  fixed = fixed.replace(
    /<li><strong>Battery Only:<\/strong>(.*?)<\/li>/gi,
    '<li style="font-size: 0.875rem; font-style: italic; color: #6b7280; line-height: 1.5;"><strong style="font-style: normal;">Battery Only:</strong>$1</li>'
  );

  fixed = fixed.replace(
    /<li><strong>Battery \+ Inverter:<\/strong>(.*?)<\/li>/gi,
    '<li style="font-size: 0.875rem; font-style: italic; color: #6b7280; line-height: 1.5;"><strong style="font-style: normal;">Battery + Inverter:</strong>$1</li>'
  );

  // Wrap consecutive battery notes in ul with proper styling
  fixed = fixed.replace(
    /(<li style="font-size: 0\.875rem[^>]*>[\s\S]*?<\/li>)\s*(<li style="font-size: 0\.875rem[^>]*>[\s\S]*?<\/li>)/gis,
    '<ul style="list-style-type: disc; padding-left: 2rem; margin: 1rem 0; font-size: 0.875rem;">\n$1\n$2\n</ul>'
  );

  return fixed;
}

/**
 * Validate and fix broken tables
 */
export function validateAndFixTables(htmlContent: string): string {
  let fixed = htmlContent;

  // Check for tables missing opening tag
  if (fixed.includes('<tbody>') && !fixed.includes('<table')) {
    fixed = fixed.replace(
      /<tbody>/,
      '<table style="width: 100%; border-collapse: collapse; margin: 20px 0; background: white; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">\n<tbody>'
    );
  }

  // Check for tables missing closing tag
  if (fixed.includes('</tbody>') && !fixed.includes('</table>')) {
    fixed = fixed.replace(
      /<\/tbody>/,
      '</tbody>\n</table>'
    );
  }

  // Remove orphaned table fragments (td without tr)
  fixed = fixed.replace(
    /<td[^>]*>[^<]*<\/td>(?!\s*<\/tr>)/gi,
    ''
  );

  // Fix incomplete comparison tables (missing columns)
  fixed = fixIncompleteComparisonTables(fixed);

  return fixed;
}

/**
 * Detect and fix incomplete comparison tables
 */
function fixIncompleteComparisonTables(html: string): string {
  // Find tables with comparison headers (e.g., "vs." or "Comparison")
  const tableRegex = /<table[^>]*>([\s\S]*?)<\/table>/gi;
  
  return html.replace(tableRegex, (tableMatch) => {
    // Check if this is a comparison table
    if (!tableMatch.toLowerCase().includes('vs.') && !tableMatch.toLowerCase().includes('comparison')) {
      return tableMatch;
    }

    // Get all rows (from thead or tbody)
    const allRows = tableMatch.match(/<tr[^>]*>[\s\S]*?<\/tr>/gi) || [];
    if (allRows.length === 0) return tableMatch;

    // First row is header - count columns
    const firstRow = allRows[0];
    const headerCells = (firstRow.match(/<th[^>]*>/gi) || firstRow.match(/<td[^>]*>/gi) || []).length;
    
    if (headerCells === 0) return tableMatch;

    console.log(`📊 Table has ${headerCells} columns in header`);

    // Check all rows for missing cells
    let hasIncompleteRows = false;
    const fixedRows = allRows.map((row, index) => {
      const cells = (row.match(/<td[^>]*>/gi) || row.match(/<th[^>]*>/gi) || []).length;
      
      // If row has fewer cells than header, add empty cells
      if (cells < headerCells && cells > 0) {
        hasIncompleteRows = true;
        const missingCells = headerCells - cells;
        console.log(`⚠️ Row ${index + 1} has ${cells} cells, expected ${headerCells} - adding ${missingCells} empty cells`);
        
        const cellTag = row.includes('<th') ? 'th' : 'td';
        const emptyCells = `<${cellTag} style="padding: 12px; border: 1px solid #e5e7eb; color: #9ca3af;">-</${cellTag}>`.repeat(missingCells);
        return row.replace('</tr>', `${emptyCells}</tr>`);
      }
      
      return row;
    });

    if (hasIncompleteRows) {
      console.log('✅ Fixed incomplete comparison table');
      // Replace all rows in the table
      let result = tableMatch;
      allRows.forEach((oldRow, i) => {
        result = result.replace(oldRow, fixedRows[i]);
      });
      return result;
    }

    return tableMatch;
  });
}
