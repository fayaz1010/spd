Write-Host "Checking contact info in database..." -ForegroundColor Cyan

$query = @"
SELECT 
    businessName,
    businessPhone,
    businessEmail,
    businessAddress,
    businessABN
FROM "ApiSettings"
WHERE id = 'default'
LIMIT 1;
"@

Write-Host "`nExecuting query..." -ForegroundColor Yellow
Write-Host $query

Write-Host "`nPlease check the database manually or tell me what the correct contact info should be." -ForegroundColor Green
