$ErrorActionPreference = 'Stop'
$expected = 'v59'
$checks = @(
  @{File='BUILD_VERSION.txt'; Pattern=$expected},
  @{File='version.json'; Pattern='"version":"v59"'},
  @{File='index.html'; Pattern='ゲームバージョン v59'},
  @{File='app.js'; Pattern='CardWolf build v59'},
  @{File='app.js'; Pattern='clientVersion:"v59"'},
  @{File='version-check.js'; Pattern='const expected = "v59"'},
  @{File='index.html'; Pattern='firebase-config.js?v=59'},
  @{File='index.html'; Pattern='version-check.js?v=59'},
  @{File='index.html'; Pattern='app.js?v=59'}
)
foreach ($c in $checks) {
  $text = Get-Content $c.File -Raw
  if ($text -notmatch [regex]::Escape($c.Pattern)) { throw "Version check failed: $($c.File)" }
}
Write-Host "CardWolf build $expected: version files are synchronized."
