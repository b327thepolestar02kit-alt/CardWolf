$ErrorActionPreference = 'Stop'
$expected = 'v83'

function Assert-Contains($file, $pattern) {
  $text = Get-Content $file -Raw
  if ($text -notmatch [regex]::Escape($pattern)) {
    throw "Version check failed: $file missing [$pattern]"
  }
}

Assert-Contains 'BUILD_VERSION.txt' $expected
Assert-Contains 'version.json' '"version":"v83"'
Assert-Contains 'index.html' 'ゲームバージョン v83'
Assert-Contains 'index.html' 'styles.css?v=v83'
Assert-Contains 'index.html' 'firebase-config.js?v=v83'
Assert-Contains 'index.html' 'version-check.js?v=v83'
Assert-Contains 'index.html' 'app.js?v=v83'
Assert-Contains 'app.js' 'CardWolf build v83'
Assert-Contains 'app.js' 'clientVersion:"v83"'
Assert-Contains 'version-check.js' 'const expected = "v83"'

# Prevent the previous catastrophic failure: every local script/style reference
# in index.html must point to a real file in this release folder.
$html = Get-Content 'index.html' -Raw
$refs = [regex]::Matches($html, '(?:src|href)=["'']([^"'']+)["'']') | ForEach-Object { $_.Groups[1].Value }
foreach ($ref in $refs) {
  if ($ref -match '^(https?:|//|#|data:|mailto:)') { continue }
  $pathOnly = ($ref -split '')[0]
  $pathOnly = $pathOnly.Split('?')[0].Split('#')[0]
  if ([string]::IsNullOrWhiteSpace($pathOnly)) { continue }
  $target = Join-Path (Get-Location) $pathOnly
  if (-not (Test-Path $target -PathType Leaf)) {
    throw "Build integrity check failed: index.html references missing local file [$pathOnly]"
  }
}

# Ensure the deliberately bad suffix form can never return.
if ($html -match '(styles\.css|firebase-config\.js|version-check\.js|app\.js)v7[0-9]+') {
  throw 'Build integrity check failed: invalid version suffix detected in local asset reference.'
}

Write-Host "CardWolf build $expected: version and local asset references are synchronized."
