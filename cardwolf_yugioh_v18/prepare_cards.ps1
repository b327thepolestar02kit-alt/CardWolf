$ErrorActionPreference = "Stop"
$base = Split-Path -Parent $MyInvocation.MyCommand.Path
$dataDir = Join-Path $base "data"
$imgDir = Join-Path $base "images"
New-Item -ItemType Directory -Force $dataDir | Out-Null
New-Item -ItemType Directory -Force $imgDir | Out-Null

$configPath = Join-Path $base "cards.config.json"
$config = Get-Content -LiteralPath $configPath -Raw | ConvertFrom-Json
$wanted = @($config.cards)
$allUrl = "https://db.ygoprodeck.com/api/v7/cardinfo.php"

Write-Host "Downloading YGOPRODeck card database..."
try {
    $all = Invoke-RestMethod -Uri $allUrl -Method Get -TimeoutSec 120
}
catch {
    Write-Host "API download failed." -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Read-Host "Press Enter to close"
    exit 1
}

$out = @()
$n = 0

foreach ($name in $wanted) {
    $n++
    Write-Host ("[{0}/{1}] {2}" -f $n, $wanted.Count, $name)

    $hit = $all.data | Where-Object { $_.name -eq $name } | Select-Object -First 1

    if (-not $hit) {
        Write-Host "  Card data not found." -ForegroundColor Yellow
        continue
    }

    $safe = ($hit.name -replace '[^\w\.-]+', '_')
    $imgUrl = $hit.card_images[0].image_url
    $file = Join-Path $imgDir ($safe + ".jpg")

    try {
        Invoke-WebRequest -Uri $imgUrl -OutFile $file -TimeoutSec 120
        $local = "images/$safe.jpg"
        Write-Host "  Image OK"
    }
    catch {
        $local = ""
        Write-Host "  Image download failed." -ForegroundColor Yellow
        Write-Host ("  " + $_.Exception.Message) -ForegroundColor Yellow
    }

    $out += [pscustomobject]@{
        name = $hit.name
        type = $hit.type
        desc = $hit.desc
        atk = $hit.atk
        def = $hit.def
        level = $hit.level
        race = $hit.race
        attribute = $hit.attribute
        image = $local
    }
}

$json = $out | ConvertTo-Json -Depth 8
$js = "window.CARD_POOL_DATA = " + $json + ";"
$cardsJs = Join-Path $dataDir "cards.js"
Set-Content -LiteralPath $cardsJs -Value $js -Encoding UTF8

Write-Host ""
Write-Host ("CARD PREPARATION COMPLETE: {0} / {1}" -f $out.Count, $wanted.Count) -ForegroundColor Green
Read-Host "Press Enter to close"
