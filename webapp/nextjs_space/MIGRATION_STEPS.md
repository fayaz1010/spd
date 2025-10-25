# 🚀 Database Migration Steps

## Run This Command:

```bash
cd d:\SPD\webapp\nextjs_space
npx prisma db push
```

This will:
- ✅ Add 48 new fields to CustomerQuote table
- ✅ Update database schema
- ✅ Generate new Prisma client
- ✅ No data loss (only adding fields)

## After Migration:

The calculator will be ready to:
1. Save bill breakdown data
2. Save self-consumption metrics
3. Save battery metrics
4. Save existing system data

## Verify Migration:

```bash
npx prisma studio
```

Then check CustomerQuote table for new fields:
- billInterval
- billJanFeb, billMarApr, etc.
- dailySupplyCharge, electricityRate, feedInTariff
- selfConsumptionPercent, selfSufficiencyPercent
- batteryChargedKwh, batteryDischargedKwh
- hasExistingSolar, hasExistingBattery

## Safe to Run:

✅ Only adding new fields (no deletions)
✅ All fields are optional (nullable)
✅ Default values provided where needed
✅ No breaking changes
✅ Existing data preserved
