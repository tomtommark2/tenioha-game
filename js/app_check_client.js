// Public reCAPTCHA Enterprise site key; fill only after Firebase registration.
// An empty key keeps the current app working during the observation rollout.
(() => {
    const SITE_KEY = '';
    window.createTeniohaAppCheckClient = function ({ siteKey, localDevelopment = false,
        loadSdk = () => import('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-check.js'), timeoutMs = 1000 }) {
        let ready = null;
        async function bounded(work, fallback) {
            let timer;
            try {
                return await Promise.race([work, new Promise(resolve => { timer = setTimeout(() => resolve(fallback), timeoutMs); })]);
            } catch { return fallback; }
            finally { clearTimeout(timer); }
        }
        return {
            async initialize(app) {
                if (!siteKey || localDevelopment) return false;
                if (!ready) ready = Promise.resolve().then(loadSdk).then(sdk => ({ sdk, instance: sdk.initializeAppCheck(app, {
                    provider: new sdk.ReCaptchaEnterpriseProvider(siteKey), isTokenAutoRefreshEnabled: true
                }) })).catch(() => null);
                return Boolean(await bounded(ready, null));
            },
            async headers() {
                if (!ready) return {};
                return bounded(ready.then(async state => {
                    if (!state) return {};
                    const result = await state.sdk.getToken(state.instance, false);
                    return typeof result?.token === 'string' && result.token.length > 0 && result.token.length <= 8192
                        ? { 'X-Firebase-AppCheck': result.token } : {};
                }), {});
            }
        };
    };
    window.teniohaAppCheckClient = window.createTeniohaAppCheckClient({ siteKey: SITE_KEY,
        localDevelopment: ['localhost', '127.0.0.1'].includes(window.location.hostname) });
})();
