@echo off
REM Re-seed Database with October 24, 2025 Data Only
REM Run these in the exact order they were created

echo 🌱 Re-seeding database with Oct 24, 2025 data...
echo.

echo 1/14 - Content...
call npx tsx prisma/seed-content.ts
if %errorlevel% neq 0 goto error

echo 2/14 - Company data...
call npx tsx prisma/seed-company-data.ts
if %errorlevel% neq 0 goto error

echo 3/14 - Directors (real)...
call npx tsx prisma/seed-directors-real.ts
if %errorlevel% neq 0 goto error

echo 4/14 - Directors (simple)...
call npx tsx prisma/seed-directors-simple.ts
if %errorlevel% neq 0 goto error

echo 5/14 - Installation costs...
call npx tsx prisma/seed-installation-costs-perth-2025-updated.ts
if %errorlevel% neq 0 goto error

echo 6/14 - Products from CSV...
call npx tsx prisma/seed-products-from-csv.ts
if %errorlevel% neq 0 goto error

echo 7/14 - Products from extracted CSV...
call npx tsx prisma/seed-products-from-extracted-csv.ts
if %errorlevel% neq 0 goto error

echo 8/14 - Products from cleaned CSV...
call npx tsx prisma/seed-products-from-cleaned-csv.ts
if %errorlevel% neq 0 goto error

echo 9/14 - Missing suppliers...
call npx tsx prisma/seed-missing-suppliers.ts
if %errorlevel% neq 0 goto error

echo 10/14 - Supplier product links...
call npx tsx prisma/seed-supplier-product-links.ts
if %errorlevel% neq 0 goto error

echo 11/14 - Installation cost items...
call npx tsx prisma/seed-installation-cost-items-proper.ts
if %errorlevel% neq 0 goto error

echo 12/14 - Installation 40...
call npx tsx prisma/seed-installation-40.ts
if %errorlevel% neq 0 goto error

echo 13/14 - Additional products...
call node seed_additional_products.js
if %errorlevel% neq 0 goto error

echo 14/14 - Premium batteries...
call node seed_premium_batteries.js
if %errorlevel% neq 0 goto error

echo.
echo ✅ Re-seeding complete!
goto end

:error
echo.
echo ❌ Error occurred during seeding!
echo Check the error message above.
exit /b 1

:end
