<template>
  <div class="app-layout">
    <main class="content">
      <router-view />
    </main>

    <footer class="global-footer">
      <p>&copy; 2026 WorkoutTimer. Stworzony dla pasjonatów HIIT.</p>
      <div class="footer-links">
        <router-link to="/">Start</router-link>
        <router-link to="/configurator">Konfigurator</router-link>
      </div>
    </footer>
  </div>
</template>

<style>
/* Globalny layout z klejącą się stopką (Sticky Footer) */
.app-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  width: 100%;
}

.content {
  flex: 1; /* Wypycha stopkę na sam dół, jeśli treści jest mało */
}

.global-footer {
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  padding: 1.5rem 2rem;
  text-align: center;
  color: var(--text-dim, #a0a0a0);
  font-size: 0.9rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  align-items: center;
}

.footer-links {
  display: flex;
  gap: 1.5rem;
}

.footer-links a {
  color: var(--text-dim, #a0a0a0);
  text-decoration: none;
  transition: color 0.2s;
}

.footer-links a:hover {
  color: var(--accent, #ff6d00);
}

@media (min-width: 640px) {
  .global-footer {
    flex-direction: row;
    justify-content: space-between;
    max-width: 900px;
    margin: 0 auto;
    width: 100%;
  }
}
</style>