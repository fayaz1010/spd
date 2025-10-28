Write-Host "Testing Extra Services..." -ForegroundColor Cyan

$body = @{
    message = "Do you offer roof repairs or gutter cleaning?"
    context = "website"
    conversationHistory = @()
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "http://localhost:5123/api/chatbot/chat-v2" -Method POST -ContentType "application/json" -Body $body
    
    Write-Host "`n=== AI RESPONSE ===" -ForegroundColor Green
    Write-Host $response.response
    
    Write-Host "`n=== CHECK ===" -ForegroundColor Cyan
    if ($response.response -match 'roof|gutter|service') { 
        Write-Host "[OK] Discusses extra services" -ForegroundColor Green 
    } else { 
        Write-Host "[MISSING] Extra services info" -ForegroundColor Red 
    }
    
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}
