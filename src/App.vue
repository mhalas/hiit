<script setup lang="ts">
import { useRoute } from 'vue-router';
import ThemePicker from '@/components/ThemePicker.vue';
import { useTheme } from '@/composables/useTheme';

const route = useRoute();
const { theme, themes, hasThemeChoice, setTheme } = useTheme();
</script>

<template>
  <div class="app-layout">
    <main class="content">
      <router-view />
    </main>

    <footer v-if="!route.meta.hideFooter" class="global-footer">
      <p>&copy; 2026 WorkoutTimer. Stworzony dla pasjonatów HIIT.</p>
      <ThemePicker
        v-if="hasThemeChoice"
        :themes="themes"
        :model-value="theme.id"
        @update:model-value="setTheme"
      />
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
  min-height: 100dvh;
  width: 100%;
}

.content {
  flex: 1; /* Wypycha stopkę na sam dół, jeśli treści jest mało */
}

.global-footer {
  width: 100%;
  max-width: 720px;
  margin: 0 auto;
  border-top: 1px solid var(--color-border);
  padding: 24px 20px 32px;
  color: var(--color-text-dim);
  font-size: 0.85rem;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.global-footer p {
  margin: 0;
}

.footer-links {
  display: flex;
  gap: 1.5rem;
}

.footer-links a {
  padding: 12px 0;
  font-weight: 600;
  text-decoration: none;
}
</style>
