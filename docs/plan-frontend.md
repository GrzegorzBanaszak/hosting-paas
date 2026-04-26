# Plan rozwoju frontendu `hosting-paas`

Ten dokument opisuje osobny plan dla panelu administracyjnego frontendowego. Celem jest zbudowanie prostego interfejsu do obslugi control plane dla hostowania aplikacji z GitHuba.

## Cel v0 frontendu

- logowanie administratora
- dashboard stanu platformy
- lista aplikacji
- widok szczegolow aplikacji
- podglad deploymentow i statusow
- zarzadzanie zmiennymi srodowiskowymi
- zarzadzanie domenami
- obsluga stanow ladowania, bledow i pustych widokow

---

## Etap 1 - fundamenty projektu

- [x] utworzyc aplikacje React + Vite
- [x] dodac TypeScript
- [x] skonfigurowac podstawowy build
- [x] dodac podstawowy linting
- [x] usunac starterowy widok Vite
- [x] ustalic docelowa strukture katalogow frontendu
- [x] przygotowac konfiguracje polaczenia z API
- [x] przygotowac wspolne typy i modele DTO

---

## Etap 2 - shell aplikacji

- [x] dodac routing aplikacji
- [x] przygotowac glowny layout panelu administracyjnego
- [x] dodac sidebar lub nawigacje glowna
- [x] dodac topbar z informacja o sesji
- [x] dodac widok `not found`
- [x] dodac podstawowy system powiadomien
- [x] przygotowac wspolne komponenty UI

---

## Etap 3 - autoryzacja i sesja

- [x] dodac formularz logowania administratora
- [x] podpiac `POST /api/auth/login`
- [x] przechowywac token dostepowy
- [x] dodac bootstrap sesji przez `GET /api/auth/me`
- [x] zabezpieczyc trasy wymagajace zalogowania
- [x] dodac wylogowanie
- [x] dodac obsluge wygasniecia tokenu

---

## Etap 4 - dashboard platformy

- [x] dodac ekran startowy panelu
- [x] pokazac status API i healthcheck
- [x] pokazac podstawowe informacje o platformie
- [x] dodac sekcje ostatniej aktywnosci
- [x] dodac miejsce na metryki aplikacji i deploymentow
- [x] dodac stany puste dla jeszcze niegotowych modulow

---

## Etap 5 - zarzadzanie aplikacjami

- [x] dodac widok listy aplikacji
- [x] dodac filtrowanie i wyszukiwanie aplikacji
- [x] dodac widok szczegolow aplikacji
- [x] dodac formularz tworzenia aplikacji
- [x] dodac formularz edycji aplikacji
- [x] dodac akcje usuniecia aplikacji
- [x] pokazac status aplikacji i podstawowe metadane

---

## Etap 6 - repozytorium i integracja GitHub

- [x] dodac sekcje podpiecia repozytorium do aplikacji
- [x] dodac formularz owner / repo / branch / clone url
- [x] pokazac aktualnie podlaczone repozytorium
- [x] dodac widok konfiguracji webhooka
- [x] pokazac ostatni commit i branch deployujacy

---

## Etap 7 - deploymenty

- [ ] dodac liste deploymentow dla aplikacji
- [ ] dodac widok szczegolow deploymentu
- [ ] pokazac status deploymentu, trigger i commit SHA
- [ ] dodac reczny trigger deployu
- [ ] dodac odswiezanie statusu deploymentu
- [ ] dodac podstawowy podglad logow deploymentu
- [ ] przygotowac miejsce pod retry i redeploy

---

## Etap 8 - runtime i operacje

- [ ] dodac akcje start aplikacji
- [ ] dodac akcje stop aplikacji
- [ ] dodac akcje restart aplikacji
- [ ] pokazac healthcheck aplikacji
- [ ] pokazac ostatni znany status runtime
- [ ] dodac potwierdzenia dla operacji administracyjnych

---

## Etap 9 - zmienne srodowiskowe i sekrety

- [ ] dodac liste zmiennych srodowiskowych
- [ ] dodac formularz tworzenia i edycji zmiennej
- [ ] rozroznic sekrety od zwyklych wartosci
- [ ] maskowac sekrety w UI
- [ ] dodac usuwanie zmiennych
- [ ] dodac walidacje kluczy i wartosci

---

## Etap 10 - domeny i routing

- [ ] dodac widok domen przypisanych do aplikacji
- [ ] dodac formularz dodawania domeny
- [ ] pokazac domene glowna
- [ ] pokazac status konfiguracji domeny
- [ ] dodac usuwanie domeny
- [ ] dodac walidacje konfliktow i duplikatow

---

## Etap 11 - jakosc UX

- [ ] dodac globalna obsluge bledow API
- [ ] dodac loading skeletons i stany pustych danych
- [ ] dodac optimistic lub bezpieczne odswiezanie danych tam, gdzie ma to sens
- [ ] dodac spojnosc komunikatow bledow i sukcesu
- [ ] poprawic dostepnosc formularzy i nawigacji
- [ ] zadbac o responsywnosc na desktop i mobile

---

## Etap 12 - testy

- [ ] dodac testy jednostkowe dla kluczowych komponentow
- [ ] dodac testy formularza logowania
- [ ] dodac testy guardow tras i sesji
- [ ] dodac testy integracyjne dla glownych flow
- [ ] dodac testy dla widokow aplikacji i deploymentow

---

## Etap 13 - hardening i wydanie

- [ ] dodac bezpieczna obsluge tokenu i danych sesji
- [ ] ograniczyc ryzyko wycieku sekretow w UI
- [ ] przygotowac plik `.env.example` dla frontendu
- [ ] dopracowac konfiguracje produkcyjna builda
- [ ] dodac podstawowa analityke bledow frontendowych
- [ ] przygotowac frontend do uruchamiania za reverse proxy

---

## Minimalna kolejnosc startowa

- [ ] fundamenty projektu
- [ ] shell aplikacji
- [ ] autoryzacja
- [ ] dashboard
- [ ] aplikacje
- [ ] deploymenty
- [ ] zmienne srodowiskowe
- [ ] domeny

---

## Definicja v0

Frontend v0 powinien umiec:

- logowac administratora
- pokazywac status platformy
- wyswietlac liste aplikacji
- pokazywac szczegoly aplikacji
- uruchamiac reczny deploy
- pokazywac historie deploymentow
- zarzadzac zmiennymi srodowiskowymi
- zarzadzac domenami aplikacji
