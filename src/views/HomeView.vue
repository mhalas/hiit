<template>
  <div class="home">
    <!-- Nagłówek główny -->
    <header class="home-header">
      <RouterLink to="/" class="brand">
        <span class="brand__mark" aria-hidden="true">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.6"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <polyline points="2 12 6 12 9 4 15 20 18 12 22 12"></polyline>
          </svg>
        </span>
        <span class="brand__name display">WorkoutTimer</span>
      </RouterLink>
      <RouterLink to="/configurator" class="home-header__link">Konfigurator</RouterLink>
    </header>

    <section class="hero">
      <span class="badge">Interwałowy asystent</span>
      <h1 class="hero__title display">HIIT i Tabata pod pełną kontrolą</h1>
      <p class="hero__text">
        Ułóż ćwiczenia, serie i przerwy. Timer poprowadzi Cię dźwiękiem i obrazem — bez zakładania
        konta.
      </p>
      <RouterLink to="/configurator" class="btn-primary hero__cta">
        <span>Stwórz własny trening</span>
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2.6"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <line x1="5" y1="12" x2="19" y2="12"></line>
          <polyline points="12 5 19 12 12 19"></polyline>
        </svg>
      </RouterLink>
      <p class="hero__note">
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2.2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M9 15l6-6"></path>
          <path d="M11 6l1-1a4 4 0 0 1 6 6l-1 1"></path>
          <path d="M13 18l-1 1a4 4 0 0 1-6-6l1-1"></path>
        </svg>
        Cały plan zapisuje się w linku.
      </p>
    </section>

    <!-- Sekcja informacyjna -->
    <section class="steps">
      <h2 class="section-heading display">Jak to działa</h2>
      <ol class="steps__list">
        <li class="card step">
          <span class="step__number display" aria-hidden="true">01</span>
          <div>
            <h3 class="step__title">Skonfiguruj ćwiczenia</h3>
            <p class="step__text">
              Wpisz nazwy, czas trwania fazy pracy oraz odpoczynku dla każdego ruchu.
            </p>
          </div>
        </li>
        <li class="card step">
          <span class="step__number display" aria-hidden="true">02</span>
          <div>
            <h3 class="step__title">Ustaw serie</h3>
            <p class="step__text">Określ liczbę obwodów oraz czas przerwy między nimi.</p>
          </div>
        </li>
        <li class="card step">
          <span class="step__number display" aria-hidden="true">03</span>
          <div>
            <h3 class="step__title">Uruchom timer</h3>
            <p class="step__text">
              Kliknij start i skup się wyłącznie na wysiłku – aplikacja poprowadzi Cię dźwiękiem i
              obrazem.
            </p>
          </div>
        </li>
      </ol>
    </section>

    <section class="info">
      <div class="card info-card">
        <h2 class="info-card__title display">Czym jest HIIT?</h2>
        <p>
          <strong>High-Intensity Interval Training</strong> to metoda polegająca na przeplataniu
          krótkich okresów maksymalnego wysiłku z momentami krótkiego odpoczynku. Pozwala spalić
          mnóstwo kalorii, podkręcić metabolizm i zbudować kondycję w rekordowo krótkim czasie.
        </p>
      </div>

      <div class="card info-card highlight-card">
        <h2 class="info-card__title display">Jak zapisać plan na stałe?</h2>
        <p>
          Nasza aplikacja nie wymaga zakładania konta. Gdy tylko skonfigurujesz swój idealny
          trening, <strong>adres URL w pasku przeglądarki automatycznie zaktualizuje się</strong>,
          kodując cały Twój plan.
        </p>
        <p class="tip">
          Wystarczy, że dodasz tę stronę do zakładek (np. skrótem <kbd>Ctrl + D</kbd> /
          <kbd>Cmd + D</kbd>) lub skopiujesz link, aby mieć do niego dostęp w dowolnym momencie.
        </p>
      </div>
    </section>

    <!-- Stopka -->
    <footer class="home-cta">
      <p class="home-cta__text display">Gotowy? Czas zacząć.</p>
      <RouterLink to="/configurator" class="btn-secondary">Przejdź do konfiguratora</RouterLink>
    </footer>
  </div>
</template>

<style scoped>
.home {
  max-width: 720px;
  margin: 0 auto;
  padding: 0 20px 48px;
}

.home-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 0 6px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--color-text);
  text-decoration: none;
}

.brand:hover {
  color: var(--color-text);
}

.brand__mark {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: var(--color-accent);
  color: var(--color-on-accent);
  display: flex;
  align-items: center;
  justify-content: center;
}

.brand__mark svg {
  width: 20px;
  height: 20px;
}

.brand__name {
  font-size: 1.5rem;
  font-weight: 700;
  letter-spacing: 0.03em;
}

.home-header__link {
  padding: 13px 4px;
  color: var(--color-text);
  font-size: 0.9rem;
  font-weight: 600;
  text-decoration: none;
}

.hero {
  display: flex;
  flex-direction: column;
  gap: 18px;
  padding-top: 36px;
}

.hero__title {
  margin: 0;
  font-size: clamp(3.25rem, 15vw, 5rem);
  line-height: 0.92;
}

.hero__text {
  margin: 0;
  max-width: 34rem;
  font-size: 1.05rem;
  line-height: 1.55;
  color: var(--color-text-dim);
}

.hero__cta {
  margin-top: 6px;
  justify-content: space-between;
  min-height: 64px;
  font-size: 1.1rem;
}

.hero__cta svg {
  width: 24px;
  height: 24px;
}

.hero__note {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  font-size: 0.8rem;
  color: var(--color-text-dim);
}

.hero__note svg {
  width: 16px;
  height: 16px;
}

.steps {
  padding-top: 48px;
}

.section-heading {
  margin: 0 0 18px;
  font-size: 1.9rem;
}

.steps__list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.step {
  display: flex;
  gap: 16px;
  padding: 18px;
}

.step__number {
  min-width: 40px;
  font-size: 2.1rem;
  line-height: 1;
  color: var(--color-accent);
}

.step__title {
  margin: 0 0 4px;
  font-size: 1rem;
  font-weight: 700;
}

.step__text {
  margin: 0;
  font-size: 0.9rem;
  line-height: 1.5;
  color: var(--color-text-dim);
}

.info {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
  padding-top: 40px;
}

.info-card {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 22px;
}

.info-card__title {
  margin: 0;
  font-size: 1.6rem;
}

.info-card p {
  margin: 0;
  font-size: 0.9rem;
  line-height: 1.6;
  color: var(--color-text-dim);
}

.info-card strong {
  color: var(--color-text);
}

.highlight-card {
  /* border-color: rgba(255, 109, 0, 0.3); */
  /* background: linear-gradient(135deg, rgba(30, 30, 30, 1) 0%, rgba(45, 25, 10, 0.4) 100%); */
  border: 1px solid var(--color-highlight-border);
}

kbd {
  padding: 2px 7px;
  border-radius: 6px;
  background: var(--color-surface-raised);
  color: var(--color-text);
  font-family: var(--font-body);
  font-size: 0.75rem;
  font-weight: 700;
}

.home-cta {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding-top: 40px;
}

.home-cta__text {
  margin: 0;
  font-size: 1.9rem;
  text-align: center;
}

@media (min-width: 768px) {
  .info {
    grid-template-columns: repeat(2, 1fr);
  }

  .highlight-card {
    grid-column: span 2;
  }
}
</style>
