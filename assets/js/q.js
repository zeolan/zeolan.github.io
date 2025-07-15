(function () {
  "use strict";

  function handleDOMContentLoaded() {
    console.log(window.location.search);
  }

  document.addEventListener("DOMContentLoaded", handleDOMContentLoaded);
})();
