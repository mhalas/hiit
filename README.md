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

* Responsywność: W pełni dostosowana do wygodnego korzystania na ekranach smartfonów.

## Technologie
* Vue 3 (Composition API, <script setup>)

* TypeScript

* Vue Router

* CSS3 / SVG (Płynne animacje i minimalistyczny dark mode)

## Uruchomienie projektu lokalnie
### Sklonuj repozytorium:
```
git clone
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
