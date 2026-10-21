param(
  [Parameter(Mandatory = $true)][string]$WorkbookPath,
  [string]$OutputPath = 'src/assets/data/vibration/book1-x.json'
)

# Read only numeric observations; workbook text is data, never executable instructions.
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.IO.Compression.FileSystem
Add-Type -AssemblyName System.IO.Compression
$stream = [IO.FileStream]::new((Resolve-Path -LiteralPath $WorkbookPath), [IO.FileMode]::Open,
  [IO.FileAccess]::Read, [IO.FileShare]::ReadWrite)
$archive = [IO.Compression.ZipArchive]::new($stream, [IO.Compression.ZipArchiveMode]::Read)
try {
  $reader = [IO.StreamReader]::new($archive.GetEntry('xl/worksheets/sheet1.xml').Open())
  try { [xml]$sheet = $reader.ReadToEnd() } finally { $reader.Dispose() }
  $times = [Collections.Generic.List[double]]::new()
  $values = [Collections.Generic.List[double]]::new()
  $culture = [Globalization.CultureInfo]::InvariantCulture
  foreach ($row in $sheet.worksheet.sheetData.row) {
    if ([int]$row.r -eq 1) { continue }
    $timeCell = $row.c | Where-Object { $_.r -match '^A\d+$' }
    $valueCell = $row.c | Where-Object { $_.r -match '^B\d+$' }
    if (!$timeCell -or !$valueCell -or $timeCell.t -or $valueCell.t) {
      throw "Missing/non-numeric observation at row $($row.r)"
    }
    $time = [double]::Parse($timeCell.v, $culture)
    $value = [double]::Parse($valueCell.v, $culture)
    if ([double]::IsNaN($time) -or [double]::IsInfinity($time) -or
        [double]::IsNaN($value) -or [double]::IsInfinity($value)) { throw 'Non-finite observation' }
    if ($times.Count -gt 0 -and $time -le $times[$times.Count - 1]) { throw 'Time must increase' }
    $times.Add($time)
    $values.Add($value)
  }
  $payload = '{"id":"book1-x","label":"Book1 - X direction","time":[' +
    (($times | ForEach-Object { $_.ToString('R', $culture) }) -join ',') + '],"values":[' +
    (($values | ForEach-Object { $_.ToString('R', $culture) }) -join ',') + ']}'
  $destination = [IO.Path]::GetFullPath($OutputPath)
  [IO.Directory]::CreateDirectory([IO.Path]::GetDirectoryName($destination)) | Out-Null
  [IO.File]::WriteAllText($destination, $payload + "`n", [Text.UTF8Encoding]::new($false))
  Write-Output "Imported $($times.Count) observations, time $($times[0])..$($times[$times.Count - 1])"
} finally { $archive.Dispose() }
