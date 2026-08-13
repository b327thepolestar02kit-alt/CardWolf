$ErrorActionPreference = 'Stop'
$expected = 'v63'
$checks = @(
  @{File='BUILD_VERSION.txt'; Pattern=$expected},
  @{File='version.json'; Pattern='"version":"v63"'},
  @{File='index.html'; Pattern='ゲームバージョン v63'},
  @{File='app.js'; Pattern='CardWolf build v63'},
  @{File='app.js'; Pattern='clientVersion:"v63"'},
  @{File='version-check.js'; Pattern='const expected = "v63"'},
  @{File='index.html'; Pattern='firebase-config.js?v=61'},
  @{File='index.html'; Pattern='version-check.js?v=61'},
  @{File='index.html'; Pattern='app.js?v=61'}
)
foreach ($c in $checks) {
  $text = Get-Content $c.File -Raw
  if ($text -notmatch [regex]::Escape($c.Pattern)) { throw "Version check failed: $($c.File)" }
}
Write-Host "CardWolf build $expected: version files are synchronized."
