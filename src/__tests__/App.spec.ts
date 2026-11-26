import { describe, expect, it } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import { createMemoryHistory, createRouter } from 'vue-router';
import App from '@/App.vue';
import { routes } from '@/router';

async function mountAppAt(path: string) {
  const router = createRouter({ history: createMemoryHistory(), routes });
  await router.push(path);
  await router.isReady();
  const wrapper = mount(App, { global: { plugins: [router] } });
  await flushPromises();
  return wrapper;
}

describe('App', () => {
  it('shows the footer on the home page and in the configurator', async () => {
    for (const path of ['/', '/configurator']) {
      const wrapper = await mountAppAt(path);
      expect(wrapper.find('.global-footer').exists()).toBe(true);
      wrapper.unmount();
    }
  });

  it('hides the footer on the full-screen timer', async () => {
    const wrapper = await mountAppAt('/timer');

    expect(wrapper.find('.global-footer').exists()).toBe(false);
    wrapper.unmount();
  });

  it('does not show a style picker while there is only one style', async () => {
    const wrapper = await mountAppAt('/');

    expect(wrapper.find('.theme-picker').exists()).toBe(false);
    wrapper.unmount();
  });
});
