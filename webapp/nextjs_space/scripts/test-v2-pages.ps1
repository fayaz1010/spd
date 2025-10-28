Write-Host "Testing V2 knowledge of website pages..." -ForegroundColor Cyan

# Test 1: Shop page
Write-Host "`n=== TEST 1: Shop Page ===" -ForegroundColor Yellow
$body1 = @{
    message = "What solar panels do you have available? I want to compare brands."
    context = "website"
    conversationHistory = @()
} | ConvertTo-Json

try {
    $response1 = Invoke-RestMethod -Uri "http://localhost:5123/api/chatbot/chat-v2" -Method POST -ContentType "application/json" -Body $body1
    Write-Host $response1.response
    if ($response1.response -match 'shop') { Write-Host "[OK] Mentions shop page" -ForegroundColor Green } else { Write-Host "[MISSING] Shop page" -ForegroundColor Red }
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 2: Extra Services
Write-Host "`n=== TEST 2: Extra Services ===" -ForegroundColor Yellow
$body2 = @{
    message = "Do you offer roof repairs or gutter cleaning?"
    context = "website"
    conversationHistory = @()
} | ConvertTo-Json

try {
    $response2 = Invoke-RestMethod -Uri "http://localhost:5123/api/chatbot/chat-v2" -Method POST -ContentType "application/json" -Body $body2
    Write-Host $response2.response
    if ($response2.response -match 'extra|service|roof|gutter') { Write-Host "[OK] Discusses extra services" -ForegroundColor Green } else { Write-Host "[MISSING] Extra services" -ForegroundColor Red }
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 3: Jobs/Careers
Write-Host "`n=== TEST 3: Jobs/Careers ===" -ForegroundColor Yellow
$body3 = @{
    message = "Are you hiring? Do you have any job openings?"
    context = "website"
    conversationHistory = @()
} | ConvertTo-Json

try {
    $response3 = Invoke-RestMethod -Uri "http://localhost:5123/api/chatbot/chat-v2" -Method POST -ContentType "application/json" -Body $body3
    Write-Host $response3.response
    if ($response3.response -match 'career|job|hiring|www\.sundirectpower\.com\.au/careers') { Write-Host "[OK] Mentions careers page" -ForegroundColor Green } else { Write-Host "[MISSING] Careers page" -ForegroundColor Red }
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 4: Packages
Write-Host "`n=== TEST 4: Packages ===" -ForegroundColor Yellow
$body4 = @{
    message = "What solar packages do you offer?"
    context = "website"
    conversationHistory = @()
} | ConvertTo-Json

try {
    $response4 = Invoke-RestMethod -Uri "http://localhost:5123/api/chatbot/chat-v2" -Method POST -ContentType "application/json" -Body $body4
    Write-Host $response4.response
    if ($response4.response -match 'package|www\.sundirectpower\.com\.au/packages') { Write-Host "[OK] Mentions packages page" -ForegroundColor Green } else { Write-Host "[MISSING] Packages page" -ForegroundColor Red }
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n=== SUMMARY ===" -ForegroundColor Cyan
Write-Host "All tests completed. Check results above." -ForegroundColor Green
