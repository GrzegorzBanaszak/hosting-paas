# Plan rozwoju backendu `hosting-paas`

Ten dokument opisuje osobny plan dla API backendowego. Celem jest zbudowanie prostego control plane dla hostowania projektow z GitHuba na wlasnym serwerze.

## Cel v0 backendu

- zarzadzanie aplikacjami
- podpiecie repozytorium GitHub do aplikacji
- reczny deploy
- automatyczny deploy po pushu
- podglad statusu i logow
- restart, stop i start aplikacji
- obsluga zmiennych srodowiskowych
- podstawowy healthcheck

---

## Etap 1 - fundamenty projektu

- [x] ustalic strukture warstw backendu
- [x] wybrac styl API: kontrolery
- [x] przygotowac podstawowy podzial na moduuly
- [x] dodac konfiguracje przez `appsettings` i zmienne srodowiskowe
- [x] dodac OpenAPI / Swagger
- [x] dodac health endpoint
- [x] przygotowac logowanie aplikacyjne
- [x] ustalic standard odpowiedzi bledow

---

## Etap 2 - model domeny

- [x] zaprojektowac encje `App`
- [x] zaprojektowac encje `Repository`
- [x] zaprojektowac encje `Deployment`
- [x] zaprojektowac encje `EnvironmentVariable`
- [x] zaprojektowac encje `Domain`
- [x] zaprojektowac encje `LogEntry`
- [x] dodac statusy dla aplikacji i deploymentu
- [x] ustalic relacje miedzy encjami
- [x] przygotowac walidacje danych

---

## Etap 3 - baza danych

- [x] wybrac silnik bazy danych
- [x] przygotowac DbContext
- [x] dodac migracje poczatkowe
- [x] utworzyc tabele dla aplikacji i deploymentow
- [x] utworzyc tabele dla repozytoriow i domen
- [x] utworzyc tabele dla zmiennych srodowiskowych
- [x] utworzyc tabele dla logow
- [x] dodac seed danych dla pierwszej konfiguracji

---

## Etap 4 - autoryzacja i dostep

- [x] dodac logowanie administratora
- [x] wybrac mechanizm autoryzacji: JWT albo cookie session
- [x] dodac role uzytkownikow
- [x] zabezpieczyc endpointy administracyjne
- [x] dodac podstawowe rate limiting
- [x] dodac walidacje tokenow lub sesji

---

## Etap 5 - zarzadzanie aplikacjami

- [x] dodac endpoint tworzenia aplikacji
- [x] dodac endpoint edycji aplikacji
- [x] dodac endpoint listy aplikacji
- [x] dodac endpoint szczegolow aplikacji
- [x] dodac endpoint usuwania aplikacji
- [x] dodac statusy aplikacji
- [x] dodac konfiguracje portu, komendy startowej i builda
- [x] dodac mapowanie aplikacji do subdomeny

---

## Etap 6 - integracja z GitHub

- [x] dodac podpiecie repozytorium do aplikacji
- [x] dodac wybor brancha deployujacego
- [x] dodac obsluge webhooka z GitHuba
- [x] zweryfikowac podpis webhooka
- [x] dodac zapis commit SHA dla deploya
- [x] dodac obsluge rerun deploya dla konkretnego commita
- [x] dodac filtracje eventow po repozytorium i branchu

---

## Etap 7 - pipeline deployu

- [x] dodac tworzenie rekordu deploymentu
- [x] dodac kolejke zadan deployu
- [x] dodac etap build
- [x] dodac etap publikacji obrazu lub artefaktu
- [x] dodac etap restartu uslugi
- [x] dodac statusy pipeline
- [x] dodac obsluge bledow i retry
- [x] dodac historie deploymentow
- [x] dodac pobieranie kodu z repozytorium do izolowanego workspace
- [x] dodac checkout konkretnego commita SHA przed uruchomieniem pipeline
- [x] dodac rozroznienie typu deploymentu: `StaticSite`, `FrontendSpa`, `BackendApi`, `Fullstack`
- [x] dodac auto-detekcje typu projektu na podstawie struktury repozytorium
- [x] dodac osobne etapy pipeline: `SourceAcquisition`, `ProjectDetection`, `Build`, `Publish`, `Activation`, `Verification`
- [x] dodac konfiguracje katalogow `workspaces`, `releases` i `current`
- [x] dodac zapis metadanych workspace i release w rekordzie deploymentu
- [x] dodac konfiguracje `PublishDirectory` albo katalogu output per typ aplikacji
- [x] dodac reguly publikacji dla `StaticSite` bez kroku runtime/start
- [x] dodac reguly publikacji dla `FrontendSpa` z kopiowaniem `dist/` albo `build/`
- [x] dodac publikacje statycznych plikow do katalogu release
- [x] dodac aktywacje release przez przelaczenie katalogu `current`
- [x] dodac oznaczenie aktywnego release per aplikacja
- [x] dodac rollback do poprzedniego release przy nieudanej aktywacji lub weryfikacji
- [x] dodac podstawowy smoke test po deployu
- [x] dodac walidacje obecnosci pliku startowego po publish, np. `index.html` dla `StaticSite`
- [x] dodac endpoint szczegolow pojedynczego deploymentu
- [x] dodac endpoint logow dla konkretnego deploymentu

