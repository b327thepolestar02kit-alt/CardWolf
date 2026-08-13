$ErrorActionPreference = 'Stop'
$expected = 'v64'
$checks = @(
  @{File='BUILD_VERSION.txt'; Pattern=$expected},
  @{File='version.json'; Pattern='"version":"v64"'},
  @{File='index.html'; Pattern='ゲームバージョン v64'},
  @{File='app.js'; Pattern='CardWolf build v64'},
  @{File='app.js'; Pattern='clientVersion:"v64"'},
  @{File='version-check.js'; Pattern='const expected = "v64"'},
  @{File='index.html'; Pattern='firebase-config.js?v=61'},
  @{File='index.html'; Pattern='version-check.js?v=61'},
  @{File='index.html'; Pattern='app.js?v=61'}
)
foreach ($c in $checks) {
  $text = Get-Content $c.File -Raw
  if ($text -notmatch [regex]::Escape($c.Pattern)) { throw "Version check failed: $($c.File)" }
}
Write-Host "CardWolf build $expected: version files are synchronized."
