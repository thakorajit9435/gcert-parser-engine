import { BACKEND_API_URL } from '../constants';

let isWarmingUp = false;
let isAwake = false;

/**
 * Pre-warms the Render.com backend in the background so that
 * cold starts are triggered before the user opens any textbook or AI feature.
 */
export function warmUpBackend(): void {
    if (isAwake || isWarmingUp) return;
    isWarmingUp = true;

    fetch(`${BACKEND_API_URL}/`, { method: 'GET' })
        .then(res => {
            isWarmingUp = false;
            if (res.ok) {
                isAwake = true;
                console.log('[Warmup] Render backend is active & ready.');
            }
        })
        .catch(err => {
            isWarmingUp = false;
            console.log('[Warmup] Wake-up ping sent to Render backend:', err?.message);
        });
}
