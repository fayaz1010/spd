"""
PDF Supplier Price List Extractor
Extracts product data from supplier PDF price lists and creates CSV files
"""

import pdfplumber
import pandas as pd
import re
import os
from pathlib import Path

# Supplier configurations
SUPPLIERS = {
    'BayWa re Price List (7).pdf': {
        'name': 'BayWa r.e.',
        'output': 'baywa_products.csv'
    },
    'Go Solar PriceList - AUGUST 2025.pdf': {
        'name': 'Go Solar',
        'output': 'gosolar_products.csv'
    },
    'Raystech Price list2.pdf': {
        'name': 'Raystech',
        'output': 'raystech_products.csv'
    },
    'SG Wholesale Pricelist V8 2025.pdf': {
        'name': 'SG Wholesale',
        'output': 'sgwholesale_products.csv'
    },
    'Sigenergy Price list.pdf': {
        'name': 'Sigenergy',
        'output': 'sigenergy_products.csv'
    },
    'Sunsavers Price (2).pdf': {
        'name': 'Sunsavers',
        'output': 'sunsavers_products.csv'
    },
    'iStore Guide - Jan 25.pdf': {
        'name': 'iStore',
        'output': 'istore_products.csv'
    }
}

def clean_price(price_str):
    """Extract numeric price from string"""
    if not price_str or pd.isna(price_str):
        return None
    # Remove $, commas, spaces
    cleaned = re.sub(r'[$,\s]', '', str(price_str))
    try:
        return float(cleaned)
    except:
        return None

def categorize_product(text):
    """Determine product category from text"""
    text_lower = text.lower()
    if any(word in text_lower for word in ['panel', 'solar module', 'pv module']):
        return 'Solar Panels'
    elif any(word in text_lower for word in ['inverter', 'hybrid']):
        return 'Inverters'
    elif any(word in text_lower for word in ['battery', 'storage', 'powerwall']):
        return 'Batteries'
    elif any(word in text_lower for word in ['mount', 'rack', 'rail', 'clamp', 'hook']):
        return 'Mounting'
    elif any(word in text_lower for word in ['cable', 'wire', 'connector', 'mc4']):
        return 'Cables'
    elif any(word in text_lower for word in ['charger', 'ev', 'zappi']):
        return 'EV Chargers'
    else:
        return 'Accessories'

def extract_wattage(text):
    """Extract wattage from product description"""
    match = re.search(r'(\d+)\s*[Ww]', text)
    if match:
        return f"{match.group(1)}W"
    return ""

def extract_brand(text):
    """Extract brand name from product description"""
    # Common brands
    brands = ['Jinko', 'Trina', 'Longi', 'JA Solar', 'Canadian', 'Risen', 'Seraphim',
              'Q.CELLS', 'REC', 'SunPower', 'Aiko', 'WINAICO',
              'Fronius', 'SMA', 'Sungrow', 'SolarEdge', 'Enphase', 'GoodWe', 'Huawei',
              'Tesla', 'BYD', 'Pylontech', 'Alpha ESS', 'Sigenergy',
              'iStore', 'Growatt', 'Victron']
    
    for brand in brands:
        if brand.lower() in text.lower():
            return brand
    
    # Try to extract first word as brand
    words = text.split()
    if words:
        return words[0]
    return "Unknown"

def extract_from_pdf(pdf_path, supplier_name):
    """Extract product data from PDF"""
    print(f"\n📄 Processing: {os.path.basename(pdf_path)}")
    print(f"   Supplier: {supplier_name}")
    
    products = []
    
    try:
        with pdfplumber.open(pdf_path) as pdf:
            print(f"   Pages: {len(pdf.pages)}")
            
            for page_num, page in enumerate(pdf.pages, 1):
                # Extract tables
                tables = page.extract_tables()
                
                if not tables:
                    # Try text extraction if no tables
                    text = page.extract_text()
                    if text:
                        lines = text.split('\n')
                        for line in lines:
                            # Look for price patterns
                            if '$' in line and any(char.isdigit() for char in line):
                                products.append({
                                    'text': line,
                                    'page': page_num
                                })
                    continue
                
                for table_idx, table in enumerate(tables):
                    if not table or len(table) < 2:
                        continue
                    
                    # Try to identify header row
                    header = table[0]
                    
                    # Process data rows
                    for row_idx, row in enumerate(table[1:], 1):
                        if not row or len(row) < 2:
                            continue
                        
                        # Join all cells to get full product info
                        row_text = ' '.join([str(cell) if cell else '' for cell in row])
                        
                        # Look for price in row
                        price_match = re.search(r'\$[\d,]+\.?\d*', row_text)
                        if price_match:
                            products.append({
                                'row': row,
                                'text': row_text,
                                'page': page_num,
                                'table': table_idx
                            })
            
            print(f"   Found {len(products)} potential products")
            
    except Exception as e:
        print(f"   ❌ Error: {e}")
        return []
    
    return products

