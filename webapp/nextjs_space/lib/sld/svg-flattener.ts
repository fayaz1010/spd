/**
 * SVG Flattener
 * Converts nested <svg> elements to <g> groups to fix browser rendering issues
 */

export function flattenNestedSvgs(svgString: string): string {
  console.log('🔨 Flattening nested SVGs...');
  
  // Find all nested <svg> elements (those with x, y attributes)
  const nestedSvgRegex = /<svg\s+x="([^"]+)"\s+y="([^"]+)"\s+width="([^"]+)"\s+height="([^"]+)"\s+viewBox="([^"]+)"[^>]*>([\s\S]*?)<\/svg>/g;
  
  let flattened = svgString;
  let match;
  let count = 0;
  
  while ((match = nestedSvgRegex.exec(svgString)) !== null) {
    const [fullMatch, x, y, width, height, viewBox, content] = match;
    
    // Parse viewBox to calculate scale
    const [vbX, vbY, vbWidth, vbHeight] = viewBox.split(' ').map(Number);
    const scaleX = parseFloat(width) / vbWidth;
    const scaleY = parseFloat(height) / vbHeight;
    
    // Convert to <g> with transform
    const replacement = `<g transform="translate(${x}, ${y}) scale(${scaleX}, ${scaleY})">${content}</g>`;
    
    flattened = flattened.replace(fullMatch, replacement);
    count++;
  }
  
  console.log(`  Converted ${count} nested <svg> elements to <g> groups`);
  
  return flattened;
}
