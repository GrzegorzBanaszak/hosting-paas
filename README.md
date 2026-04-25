# paas-v0

Startowy projekt pod własny mini PaaS do hostowania aplikacji webowych.

## Struktura

- `frontend` — React + Vite
- `api` — ASP.NET Core Web API
- `infra` — konfiguracje infrastrukturalne (Docker, Traefik, deploy)

## Cel v0

Lokalne środowisko na Windows + WSL2 + Docker Desktop, które później będzie można przenieść na Ubuntu w Proxmox.

## Diagram architektury

Aktualny przepływ między frontendem, API i głównymi komponentami backendu:

```mermaid
flowchart LR
    FE[Frontend React/Vite]
    SYS[SystemController]
    AUTHC[AuthController]
    ADMINC[AdminController]
    AUTHSVC[AdminAuthService]
    API[(ASP.NET Core API)]
    DBCTX[AppDbContext / EF Core]
    PG[(PostgreSQL)]
    CFG[appsettings + ENV]

    FE --> API
    API --> SYS
    API --> AUTHC
    API --> ADMINC
    AUTHC --> AUTHSVC
    ADMINC --> AUTHSVC
    AUTHSVC --> CFG
    API --> DBCTX
    DBCTX --> PG
    API --> CFG
```

Docelowy układ modułów wynikający z obecnego modelu domeny i planu backendu:

```mermaid
flowchart LR
    FE[Admin Frontend]
    BFF[ASP.NET Core API]

    AUTH[Auth Module]
    APPS[Apps Module]
    REPOS[Repositories Module]
    DEPLOY[Deployments Module]
    DOMAINS[Domains Module]
    ENVS[Environment Variables Module]
    LOGS[Logs Module]
    WEBHOOK[GitHub Webhook Module]
    WORKER[Deployment Worker]
    RUNTIME[Runtime/Executor]
    GITHUB[GitHub]
    DB[(PostgreSQL)]

    FE --> BFF
    BFF --> AUTH
    BFF --> APPS
    BFF --> REPOS
    BFF --> DEPLOY
    BFF --> DOMAINS
    BFF --> ENVS
    BFF --> LOGS

    GITHUB --> WEBHOOK
    WEBHOOK --> REPOS
    WEBHOOK --> DEPLOY

    DEPLOY --> WORKER
    WORKER --> RUNTIME
    WORKER --> LOGS
    WORKER --> DB

    AUTH --> DB
    APPS --> DB
    REPOS --> DB
    DEPLOY --> DB
    DOMAINS --> DB
    ENVS --> DB
    LOGS --> DB
```

## Diagram relacji domenowych

Relacje encji zapisanych w bazie danych:

```mermaid
erDiagram
    App ||--o| Repository : has_one
    App ||--o{ Deployment : has_many
    Repository ||--o{ Deployment : source_for
    App ||--o{ EnvironmentVariable : has_many
    App ||--o{ Domain : has_many
    App ||--o{ LogEntry : has_many
    Deployment ||--o{ LogEntry : has_many
```
