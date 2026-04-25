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

- [ ] dodac formularz logowania administratora
- [ ] podpiac `POST /api/auth/login`
- [ ] przechowywac token dostepowy
- [ ] dodac bootstrap sesji przez `GET /api/auth/me`
- [ ] zabezpieczyc trasy wymagajace zalogowania
- [ ] dodac wylogowanie
- [ ] dodac obsluge wygasniecia tokenu

---

## Etap 4 - dashboard platformy

- [ ] dodac ekran startowy panelu
- [ ] pokazac status API i healthcheck
- [ ] pokazac podstawowe informacje o platformie
- [ ] dodac sekcje ostatniej aktywnosci
- [ ] dodac miejsce na metryki aplikacji i deploymentow
- [ ] dodac stany puste dla jeszcze niegotowych modulow

---

## Etap 5 - zarzadzanie aplikacjami

- [ ] dodac widok listy aplikacji
- [ ] dodac filtrowanie i wyszukiwanie aplikacji
- [ ] dodac widok szczegolow aplikacji
- [ ] dodac formularz tworzenia aplikacji
- [ ] dodac formularz edycji aplikacji
- [ ] dodac akcje usuniecia aplikacji
- [ ] pokazac status aplikacji i podstawowe metadane

---

## Etap 6 - repozytorium i integracja GitHub

- [ ] dodac sekcje podpiecia repozytorium do aplikacji
- [ ] dodac formularz owner / repo / branch / clone url
- [ ] pokazac aktualnie podlaczone repozytorium
- [ ] dodac widok konfiguracji webhooka
- [ ] pokazac ostatni commit i branch deployujacy

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
