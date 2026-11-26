import { onScopeDispose, ref } from 'vue';

export type ShareResult = 'shared' | 'copied' | 'cancelled' | 'failed';
export type ShareStatus = 'idle' | 'copied' | 'failed';

export const COPIED_MESSAGE_MS = 3000;

const isAbort = (error: unknown) => error instanceof DOMException && error.name === 'AbortError';

export function useShare() {
  const status = ref<ShareStatus>('idle');
  const sharedUrl = ref('');
  let hideTimer: ReturnType<typeof setTimeout> | null = null;

  const cancelHide = () => {
    if (hideTimer !== null) {
      clearTimeout(hideTimer);
      hideTimer = null;
    }
  };

  const setStatus = (next: ShareStatus) => {
    cancelHide();
    status.value = next;
    if (next === 'copied') {
      hideTimer = setTimeout(() => {
        status.value = 'idle';
        hideTimer = null;
      }, COPIED_MESSAGE_MS);
    }
  };

  const share = async (data: { title: string; url: string }): Promise<ShareResult> => {
    sharedUrl.value = data.url;

    if (typeof navigator.share === 'function') {
      try {
        await navigator.share(data);
        setStatus('idle');
        return 'shared';
      } catch (error) {
        if (isAbort(error)) {
          return 'cancelled';
        }
      }
    }

    try {
      await navigator.clipboard.writeText(data.url);
      setStatus('copied');
      return 'copied';
    } catch {
      setStatus('failed');
      return 'failed';
    }
  };

  onScopeDispose(cancelHide);

  return { status, sharedUrl, share, dismiss: () => setStatus('idle') };
}
