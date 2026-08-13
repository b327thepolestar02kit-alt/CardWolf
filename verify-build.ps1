$ErrorActionPreference = 'Stop'
$expected = 'v60'
$checks = @(
  @{File='BUILD_VERSION.txt'; Pattern=$expected},
  @{File='version.json'; Pattern='"version":"v60"'},
  @{File='index.html'; Pattern='ゲームバージョン v60'},
  @{File='app.js'; Pattern='CardWolf build v60'},
  @{File='app.js'; Pattern='clientVersion:"v60"'},
  @{File='version-check.js'; Pattern='const expected = "v60"'},
  @{File='index.html'; Pattern='firebase-config.js?v=60'},
  @{File='index.html'; Pattern='version-check.js?v=60'},
  @{File='index.html'; Pattern='app.js?v=60'}
)
foreach ($c in $checks) {
  $text = Get-Content $c.File -Raw
  if ($text -notmatch [regex]::Escape($c.Pattern)) { throw "Version check failed: $($c.File)" }
}
Write-Host "CardWolf build $expected: version files are synchronized."