def process_products(raw_products, supplier_name):
    """Process raw extracted data into structured format"""
    processed = []
    
    for item in raw_products:
        try:
            text = item.get('text', '')
            row = item.get('row', [])
            
            # Extract price
            price_match = re.search(r'\$[\d,]+\.?\d*', text)
            price = clean_price(price_match.group(0)) if price_match else None
            
            if not price or price <= 0:
                continue
            
            # Extract product info
            category = categorize_product(text)
            brand = extract_brand(text)
            wattage = extract_wattage(text)
            
            # Try to get SKU/Part number (usually alphanumeric code)
            sku_match = re.search(r'[A-Z]{2,}[-_]?[\dA-Z]{3,}', text)
            sku = sku_match.group(0) if sku_match else ''
            
            # Description (clean up the text)
            description = text.replace(price_match.group(0) if price_match else '', '')
            description = re.sub(r'\s+', ' ', description).strip()
            
            product = {
                'Category': category,
                'Supplier': supplier_name,
                'Brand': brand,
                'Product Description': description[:100],  # Limit length
                'Specifications': wattage,
                'Vendor Part No#': sku,
                'Price (ex. GST)': f"${price:.2f}",
                'Page': item.get('page', ''),
            }
            
            processed.append(product)
            
        except Exception as e:
            print(f"   ⚠️  Error processing item: {e}")
            continue
    
    return processed

def main():
    print("=" * 70)
    print("PDF SUPPLIER PRICE LIST EXTRACTOR")
    print("=" * 70)
    
    suppliers_dir = Path('suppliers')
    output_dir = suppliers_dir / 'extracted'
    output_dir.mkdir(exist_ok=True)
    
    all_products = []
    
    for pdf_file, config in SUPPLIERS.items():
        pdf_path = suppliers_dir / pdf_file
        
        if not pdf_path.exists():
            print(f"\n⏭️  Skipping {pdf_file} (not found)")
            continue
        
        # Extract from PDF
        raw_products = extract_from_pdf(str(pdf_path), config['name'])
        
        if not raw_products:
            print(f"   ⚠️  No products found")
            continue
        
        # Process products
        products = process_products(raw_products, config['name'])
        print(f"   ✅ Processed {len(products)} products")
        
        # Save individual supplier file
        if products:
            df = pd.DataFrame(products)
            output_path = output_dir / config['output']
            df.to_csv(output_path, index=False)
            print(f"   💾 Saved to: {output_path}")
            
            all_products.extend(products)
    
    # Save combined file
    if all_products:
        print(f"\n📊 Total products extracted: {len(all_products)}")
        df_all = pd.DataFrame(all_products)
        combined_path = output_dir / 'all_products_combined.csv'
        df_all.to_csv(combined_path, index=False)
        print(f"💾 Combined file saved to: {combined_path}")
        
        # Summary by supplier
        print("\n📈 Products by Supplier:")
        summary = df_all.groupby('Supplier').size()
        for supplier, count in summary.items():
            print(f"   {supplier}: {count} products")
        
        # Summary by category
        print("\n📈 Products by Category:")
        summary = df_all.groupby('Category').size()
        for category, count in summary.items():
            print(f"   {category}: {count} products")
    
    print("\n" + "=" * 70)
    print("✅ EXTRACTION COMPLETE!")
    print("=" * 70)
    print(f"\nNext steps:")
    print(f"1. Review extracted files in: {output_dir}")
    print(f"2. Clean up any errors or missing data")
    print(f"3. Run the seed script to import to database")

if __name__ == '__main__':
    main()
