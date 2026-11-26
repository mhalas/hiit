import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils';
import ShareButton from '@/components/ShareButton.vue';
import { COPIED_MESSAGE_MS } from '@/composables/useShare';

const URL = 'https://example.test/hiit/configurator?data=2~Plan~1~0~Pompki.20.10';

let wrapper: VueWrapper;

const setNavigator = (key: 'share' | 'clipboard', value: unknown) =>
  Object.defineProperty(navigator, key, { configurable: true, value });

const mountButton = (props: Record<string, unknown> = {}) => {
  wrapper = mount(ShareButton, {
    props: { title: 'Plan', getUrl: () => URL, ...props },
  });
  return wrapper;
};

const click = async () => {
  await wrapper.get('.share-button').trigger('click');
  await flushPromises();
};

beforeEach(() => {
  setNavigator('share', undefined);
  setNavigator('clipboard', undefined);
});

afterEach(() => {
  wrapper?.unmount();
  vi.useRealTimers();
  Reflect.deleteProperty(navigator, 'share');
  Reflect.deleteProperty(navigator, 'clipboard');
});

describe('ShareButton – phone share menu', () => {
  it('opens the system share menu with the title and link', async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    const writeText = vi.fn();
    setNavigator('share', share);
    setNavigator('clipboard', { writeText });
    mountButton();

    await click();

    expect(share).toHaveBeenCalledWith({ title: 'Plan', url: URL });
    expect(writeText).not.toHaveBeenCalled();
    expect(wrapper.get('.share-message').text()).toBe('');
  });

  it('does nothing more when the user closes the share menu', async () => {
    setNavigator('share', vi.fn().mockRejectedValue(new DOMException('cancelled', 'AbortError')));
    const writeText = vi.fn();
    setNavigator('clipboard', { writeText });
    mountButton();

    await click();

    expect(writeText).not.toHaveBeenCalled();
    expect(wrapper.find('.share-fallback').exists()).toBe(false);
  });

  it('copies the link instead when the share menu fails', async () => {
    setNavigator('share', vi.fn().mockRejectedValue(new DOMException('no', 'NotAllowedError')));
    const writeText = vi.fn().mockResolvedValue(undefined);
    setNavigator('clipboard', { writeText });
    mountButton();

    await click();

    expect(writeText).toHaveBeenCalledWith(URL);
    expect(wrapper.get('.share-message').text()).toBe('Link skopiowany do schowka');
  });
});

describe('ShareButton – computer without a share menu', () => {
  it('copies the link and confirms it for a few seconds', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    const writeText = vi.fn().mockResolvedValue(undefined);
    setNavigator('clipboard', { writeText });
    mountButton();

    await click();

    expect(writeText).toHaveBeenCalledWith(URL);
    expect(wrapper.get('.share-message').text()).toBe('Link skopiowany do schowka');
    expect(wrapper.get('.share-message').attributes('aria-live')).toBe('polite');

    vi.advanceTimersByTime(COPIED_MESSAGE_MS);
    await flushPromises();
    expect(wrapper.get('.share-message').text()).toBe('');
  });

  it('shows the link to copy by hand when copying is blocked', async () => {
    setNavigator('clipboard', { writeText: vi.fn().mockRejectedValue(new Error('denied')) });
    mountButton();

    await click();

    const input = wrapper.get('.share-fallback input');
    expect((input.element as HTMLInputElement).value).toBe(URL);
    expect(input.attributes('readonly')).toBeDefined();
    expect(wrapper.get(`label[for="${input.attributes('id')}"]`).text()).toContain(
      'skopiuj link ręcznie',
    );

    await wrapper.get('.share-fallback [aria-label="Zamknij"]').trigger('click');
    expect(wrapper.find('.share-fallback').exists()).toBe(false);
  });

  it('shows the link to copy by hand when there is no clipboard at all', async () => {
    mountButton();

    await click();

    expect((wrapper.get('.share-fallback input').element as HTMLInputElement).value).toBe(URL);
  });
});

describe('ShareButton – state', () => {
  it('waits for the link before sharing', async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    setNavigator('share', share);
    mountButton({ getUrl: () => Promise.resolve(`${URL}-later`) });

    await click();

    expect(share).toHaveBeenCalledWith({ title: 'Plan', url: `${URL}-later` });
  });

  it('can be disabled', () => {
    mountButton({ disabled: true });

    expect(wrapper.get('.share-button').attributes('disabled')).toBeDefined();
  });
});
