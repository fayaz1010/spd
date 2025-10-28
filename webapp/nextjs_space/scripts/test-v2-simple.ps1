Write-Host "Testing Chat API v2 on port 5123..." -ForegroundColor Cyan

$body = @{
    message = "My monthly bill is 300 dollars, what size system do I need?"
    context = "website"
    conversationHistory = @()
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "http://localhost:5123/api/chatbot/chat-v2" -Method POST -ContentType "application/json" -Body $body
    
    Write-Host "`nAI Response:" -ForegroundColor Green
    Write-Host $response.response
    
    if ($response.modelUsed) {
        Write-Host "`nModel: $($response.modelUsed)" -ForegroundColor Cyan
    }
    
    if ($response.toolsUsed) {
        Write-Host "Tools: $($response.toolsUsed -join ', ')" -ForegroundColor Cyan
    }
    
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}
