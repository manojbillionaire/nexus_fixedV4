import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';

// ─── Service Worker Cleanup ───────────────────────────────────────────────────
// We do NOT use a caching service worker. This block:
//  1. Registers the self-destruct sw.js (which wipes all old caches)
//  2. Listens for SW_SELF_DESTRUCT message → unregisters ALL SWs → reloads once
//  3. Also eagerly unregisters any existing SWs on every page load
if ('serviceWorker' in navigator) {
  // Listen for self-destruct signal from sw.js
  navigator.serviceWorker.addEventListener('message', async (e) => {
    if (e.data?.type === 'SW_SELF_DESTRUCT') {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map(r => r.unregister()));
      // Reload once (only if not already reloading)
      if (!sessionStorage.getItem('_sw_cleaned')) {
        sessionStorage.setItem('_sw_cleaned', '1');
        window.location.reload();
      }
    }
  });

  window.addEventListener('load', async () => {
    try {
      // Register the self-destruct SW to clean up old caches
      await navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' });
    } catch {}

    // Also unregister all SWs directly — belt and suspenders
    try {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map(r => r.unregister()));
    } catch {}

    // Clear the reload guard after 10s so it works again on next deploy
    setTimeout(() => sessionStorage.removeItem('_sw_cleaned'), 10000);
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
