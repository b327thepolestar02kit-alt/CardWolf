$ErrorActionPreference = 'Stop'
$expected = 'v56'
$checks = @(
  @{File='BUILD_VERSION.txt'; Pattern=$expected},
  @{File='version.json'; Pattern='"version": "v56"'},
  @{File='index.html'; Pattern='v56'},
  @{File='app.js'; Pattern='CardWolf build v56'},
  @{File='app.js'; Pattern='clientVersion:"v56"'},
  @{File='version-check.js'; Pattern='const expected = "v56"'}
)
foreach ($c in $checks) {
  $text = Get-Content $c.File -Raw
  if ($text -notmatch [regex]::Escape($c.Pattern)) { throw "Version check failed: $($c.File)" }
}
Write-Host "CardWolf build $expected: version files are synchronized."
