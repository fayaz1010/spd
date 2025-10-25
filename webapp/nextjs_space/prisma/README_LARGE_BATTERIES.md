# Large Battery Systems Seeding Guide

## Quick Start

Run the complete seeding process:

```bash
cd docs/nextjs_space
npx tsx prisma/seed-large-batteries-complete.ts
```

This will seed:
- ✅ 14 large capacity battery products (20-54kWh)
- ✅ Supplier pricing for all batteries
- ✅ 5 supplier records

## What Gets Seeded

### Products (14 batteries)

**Sungrow SBH Series (4 products)**
- SBH200: 20kWh - $16,800
- SBH250: 25kWh - $21,000
- SBH300: 30kWh - $25,200
- SBH400: 40kWh - $33,600

**BYD Battery-Box HVM (2 products)**
- HVM 19.3kWh - $15,500
- HVM 22.1kWh - $17,680

**Pylontech Force H2 (2 products)**
- FH2 21.3kWh - $13,200
- FH2 28.4kWh - $17,600

**Alpha ESS SMILE-B3 (1 product)**
- SMILE-B3 23.2kWh - $13,680

**Tesla Powerwall 3 Multi-Unit (4 products)**
- PW3 Dual (27kWh) - $25,500
- PW3 Triple (40.5kWh) - $37,400
- PW3 Quad (54kWh) - $49,300

**Tesla Powerwall 3 (1 product)**
- PW3 Single (13.5kWh) - Already exists

### Suppliers (5 companies)

1. Sungrow Australia
2. BYD Australia
3. Pylontech Australia
4. Alpha ESS Australia
5. Tesla Energy Australia

## Individual Seed Scripts

If you need to run them separately:

```bash
# Products only
npx tsx prisma/seed-large-batteries-2025.ts

# Supplier pricing only (requires products to exist first)
npx tsx prisma/seed-large-battery-suppliers-2025.ts
```

## Verification

After seeding, verify in your database:

```sql
-- Check products
SELECT name, sku, specifications->>'capacity' as capacity, tier
FROM "Product"
WHERE "productType" = 'BATTERY'
  AND CAST(specifications->>'capacity' AS DECIMAL) >= 20
ORDER BY CAST(specifications->>'capacity' AS DECIMAL);

-- Check supplier pricing
SELECT p.name, s.name as supplier, sp."retailPrice"
FROM "SupplierProduct" sp
JOIN "Product" p ON sp."productId" = p.id
JOIN "Supplier" s ON sp."supplierId" = s.id
WHERE p."productType" = 'BATTERY'
  AND CAST(p.specifications->>'capacity' AS DECIMAL) >= 20
ORDER BY sp."retailPrice";
```

## Integration with Package Generation

The `/api/quotes/generate-packages` endpoint will now:

1. **Automatically select** appropriate large batteries when requirements exceed 20kWh
2. **Calculate multiple units** if needed (e.g., 3x Tesla Powerwall 3 for 40.5kWh)
3. **Display correctly** in the UI: "3x 13.5kWh Tesla (40.5kWh total)"
4. **Cost accurately** including installation for multiple units

## Capacity Ranges

- **20-25kWh:** Budget/Mid tier - Pylontech, Alpha ESS, Sungrow SBH200
- **25-30kWh:** Mid/Premium tier - Sungrow SBH250/300, BYD HVM, Tesla 2x
- **30-40kWh:** Premium tier - Sungrow SBH300, Tesla 3x
- **40-50kWh:** Premium tier - Sungrow SBH400, Tesla 3x
- **50kWh+:** Premium tier - Tesla 4x

## Troubleshooting

### "Product not found" errors
Make sure you run the products seed before the supplier pricing seed.

### Duplicate key errors
The scripts use upsert logic, so they're safe to run multiple times. If you get errors:
1. Check your database connection
2. Verify the Product and Supplier tables exist
3. Check for schema mismatches

### Pricing seems wrong
All prices are based on 2025 Australian market research:
- Wholesale costs include supplier margins
- Retail prices include installation components
- Prices exclude rebates (applied separately)

## Notes

- All batteries are LiFePO4 (LFP) chemistry for safety
- 10-year warranties standard across all brands
- Lead times: 14-28 days depending on supplier
- MOQ: 1 unit for all products
- Installation costs calculated separately via installation-pricing-service

## Support

For issues or questions:
1. Check the main documentation: `/docs/LARGE_BATTERY_SYSTEMS_2025.md`
2. Review the seed files for detailed specifications
3. Check the API logs when generating packages

---

*Last updated: October 14, 2025*
