# Flow deploymentu dla `artisan-bakery-landing-page`

Ten dokument opisuje rekomendowany flow deploymentu dla aplikacji wzorcowej `GrzegorzBanaszak/artisan-bakery-landing-page` w kontekscie obecnego repo `hosting-paas`.

## 1. Analiza aktualnego stanu projektu

### Co juz jest gotowe w `hosting-paas`

- osobny `frontend` w React + Vite
- osobne `api` w ASP.NET Core
- PostgreSQL i migracje EF Core
- logowanie administratora przez JWT
- CRUD aplikacji i repozytoriow
- webhook GitHub
- kolejka deploymentow i worker deploymentu
- runtime start / stop / restart dla procesow lokalnych
- healthcheck i logi runtime

### Co juz dziala w pipeline backendu

Obecny backend potrafi:

- utworzyc rekord deploymentu
- pobrac konfiguracje aplikacji z bazy
- odpalic `BuildCommand` w katalogu `ProjectRootPath`
- zapisac manifest artefaktu do `artifacts/<slug>/<deploymentId>/manifest.json`
- opcjonalnie odpalic `StartCommand`

### Czego jeszcze brakuje do pelnego deployu z GitHuba

Obecny pipeline nie robi jeszcze kilku krytycznych rzeczy:

- nie klonuje repozytorium z GitHuba do workspace
- nie checkoutuje konkretnego brancha ani commita
- nie kopiuje zbudowanego artefaktu do katalogu serwowanego publicznie
- nie wystawia aplikacji przez reverse proxy
- nie rozroznia typu aplikacji: statyczna strona vs aplikacja serwerowa
- nie ma osobnego flow dla prostych landing page bez backendu

## 2. Czym jest repo referencyjne

Repo `artisan-bakery-landing-page` jest prostym statycznym projektem frontendowym:

- glowny plik: `index.html`
- style: `styles.css`
- brak backendu
- brak procesu build
- brak `package.json`
- brak potrzeby uruchamiania procesu aplikacji

To oznacza, ze dla tego typu projektu najlepszy deployment nie powinien isc przez `StartCommand`, tylko przez publikacje plikow statycznych.

## 3. Docelowy model deploymentu dla tego typu aplikacji

### Rekomendowany typ aplikacji

Dla `artisan-bakery-landing-page` proponuje typ:

- `StaticSite`

Minimalny model konfiguracyjny aplikacji powinien rozrozniac:

- `StaticSite`
- `FrontendSpa`
- `BackendApi`
- `Fullstack`

### Minimalna konfiguracja aplikacji statycznej

Dla tego repo konfiguracja powinna wygladac tak:

- `RepositoryProvider`: GitHub
- `Owner`: `GrzegorzBanaszak`
- `Repo`: `artisan-bakery-landing-page`
- `Branch`: `main`
- `ProjectRootPath`: `.`
- `BuildCommand`: puste
- `StartCommand`: puste
- `PublishDirectory`: `.`
- `PublicBasePath`: `/var/www/apps/artisan-bakery/current` albo analogiczny katalog na Windows
- `DeploymentMode`: `StaticFiles`

## 4. Docelowy flow deploymentu

### Flow end-to-end

1. Administrator tworzy aplikacje w `hosting-paas`.
2. Administrator podpina repozytorium GitHub i branch `main`.
3. GitHub wysyla webhook po pushu albo administrator klika manualny deploy.
4. API tworzy rekord deploymentu ze statusem `Queued`.
5. Worker pobiera deployment z kolejki.
6. Worker tworzy izolowany katalog roboczy dla deploymentu.
7. Worker klonuje repozytorium albo fetchuje najnowszy commit.
8. Worker checkoutuje konkretny commit SHA zapisany w rekordzie deploymentu.
9. Worker wykrywa typ aplikacji.
10. Dla `artisan-bakery-landing-page` worker rozpoznaje projekt jako statyczny.
11. Worker pomija etap build, bo brak `BuildCommand` i brak narzedzi bundlujacych.
12. Worker kopiuje `index.html`, `styles.css` i inne assety do katalogu release.
13. Worker przelacza symlink albo wskazanie `current` na nowy release.
14. Reverse proxy albo serwer statyczny zaczyna serwowac nowa wersje.
15. Worker wykonuje smoke test HTTP na `/`.
16. Deployment dostaje status `Succeeded` albo `Failed`.
17. Logi i metadane deploymentu sa widoczne w panelu.

### Flow katalogow

Przykladowy uklad:

