<script setup lang="ts">
import { useRouter } from 'vue-router';

const router = useRouter();
const goToConfigurator = () => router.push('/configurator');
</script>

<template>
  <div class="home-container">
    <!-- Nagłówek główny -->
    <header class="hero">
      <span class="badge">Interwałowy Asystent</span>
      <h1>WorkoutTimer</h1>
      <p class="subtitle">Przejmij pełną kontrolę nad swoimi treningami HIIT i Tabata w nowoczesny i minimalistyczny sposób.</p>
      
      <button class="btn-primary" @click="goToConfigurator()">
        Stwórz własny trening
      </button>
    </header>

    <div class="divider"></div>

    <!-- Sekcja informacyjna -->
    <section class="info-section">
      <div class="info-card">
        <h2>🔥 Czym jest HIIT?</h2>
        <p>
          <strong>High-Intensity Interval Training</strong> to metoda polegająca na przeplataniu krótkich okresów maksymalnego wysiłku z momentami krótkiego odpoczynku. Pozwala spalić mnóstwo kalorii, podkręcić metabolizm i zbudować kondycję w rekordowo krótkim czasie.
        </p>
      </div>

      <div class="info-card">
        <h2>⚡ Jak stworzyć swój plan?</h2>
        <ol class="steps-list">
          <li><strong>Skonfiguruj ćwiczenia:</strong> Wpisz nazwy, czas trwania fazy pracy oraz odpoczynku dla każdego ruchu.</li>
          <li><strong>Ustaw serie:</strong> Określ liczbę obwodów oraz czas przerwy między nimi.</li>
          <li><strong>Uruchom timer:</strong> Kliknij start i skup się wyłącznie na wysiłku – aplikacja poprowadzi Cię dźwiękiem i obrazem.</li>
        </ol>
      </div>

      <div class="info-card highlight-card">
        <h2>🔖 Jak zapisać plan na stałe?</h2>
        <p>
          Nasza aplikacja nie wymaga zakładania konta. Gdy tylko skonfigurujesz swój idealny trening, <strong>adres URL w pasku przeglądarki automatycznie zaktualizuje się</strong>, kodując cały Twój plan.
        </p>
        <p class="tip">
          💡 Wystarczy, że dodasz tę stronę do zakładek przeglądarki (np. skrótem <kbd>Ctrl + D</kbd> / <kbd>Cmd + D</kbd>) lub skopiujesz link, aby mieć do niego dostęp w dowolnym momencie!
        </p>
      </div>
    </section>

    <!-- Stopka -->
    <footer class="footer">
      <p>Gotowy na trening? Czas zacząć.</p>
      <button class="btn-secondary" @click="goToConfigurator()">
        Przejdź do konfiguratora
      </button>
    </footer>
  </div>
</template>

<style scoped>
.home-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 4rem 1.5rem;
  color: var(--text, #e0e0e0);
}

.hero {
  text-align: center;
  margin-bottom: 3rem;
}

.badge {
  display: inline-block;
  padding: 0.35rem 0.85rem;
  font-size: 0.85rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  background: rgba(255, 109, 0, 0.15);
  color: var(--accent, #ff6d00);
  border-radius: 50px;
  margin-bottom: 1rem;
}

.hero h1 {
  font-size: 3.5rem;
  font-weight: 800;
  margin: 0 0 1rem 0;
  letter-spacing: -0.02em;
}

.subtitle {
  font-size: 1.2rem;
  color: var(--text-dim, #a0a0a0);
  max-width: 600px;
  margin: 0 auto 2rem auto;
  line-height: 1.5;
}

.divider {
  height: 1px;
  background: rgba(255, 255, 255, 0.08);
  margin: 3rem 0;
}

.info-section {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
}

.info-card {
  background: var(--card, #1e1e1e);
  padding: 2rem;
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.04);
}

.info-card h2 {
  font-size: 1.4rem;
  margin-top: 0;
  margin-bottom: 1rem;
  color: #fff;
}

.info-card p {
  color: var(--text-dim, #a0a0a0);
  line-height: 1.6;
  margin: 0;
}

.steps-list {
  margin: 0;
  padding-left: 1.25rem;
  color: var(--text-dim, #a0a0a0);
  line-height: 1.6;
}

.steps-list li {
  margin-bottom: 0.75rem;
}

.steps-list li:last-child {
  margin-bottom: 0;
}

.steps-list strong {
  color: var(--text, #e0e0e0);
}

.highlight-card {
  /* border-color: rgba(255, 109, 0, 0.3); */
  /* background: linear-gradient(135deg, rgba(30, 30, 30, 1) 0%, rgba(45, 25, 10, 0.4) 100%); */
}

.tip {
  margin-top: 1rem !important;
  font-size: 0.95rem;
}

kbd {
  background: rgba(255, 255, 255, 0.1);
  padding: 0.2rem 0.4rem;
  border-radius: 4px;
  font-family: monospace;
  font-size: 0.9em;
  color: #fff;
}

.footer {
  text-align: center;
  margin-top: 4rem;
  padding: 2rem;
}

.footer p {
  color: var(--text-dim, #a0a0a0);
  margin-bottom: 1.5rem;
  font-size: 1.1rem;
}

.btn-primary, .btn-secondary {
  padding: 1rem 2.5rem;
  font-size: 1.1rem;
  font-weight: 600;
  border-radius: 50px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-primary {
  background: var(--accent, #ff6d00);
  color: white;
  border: none;
}

.btn-primary:hover {
  filter: brightness(1.15);
  transform: translateY(-2px);
}

.btn-secondary {
  background: transparent;
  color: var(--text, #e0e0e0);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.4);
}

@media (min-width: 768px) {
  .info-section {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .highlight-card {
    grid-column: span 2;
  }
}
</style>