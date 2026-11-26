# Interwałowy Timer Treningowy
Lekka, minimalistyczna aplikacja webowa stworzona w Vue 3 do konfiguracji i śledzenia własnych treningów interwałowych (np. HIIT, Tabata, obwody).

🚀 Wypróbuj aplikację na żywo: https://mhalas.github.io/hiit

## Funkcje
* Konfigurator Treningu: Dodawaj, usuwaj i modyfikuj ćwiczenia, ustalaj czasy pracy, odpoczynku oraz liczbę serii.

* Inteligentne Linki: Konfiguracja treningu jest kodowana i przesyłana w URL – łatwo udostępnisz swój plan treningowy znajomym.

* Dynamiczny Licznik:
  * Duży, okrągły timer z animacją postępu zgodną z ruchem wskazówek zegara.
  * Automatyczna zmiana kolorów (pomarańczowy dla wysiłku, zielony dla odpoczynku i przerw między obwodami).
  * Wskaźnik aktualnie wykonywanego ćwiczenia na liście harmonogramu.
  * Podgląd następnego ćwiczenia podczas odpoczynku i czas pozostały do końca treningu.
  * Przyciski przejścia do poprzedniego i następnego kroku.
  * Sygnały dźwiękowe odliczania i zmiany fazy; ekran nie wygasza się w trakcie treningu.

* Responsywność: W pełni dostosowana do wygodnego korzystania na ekranach smartfonów.

## Technologie
* Vue 3 (Composition API, <script setup>)

* TypeScript

* Vue Router

* CSS3 / SVG (Płynne animacje i minimalistyczny dark mode)

* Vitest, Vue Test Utils, ESLint, Prettier

## Uruchomienie projektu lokalnie
### Sklonuj repozytorium:
```
git clone https://github.com/mhalas/hiit.git
cd hiit
```

### Zainstaluj zależności:
```
npm install
```

### Uruchom serwer deweloperski:
```
npm run dev
```

Otwórz aplikację w przeglądarce pod adresem wskazanym w terminalu (zazwyczaj http://localhost:5173).

## Sprawdzanie kodu
| Polecenie | Opis |
|---|---|
| `npm test` | testy jednostkowe i komponentów (Vitest) |
| `npm run test:watch` | testy uruchamiane ponownie po każdej zmianie |
| `npm run lint` | sprawdzenie kodu (ESLint) |
| `npm run format` | formatowanie kodu (Prettier) |
| `npm run type-check` | sprawdzenie typów (vue-tsc) |
| `npm run build` | sprawdzenie typów i zbudowanie aplikacji do `dist/` |

Te same kroki uruchamia CI przy każdym pushu do `main`; aplikacja jest wdrażana na GitHub Pages dopiero, gdy wszystkie przejdą.
