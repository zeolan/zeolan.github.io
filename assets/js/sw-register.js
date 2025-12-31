if ('serviceWorker' in navigator) {
  window.addEventListener('load', function () {
    navigator.serviceWorker.register('/sw.js')
      .then(function (reg) { console.log('Service worker registered.', reg); })
      .catch(function (err) { console.error('Service worker registration failed:', err); });
  });
}
