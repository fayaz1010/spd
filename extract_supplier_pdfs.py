#!/usr/bin/env python3
"""
Extract text from all supplier PDF price lists
"""

import PyPDF2
import os
import json

suppliers_dir = r"D:\SPD\suppliers"
output_dir = r"D:\SPD\suppliers\extracted"

# Create output directory
os.makedirs(output_dir, exist_ok=True)

pdf_files = [
    "BayWa re Price List (7).pdf",
    "Go Solar PriceList - AUGUST 2025.pdf",
    "Raystech Price list2.pdf",
    "SG Wholesale Pricelist V8 2025.pdf",
    "Sigenergy Price list.pdf",
    "Sunsavers Price (2).pdf",
    "iStore Guide - Jan 25.pdf"
]

for pdf_file in pdf_files:
    pdf_path = os.path.join(suppliers_dir, pdf_file)
    
    if not os.path.exists(pdf_path):
        print(f"⚠️  File not found: {pdf_file}")
        continue
    
    print(f"\n📄 Extracting: {pdf_file}")
    print("=" * 80)
    
    try:
        with open(pdf_path, 'rb') as file:
            pdf_reader = PyPDF2.PdfReader(file)
            num_pages = len(pdf_reader.pages)
            
            print(f"   Pages: {num_pages}")
            
            # Extract text from all pages
            full_text = ""
            for page_num in range(num_pages):
                page = pdf_reader.pages[page_num]
                text = page.extract_text()
                full_text += f"\n\n--- PAGE {page_num + 1} ---\n\n{text}"
            
            # Save to text file
            output_filename = pdf_file.replace('.pdf', '.txt')
            output_path = os.path.join(output_dir, output_filename)
            
            with open(output_path, 'w', encoding='utf-8') as out_file:
                out_file.write(full_text)
            
            print(f"   ✅ Extracted to: {output_filename}")
            print(f"   Characters: {len(full_text)}")
            
    except Exception as e:
        print(f"   ❌ Error: {str(e)}")

print("\n" + "=" * 80)
print(f"✅ Extraction complete! Check: {output_dir}")
print("=" * 80)