---

## Etap 8 - runtime i operacje

- [x] dodac restart aplikacji
- [x] dodac start aplikacji
- [x] dodac stop aplikacji
- [x] dodac healthcheck aplikacji
- [x] dodac podglad ostatnich logow
- [x] dodac pobieranie logow po zakresie czasu
- [x] dodac prosty monitoring statusu kontenera
- [ ] dodac rozdzielenie logow runtime od logow deploymentu na poziomie endpointow
- [ ] dodac blokade operacji start / restart dla aplikacji typu `StaticSite`
- [ ] dodac status gotowosci release przed uruchomieniem runtime
- [ ] dodac endpoint ostatniego znanego stanu runtime per aplikacja

---

## Etap 9 - zmienne srodowiskowe i sekrety

- [ ] dodac edycje zmiennych srodowiskowych
- [ ] rozdzielic sekrety od zwyklych wartosci
- [ ] ukryc sekrety w odpowiedziach API
- [ ] dodac walidacje nazw i wartosci
- [ ] dodac wersjonowanie zmian konfiguracji

---

## Etap 10 - domeny i routing

- [ ] dodac przypisywanie domen do aplikacji
- [ ] dodac przypisywanie wielu domen do jednej aplikacji
- [ ] dodac walidacje konfliktow domen
- [ ] dodac status konfiguracji routingu
- [ ] przygotowac backend pod reverse proxy
- [ ] dodac generowanie konfiguracji reverse proxy dla aktywnego release
- [ ] dodac mapowanie domeny na katalog `current` dla aplikacji statycznych
- [ ] dodac obsluge primary domain i domen dodatkowych przy aktywacji release
- [ ] dodac walidacje zgodnosci domen z typem aplikacji i trybem deploymentu

---

## Etap 11 - logowanie i obserwowalnosc

- [ ] dodac strukturalne logi backendu
- [ ] dodac correlation id dla requestow
- [ ] dodac logi dla deploymentow
- [ ] dodac audyt najwazniejszych akcji
- [ ] dodac prosty endpoint diagnostyczny
- [ ] dodac logowanie etapow pipeline: `SourceAcquisition`, `ProjectDetection`, `Build`, `Publish`, `Activation`, `Verification`
- [ ] dodac rozroznienie logow webhooka, deployu i runtime przez stale `source`
- [ ] dodac metadane commita, brancha i app id do logow deploymentowych
- [ ] dodac endpoint diagnostyczny dla kolejek i aktywnych workerow

---

## Etap 12 - testy

- [ ] dodac testy jednostkowe dla logiki domenowej
- [ ] dodac testy integracyjne dla API
- [ ] dodac testy webhookow GitHub
- [ ] dodac testy deploymentu w trybie symulowanym
- [ ] dodac testy walidacji danych

---

## Etap 13 - hardening

- [ ] dodac ograniczenia dostepu do endpointow administracyjnych
- [ ] dodac walidacje inputu dla wszystkich endpointow
- [ ] dodac obsluge bledow z czytelnymi komunikatami
- [ ] dodac timeouty dla operacji zewnetrznych
- [ ] dodac retry dla wybranych operacji
- [ ] dodac bezpieczne przechowywanie sekretow
- [ ] dodac walidacje bezpiecznych sciezek workspace / release / current
- [ ] dodac ograniczenia dla komend build i start uruchamianych przez worker
- [ ] dodac atomowe przelaczanie release bez pozostawiania niepelnego stanu
- [ ] dodac cleanup starych workspace i release po polityce retencji
- [ ] dodac ochrone przed wielokrotnym queue tego samego deploymentu dla tego samego commita

---

## Minimalna kolejnosc startowa

- [ ] fundamenty projektu
- [ ] model domeny
- [ ] baza danych
- [ ] autoryzacja
- [ ] aplikacje
- [ ] GitHub integration
- [ ] pipeline deployu
- [ ] runtime i operacje

---

## Definicja v0

Backend v0 powinien umiec:

- tworzyc i edytowac aplikacje
- podlaczac repozytoria GitHub
- przyjmowac webhooki z GitHuba
- uruchamiac deploy po pushu
- uruchamiac deploy recznie
- pokazywac status deploymentu
- zwracac logi i healthcheck
- restartowac aplikacje
- publikowac statyczna aplikacje do aktywnego release
- przechowywac historie deploymentow wraz z commit SHA i etapem pipeline
