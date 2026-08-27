$ErrorActionPreference='Stop'
$root=Split-Path -Parent $MyInvocation.MyCommand.Path
if((Get-Content -Raw -Encoding UTF8 (Join-Path $root "BUILD_VERSION.txt")).Trim() -ne "v109"){throw "BUILD_VERSION mismatch"}
$py=Get-Command python -ErrorAction SilentlyContinue
if($py){& $py.Source (Join-Path $root "verify-build.py"); if($LASTEXITCODE -ne 0){throw "verify-build.py failed"}}
else{Write-Host "Python not found; version check only."}
