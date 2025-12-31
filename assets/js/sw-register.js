/*
  sw-register.js
  - Purpose: register the service worker so the browser can install
    and activate it for this origin. This script is intentionally
    small and safe: it only attempts registration on supported
    browsers and logs success/failure for debugging.

  Behavior:
  - Waits for the `load` event to avoid racing with critical resource
    downloads and to ensure the page is stable when registration runs.
  - Registers `/sw.js` at the site root; the scope will default to
    the origin root which is appropriate for a global app shell.
  - Logs registration result for debugging; failures are non-fatal.

  Optional improvements (not implemented here):
  - Notify the service worker to `skipWaiting()` and prompt users to
    reload when a new worker becomes active.
  - Add analytics/error reporting for registration failures.
*/
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function () {
    navigator.serviceWorker.register('/sw.js')
      .then(function (reg) { console.debug('Service worker registered.', reg); })
      .catch(function (err) { console.error('Service worker registration failed:', err); });
  });
}
