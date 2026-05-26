<#
.SYNOPSIS
    Lion Skill Library — installer for Claude Code (Windows PowerShell).

.DESCRIPTION
    Downloads and installs Claude Skills from Lion Skill Library to
    $env:USERPROFILE\.claude\skills\ (or .\.claude\skills\ with --scope project).

.EXAMPLE
    # 下載並列出可裝清單
    iwr https://vincenthsiehisme.github.io/lion-skill-library/install.ps1 -useb | Out-File install.ps1
    .\install.ps1 list

.EXAMPLE
    # 裝單一 skill
    .\install.ps1 install example-greeting

.EXAMPLE
    # 一次裝整個庫
    .\install.ps1 install --all

.EXAMPLE
    # ExecutionPolicy 被擋時
    powershell -ExecutionPolicy Bypass -File .\install.ps1 install example-greeting

.LINK
    https://github.com/Vincenthsiehisme/lion-skill-library
#>

[CmdletBinding()]
param(
    [Parameter(Position = 0)]
    [string]$Command = '',

    [Parameter(Position = 1, ValueFromRemainingArguments = $true)]
    [string[]]$Arguments = @()
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

# ---------- Config ----------
$BaseUrl = if ($env:LION_SKILL_BASE_URL) {
    $env:LION_SKILL_BASE_URL
} else {
    'https://vincenthsiehisme.github.io/lion-skill-library'
}
$ManifestUrl = "$BaseUrl/manifest.json"
$UserSkillsDir = Join-Path $env:USERPROFILE '.claude\skills'
$ProjectSkillsDir = Join-Path (Get-Location).Path '.claude\skills'

# ---------- Logging ----------
function Write-Info  { param([string]$Msg) Write-Host "→ $Msg" -ForegroundColor Cyan }
function Write-Ok    { param([string]$Msg) Write-Host "  ✓ $Msg" -ForegroundColor Green }
function Write-Warn2 { param([string]$Msg) Write-Host "  ! $Msg" -ForegroundColor Yellow }
function Write-Err2  { param([string]$Msg) Write-Host "  ✗ $Msg" -ForegroundColor Red }
function Write-Dim   { param([string]$Msg) Write-Host $Msg -ForegroundColor DarkGray }

# ---------- Manifest cache ----------
$Script:Manifest = $null

function Get-Manifest {
    if ($null -ne $Script:Manifest) { return $Script:Manifest }

    Write-Info "讀取 manifest:$ManifestUrl"
    try {
        # -UseBasicParsing 對 PS 5.1 必要;PS 7+ 預設就是
        $response = Invoke-WebRequest -Uri $ManifestUrl -UseBasicParsing -ErrorAction Stop
        $Script:Manifest = $response.Content | ConvertFrom-Json
        Write-Ok 'manifest 已載入'
        return $Script:Manifest
    } catch {
        Write-Err2 "無法下載 manifest:$_"
        Write-Host '  檢查網路或 LION_SKILL_BASE_URL 環境變數。' -ForegroundColor DarkGray
        exit 1
    }
}

# ---------- Commands ----------
function Invoke-List {
    $manifest = Get-Manifest
    Write-Host ''
    Write-Host '可安裝的 skill:' -ForegroundColor White
    Write-Host ''
    $fmt = '  {0,-25} {1,-8} {2,-10} {3}'
    Write-Host ($fmt -f 'NAME', 'VERSION', 'CATEGORY', 'DESCRIPTION')
    Write-Host ($fmt -f '----', '-------', '--------', '-----------')

    foreach ($skill in $manifest.skills) {
        $desc = $skill.description
        if ($desc.Length -gt 60) {
            $desc = $desc.Substring(0, 57) + '...'
        }
        Write-Host ($fmt -f $skill.name, $skill.version, $skill.category, $desc)
    }

    Write-Host ''
    Write-Dim "安裝指令:.\install.ps1 install <name>"
}

function Install-SingleSkill {
    param(
        [string]$SkillName,
        [string]$TargetDir,
        [bool]$Force
    )

    $manifest = Get-Manifest
    $skill = $manifest.skills | Where-Object { $_.name -eq $SkillName } | Select-Object -First 1

    if ($null -eq $skill) {
        Write-Err2 "找不到 skill:$SkillName"
        Write-Host '  用 list 看可用清單。' -ForegroundColor DarkGray
        return $false
    }

    $installPath = Join-Path $TargetDir $SkillName

    if ((Test-Path $installPath) -and (-not $Force)) {
        Write-Warn2 "$SkillName 已存在於 $installPath(用 --force 覆蓋,或先手動刪除)"
        return $true  # 不算失敗,只是跳過
    }

    Write-Info "下載 $SkillName v$($skill.version)"
    $zipUrl = "$BaseUrl/downloads/$($skill.zipFilename)"

    # 用 temp 區域作業,完成才搬到正式位置
    $tmpZip = [System.IO.Path]::GetTempFileName() + '.zip'
    $tmpDir = Join-Path ([System.IO.Path]::GetTempPath()) "lion-skill-$([guid]::NewGuid().ToString('N'))"

    try {
        Invoke-WebRequest -Uri $zipUrl -OutFile $tmpZip -UseBasicParsing -ErrorAction Stop
    } catch {
        Write-Err2 "下載失敗:$zipUrl"
        Remove-Item -Force -ErrorAction SilentlyContinue $tmpZip
        return $false
    }

    try {
        Expand-Archive -Path $tmpZip -DestinationPath $tmpDir -Force -ErrorAction Stop
    } catch {
        Write-Err2 "解壓失敗:$($skill.zipFilename)"
        Remove-Item -Force -Recurse -ErrorAction SilentlyContinue $tmpZip, $tmpDir
        return $false
    }

    # 兼容兩種 zip 結構:
    #   1) 內含 <name>\SKILL.md  -> 有外層資料夾
    #   2) 直接 SKILL.md         -> 無外層資料夾(fallback)
    $srcDir = $null
    if (Test-Path (Join-Path $tmpDir "$SkillName\SKILL.md")) {
        $srcDir = Join-Path $tmpDir $SkillName
    } elseif (Test-Path (Join-Path $tmpDir 'SKILL.md')) {
        $srcDir = $tmpDir
    } else {
        Write-Err2 'zip 結構異常:找不到 SKILL.md'
        Write-Host '  zip 內容:' -ForegroundColor DarkGray
        Get-ChildItem -Path $tmpDir -Recurse -Depth 1 | ForEach-Object {
            Write-Host "    $($_.FullName)" -ForegroundColor DarkGray
        }
        Remove-Item -Force -Recurse -ErrorAction SilentlyContinue $tmpZip, $tmpDir
        return $false
    }

    # 確保 target 父目錄存在
    if (-not (Test-Path $TargetDir)) {
        New-Item -ItemType Directory -Path $TargetDir -Force | Out-Null
    }

    # 覆蓋:先刪舊的
    if ((Test-Path $installPath) -and $Force) {
        Remove-Item -Path $installPath -Recurse -Force
    }

    try {
        Copy-Item -Path $srcDir -Destination $installPath -Recurse -Force -ErrorAction Stop
    } catch {
        Write-Err2 "搬移失敗:$installPath"
        Remove-Item -Force -Recurse -ErrorAction SilentlyContinue $tmpZip, $tmpDir
        return $false
    }

    # 清理 temp
    Remove-Item -Force -Recurse -ErrorAction SilentlyContinue $tmpZip, $tmpDir

    # ---- D3 驗證:確認 SKILL.md 真的在 ----
    if (Test-Path (Join-Path $installPath 'SKILL.md')) {
        Write-Ok "$SkillName v$($skill.version) 已安裝到 $installPath"
        return $true
    } else {
        Write-Err2 "$SkillName 安裝後驗證失敗:$installPath\SKILL.md 不存在"
        return $false
    }
}

function Invoke-Install {
    param([string[]]$CmdArgs)

    $installAll = $false
    $force = $false
    $skillName = ''
    $targetDir = $UserSkillsDir

    $i = 0
    while ($i -lt $CmdArgs.Count) {
        $arg = $CmdArgs[$i]
        switch -Regex ($arg) {
            '^--all$'   { $installAll = $true; $i++ }
            '^--force$' { $force = $true; $i++ }
            '^--scope$' {
                $i++
                if ($i -ge $CmdArgs.Count) {
                    Write-Err2 "--scope 需要參數 'project' 或 'user'"
                    exit 1
                }
                switch ($CmdArgs[$i]) {
                    'project' { $targetDir = $ProjectSkillsDir }
                    'user'    { $targetDir = $UserSkillsDir }
                    default {
                        Write-Err2 "--scope 只接受 'project' 或 'user'"
                        exit 1
                    }
                }
                $i++
            }
            '^--' {
                Write-Err2 "未知 flag:$arg"
                exit 1
            }
            default {
                if ($skillName -eq '') {
                    $skillName = $arg
                } else {
                    Write-Err2 "多餘參數:$arg"
                    exit 1
                }
                $i++
            }
        }
    }

    if (-not $installAll -and $skillName -eq '') {
        Write-Err2 '請指定 skill 名稱,或用 --all 安裝全部。'
        Write-Host '  用 list 看可用清單。' -ForegroundColor DarkGray
        exit 1
    }

    $manifest = Get-Manifest

    Write-Host ''
    Write-Host "安裝目標:$targetDir" -ForegroundColor White
    Write-Host ''

    if ($installAll) {
        $installed = 0
        $failed = 0
        foreach ($skill in $manifest.skills) {
            $result = Install-SingleSkill -SkillName $skill.name -TargetDir $targetDir -Force $force
            if ($result) { $installed++ } else { $failed++ }
        }
        Write-Host ''
        if ($failed -eq 0) {
            Write-Ok "全部完成:$installed 個 skill 已安裝"
        } else {
            Write-Warn2 "完成:$installed 個成功,$failed 個失敗"
        }
    } else {
        Install-SingleSkill -SkillName $skillName -TargetDir $targetDir -Force $force | Out-Null
    }

    Write-Host ''
    Write-Dim '下次符合觸發條件時,Claude 會自動載入。'
    Write-Dim '重啟 Claude Code session 讓變更生效。'
}

function Show-Help {
    $help = @"

Lion Skill Library — installer (PowerShell)

USAGE
  # 推薦:先下載到本機再跑
  iwr $BaseUrl/install.ps1 -useb -OutFile install.ps1
  .\install.ps1 <command> [options]

  # ExecutionPolicy 被擋時
  powershell -ExecutionPolicy Bypass -File .\install.ps1 <command> [options]

COMMANDS
  list                       列出所有可安裝的 skill
  install <name>             安裝指定 skill
  install --all              安裝整個庫
  help                       顯示這份說明

OPTIONS
  --scope project            安裝到 .\.claude\skills\(當前目錄,專案級)
  --scope user               安裝到 `$env:USERPROFILE\.claude\skills\(預設)
  --force                    覆蓋既有同名 skill

EXAMPLES
  .\install.ps1 list
  .\install.ps1 install example-greeting
  .\install.ps1 install example-greeting --scope project
  .\install.ps1 install example-greeting --force
  .\install.ps1 install --all

ENVIRONMENT
  LION_SKILL_BASE_URL        覆寫預設的 manifest 來源(debug 用)

MORE
  $BaseUrl/install           完整安裝教學
  https://github.com/Vincenthsiehisme/lion-skill-library

"@
    Write-Host $help
}

# ---------- Main ----------
if ($Command -eq '' -or $Command -eq 'help' -or $Command -eq '--help' -or $Command -eq '-h') {
    Show-Help
    exit 0
}

switch ($Command) {
    'list'    { Invoke-List }
    'install' { Invoke-Install -CmdArgs $Arguments }
    default {
        Write-Err2 "未知指令:$Command"
        Show-Help
        exit 1
    }
}
