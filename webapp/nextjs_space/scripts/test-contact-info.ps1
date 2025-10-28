Write-Host "Testing contact information in responses..." -ForegroundColor Cyan

# Test v1
Write-Host "`n=== V1 RESPONSE ===" -ForegroundColor Yellow
$body = @{
    message = "What's your phone number and email?"
    context = "website"
    conversationHistory = @()
} | ConvertTo-Json

try {
    $response1 = Invoke-RestMethod -Uri "http://localhost:5123/api/chatbot/chat" -Method POST -ContentType "application/json" -Body $body
    Write-Host $response1.response
} catch {
    Write-Host "V1 Error: $($_.Exception.Message)" -ForegroundColor Red
}

# Test v2
Write-Host "`n=== V2 RESPONSE ===" -ForegroundColor Yellow
try {
    $response2 = Invoke-RestMethod -Uri "http://localhost:5123/api/chatbot/chat-v2" -Method POST -ContentType "application/json" -Body $body
    Write-Host $response2.response
} catch {
    Write-Host "V2 Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n=== COMPARISON ===" -ForegroundColor Cyan
Write-Host "Check if both show the same contact information from database"
