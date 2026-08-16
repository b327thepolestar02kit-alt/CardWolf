$ErrorActionPreference = 'Stop'
$expected = 'v69'
$checks = @(
  @{File='BUILD_VERSION.txt'; Pattern=$expected},
  @{File='version.json'; Pattern='"version":"v69"'},
  @{File='index.html'; Pattern='ゲームバージョン v69'},
  @{File='app.js'; Pattern='CardWolf build v69'},
  @{File='app.js'; Pattern='clientVersion:"v69"'},
  @{File='version-check.js'; Pattern='const expected = "v69"'},
  @{File='index.html'; Pattern='styles.cssv69'},
  @{File='index.html'; Pattern='firebase-config.jsv69'},
  @{File='index.html'; Pattern='version-check.jsv69'},
  @{File='index.html'; Pattern='app.jsv69'}
)
foreach ($c in $checks) {
  $text = Get-Content $c.File -Raw
  if ($text -notmatch [regex]::Escape($c.Pattern)) { throw "Version check failed: $($c.File) missing $($c.Pattern)" }
}
Write-Host "CardWolf build $expected: version files are synchronized."
