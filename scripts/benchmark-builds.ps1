# AgenticFlow Build Performance Benchmark Script
# Tests various build configurations and measures performance

Write-Host "🎯 AgenticFlow Build Performance Benchmark" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# Function to measure command execution time
function Measure-BuildCommand {
    param(
        [string]$Name,
        [string]$Command,
        [string]$Description
    )
    
    Write-Host "`n🔥 $Name" -ForegroundColor Yellow
    Write-Host "   $Description" -ForegroundColor Gray
    Write-Host "   Command: $Command" -ForegroundColor DarkGray
    
    # Clean before each test
    pnpm clean | Out-Null
    
    # Measure execution time
    $stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
    try {
        Invoke-Expression $Command | Out-Null
        $stopwatch.Stop()
        $success = $true
    }
    catch {
        $stopwatch.Stop()
        $success = $false
        Write-Host "   ❌ Failed: $_" -ForegroundColor Red
    }
    
    $timeSeconds = [math]::Round($stopwatch.Elapsed.TotalSeconds, 2)
    
    if ($success) {
        $status = if ($timeSeconds -lt 30) { "✅" } else { "⚠️" }
        Write-Host "   $status Time: ${timeSeconds}s" -ForegroundColor Green
    }
    
    return @{
        Name = $Name
        Command = $Command
        Time = $timeSeconds
        Success = $success
        Status = if ($timeSeconds -lt 30) { "PASS" } else { "SLOW" }
    }
}

# Test scenarios
$results = @()

# 1. Individual package builds (fastest)
$results += Measure-BuildCommand -Name "Types Package" -Command "pnpm turbo run build --filter='@agenticflow/types'" -Description "Build types package only"

$results += Measure-BuildCommand -Name "Config Package" -Command "pnpm turbo run build --filter='@agenticflow/config'" -Description "Build config package only"

$results += Measure-BuildCommand -Name "Core Package" -Command "pnpm turbo run build --filter='@agenticflow/core'" -Description "Build core package only"

# 2. Sequential backend build
$results += Measure-BuildCommand -Name "Backend Sequential" -Command "pnpm turbo run build --filter='@agenticflow/types'; pnpm turbo run build --filter='@agenticflow/config'; pnpm turbo run build --filter='@agenticflow/core'" -Description "Build backend packages sequentially"

# 3. Full monorepo build
$results += Measure-BuildCommand -Name "Full Monorepo" -Command "pnpm build" -Description "Build all packages with dependencies"

# 4. Incremental build test
Write-Host "`n🔄 Testing Incremental Builds" -ForegroundColor Yellow
pnpm build | Out-Null
$results += Measure-BuildCommand -Name "Incremental Build" -Command "pnpm build" -Description "Rebuild without changes (should use cache)"

# Generate performance report
Write-Host "`n📊 PERFORMANCE REPORT" -ForegroundColor Cyan
Write-Host "=====================" -ForegroundColor Cyan

$results | ForEach-Object {
    $statusColor = if ($_.Success -and $_.Status -eq "PASS") { "Green" } elseif ($_.Success) { "Yellow" } else { "Red" }
    Write-Host "• $($_.Name): $($_.Time)s [$($_.Status)]" -ForegroundColor $statusColor
}

# Performance analysis
$avgTime = ($results | Where-Object { $_.Success } | Measure-Object -Property Time -Average).Average
$fastestTime = ($results | Where-Object { $_.Success } | Measure-Object -Property Time -Minimum).Minimum
$slowestTime = ($results | Where-Object { $_.Success } | Measure-Object -Property Time -Maximum).Maximum

Write-Host "`n📈 ANALYSIS" -ForegroundColor Cyan
Write-Host "==========" -ForegroundColor Cyan
Write-Host "• Fastest build: ${fastestTime}s" -ForegroundColor Green
Write-Host "• Slowest build: ${slowestTime}s" -ForegroundColor Yellow
Write-Host "• Average time: $([math]::Round($avgTime, 2))s" -ForegroundColor Blue

$passCount = ($results | Where-Object { $_.Success -and $_.Status -eq "PASS" }).Count
$totalCount = $results.Count

Write-Host "• Performance target (<30s): ${passCount}/${totalCount} builds" -ForegroundColor $(if ($passCount -eq $totalCount) { "Green" } else { "Yellow" })

# Recommendations
Write-Host "`n💡 OPTIMIZATIONS IMPLEMENTED" -ForegroundColor Cyan
Write-Host "============================" -ForegroundColor Cyan
Write-Host "✅ Turbo caching with proper inputs/outputs"
Write-Host "✅ Dependency-aware build pipeline"
Write-Host "✅ Incremental TypeScript compilation"
Write-Host "✅ Parallel execution where possible"
Write-Host "✅ Fine-grained package filtering"
Write-Host "✅ Optimized output logging (errors-only for linting)"

if ($avgTime -lt 30) {
    Write-Host "`n🎉 SUCCESS: Average build time under 30s target!" -ForegroundColor Green
} else {
    Write-Host "`n⚠️  WARNING: Average build time exceeds 30s target" -ForegroundColor Yellow
}

Write-Host "`n🔗 Quick Commands:" -ForegroundColor Cyan
Write-Host "• Fast backend: pnpm turbo run build --filter='@agenticflow/types' --filter='@agenticflow/config' --filter='@agenticflow/core'"
Write-Host "• Development: pnpm dev:backend"
Write-Host "• Full build: pnpm build"
Write-Host "• Clean rebuild: pnpm clean; pnpm build" 