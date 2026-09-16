param(
  [Parameter(Mandatory = $true)]
  [string]$SourceRepository,

  [Parameter(Mandatory = $true)]
  [string]$OutputDirectory
)

$ErrorActionPreference = 'Stop'

$repository = [System.IO.Path]::GetFullPath($SourceRepository)
$output = [System.IO.Path]::GetFullPath($OutputDirectory)
$markerName = '.apache-echarts-asset-staging'

if (-not (Test-Path -LiteralPath (Join-Path $repository '.git'))) {
  throw "Source repository is not a Git checkout: $repository"
}

if (Test-Path -LiteralPath $output) {
  $marker = Join-Path $output $markerName
  if (-not (Test-Path -LiteralPath $marker)) {
    throw "Refusing to replace an unmarked staging directory: $output"
  }
  Remove-Item -LiteralPath $output -Recurse -Force
}

New-Item -ItemType Directory -Path $output | Out-Null
Set-Content -LiteralPath (Join-Path $output $markerName) -Value 'Generated Apache ECharts asset staging directory.'

$sourceRoot = Join-Path $repository 'public/examples/ts'
$catalogPath = Join-Path $repository 'src/data/chart-list-data.js'
$catalog = Get-Content -LiteralPath $catalogPath -Raw
$records = [regex]::Matches(
  $catalog,
  '\{\s*"category":[\s\S]*?"id":\s*"([^"]+)"[\s\S]*?"ts":\s*(true|false)[\s\S]*?\}'
) | ForEach-Object {
  [pscustomobject]@{
    Id = $_.Groups[1].Value
    Extension = if ($_.Groups[2].Value -eq 'true') { '.ts' } else { '.js' }
  }
}

$paths = [System.Collections.Generic.HashSet[string]]::new([System.StringComparer]::Ordinal)
foreach ($record in $records) {
  $sourceFile = Join-Path $sourceRoot ($record.Id + $record.Extension)
  $source = Get-Content -LiteralPath $sourceFile -Raw
  foreach ($match in [regex]::Matches($source, 'ROOT_PATH\s*\+\s*[''"]([^''"]+)')) {
    $resourcePath = $match.Groups[1].Value
    if ($resourcePath -eq '/data/asset/data/links-ny/links_ny_') {
      continue
    }
    [void]$paths.Add(('public' + $resourcePath).Replace('\', '/'))
  }
}

$linkChunks = git -C $repository ls-tree -r --name-only HEAD public/data/asset/data/links-ny
if ($LASTEXITCODE -ne 0) {
  throw 'Unable to enumerate the New York links dataset.'
}
$linkChunks | ForEach-Object { [void]$paths.Add($_) }

$archivePath = Join-Path ([System.IO.Path]::GetDirectoryName($output)) 'apache-echarts-assets.tar'
$succeeded = $false
for ($attempt = 1; $attempt -le 12; $attempt++) {
  if (Test-Path -LiteralPath $archivePath) {
    Remove-Item -LiteralPath $archivePath -Force
  }
  & git -c http.version=HTTP/1.1 -C $repository archive --format=tar -o $archivePath HEAD @($paths)
  if ($LASTEXITCODE -eq 0) {
    $succeeded = $true
    break
  }
  Start-Sleep -Seconds 2
}

if (-not $succeeded) {
  throw 'Unable to download the referenced Apache ECharts assets after 12 attempts.'
}

tar.exe -xf $archivePath -C $output
if ($LASTEXITCODE -ne 0) {
  throw 'Unable to extract the Apache ECharts asset archive.'
}

$fileCount = (Get-ChildItem -LiteralPath $output -File -Recurse | Measure-Object).Count
Write-Output "Downloaded $fileCount referenced Apache ECharts resource files to $output"
