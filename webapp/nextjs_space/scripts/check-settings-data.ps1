Write-Host "Checking Live Chat Settings data..." -ForegroundColor Cyan

try {
    $response = Invoke-RestMethod -Uri "http://localhost:5123/api/admin/website/live-chat-settings" -Method GET
    
    Write-Host "`n=== SETTINGS DATA ===" -ForegroundColor Green
    Write-Host "Enabled: $($response.enabled)"
    Write-Host "AI Model: $($response.aiModel)"
    Write-Host "AI Name: $($response.aiName)"
    Write-Host "Temperature: $($response.temperature)"
    Write-Host "Max Tokens: $($response.maxTokens)"
    Write-Host "Position: $($response.position)"
    
    Write-Host "`n=== SYSTEM PROMPT ===" -ForegroundColor Yellow
    if ($response.systemPrompt) {
        $promptLength = $response.systemPrompt.Length
        $promptPreview = $response.systemPrompt.Substring(0, [Math]::Min(500, $promptLength))
        Write-Host "Length: $promptLength characters"
        Write-Host "Preview (first 500 chars):"
        Write-Host $promptPreview
        Write-Host "..."
        
        # Check for key content
        Write-Host "`n=== CONTENT CHECK ===" -ForegroundColor Magenta
        if ($response.systemPrompt -match 'calculator-v2') { Write-Host "[OK] Contains calculator links" -ForegroundColor Green } else { Write-Host "[MISSING] Calculator links" -ForegroundColor Red }
        if ($response.systemPrompt -match 'rebate') { Write-Host "[OK] Contains rebate info" -ForegroundColor Green } else { Write-Host "[MISSING] Rebate info" -ForegroundColor Red }
        if ($response.systemPrompt -match 'installation') { Write-Host "[OK] Contains installation info" -ForegroundColor Green } else { Write-Host "[MISSING] Installation info" -ForegroundColor Red }
        if ($response.systemPrompt -match 'objection') { Write-Host "[OK] Contains objection handling" -ForegroundColor Green } else { Write-Host "[MISSING] Objection handling" -ForegroundColor Red }
    } else {
        Write-Host "NO SYSTEM PROMPT FOUND!" -ForegroundColor Red
    }
    
    Write-Host "`n=== KNOWLEDGE BASE FIELDS ===" -ForegroundColor Cyan
    Write-Host "Company Info: $(if ($response.companyInfo) { 'Present' } else { 'NULL' })"
    Write-Host "Product Info: $(if ($response.productInfo) { 'Present' } else { 'NULL' })"
    Write-Host "Pricing Info: $(if ($response.pricingInfo) { 'Present' } else { 'NULL' })"
    Write-Host "Knowledge Base: $(if ($response.knowledgeBase) { 'Present' } else { 'NULL' })"
    
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}
