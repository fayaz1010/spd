#!/bin/bash
# Re-seed Database with October 24, 2025 Data Only
# Run these in the exact order they were created

echo "🌱 Re-seeding database with Oct 24, 2025 data..."
echo ""

echo "1/14 - Content..."
npx tsx prisma/seed-content.ts

echo "2/14 - Company data..."
npx tsx prisma/seed-company-data.ts

echo "3/14 - Directors (real)..."
npx tsx prisma/seed-directors-real.ts

echo "4/14 - Directors (simple)..."
npx tsx prisma/seed-directors-simple.ts

echo "5/14 - Installation costs..."
npx tsx prisma/seed-installation-costs-perth-2025-updated.ts

echo "6/14 - Products from CSV..."
npx tsx prisma/seed-products-from-csv.ts

echo "7/14 - Products from extracted CSV..."
npx tsx prisma/seed-products-from-extracted-csv.ts

echo "8/14 - Products from cleaned CSV..."
npx tsx prisma/seed-products-from-cleaned-csv.ts

echo "9/14 - Missing suppliers..."
npx tsx prisma/seed-missing-suppliers.ts

echo "10/14 - Supplier product links..."
npx tsx prisma/seed-supplier-product-links.ts

echo "11/14 - Installation cost items..."
npx tsx prisma/seed-installation-cost-items-proper.ts

echo "12/14 - Installation 40..."
npx tsx prisma/seed-installation-40.ts

echo "13/14 - Additional products..."
node seed_additional_products.js

echo "14/14 - Premium batteries..."
node seed_premium_batteries.js

echo ""
echo "✅ Re-seeding complete!"
