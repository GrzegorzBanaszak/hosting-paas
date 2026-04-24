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

- [ ] zaprojektowac encje `App`
- [ ] zaprojektowac encje `Repository`
- [ ] zaprojektowac encje `Deployment`
- [ ] zaprojektowac encje `EnvironmentVariable`
- [ ] zaprojektowac encje `Domain`
- [ ] zaprojektowac encje `LogEntry`
- [ ] dodac statusy dla aplikacji i deploymentu
- [ ] ustalic relacje miedzy encjami
- [ ] przygotowac walidacje danych

---

## Etap 3 - baza danych

- [ ] wybrac silnik bazy danych
- [ ] przygotowac DbContext
- [ ] dodac migracje poczatkowe
- [ ] utworzyc tabele dla aplikacji i deploymentow
- [ ] utworzyc tabele dla repozytoriow i domen
- [ ] utworzyc tabele dla zmiennych srodowiskowych
- [ ] utworzyc tabele dla logow
- [ ] dodac seed danych dla pierwszej konfiguracji

---

## Etap 4 - autoryzacja i dostep

- [ ] dodac logowanie administratora
- [ ] wybrac mechanizm autoryzacji: JWT albo cookie session
- [ ] dodac role uzytkownikow
- [ ] zabezpieczyc endpointy administracyjne
- [ ] dodac podstawowe rate limiting
- [ ] dodac walidacje tokenow lub sesji

---

## Etap 5 - zarzadzanie aplikacjami

- [ ] dodac endpoint tworzenia aplikacji
- [ ] dodac endpoint edycji aplikacji
- [ ] dodac endpoint listy aplikacji
- [ ] dodac endpoint szczegolow aplikacji
- [ ] dodac endpoint usuwania aplikacji
- [ ] dodac statusy aplikacji
- [ ] dodac konfiguracje portu, komendy startowej i builda
- [ ] dodac mapowanie aplikacji do subdomeny

---

## Etap 6 - integracja z GitHub

- [ ] dodac podpiecie repozytorium do aplikacji
- [ ] dodac wybor brancha deployujacego
- [ ] dodac obsluge webhooka z GitHuba
- [ ] zweryfikowac podpis webhooka
- [ ] dodac zapis commit SHA dla deploya
- [ ] dodac obsluge rerun deploya dla konkretnego commita
- [ ] dodac filtracje eventow po repozytorium i branchu

---

## Etap 7 - pipeline deployu

- [ ] dodac tworzenie rekordu deploymentu
- [ ] dodac kolejke zadan deployu
- [ ] dodac etap build
- [ ] dodac etap publikacji obrazu lub artefaktu
- [ ] dodac etap restartu uslugi
- [ ] dodac statusy pipeline
- [ ] dodac obsluge bledow i retry
- [ ] dodac historię deploymentow

---

## Etap 8 - runtime i operacje

- [ ] dodac restart aplikacji
- [ ] dodac start aplikacji
- [ ] dodac stop aplikacji
- [ ] dodac healthcheck aplikacji
- [ ] dodac podglad ostatnich logow
- [ ] dodac pobieranie logow po zakresie czasu
- [ ] dodac prosty monitoring statusu kontenera

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

---

## Etap 11 - logowanie i obserwowalnosc

- [ ] dodac strukturalne logi backendu
- [ ] dodac correlation id dla requestow
- [ ] dodac logi dla deploymentow
- [ ] dodac audyt najwazniejszych akcji
- [ ] dodac prosty endpoint diagnostyczny

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
