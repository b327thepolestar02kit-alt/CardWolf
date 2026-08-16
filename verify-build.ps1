$ErrorActionPreference = 'Stop'
$expected = 'v68'
$checks = @(
  @{File='BUILD_VERSION.txt'; Pattern=$expected},
  @{File='version.json'; Pattern='"version":"v68"'},
  @{File='index.html'; Pattern='ゲームバージョン v68'},
  @{File='app.js'; Pattern='CardWolf build v68'},
  @{File='app.js'; Pattern='clientVersion:"v68"'},
  @{File='version-check.js'; Pattern='const expected = "v68"'},
  @{File='index.html'; Pattern='styles.css?v=68'},
  @{File='index.html'; Pattern='firebase-config.js?v=68'},
  @{File='index.html'; Pattern='version-check.js?v=68'},
  @{File='index.html'; Pattern='app.js?v=68'}
)
foreach ($c in $checks) {
  $text = Get-Content $c.File -Raw
  if ($text -notmatch [regex]::Escape($c.Pattern)) { throw "Version check failed: $($c.File) missing $($c.Pattern)" }
}
Write-Host "CardWolf build $expected: version files are synchronized."
