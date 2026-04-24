# Ogólna lista kroków dla projektu `hosting-paas`

## Etap 1 — przygotowanie środowiska lokalnego

- [x] zainstalować WSL2
- [x] zainstalować Ubuntu w WSL
- [x] zainstalować Docker Desktop
- [x] włączyć Docker na silniku WSL2
- [x] włączyć integrację Dockera z Ubuntu
- [x] upewnić się, że Docker działa w trybie Linux containers
- [x] przygotować katalog roboczy projektu w WSL, np. `~/projects/paas-v0`

---

## Etap 2 — utworzenie projektu i repozytorium

- [x] utworzyć repozytorium na GitHub
- [x] zainicjalizować lokalne repozytorium git
- [x] utworzyć podstawową strukturę projektu
- [x] dodać plik `.gitignore`
- [x] dodać `README.md`
- [x] wykonać pierwszy commit
- [x] wypchnąć projekt na GitHub

---

## Etap 3 — stworzenie startowego monorepo

- [x] utworzyć katalog `frontend`
- [x] utworzyć aplikację React + Vite
- [x] utworzyć katalog `api`
- [x] utworzyć projekt ASP.NET Core Web API
- [x] utworzyć katalog `infra`
- [x] utworzyć katalog `docs`

Docelowa struktura:

- [x] `frontend/`
- [x] `api/`
- [x] `infra/`
- [x] `docs/`

---

## Etap 4 — uruchomienie aplikacji lokalnie bez Dockera

- [ ] sprawdzić, czy frontend uruchamia się lokalnie
- [ ] sprawdzić, czy API uruchamia się lokalnie
- [ ] potwierdzić komunikację frontend → API, jeśli backend jest potrzebny

---

## Etap 5 — dockerizacja projektu

- [ ] przygotować Dockerfile dla frontendu
- [ ] przygotować Dockerfile dla API
- [ ] przygotować `.dockerignore`
- [ ] upewnić się, że oba obrazy budują się lokalnie
- [ ] uruchomić frontend w kontenerze
- [ ] uruchomić API w kontenerze

---

## Etap 6 — wspólne uruchamianie przez Docker Compose

- [ ] utworzyć `docker-compose.yml`
- [ ] skonfigurować wspólną sieć dla usług
- [ ] dodać usługę `frontend`
- [ ] dodać usługę `api`
- [ ] uruchomić całość jednym poleceniem
- [ ] sprawdzić, czy kontenery komunikują się poprawnie

---

## Etap 7 — reverse proxy

- [ ] dodać Traefika albo Nginx
- [ ] skonfigurować routing do frontendu
- [ ] skonfigurować routing do API
- [ ] wystawić aplikację lokalnie przez jedną warstwę wejściową
- [ ] sprawdzić działanie routingu

---

## Etap 8 — publikacja przez Cloudflare Tunnel

- [ ] skonfigurować konto i domenę w Cloudflare
- [ ] zainstalować `cloudflared`
- [ ] utworzyć tunnel
- [ ] skierować tunnel na lokalny reverse proxy
- [ ] skonfigurować subdomenę dla frontendu
- [ ] skonfigurować subdomenę dla API
- [ ] sprawdzić dostęp do aplikacji z internetu

---

## Etap 9 — standaryzacja aplikacji

- [ ] ustalić wspólny schemat nazw aplikacji
- [ ] ustalić schemat subdomen
- [ ] ustalić sposób trzymania zmiennych środowiskowych
- [ ] przygotować szablon dla nowych aplikacji
- [ ] przygotować wspólny standard Dockerfile i Compose

---

## Etap 10 — automatyczny deploy z GitHub

- [ ] przygotować workflow GitHub Actions
- [ ] skonfigurować self-hosted runner
- [ ] zautomatyzować build obrazów
- [ ] zautomatyzować restart usług po deployu
- [ ] przetestować deploy po pushu na `main`

---

## Etap 11 — rozwój w stronę mini-PaaS

- [ ] przygotować prosty rejestr aplikacji
- [ ] dodać skrypt do tworzenia nowej aplikacji
- [ ] dodać skrypt do deployu aplikacji
- [ ] dodać skrypt do restartu aplikacji
- [ ] dodać podgląd logów
- [ ] dodać healthchecki

---

## Etap 12 — przygotowanie do migracji na serwer

- [ ] dopilnować, żeby wszystko działało niezależnie od Windowsa
- [ ] unikać skryptów specyficznych dla Windows
- [ ] trzymać konfigurację w plikach i env
- [ ] upewnić się, że projekt można przenieść 1:1 na Ubuntu

---

## Etap 13 — migracja na docelowy serwer

- [ ] złożyć serwer
- [ ] zainstalować Proxmox
- [ ] utworzyć VM z Ubuntu Server
- [ ] zainstalować Docker i potrzebne narzędzia
- [ ] przenieść konfigurację projektu
- [ ] uruchomić aplikacje na Ubuntu
- [ ] przepiąć tunnel i routing na nowy host

---

# Minimalna kolejność startowa

## Priorytet na teraz

- [ ] przygotować WSL2 + Docker Desktop
- [ ] utworzyć repozytorium GitHub
- [ ] stworzyć monorepo `frontend` + `api` + `infra`
- [ ] uruchomić frontend i API lokalnie
- [ ] zrobić Dockerfile dla obu usług
- [ ] dodać `docker-compose.yml`
- [ ] dodać reverse proxy
- [ ] wystawić aplikację przez Cloudflare Tunnel
- [ ] dodać prosty deploy z GitHub

---

# Pierwszy praktyczny cel

## v0 powinno umieć:

- [ ] uruchomić frontend React + Vite
- [ ] uruchomić opcjonalne API w .NET
- [ ] wystawić frontend pod subdomeną
- [ ] wystawić API pod subdomeną
- [ ] uruchamiać całość przez Docker Compose
- [ ] pozwolić na późniejsze przeniesienie na Ubuntu
