#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Script para rodar todos os serviços do Baby Book em paralelo
    
.DESCRIPTION
    Inicia:
    - API (FastAPI) na porta 8000
    - Web (Vite SPA) na porta 5173
    - Edge (Cloudflare Workers) na porta 8787
    - Workers (Background Jobs)
    
.EXAMPLE
    .\run-all-services.ps1
    
.NOTES
    Cada serviço roda em um novo terminal independente
#>

param(
    [switch]$ApiOnly = $false,
    [switch]$WebOnly = $false,
    [switch]$Verbose = $false
)

function Write-Header {
    param([string]$Text, [string]$Color = "Cyan")
    Write-Host "`n  ┌─ $Text" -ForegroundColor $Color
    Write-Host "  │" -ForegroundColor $Color
}

function Write-Service {
    param([string]$Name, [string]$Command, [string]$Port)
    Write-Host "  │  🚀 $Name" -ForegroundColor Green
    Write-Host "  │     Command: $Command" -ForegroundColor Gray
    Write-Host "  │     URL: http://localhost:$Port" -ForegroundColor Gray
    Write-Host "  │" -ForegroundColor Cyan
}

function Start-ServiceTerminal {
    param(
        [string]$Name,
        [string]$Command,
        [string]$Port,
        [int]$Index
    )
    
    $script = {
        param($Cmd, $Name)
        Write-Host "┌────────────────────────────────────────┐" -ForegroundColor Green
        Write-Host "│ 🚀 $Name" -ForegroundColor Green
        Write-Host "└────────────────────────────────────────┘" -ForegroundColor Green
        Write-Host "Executando: $Cmd`n" -ForegroundColor Yellow
        Invoke-Expression $Cmd
    }
    
    Start-Process pwsh -ArgumentList "-NoExit", "-Command", "`$Host.UI.RawUI.WindowTitle = '$Name'; Clear-Host; $Command" -WindowStyle Normal
}

Clear-Host
Write-Host "
╔════════════════════════════════════════════════════╗
║         🎉 Baby Book - Iniciar Serviços            ║
╚════════════════════════════════════════════════════╝
" -ForegroundColor Magenta

Write-Header "VALIDAÇÕES PRÉ-INICIALIZAÇÃO" "Yellow"

# Validar que estamos no diretório correto
if (-not (Test-Path "./package.json") -or -not (Test-Path "./pyproject.toml")) {
    Write-Host "  │  ❌ Erro: Execute este script na raiz do projeto" -ForegroundColor Red
    exit 1
}

# Validar que venv está ativado
if ($env:VIRTUAL_ENV -eq $null) {
    Write-Host "  │  ⚠️  Aviso: Python venv não ativado" -ForegroundColor Yellow
    Write-Host "  │     Execute: .\.venv\Scripts\Activate.ps1" -ForegroundColor Yellow
    $response = Read-Host "  │  Continuar mesmo assim? (s/n)"
    if ($response -ne "s") {
        exit 1
    }
}

# Validar docker
if (Get-Command docker -ErrorAction SilentlyContinue) {
    $dockerStatus = docker compose ps 2>&1
    if ($dockerStatus -match "healthy") {
        Write-Host "  │  ✅ Docker services estão rodando" -ForegroundColor Green
    } else {
        Write-Host "  │  ⚠️  Aviso: Docker services podem não estar prontos" -ForegroundColor Yellow
        Write-Host "  │     Execute: docker compose up -d" -ForegroundColor Yellow
    }
} else {
    Write-Host "  │  ⚠️  Docker não encontrado" -ForegroundColor Yellow
}

Write-Host "  │" -ForegroundColor Cyan
Write-Host "  └─ Pré-validações completas" -ForegroundColor Cyan

Write-Header "SERVIÇOS A INICIALIZAR" "Green"

if (-not $ApiOnly -and -not $WebOnly) {
    Write-Service "API (FastAPI)" "pnpm dev:api" "8000"
    Write-Service "Web (Vite SPA)" "pnpm dev:web" "5173"
    Write-Service "Edge (Cloudflare)" "pnpm dev:edge" "8787"
    Write-Service "Workers (Background)" "pnpm dev:workers" "-"
} elseif ($ApiOnly) {
    Write-Service "API (FastAPI)" "pnpm dev:api" "8000"
} elseif ($WebOnly) {
    Write-Service "Web (Vite SPA)" "pnpm dev:web" "5173"
}

Write-Host "  └─ Iniciando serviços..." -ForegroundColor Green

Write-Host "`n  ⏳ Aguarde... (novos terminais se abrirão automaticamente)" -ForegroundColor Yellow
Start-Sleep -Seconds 1

# Iniciar serviços
if (-not $WebOnly) {
    Write-Host "`n  📡 Iniciando API..." -ForegroundColor Cyan
    Start-ServiceTerminal -Name "Baby Book - API (8000)" -Command "pnpm dev:api" -Port "8000" -Index 1
    Start-Sleep -Seconds 2
}

if (-not $ApiOnly) {
    Write-Host "`n  🎨 Iniciando Web..." -ForegroundColor Cyan
    Start-ServiceTerminal -Name "Baby Book - Web (5173)" -Command "pnpm dev:web" -Port "5173" -Index 2
    Start-Sleep -Seconds 2
    
    Write-Host "`n  🌍 Iniciando Edge..." -ForegroundColor Cyan
    Start-ServiceTerminal -Name "Baby Book - Edge (8787)" -Command "pnpm dev:edge" -Port "8787" -Index 3
    Start-Sleep -Seconds 2
    
    Write-Host "`n  ⚙️  Iniciando Workers..." -ForegroundColor Cyan
    Start-ServiceTerminal -Name "Baby Book - Workers" -Command "pnpm dev:workers" -Port "-" -Index 4
}

Write-Host "`n╔════════════════════════════════════════════════════╗
║          ✨ Todos os serviços iniciados!          ║
╚════════════════════════════════════════════════════╝" -ForegroundColor Green

Write-Host "`n  📍 ACESSAR:" -ForegroundColor Green
Write-Host "     • Web:        http://localhost:5173" -ForegroundColor White
Write-Host "     • API Docs:   http://localhost:8000/docs" -ForegroundColor White
Write-Host "     • MinIO:      http://localhost:9001" -ForegroundColor White
Write-Host "     • Edge Dev:   http://localhost:8787" -ForegroundColor White

Write-Host "`n  🛑 Para parar os serviços, feche os terminais ou Ctrl+C em cada um" -ForegroundColor Yellow
Write-Host "`n  💡 Dica: Use -ApiOnly ou -WebOnly para iniciar apenas um serviço" -ForegroundColor Gray
Write-Host "`n  Exemplo: .\run-all-services.ps1 -ApiOnly`n" -ForegroundColor Gray
