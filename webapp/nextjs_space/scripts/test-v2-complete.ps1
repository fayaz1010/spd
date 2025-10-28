Write-Host "Testing Chat API v2 with complete question..." -ForegroundColor Cyan

$body = @{
    message = "My monthly bill is about 300 dollars and I live in Perth postcode 6000. What size solar system with battery do I need to get to zero bills?"
    context = "website"
    conversationHistory = @()
} | ConvertTo-Json

try {
    Write-Host "Calling API..." -ForegroundColor Yellow
    $response = Invoke-RestMethod -Uri "http://localhost:5123/api/chatbot/chat-v2" -Method POST -ContentType "application/json" -Body $body
    
    Write-Host "`n=== AI RESPONSE ===" -ForegroundColor Green
    Write-Host $response.response
    Write-Host "`n=== METADATA ===" -ForegroundColor Cyan
    
    if ($response.modelUsed) {
        Write-Host "Model: $($response.modelUsed)"
    }
    
    if ($response.temperature) {
        Write-Host "Temperature: $($response.temperature)"
    }
    
    if ($response.toolsUsed) {
        Write-Host "Tools Used: $($response.toolsUsed -join ', ')" -ForegroundColor Yellow
    }
    
    Write-Host "`n=== QUALITY CHECK ===" -ForegroundColor Magenta
    $text = $response.response
    
    if ($text -match '\$\d+') { Write-Host "[OK] Contains dollar amounts" -ForegroundColor Green } else { Write-Host "[MISSING] Dollar amounts" -ForegroundColor Red }
    if ($text -match '\d+\.?\d*kW') { Write-Host "[OK] Mentions system size (kW)" -ForegroundColor Green } else { Write-Host "[MISSING] System size" -ForegroundColor Red }
    if ($text -match 'battery|kWh') { Write-Host "[OK] Discusses battery" -ForegroundColor Green } else { Write-Host "[MISSING] Battery info" -ForegroundColor Red }
    if ($text -match 'rebate') { Write-Host "[OK] Mentions rebates" -ForegroundColor Green } else { Write-Host "[MISSING] Rebates" -ForegroundColor Red }
    if ($text -match 'saving') { Write-Host "[OK] Discusses savings" -ForegroundColor Green } else { Write-Host "[MISSING] Savings" -ForegroundColor Red }
    if ($text -match 'calculator|www\.sundirectpower') { Write-Host "[OK] Includes link" -ForegroundColor Green } else { Write-Host "[MISSING] Calculator link" -ForegroundColor Red }
    
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}
