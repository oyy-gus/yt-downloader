# Export YouTube Cookies from Microsoft Edge
# Run this script to generate cookies.txt for Maxistrong
# Edge must be closed before running this script

Write-Host "============================================" -ForegroundColor Cyan
Write-Host " Maxistrong - YouTube Cookie Exporter" -ForegroundColor Cyan  
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

$edgeProcess = Get-Process -Name "msedge" -ErrorAction SilentlyContinue
if ($edgeProcess) {
    Write-Host "Detected Microsoft Edge is running." -ForegroundColor Yellow
    $confirm = Read-Host "Close Edge to export cookies? (Y/N)"
    if ($confirm -eq 'Y' -or $confirm -eq 'y') {
        Stop-Process -Name "msedge" -Force -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 2
        Write-Host "Edge closed." -ForegroundColor Green
    } else {
        Write-Host "Aborted. Please close Edge manually and run again." -ForegroundColor Red
        exit 1
    }
}

$ytdlpPath = Join-Path $PSScriptRoot "yt-dlp.exe"
if (-not (Test-Path $ytdlpPath)) {
    $ytdlpPath = "yt-dlp"
}

Write-Host ""
Write-Host "Exporting YouTube cookies from Microsoft Edge..." -ForegroundColor Cyan

$cookiesOutput = Join-Path $PSScriptRoot "cookies.txt"
& $ytdlpPath --cookies-from-browser edge --print "%(title)s" --flat-playlist "https://www.youtube.com/watch?v=dQw4w9WgXcQ" --cookies $cookiesOutput 2>&1 | Out-Null

# Alternative: Export cookies directly using yt-dlp cookie extraction
$result = & $ytdlpPath --cookies-from-browser edge -o - --skip-download --no-warnings --print "%(id)s" "https://www.youtube.com/watch?v=dQw4w9WgXcQ" 2>&1

if (Test-Path $cookiesOutput) {
    $lines = (Get-Content $cookiesOutput | Measure-Object -Line).Lines
    Write-Host ""
    Write-Host "SUCCESS! Exported $lines cookie lines to: $cookiesOutput" -ForegroundColor Green
    Write-Host ""
    Write-Host "You can now restart the Maxistrong backend server." -ForegroundColor Cyan
} else {
    Write-Host ""
    Write-Host "Cookie export via yt-dlp method. Trying direct database export..." -ForegroundColor Yellow
    
    # Direct database export
    $cookieSrc = "$env:LOCALAPPDATA\Microsoft\Edge\User Data\Default\Network\Cookies"
    if (Test-Path $cookieSrc) {
        $tmpDb = Join-Path $PSScriptRoot "tmp\edge_cookies.db"
        New-Item -ItemType Directory -Path (Split-Path $tmpDb) -Force | Out-Null
        Copy-Item -Path $cookieSrc -Destination $tmpDb -Force
        
        Write-Host "Copied Edge cookie database. Running Python exporter..." -ForegroundColor Cyan
        python "$PSScriptRoot\scratch_dump_cookies.py"
        
        $pythonOutput = Join-Path $PSScriptRoot "tmp\cookies.txt"
        if (Test-Path $pythonOutput) {
            Copy-Item $pythonOutput $cookiesOutput -Force
            Write-Host "SUCCESS! Cookies exported to: $cookiesOutput" -ForegroundColor Green
        } else {
            Write-Host "Export failed. Please install 'pywin32' and 'pycryptodomex' packages:" -ForegroundColor Red
            Write-Host "  pip install pywin32 pycryptodomex" -ForegroundColor Yellow
        }
    }
}

Write-Host ""
Write-Host "Press any key to continue..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
