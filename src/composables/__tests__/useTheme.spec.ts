import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { initTheme, THEME_STORAGE_KEY, useTheme } from '@/composables/useTheme';
import { defaultTheme, findTheme, themes } from '@/themes';
import type { ThemeId } from '@/types/theme';

beforeEach(() => {
  localStorage.clear();
  delete document.documentElement.dataset.theme;
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('theme registry', () => {
  it('has Puls as the default and only style for now', () => {
    expect(defaultTheme.id).toBe('pulse');
    expect(themes.map((theme) => theme.id)).toEqual(['pulse']);
  });

  it('gives every style a name, three swatches and a timer face', () => {
    for (const theme of themes) {
      expect(theme.name).toBeTruthy();
      expect(theme.swatches).toHaveLength(3);
      expect(theme.timerFace).toBeTruthy();
    }
  });

  it('finds styles by id and ignores unknown ids', () => {
    expect(findTheme('pulse')).toBe(defaultTheme);
    expect(findTheme('neon')).toBeUndefined();
    expect(findTheme(null)).toBeUndefined();
  });
});

describe('useTheme', () => {
  it('applies the default style to the page on start', () => {
    initTheme();

    expect(document.documentElement.dataset.theme).toBe('pulse');
    expect(useTheme().theme.value.id).toBe('pulse');
  });

  it('falls back to the default for an unknown stored style', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'removed-style');

    initTheme();

    expect(useTheme().theme.value.id).toBe('pulse');
  });

  it('still works when the browser blocks storage', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });

    initTheme();
    useTheme().setTheme('pulse');

    expect(document.documentElement.dataset.theme).toBe('pulse');
  });

  it('remembers the chosen style', () => {
    useTheme().setTheme('pulse');

    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('pulse');
    expect(document.documentElement.dataset.theme).toBe('pulse');
  });

  it('ignores a style that does not exist', () => {
    initTheme();

    useTheme().setTheme('neon' as ThemeId);

    expect(useTheme().theme.value.id).toBe('pulse');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBeNull();
  });

  it('hides the style choice while there is only one style', () => {
    expect(useTheme().hasThemeChoice).toBe(false);
  });
});
