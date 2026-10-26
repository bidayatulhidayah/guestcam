<#
.SYNOPSIS
  Frees the Firebase emulator ports on Windows.

.DESCRIPTION
  On Windows, `firebase emulators:exec` and Ctrl+C on `emulators:start` can
  leave the emulator processes (java.exe for Firestore and the Storage rules
  runtime, node.exe for the CLI) running and holding their ports, so the next
  run fails with "port taken". This script stops them.

  Only processes that are clearly Firebase emulators are stopped: java.exe or
  node.exe whose command line mentions the emulators. Anything else listening
  on these ports (another app on 8080, for example) is reported and left alone.

  Run through `npm run emulators:kill` (also runs before and after `npm test`).

.PARAMETER DryRun
  Lists what would be stopped without stopping anything.
#>
param(
  [int[]]$Ports = @(4000, 4400, 4500, 5001, 8080, 8085, 9099, 9199),
  [switch]$DryRun
)

$ErrorActionPreference = 'Stop'

# Command-line fragments that identify Firebase emulator processes.
$emulatorPattern = 'firebase|cloud-firestore-emulator|cloud-storage-rules-runtime|pubsub-emulator|emulator'

$listeners = @(Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue |
  Where-Object { $Ports -contains $_.LocalPort })

if ($listeners.Count -eq 0) {
  Write-Output 'emulators:kill: all emulator ports are free.'
  exit 0
}

$stopped = 0
foreach ($processId in ($listeners.OwningProcess | Sort-Object -Unique)) {
  $heldPorts = ($listeners | Where-Object { $_.OwningProcess -eq $processId }).LocalPort | Sort-Object -Unique
  $info = Get-CimInstance Win32_Process -Filter "ProcessId = $processId" -ErrorAction SilentlyContinue
  if (-not $info) { continue }

  $isEmulator = ($info.Name -in @('java.exe', 'node.exe')) -and ($info.CommandLine -match $emulatorPattern)
  if (-not $isEmulator) {
    Write-Output "emulators:kill: port(s) $($heldPorts -join ', ') used by $($info.Name) (PID $processId), not a Firebase emulator. Left running."
    continue
  }

  if ($DryRun) {
    Write-Output "emulators:kill: would stop $($info.Name) (PID $processId) on port(s) $($heldPorts -join ', ')."
    continue
  }

  try {
    Stop-Process -Id $processId -Force -ErrorAction Stop
    $stopped++
    Write-Output "emulators:kill: stopped $($info.Name) (PID $processId) on port(s) $($heldPorts -join ', ')."
  } catch {
    Write-Output "emulators:kill: could not stop PID ${processId}: $($_.Exception.Message)"
  }
}

if (-not $DryRun -and $stopped -gt 0) { Start-Sleep -Milliseconds 500 }
exit 0
