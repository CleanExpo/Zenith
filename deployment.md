# Zenith Deployment Guide (Windows PowerShell)

> **Scope**   This guide walks through end‑to‑end deployment of the **Zenith** application on Windows 10/11 using **PowerShell 7+**.  It covers both the **Next.js front‑end** and **Supabase/Node back‑end**, containerisation with Docker, CI/CD, monitoring, and recovery.  All commands are written for PowerShell; no Bash or WSL required.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Prerequisites](#prerequisites)
3. [Environment Setup](#environment-setup)
4. [Backend Deployment](#backend-deployment)
5. [Frontend Deployment](#frontend-deployment)
6. [Containerisation with Docker & Kubernetes](#containerisation)
7. [CI/CD Pipeline](#cicd)
8. [Security Hardening](#security)
9. [Monitoring & Observability](#monitoring)
10. [Performance Optimisation](#performance)
11. [Backup & Disaster Recovery](#dr)
12. [Troubleshooting & Loop Prevention](#troubleshooting)
13. [Deployment Checklist](#checklist)
14. [Appendix A – PowerShell Helper Scripts](#appendix)

---

## Architecture Overview <a name="architecture-overview"></a>

```
┌─────────────────────┐        ┌─────────────────────┐
│  Next.js Front‑End  │  <––> │  Node API Gateway   │
└─────────┬───────────┘        └─────────┬───────────┘
          │   WebSockets / REST          │             
          ▼                              ▼             
┌─────────────────────┐        ┌─────────────────────┐
│   Supabase (DB +   │<––DB––>│   Redis (Caching)   │
│  Auth + Storage)   │        └─────────────────────┘
└─────────────────────┘
```

*MCPs (Module Control Programs)* are wired into the IDE to watch build/output logs and auto‑trigger fixes when predefined error patterns are detected.

---

## Prerequisites <a name="prerequisites"></a>

### Required Software

| Tool                       | Minimum Version | Install Command (PowerShell)                                                                     |       |
| -------------------------- | --------------- | ------------------------------------------------------------------------------------------------ | ----- |
| **Node.js**                | 20.x LTS        | `winget install OpenJS.NodeJS.LTS`                                                               |       |
| **npm**                    | ships with Node | —                                                                                                |       |
| **Supabase CLI**           | 1.164+          | \`iwr -useb [https://supabase.com/cli/install/windows](https://supabase.com/cli/install/windows) | iex\` |
| **Docker Desktop**         | 4.30+           | `winget install Docker.DockerDesktop`                                                            |       |
| **Git**                    | 2.43+           | `winget install Git.Git`                                                                         |       |
| **Redis (optional local)** | 7.2             | `winget install Redis.Redis`                                                                     |       |

> **Tip**  Run `Get-Command <tool> -ErrorAction SilentlyContinue` to verify each install.

### IDE & MCP Integration

* **VS Code** with the \[MCP Extension Pack].
* `Invoke-MCPFix` PowerShell module (bundled in `/scripts/MCP/`).

---

## Environment Setup <a name="environment-setup"></a>

1. **Clone repo & move into project**

   ```powershell
   git clone https://github.com/your-org/zenith.git
   cd zenith
   ```

2. **Validate / collect environment variables**

   ```powershell
   .\scripts\Check-Env.ps1  # details in Appendix A
   ```

   The helper script:

   * Lists required variables.
   * Prompts for any missing ones ≤ 2 times.
   * Logs to `logs/env‑check.log`.
   * Calls `Invoke-MCPFix Env` if still incomplete.

3. **Install dependencies (monorepo)**

   ```powershell
   npm ci  # deterministic install via package‑lock.json
   ```

---

## Backend Deployment <a name="backend-deployment"></a>

### 1  Start Supabase locally

```powershell
supabase init      # creates .supabase folder (first run only)
supabase start     # launches Postgres, Auth, Storage
```

*If ports 54321/54322 are busy `supabase start -p 55432`.*

### 2  Run database migrations & seeds

```powershell
npm run migrate   # knex migration
npm run seed      # optional initial data
```

### 3  Redis (optional but recommended)

```powershell
redis-server --service-start  # installed via winget
```

Then update `REDIS_URL` in `.env`.

---

## Frontend Deployment <a name="frontend-deployment"></a>

### 1  Build static assets

```powershell
npm run build         # Next.js production build
```

### 2  Start production server

```powershell
npm run start         # next start -p 3000
```

Verify at [http://localhost:3000](http://localhost:3000).

---

## Containerisation & Orchestration <a name="containerisation"></a>

### Docker (single‑node)

```powershell
docker build -t zenith-app:latest .
docker run --env-file .env -p 3000:3000 zenith-app:latest
```

### Kubernetes (optional cluster)

* Deployment manifests located in `/k8s/*`.
* Use **k3d** on Windows for local cluster:

  ```powershell
  k3d cluster create zenith --servers 1 --agents 2
  kubectl apply -k ./k8s/overlays/local
  ```

---

## CI/CD Pipeline <a name="cicd"></a>

Sample **GitHub Actions** (`.github/workflows/deploy.yml`):

```yaml
name: CI/CD Windows
on: [push]
jobs:
  build-and-deploy:
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v4
      - name: Set up Node
        uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm run build
      - name: Docker Build & Push
        run: |
          docker login ghcr.io -u ${{ secrets.CI_USER }} -p ${{ secrets.CI_PAT }}
          docker build -t ghcr.io/your-org/zenith:${{ github.sha }} .
          docker push ghcr.io/your-org/zenith:${{ github.sha }}
      - name: Deploy to Azure Web App
        uses: azure/webapps-deploy@v3
        with:
          app-name: "zenith-prod"
          images: "ghcr.io/your-org/zenith:${{ github.sha }}"
```

> Replace with AWS/GCP runners as needed.

---

## Security Hardening <a name="security"></a>

* **HTTPS‑only:** Enforce TLS 1.2+ in reverse proxy (see `nginx/prod.conf`).
* **Secrets Management:** Store secrets in Azure Key Vault / AWS Secrets Manager; never commit `.env`.
* **HTTP headers:** Use `helmet` middleware – already configured in `server/index.ts`.
* **Container:** Run as non‑root UID, enable read‑only root FS.

---

## Monitoring & Observability <a name="monitoring"></a>

| Layer    | Tooling                                  |
| -------- | ---------------------------------------- |
| Frontend | Google Tag Manager, Sentry (performance) |
| Backend  | Prometheus + Grafana dashboards          |
| DB       | Supabase Insights                        |
| Logs     | Loki stack (`docker-compose.loki.yml`)   |

---

## Performance Optimisation <a name="performance"></a>

* **Next.js**: enable `next/image`, incremental static regeneration.
* **API**: cache heavy queries in Redis for 60 s average; invalidate on write.
* **DB**: run `ANALYZE` nightly – job defined in `supabase/functions/cron.sql`.

---

## Backup & Disaster Recovery <a name="dr"></a>

* **Database**: automated WAL‑level backups every 15 min to S3 (see `supabase/backups.yaml`).
* **Assets**: Supabase storage bucket replication enabled.
* **Infra as Code**: ARM/Bicep templates stored in `/iac/` – redeploy in one command.

---

## Troubleshooting & Loop Prevention <a name="troubleshooting"></a>

| Symptom             | Auto‑Recovery Logic                                                                            |
| ------------------- | ---------------------------------------------------------------------------------------------- |
| **Build hangs**     | `scripts/Retry-Command.ps1` retries twice, then calls `Invoke-MCPFix BuildTimeout`             |
| **Migrations loop** | `npm run migrate` wrapped in `Retry‑Command` with idempotency check on `knex_migrations` table |
| **Port collision**  | `Find-OpenPort` selects next free port & rewrites `.env`                                       |

> **Loop Guard**  `Retry-Command` accepts `‑MaxAttempts 2` (default). On final failure it exits non‑zero and surfaces the log path for manual review.

---

## Deployment Checklist <a name="checklist"></a>

* [ ] Latest code merged to **main**
* [ ] `Check-Env.ps1` reports **0 missing vars**
* [ ] `npm ci` completes with no vulnerabilities > *low*
* [ ] Unit tests pass (`npm test`)
* [ ] `supabase gen types typescript --local` up to date
* [ ] Docker image built & scanned (no critical CVEs)
* [ ] Backup snapshot taken & verified

---

## Appendix A – PowerShell Helper Scripts <a name="appendix"></a>

### scripts/Check-Env.ps1

```powershell
param(
    [int]$Retry = 2,
    [string[]]$Required = @(
        'DATABASE_URL',
        'NEXT_PUBLIC_SUPABASE_URL',
        'NEXT_PUBLIC_SUPABASE_ANON_KEY',
        'STRIPE_SECRET_KEY',
        'STRIPE_WEBHOOK_SECRET',
        'GOOGLE_MAPS_API_KEY',
        'AUTH_SECRET',
        'REDIS_URL'
    )
)
$missing = $Required | Where-Object { -not $env:$_ }
if ($missing.Count -eq 0) {
    Write-Host "✅ Environment validated"
    return
}
Write-Warning "Missing vars: $($missing -join ', ')"
if ($Retry -gt 0) {
    foreach ($var in $missing) {
        $value = Read-Host "Enter value for $var (leave blank to skip)"
        if ($value) { [Environment]::SetEnvironmentVariable($var, $value, 'Process') }
    }
    & $MyInvocation.MyCommand.Path -Retry ($Retry-1) -Required $Required
} else {
    Write-Error "Environment validation failed after multiple attempts. Calling MCP..."
    Invoke-MCPFix EnvMissing -Args $missing
    exit 1
}
```

### scripts/Retry-Command.ps1

```powershell
param(
    [scriptblock]$Script,
    [int]$MaxAttempts = 2
)
for ($i = 1; $i -le $MaxAttempts; $i++) {
    try {
        & $Script
        return  # success
    }
    catch {
        Write-Warning "Attempt $i failed: $_"
        if ($i -eq $MaxAttempts) {
            Invoke-MCPFix "RetryFailure" -Args $_
            throw
        }
    }
}
```

---

**End of Deployment Guide**
