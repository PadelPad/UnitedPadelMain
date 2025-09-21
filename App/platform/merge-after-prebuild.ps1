param([string]$AppPath = "$PSScriptRoot\..")
$ErrorActionPreference="Stop"
function Step($m){ Write-Host "`n==> $m" -ForegroundColor Cyan }
function Ok($m){ Write-Host " ✔ $m" -ForegroundColor Green }
function Warn($m){ Write-Host " ! $m" -ForegroundColor Yellow }

# ANDROID
$android = Join-Path $AppPath "android\app"
if (Test-Path $android) {
  Step "Patching Android project"
  Copy-Item "$PSScriptRoot\android\google-services.json" (Join-Path $android "google-services.json") -Force
  $manifest = Join-Path $android "src\main\AndroidManifest.xml"
  if (Test-Path $manifest) {
    $additions = Get-Content "$PSScriptRoot\android\AndroidManifest.additions.xml" -Raw
    $content = Get-Content $manifest -Raw
    if ($content -notmatch "app.unitedpadel.co.uk") {
      $content = $content -replace "(</application>)", "$additions`n`$1"
      Set-Content $manifest $content
      Ok "Merged deep link + permission additions"
    } else {
      Warn "Manifest already contains deep link patterns; skipped merge"
    }
  }
  $resXml = Join-Path $android "src\main\res\xml"
  New-Item -ItemType Directory -Force -Path $resXml | Out-Null
  Copy-Item "$PSScriptRoot\android\res\xml\network_security_config.xml" $resXml -Force
  Ok "Applied network security config"
} else { Warn "Android project not found (run: npx expo prebuild --platform android)" }

# IOS
$ios = Join-Path $AppPath "ios"
if (Test-Path $ios) {
  Step "Patching iOS project"
  Copy-Item "$PSScriptRoot\ios\UnitedPadel.entitlements" $ios -Force
  Copy-Item "$PSScriptRoot\ios\GoogleService-Info.plist" $ios -Force
  Ok "Copied Entitlements & GoogleService-Info.plist"
  Warn "Open Xcode, add entitlements in Signing & Capabilities, enable Push + Associated Domains."
} else { Warn "iOS project not found (run: npx expo prebuild --platform ios)" }
