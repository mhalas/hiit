import { describe, expect, it } from 'vitest';
import { createMemoryHistory, createRouter } from 'vue-router';
import { routes } from '@/router';

const createTestRouter = () => createRouter({ history: createMemoryHistory(), routes });

describe('router', () => {
  it.each([
    ['/', 'home'],
    ['/configurator', 'configurator'],
    ['/timer', 'timer'],
  ])('opens %s as the "%s" page', async (path, name) => {
    const router = createTestRouter();

    await router.push(path);

    expect(router.currentRoute.value.name).toBe(name);
  });

  it.each(['/nie-ma-takiej-strony', '/timer/extra', '/configurator/a/b'])(
    'sends the unknown address %s to the home page',
    async (path) => {
      const router = createTestRouter();

      await router.push(path);

      expect(router.currentRoute.value.path).toBe('/');
      expect(router.currentRoute.value.name).toBe('home');
    },
  );

  it('keeps the workout link when opening the timer', async () => {
    const router = createTestRouter();

    await router.push({ path: '/timer', query: { data: 'abc' } });

    expect(router.currentRoute.value.query.data).toBe('abc');
  });
});
