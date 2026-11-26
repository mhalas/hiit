import { onScopeDispose } from 'vue';

export function useWakeLock() {
    let sentinel: WakeLockSentinel | null = null;
    let requesting = false;
    let wanted = false;

    const acquire = async () => {
        wanted = true;
        if (sentinel || requesting || !('wakeLock' in navigator) || document.visibilityState !== 'visible') {
            return;
        }

        requesting = true;
        try {
            const lock = await navigator.wakeLock.request('screen');
            if (!wanted) {
                await lock.release();
                return;
            }
            sentinel = lock;
            lock.addEventListener('release', () => {
                if (sentinel === lock) {
                    sentinel = null;
                }
            });
        } catch {
            sentinel = null;
        } finally {
            requesting = false;
        }
    };

    const release = () => {
        wanted = false;
        const lock = sentinel;
        sentinel = null;
        lock?.release().catch(() => {});
    };

    const onVisibilityChange = () => {
        if (wanted && document.visibilityState === 'visible') {
            void acquire();
        }
    };

    document.addEventListener('visibilitychange', onVisibilityChange);

    onScopeDispose(() => {
        release();
        document.removeEventListener('visibilitychange', onVisibilityChange);
    });

    return { acquire, release };
}
