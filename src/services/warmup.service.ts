import { BACKEND_API_URL } from '../constants';

let isWarmingUp = false;
let isAwake = false;
let keepAliveInterval: any = null;

/**
 * Pre-warms the Render.com backend in the background so that
 * cold starts are triggered before the user opens any textbook or AI feature.
 */
export function warmUpBackend(force = false): void {
    if (!force && (isAwake || isWarmingUp)) return;
    isWarmingUp = true;

    // Ping root and health endpoint in parallel
    Promise.allSettled([
        fetch(`${BACKEND_API_URL}/`, { method: 'GET' }),
        fetch(`${BACKEND_API_URL}/api/v1/search/health`, { method: 'GET' }),
    ]).then(results => {
        isWarmingUp = false;
        const anySuccess = results.some(r => r.status === 'fulfilled' && r.value.ok);
        if (anySuccess) {
            isAwake = true;
            console.log('[Warmup] Render backend is active & ready.');
        }
    }).catch(err => {
        isWarmingUp = false;
        console.log('[Warmup] Wake-up ping sent to Render backend:', err?.message);
    });

    // Start background keep-alive ping every 8 minutes to prevent Render from going to sleep
    if (!keepAliveInterval) {
        keepAliveInterval = setInterval(() => {
            fetch(`${BACKEND_API_URL}/`, { method: 'GET' })
                .then(() => console.log('[Warmup] 8-min keep-alive ping sent to Render'))
                .catch(() => {});
        }, 8 * 60 * 1000); // 8 minutes
    }
}
