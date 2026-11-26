import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import { createMemoryHistory, createRouter } from 'vue-router';
import HomeView from '@/views/HomeView.vue';
import { routes } from '@/router';

async function mountHome() {
  const router = createRouter({ history: createMemoryHistory(), routes });
  await router.push('/');
  await router.isReady();
  return mount(HomeView, { global: { plugins: [router] } });
}

describe('HomeView', () => {
  it('links both buttons to the configurator as real links', async () => {
    const wrapper = await mountHome();
    const links = wrapper.findAll('a.btn-primary, a.btn-secondary');

    expect(links).toHaveLength(2);
    for (const link of links) {
      expect(link.attributes('href')).toBe('/configurator');
    }
  });

  it('has no buttons that only navigate', async () => {
    const wrapper = await mountHome();

    expect(wrapper.findAll('button')).toHaveLength(0);
  });
});
