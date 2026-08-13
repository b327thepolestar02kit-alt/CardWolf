$ErrorActionPreference = 'Stop'
$expected = 'v65'
$checks = @(
  @{File='BUILD_VERSION.txt'; Pattern=$expected},
  @{File='version.json'; Pattern='"version":"v65"'},
  @{File='index.html'; Pattern='ゲームバージョン v65'},
  @{File='app.js'; Pattern='CardWolf build v65'},
  @{File='app.js'; Pattern='clientVersion:"v65"'},
  @{File='version-check.js'; Pattern='const expected = "v65"'},
  @{File='index.html'; Pattern='firebase-config.js?v=65'},
  @{File='index.html'; Pattern='version-check.js?v=65'},
  @{File='index.html'; Pattern='app.js?v=65'}
)
foreach ($c in $checks) {
  $text = Get-Content $c.File -Raw
  if ($text -notmatch [regex]::Escape($c.Pattern)) { throw "Version check failed: $($c.File)" }
}
Write-Host "CardWolf build $expected: version files are synchronized."
