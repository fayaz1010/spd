# Database Seeding Guide

## Quick Start

### Option 1: Run Foundation Only (Fastest)
```bash
cd docs/nextjs_space
npx tsx scripts/seed-1-foundation.ts
```

This creates:
- ✅ Admin users (login credentials)
- ✅ API settings
- ✅ System configuration
- ✅ Payment settings

**Login after seeding:**
- Email: `admin@sundirectpower.com`
- Password: `admin123`

---

### Option 2: Run All Seeds (Complete)
```bash
cd docs/nextjs_space
npx tsx scripts/seed-all.ts --clear
```

The `--clear` flag will wipe existing data first.

---

## What Was Created

### ✅ Completed Scripts

1. **`seed-1-foundation.ts`** - Admin users, API settings, system config
2. **`seed-all.ts`** - Master orchestrator script

### 📋 Planned Scripts (To Be Created)

The comprehensive plan includes 16 seed scripts covering:

- **Pricing & Products** - Solar/battery pricing, installation rates
- **Product Catalog** - Panels, inverters, batteries (brands & specs)
- **Suppliers** - Supplier relationships, inventory, commissions
- **Teams & Staff** - Installation teams, staff members, subcontractors
- **Consumption & Packages** - Usage assumptions, system packages
- **Leads & Quotes** - Sample customer data at various stages
- **Installation Jobs** - Jobs in different statuses with materials
- **Documents** - Certificates, compliance records, SLDs
- **Rebates** - Rebate submissions and validations
- **Service Jobs** - Maintenance and repair jobs
- **CRM** - Deals, activities, communications
- **Staff Management** - Timesheets, leave, payroll, KPIs
- **Blog** - Categories and sample posts
- **Shop** - Products and orders
- **NEM12** - Energy consumption data

---

## Current Database Status

After running `seed-1-foundation.ts`, you have:

### Admin Access
- **Super Admin**: admin@sundirectpower.com / admin123
- **Regular Admin**: manager@sundirectpower.com / admin123

### Business Configuration
- Company details (ABN, address, contact)
- License details for all Australian states (WA, NSW, VIC, QLD, SA, TAS, NT, ACT)
- CEC accreditation details
- API integration settings (placeholders)

### System Settings
- Supplier selection strategy
- Default markups (25% panels, 20% battery/inverter)
- Quote validity (30 days)
- Auto-quote requests enabled

### Payment Settings
- 10% deposit required
- 24-month installment option
- 0% interest rate

### Config Settings
- Quote expiry: 30 days
- Auto follow-up schedule: 1, 3, 7, 14 days
- Working hours: Mon-Fri, 8am-5pm
- Installation buffer: 7 days minimum

---

## Next Steps

### To Complete Full Seeding:

1. **Review the plan**: Check `docs/COMPREHENSIVE_SEED_PLAN.md`

2. **Create remaining scripts**: I've provided the structure and first script as a template

3. **Run incrementally**: Test each script individually before running all

4. **Customize data**: Adjust addresses, names, dates to match your testing needs

---

## Seeding Strategy

### Why 16 Separate Scripts?

1. **Modularity** - Test individual areas without affecting others
2. **Dependencies** - Proper order ensures relationships are maintained
3. **Debugging** - Easy to identify which area has issues
4. **Flexibility** - Run only what you need for specific testing
5. **Performance** - Smaller chunks are faster to execute

### Dependency Order

```
Foundation (Admin, Settings)
    ↓
Pricing & Products
    ↓
Product Catalog
    ↓
Suppliers & Inventory
    ↓
Teams & Staff
    ↓
Consumption & Packages
    ↓
Leads & Quotes
    ↓
Installation Jobs
    ↓
Documents & Certificates
    ↓
Rebates & Validations
    ↓
Service Jobs
    ↓
CRM & Communications
    ↓
Staff Management
    ↓
Blog Content
    ↓
Shop & Orders
    ↓
NEM12 & Analytics
```

---

## Testing Coverage

Once fully seeded, you'll be able to test:

### Customer Journey
- ✅ Lead capture forms
- ✅ Quote generation
- ✅ Payment processing
- ✅ Installation scheduling
- ✅ Job completion
- ✅ Document generation

### Staff Operations
- ✅ Team management
- ✅ Job assignment
- ✅ Time tracking
- ✅ Leave management
- ✅ Payroll processing

### Admin Functions
- ✅ Dashboard analytics
- ✅ Pricing management
- ✅ Supplier management
- ✅ Inventory tracking
- ✅ Compliance tracking
- ✅ Rebate submissions

### CRM & Sales
- ✅ Deal pipeline
- ✅ Activity tracking
- ✅ Follow-up automation
- ✅ Communication history

### Content & E-commerce
- ✅ Blog management
- ✅ Shop functionality
- ✅ Order processing

---

## Troubleshooting

### If seeding fails:

1. **Check database connection**
   ```bash
   npx prisma db push
   ```

2. **Clear and retry**
   ```bash
   npx tsx scripts/seed-all.ts --clear
   ```

3. **Run individual scripts**
   ```bash
   npx tsx scripts/seed-1-foundation.ts
   ```

4. **Check Prisma schema**
   ```bash
   npx prisma generate
   ```

### Common Issues

- **"Model not found"** - Run `npx prisma generate`
- **"Unique constraint failed"** - Use `--clear` flag or manually delete data
- **"Foreign key constraint"** - Check dependency order
- **"Invalid enum value"** - Check schema for correct enum values

---

## Data Cleanup

### Clear all data:
```bash
npx tsx scripts/seed-all.ts --clear
```

### Clear specific tables:
```typescript
await prisma.lead.deleteMany({});
await prisma.installationJob.deleteMany({});
// etc.
```

---

## Production Considerations

⚠️ **NEVER run seed scripts in production!**

These scripts are for:
- ✅ Development environments
- ✅ Testing environments
- ✅ Demo environments
- ✅ Local development

For production:
- Use proper data migration scripts
- Import real customer data carefully
- Never use default passwords
- Validate all data before import

---

## Contributing

When creating new seed scripts:

1. Follow the naming convention: `seed-X-name.ts`
2. Include console logging for progress
3. Use `upsert` where possible to avoid duplicates
4. Handle errors gracefully
5. Document what data is created
6. Test independently before adding to `seed-all.ts`

---

## Support

If you encounter issues:

1. Check the comprehensive plan: `docs/COMPREHENSIVE_SEED_PLAN.md`
2. Review the schema: `prisma/schema.prisma`
3. Check existing seed examples
4. Verify database connection

---

## Summary

✅ **Foundation script created and ready to use**
📋 **Comprehensive 16-script plan documented**
🎯 **Clear execution strategy defined**
🔐 **Admin access configured**

You can now:
1. Run the foundation script to get started
2. Create additional scripts following the template
3. Test individual functionality areas
4. Build up to complete system testing
