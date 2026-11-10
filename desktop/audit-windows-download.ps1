param(
  [Parameter(Mandatory)][ValidatePattern('^[0-9]+$')][string]$RunId,
  [Parameter(Mandatory)][ValidatePattern('^[0-9]+$')][string]$ArtifactId,
  [Parameter(Mandatory)][ValidatePattern('^[a-f0-9]{64}$')][string]$ExpectedZipSha256,
  [string]$OutputDirectory = 'download-audit'
)

$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
New-Item -ItemType Directory -Force -Path $OutputDirectory | Out-Null
$report = [ordered]@{ result = 'NotVerified'; repository = $env:GITHUB_REPOSITORY; runId = $RunId; artifactId = $ArtifactId; files = @(); scan = $null; error = $null }
$inputRoot = Join-Path $env:RUNNER_TEMP ('clock-download-audit-' + [guid]::NewGuid())
New-Item -ItemType Directory -Path $inputRoot | Out-Null

try {
  $headers = @{ Authorization = "Bearer $env:GH_TOKEN"; Accept = 'application/vnd.github+json'; 'X-GitHub-Api-Version' = '2022-11-28'; 'User-Agent' = 'Clock-Factory-download-audit' }
  $api = "https://api.github.com/repos/$env:GITHUB_REPOSITORY/actions"
  $artifact = Invoke-RestMethod -Uri "$api/artifacts/$ArtifactId" -Headers $headers
  $run = Invoke-RestMethod -Uri "$api/runs/$RunId" -Headers $headers
  if ($artifact.expired -or "$($artifact.workflow_run.id)" -ne $RunId -or $run.head_branch -ne 'main' -or $run.conclusion -ne 'success' -or $artifact.name -ne 'Clock-Factory-Windows-x64') { throw 'The requested artifact is not a completed official main-branch Windows build.' }
  if ($artifact.workflow_run.head_sha -ne $run.head_sha) { throw 'The artifact and build source commits do not match.' }
  $report.sourceCommit = $run.head_sha
  $report.sourceBuild = $run.html_url
  $zip = Join-Path $inputRoot 'original-download.zip'
  Invoke-WebRequest -Uri "$api/artifacts/$ArtifactId/zip" -Headers $headers -OutFile $zip
  $zipHash = (Get-FileHash -LiteralPath $zip -Algorithm SHA256).Hash.ToLowerInvariant()
  $report.zipSha256 = $zipHash
  if ($zipHash -ne $ExpectedZipSha256 -or "sha256:$zipHash" -ne $artifact.digest) { throw 'The downloaded ZIP does not match the published artifact digest.' }
  $contents = Join-Path $inputRoot 'contents'
  Expand-Archive -LiteralPath $zip -DestinationPath $contents
  $manifest = Join-Path $contents 'SHA256SUMS.txt'
  if (-not (Test-Path -LiteralPath $manifest)) { throw 'The published SHA-256 manifest is missing.' }
  $expected = @{}
  foreach ($line in Get-Content -LiteralPath $manifest) {
    if (-not $line.Trim()) { continue }
    if ($line -notmatch '^(?<hash>[a-f0-9]{64})\s{2}(?<name>Clock-Factory-[0-9]+\.[0-9]+\.[0-9]+-Windows-(Setup|Portable)\.exe)$') { throw 'The published SHA-256 manifest has an unexpected entry.' }
    if ($expected.ContainsKey($Matches.name)) { throw 'The checksum manifest contains duplicate entries.' }
    $expected[$Matches.name] = $Matches.hash
  }
  $executables = @(Get-ChildItem -LiteralPath $contents -Recurse -File -Filter '*.exe')
  if ($executables.Count -ne 2 -or $expected.Count -ne 2) { throw 'Expected exactly the published installer and portable executable.' }
  foreach ($file in $executables) {
    $hash = (Get-FileHash -LiteralPath $file.FullName -Algorithm SHA256).Hash.ToLowerInvariant()
    if ($hash -ne $expected[$file.Name]) { throw "Published checksum mismatch for $($file.Name)." }
    $signature = Get-AuthenticodeSignature -LiteralPath $file.FullName
    $publisher = if ($signature.SignerCertificate) { $signature.SignerCertificate.Subject } else { $null }
    $report.files += [ordered]@{ name = $file.Name; sha256 = $hash; bytes = $file.Length; signature = "$($signature.Status)"; publisher = $publisher }
  }

  if (-not (Get-Command Get-MpComputerStatus -ErrorAction SilentlyContinue)) { throw 'Microsoft Defender is unavailable on this runner; no antivirus verdict can be reported.' }
  if ((Get-Service WinDefend).Status -ne 'Running') { Start-Service WinDefend }
  # Hosted runner images disable archive scans and exclude C:\ and D:\.
  # Remove those exclusions for this dedicated VM so the scan actually checks
  # the ZIP and its payload. No downloaded executable is ever launched.
  $preferences = Get-MpPreference
  if ($preferences.ExclusionPath) { Remove-MpPreference -ExclusionPath $preferences.ExclusionPath }
  if ($preferences.ExclusionExtension) { Remove-MpPreference -ExclusionExtension $preferences.ExclusionExtension }
  Set-MpPreference -DisableArchiveScanning $false -PUAProtection Enabled -ScanAvgCPULoadFactor 50
  Update-MpSignature
  $status = Get-MpComputerStatus
  if (-not $status.AntivirusEnabled -or $status.AMRunningMode -ne 'Normal') { throw "Defender is not available for a verified scan (mode: $($status.AMRunningMode))." }
  if ((Get-MpPreference).DisableArchiveScanning) { throw 'Defender archive scanning could not be enabled.' }
  $platform = Get-ChildItem -Path "$env:ProgramData\Microsoft\Windows Defender\Platform\*\MpCmdRun.exe" -ErrorAction SilentlyContinue | Sort-Object FullName -Descending | Select-Object -First 1
  $scanner = if ($platform) { $platform.FullName } else { Join-Path $env:ProgramFiles 'Windows Defender\MpCmdRun.exe' }
  if (-not (Test-Path -LiteralPath $scanner)) { throw 'The Defender scan executable is missing.' }
  $report.scan = [ordered]@{ engine = "$($status.AMEngineVersion)"; signatures = "$($status.AntivirusSignatureVersion)"; signaturesUpdated = "$($status.AntivirusSignatureLastUpdated.ToUniversalTime().ToString('o'))"; archiveScanning = $true; exitCode = $null }
  & $scanner -Scan -ScanType 3 -File $inputRoot -DisableRemediation 2>&1 | Tee-Object -FilePath (Join-Path $OutputDirectory 'defender-scan.log')
  $scanExit = $LASTEXITCODE
  $report.scan.exitCode = $scanExit
  if ($scanExit -ne 0) { throw "Microsoft Defender did not return a successful no-detection result (exit $scanExit). Inspect defender-scan.log; do not treat this artifact as verified." }
  foreach ($file in $executables) {
    if ((Get-FileHash -LiteralPath $file.FullName -Algorithm SHA256).Hash.ToLowerInvariant() -ne $expected[$file.Name]) { throw 'A downloaded executable changed during the scan.' }
  }
  $report.result = 'NoDetectionByMicrosoftDefender'
  Write-Output "::notice title=Windows download scan::Published ZIP and executable hashes match. Microsoft Defender reported no detection with signatures $($status.AntivirusSignatureVersion). This does not override Chrome Safe Browsing or establish publisher trust."
} catch {
  $report.error = $_.Exception.Message
  $message = $report.error.Replace('%', '%25').Replace("`r", '%0D').Replace("`n", '%0A')
  Write-Output "::error title=Windows download audit::$message"
  throw
} finally {
  $report | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath (Join-Path $OutputDirectory 'audit.json') -Encoding utf8
  $lines = @('# Published Windows download audit', '', "Result: **$($report.result)**", '', "Source run: https://github.com/$env:GITHUB_REPOSITORY/actions/runs/$RunId", '', "Artifact ID: $ArtifactId", '', '| File | Authenticode status | SHA-256 |', '| --- | --- | --- |')
  foreach ($file in $report.files) { $lines += "| $($file.name) | $($file.signature) | ``$($file.sha256)`` |" }
  $lines += @('', 'No downloaded executable was launched. The scan uses the original published artifact, without rebuilding, repacking, signing, or renaming its contents.', '', 'An antivirus no-detection result is limited to that engine and definition set. It does not guarantee that software is harmless or make Chrome trust an unsigned publisher.')
  if ($report.error) { $lines += @('', "Audit could not verify the file: $($report.error)") }
  $lines | Set-Content -LiteralPath (Join-Path $OutputDirectory 'audit.md') -Encoding utf8
  if ($env:GITHUB_STEP_SUMMARY) { $lines | Add-Content -LiteralPath $env:GITHUB_STEP_SUMMARY -Encoding utf8 }
}
