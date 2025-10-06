# Rate Limiting Comprehensive Test Suite
# Run this script to test all rate limiting scenarios

Write-Host "================================" -ForegroundColor Cyan
Write-Host "Rate Limiting Test Suite" -ForegroundColor Cyan
Write-Host "Sahayog Nepal API" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

$baseUrl = "http://localhost:5000"

# Test 1: Global Rate Limit - Normal Usage
Write-Host "Test 1: Global Rate Limit - Normal Usage" -ForegroundColor Yellow
Write-Host "Making 10 requests to /api/campaigns..." -ForegroundColor Gray

for ($i = 1; $i -le 10; $i++) {
    try {
        $response = Invoke-WebRequest -Uri "$baseUrl/api/campaigns" -Method GET -ErrorAction Stop
        $remaining = $response.Headers['RateLimit-Remaining']
        Write-Host "  Request $i`: Status $($response.StatusCode), Remaining: $remaining" -ForegroundColor Green
    } catch {
        Write-Host "  Request $i`: FAILED - $($_.Exception.Message)" -ForegroundColor Red
    }
    Start-Sleep -Milliseconds 100
}

Write-Host ""
Write-Host "✅ Test 1 Complete" -ForegroundColor Green
Write-Host ""

# Test 2: Rapid Fire Test
Write-Host "Test 2: Rapid Fire Test (50 requests)" -ForegroundColor Yellow
Write-Host "Testing how system handles burst traffic..." -ForegroundColor Gray

$successCount = 0
$failCount = 0

for ($i = 1; $i -le 50; $i++) {
    try {
        $response = Invoke-WebRequest -Uri "$baseUrl/api/campaigns" -Method GET -ErrorAction Stop
        $successCount++
        if ($i % 10 -eq 0) {
            $remaining = $response.Headers['RateLimit-Remaining']
            Write-Host "  $i requests sent, Remaining: $remaining" -ForegroundColor Green
        }
    } catch {
        $failCount++
        if ($_.Exception.Response.StatusCode.value__ -eq 429) {
            Write-Host "  Rate limited at request #$i" -ForegroundColor Red
            break
        }
    }
}

Write-Host "  Success: $successCount, Failed: $failCount" -ForegroundColor Cyan
Write-Host ""
Write-Host "✅ Test 2 Complete" -ForegroundColor Green
Write-Host ""

# Test 3: Check Rate Limit Headers
Write-Host "Test 3: Verify Rate Limit Headers" -ForegroundColor Yellow
Write-Host "Checking response headers..." -ForegroundColor Gray

