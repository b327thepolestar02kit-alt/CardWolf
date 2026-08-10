$ErrorActionPreference = 'Stop'
$expected = 'v57'
$checks = @(
  @{File='BUILD_VERSION.txt'; Pattern=$expected},
  @{File='version.json'; Pattern='"version": "v57"'},
  @{File='index.html'; Pattern='v57'},
  @{File='app.js'; Pattern='CardWolf build v57'},
  @{File='app.js'; Pattern='clientVersion:"v57"'},
  @{File='version-check.js'; Pattern='const expected = "v57"'}
)
foreach ($c in $checks) {
  $text = Get-Content $c.File -Raw
  if ($text -notmatch [regex]::Escape($c.Pattern)) { throw "Version check failed: $($c.File)" }
}
Write-Host "CardWolf build $expected: version files are synchronized."
