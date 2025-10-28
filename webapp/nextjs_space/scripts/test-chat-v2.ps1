# PowerShell Test Script for Chat API v2

Write-Host "🧪 Testing Chat API v2..." -ForegroundColor Cyan
Write-Host ""

$testMessage = "My monthly bill is `$300, what size system do I need?"
Write-Host "📝 Test Message: $testMessage" -ForegroundColor Yellow
Write-Host "🌐 Calling API..." -ForegroundColor Yellow
Write-Host ""

$body = @{
    message = $testMessage
    context = "website"
    conversationHistory = @()
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "http://localhost:5123/api/chatbot/chat-v2" `
        -Method POST `
        -ContentType "application/json" `
        -Body $body `
        -ErrorAction Stop

    Write-Host "✅ Response received!" -ForegroundColor Green
    Write-Host ""
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
    Write-Host "📊 Response Data:" -ForegroundColor Cyan
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
    Write-Host ""
    
    Write-Host "💬 AI Response:" -ForegroundColor Green
    Write-Host $response.response
    Write-Host ""

    if ($response.modelUsed) {
        Write-Host "🤖 Model Used: $($response.modelUsed)" -ForegroundColor Cyan
    }

    if ($response.temperature) {
        Write-Host "🌡️  Temperature: $($response.temperature)" -ForegroundColor Cyan
    }

    if ($response.toolsUsed) {
        Write-Host "🔧 Tools Called: $($response.toolsUsed -join ', ')" -ForegroundColor Cyan
    }

    if ($response.showLeadForm) {
        Write-Host "📋 Lead Form Triggered: Yes" -ForegroundColor Yellow
    }

    Write-Host ""
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
    
    # Quality checks
    Write-Host ""
    Write-Host "✅ Quality Checks:" -ForegroundColor Cyan
    
    $hasSpecificNumbers = $response.response -match '\$\d+'
    $hasSystemSize = $response.response -match '\d+\.?\d*kW'
    $hasBattery = $response.response -match 'battery|kWh'
    $hasRebates = $response.response -match 'rebate'
    $hasSavings = $response.response -match 'saving'
    $hasCalculatorLink = $response.response -match 'calculator|www\.sundirectpower'
    
    if ($hasSpecificNumbers) { Write-Host "  ✅ Contains specific dollar amounts" -ForegroundColor Green }
    else { Write-Host "  ❌ Contains specific dollar amounts" -ForegroundColor Red }
    
    if ($hasSystemSize) { Write-Host "  ✅ Mentions system size (kW)" -ForegroundColor Green }
    else { Write-Host "  ❌ Mentions system size (kW)" -ForegroundColor Red }
    
    if ($hasBattery) { Write-Host "  ✅ Discusses battery storage" -ForegroundColor Green }
    else { Write-Host "  ❌ Discusses battery storage" -ForegroundColor Red }
    
    if ($hasRebates) { Write-Host "  ✅ Mentions rebates" -ForegroundColor Green }
    else { Write-Host "  ❌ Mentions rebates" -ForegroundColor Red }
    
    if ($hasSavings) { Write-Host "  ✅ Discusses savings" -ForegroundColor Green }
    else { Write-Host "  ❌ Discusses savings" -ForegroundColor Red }
    
    if ($hasCalculatorLink) { Write-Host "  ✅ Includes calculator link" -ForegroundColor Green }
    else { Write-Host "  ❌ Includes calculator link" -ForegroundColor Red }
    
    $qualityScore = @($hasSpecificNumbers, $hasSystemSize, $hasBattery, $hasRebates, $hasSavings, $hasCalculatorLink).Where({$_}).Count
    
    Write-Host ""
    Write-Host "📊 Quality Score: $qualityScore/6" -ForegroundColor Cyan
    
    if ($qualityScore -ge 5) {
        Write-Host "🎉 EXCELLENT - v2 is using the complete system prompt correctly!" -ForegroundColor Green
    } elseif ($qualityScore -ge 3) {
        Write-Host "⚠️  GOOD - v2 is working but could be more comprehensive" -ForegroundColor Yellow
    } else {
        Write-Host "❌ POOR - v2 may not be using the complete system prompt" -ForegroundColor Red
    }

} catch {
    Write-Host "❌ Test failed: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        Write-Host "Response: $($_.Exception.Response)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Test completed" -ForegroundColor Green
