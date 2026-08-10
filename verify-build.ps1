$ErrorActionPreference = 'Stop'
$expected = 'v58'
$checks = @(
  @{File='BUILD_VERSION.txt'; Pattern=$expected},
  @{File='version.json'; Pattern='"version": "v58"'},
  @{File='index.html'; Pattern='v58'},
  @{File='app.js'; Pattern='CardWolf build v58'},
  @{File='app.js'; Pattern='clientVersion:"v58"'},
  @{File='version-check.js'; Pattern='const expected = "v58"'}
)
foreach ($c in $checks) {
  $text = Get-Content $c.File -Raw
  if ($text -notmatch [regex]::Escape($c.Pattern)) { throw "Version check failed: $($c.File)" }
}
Write-Host "CardWolf build $expected: version files are synchronized."