- `/srv/hosting-paas/workspaces/<app-slug>/<deployment-id>`
- `/srv/hosting-paas/releases/<app-slug>/<deployment-id>`
- `/srv/hosting-paas/current/<app-slug>` jako aktywny release

Na Windows dev moze to byc odpowiednio:

- `E:\hosting-paas-data\workspaces\<app-slug>\<deployment-id>`
- `E:\hosting-paas-data\releases\<app-slug>\<deployment-id>`
- `E:\hosting-paas-data\current\<app-slug>`

### Flow reverse proxy

Najprostszy wariant produkcyjny:

1. Nginx albo Traefik odbiera ruch.
2. Domena `artisanbakery.twojadomena.pl` wskazuje na serwer.
3. Reverse proxy mapuje domene na katalog aktywnego release.
4. Dla projektu statycznego serwowane sa bezposrednio pliki HTML/CSS/obrazy.

## 5. Jak to powinno wygladac konkretnie dla `artisan-bakery-landing-page`

### Pipeline dla tego repo

1. `git clone --depth 1 --branch main https://github.com/GrzegorzBanaszak/artisan-bakery-landing-page.git`
2. opcjonalny `git checkout <commitSha>`
3. walidacja obecnosci `index.html`
4. kopiowanie plikow do katalogu release
5. publikacja release
6. test `GET /`

### Czego nie robic dla tego repo

- nie uruchamiac `npm install`
- nie uruchamiac `npm run build`
- nie uruchamiac procesu aplikacji przez `StartCommand`
- nie traktowac tego jako aplikacji kontenerowej

## 6. Jak dopasowac to do obecnego backendu

### Najwazniejsza zmiana architektoniczna

Dzisiaj backend zaklada model:

- `build command`
- `publish manifest`
- `start command`

Dla statycznych stron potrzebujesz modelu:

- `fetch source`
- `detect app kind`
- `optional build`
- `publish static output`
- `optional runtime restart`

### Proponowane etapy pipeline

Nowe etapy workera:

1. `SourceAcquisition`
2. `ProjectDetection`
3. `Build`
4. `Publish`
5. `Activation`
6. `Verification`

### Zachowanie etapow dla `StaticSite`

- `SourceAcquisition`: wymagany
- `ProjectDetection`: wymagany
- `Build`: pomijany
- `Publish`: wymagany
- `Activation`: wymagany
- `Verification`: wymagany

### Zachowanie etapow dla przyszlego `FrontendSpa`

- `SourceAcquisition`: wymagany
- `ProjectDetection`: wymagany
- `Build`: `npm ci && npm run build`
- `Publish`: kopiowanie `dist/`
- `Activation`: przelaczenie aktualnego release
- `Verification`: `GET /`

## 7. Minimalny backlog, zeby ten flow wdrozyc

### Priorytet 1

- dodac typ aplikacji lub tryb deploymentu
- dodac klonowanie repozytorium do workspace
- dodac checkout konkretnego commita
- dodac katalogi `workspace`, `releases`, `current`
- dodac publikacje plikow statycznych
- dodac smoke test po deployu

### Priorytet 2

- dodac auto-detekcje typu projektu
- dodac obsluge `dist/`, `build/`, `.next/out`, `public`
- dodac reverse proxy config generation
- dodac rollback do poprzedniego release

### Priorytet 3

- dodac deploy zero-downtime przez atomic switch
- dodac TLS i automatyczne domeny
- dodac przechowywanie artefaktow per release

## 8. Rekomendacja praktyczna

Dla obecnego etapu projektu najlepsza droga jest taka:

1. Nie probowac od razu wdrazac uniwersalnego PaaS dla wszystkich typow aplikacji.
2. Najpierw doprowadzic do konca flow dla `StaticSite`.
3. Uzyc `artisan-bakery-landing-page` jako pierwszego, najprostszego scenariusza referencyjnego.
4. Dopiero potem dodac drugi scenariusz: `Vite/React SPA`.
5. Na koncu rozszerzyc to o aplikacje backendowe uruchamiane jako proces lub kontener.

## 9. Konkluzja

Na bazie obecnego repo `hosting-paas` i referencyjnego `artisan-bakery-landing-page` docelowy deployment powinien byc dwuetapowy:

- najpierw pobranie i publikacja statycznych plikow
- dopiero pozniej rozbudowa o build i runtime dla bardziej zlozonych aplikacji

To jest najkrotsza droga do pierwszego realnie dzialajacego deployu w systemie, bez nadmiarowego komplikowania pipeline juz na starcie.