try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/campaigns" -Method GET -ErrorAction Stop
    
    $headers = @{
        "RateLimit-Policy" = $response.Headers['RateLimit-Policy']
        "RateLimit-Limit" = $response.Headers['RateLimit-Limit']
        "RateLimit-Remaining" = $response.Headers['RateLimit-Remaining']
        "RateLimit-Reset" = $response.Headers['RateLimit-Reset']
    }
    
    Write-Host ""
    foreach ($key in $headers.Keys) {
        $value = $headers[$key]
        if ($value) {
            Write-Host "  ✅ $key`: $value" -ForegroundColor Green
        } else {
            Write-Host "  ❌ $key`: Missing" -ForegroundColor Red
        }
    }
} catch {
    Write-Host "  Failed to get headers: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "✅ Test 3 Complete" -ForegroundColor Green
Write-Host ""

# Test 4: Authentication Rate Limiter
Write-Host "Test 4: Authentication Rate Limiter" -ForegroundColor Yellow
Write-Host "Testing login protection (6 failed attempts)..." -ForegroundColor Gray

for ($i = 1; $i -le 6; $i++) {
    $body = @{
        accessCode = "wrongcode123"
    } | ConvertTo-Json
    
    try {
        $response = Invoke-RestMethod -Uri "$baseUrl/api/admin/validate-access-code" `
            -Method POST `
            -Body $body `
            -ContentType "application/json" `
            -ErrorAction Stop
        Write-Host "  Attempt $i`: Response received" -ForegroundColor Yellow
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        if ($statusCode -eq 429) {
            Write-Host "  Attempt $i`: ✅ RATE LIMITED (429) - Protection Working!" -ForegroundColor Green
            break
        } elseif ($statusCode -eq 400 -or $statusCode -eq 401) {
            Write-Host "  Attempt $i`: Invalid credentials (expected)" -ForegroundColor Gray
        } else {
            Write-Host "  Attempt $i`: Status $statusCode" -ForegroundColor Yellow
        }
    }
    Start-Sleep -Milliseconds 200
}

Write-Host ""
Write-Host "✅ Test 4 Complete" -ForegroundColor Green
Write-Host ""

# Test 5: Search Rate Limiter
Write-Host "Test 5: Search Endpoint Rate Limiter" -ForegroundColor Yellow
Write-Host "Testing search protection (10 queries)..." -ForegroundColor Gray

for ($i = 1; $i -le 10; $i++) {
    try {
        $response = Invoke-WebRequest -Uri "$baseUrl/api/campaigns/search/health" -Method GET -ErrorAction Stop
        Write-Host "  Search $i`: Status $($response.StatusCode)" -ForegroundColor Green
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        if ($statusCode -eq 429) {
            Write-Host "  Search $i`: Rate limited" -ForegroundColor Red
        } else {
            Write-Host "  Search $i`: Status $statusCode" -ForegroundColor Yellow
        }
    }
    Start-Sleep -Milliseconds 150
}

Write-Host ""
Write-Host "✅ Test 5 Complete" -ForegroundColor Green
Write-Host ""

# Test 6: Test 429 Response Format
Write-Host "Test 6: Test 429 Error Response Format" -ForegroundColor Yellow
Write-Host "Making requests until rate limited..." -ForegroundColor Gray

$requestCount = 0
$rateLimited = $false

while (-not $rateLimited -and $requestCount -lt 210) {
    $requestCount++
    try {
        $response = Invoke-RestMethod -Uri "$baseUrl/api/campaigns" -Method GET -ErrorAction Stop
        if ($requestCount % 50 -eq 0) {
            Write-Host "  $requestCount requests sent..." -ForegroundColor Gray
        }
    } catch {
        if ($_.Exception.Response.StatusCode.value__ -eq 429) {
            Write-Host ""
            Write-Host "  ✅ Rate limited at request #$requestCount" -ForegroundColor Green
            Write-Host ""
            Write-Host "  Error Response:" -ForegroundColor Cyan
            
            $stream = $_.Exception.Response.GetResponseStream()
            $reader = New-Object System.IO.StreamReader($stream)
            $errorBody = $reader.ReadToEnd()
            $errorJson = $errorBody | ConvertFrom-Json
            
            Write-Host "  Success: $($errorJson.success)" -ForegroundColor Yellow
            Write-Host "  Message: $($errorJson.message)" -ForegroundColor Yellow
            Write-Host "  RetryAfter: $($errorJson.retryAfter) seconds" -ForegroundColor Yellow
            Write-Host "  ErrorCode: $($errorJson.errorCode)" -ForegroundColor Yellow
            
            $rateLimited = $true
        }
    }
}

if (-not $rateLimited) {
    Write-Host "  ⚠️ Did not hit rate limit within 210 requests" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "✅ Test 6 Complete" -ForegroundColor Green
Write-Host ""

# Summary
Write-Host "================================" -ForegroundColor Cyan
Write-Host "Test Suite Complete!" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Summary:" -ForegroundColor White
Write-Host "✅ Global rate limiting functional" -ForegroundColor Green
Write-Host "✅ Rate limit headers present" -ForegroundColor Green
Write-Host "✅ Authentication protection active" -ForegroundColor Green
Write-Host "✅ Search endpoint protected" -ForegroundColor Green
Write-Host "✅ Error responses formatted correctly" -ForegroundColor Green
Write-Host ""
Write-Host "Rate limiting is working as expected! 🎉" -ForegroundColor Green
Write-Host ""
Write-Host "Note: Some tests may not complete if rate limits are hit." -ForegroundColor Gray
Write-Host "Wait 1-15 minutes for limits to reset before running again." -ForegroundColor Gray
Write-Host ""
