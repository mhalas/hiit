import { computed, ref } from 'vue';
import { defaultTheme, findTheme, themes } from '@/themes';
import type { ThemeId } from '@/types/theme';

export const THEME_STORAGE_KEY = 'hiit.theme';

const currentThemeId = ref<ThemeId>(defaultTheme.id);

const readStoredThemeId = (): ThemeId => {
  try {
    return findTheme(localStorage.getItem(THEME_STORAGE_KEY))?.id ?? defaultTheme.id;
  } catch {
    return defaultTheme.id;
  }
};

const applyTheme = (id: ThemeId) => {
  document.documentElement.dataset.theme = id;
};

export function initTheme() {
  currentThemeId.value = readStoredThemeId();
  applyTheme(currentThemeId.value);
}

export function useTheme() {
  const theme = computed(() => findTheme(currentThemeId.value) ?? defaultTheme);

  const setTheme = (id: ThemeId) => {
    const next = findTheme(id);
    if (!next) {
      return;
    }
    currentThemeId.value = next.id;
    applyTheme(next.id);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next.id);
    } catch {
      return;
    }
  };

  return { theme, themes, hasThemeChoice: themes.length > 1, setTheme };
}
