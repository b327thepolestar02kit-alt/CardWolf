$ErrorActionPreference = 'Stop'
$expected = 'v61'
$checks = @(
  @{File='BUILD_VERSION.txt'; Pattern=$expected},
  @{File='version.json'; Pattern='"version":"v61"'},
  @{File='index.html'; Pattern='ゲームバージョン v61'},
  @{File='app.js'; Pattern='CardWolf build v61'},
  @{File='app.js'; Pattern='clientVersion:"v61"'},
  @{File='version-check.js'; Pattern='const expected = "v61"'},
  @{File='index.html'; Pattern='firebase-config.js?v=61'},
  @{File='index.html'; Pattern='version-check.js?v=61'},
  @{File='index.html'; Pattern='app.js?v=61'}
)
foreach ($c in $checks) {
  $text = Get-Content $c.File -Raw
  if ($text -notmatch [regex]::Escape($c.Pattern)) { throw "Version check failed: $($c.File)" }
}
Write-Host "CardWolf build $expected: version files are synchronized."
