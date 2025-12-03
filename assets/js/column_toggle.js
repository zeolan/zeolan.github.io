(function () {
  document.addEventListener("DOMContentLoaded", function () {
    var toggleRo = document.getElementById("toggle-ro");
    var toggleUa = document.getElementById("toggle-ua");

    function setOpacity(selector, opacity) {
      document.querySelectorAll(selector).forEach(function (cell) {
        cell.style.opacity = opacity;
      });
    }

    // initialize opacities from current checkbox state
    if (toggleRo) setOpacity('.col-ro', toggleRo.checked ? '1' : '0');
    if (toggleUa) setOpacity('.col-ru, .col-ua', toggleUa.checked ? '1' : '0');

    // Use event delegation for checkbox changes so handlers survive DOM replacements
    document.addEventListener('change', function (e) {
      var t = e.target;
      if (!t) return;
      if (t.id === 'toggle-ro') {
        e.stopPropagation();
        e.preventDefault();
        setOpacity('.col-ro', t.checked ? '1' : '0');
      } else if (t.id === 'toggle-ua') {
        e.stopPropagation();
        e.preventDefault();
        setOpacity('.col-ru, .col-ua', t.checked ? '1' : '0');
      }
    });

    // Attach click toggles on cells (ignore clicks that originate from inputs or the toggle UI)
    document.querySelectorAll('.col-ro, .col-ru, .col-ua').forEach(function (cell) {
      if (!cell.style.opacity) cell.style.opacity = '1';
      cell.addEventListener('click', function (e) {
        if (!e) return;
        if (e.target && (e.target.tagName === 'INPUT' || e.target.closest('input'))) return;
        if (e.target && e.target.closest && e.target.closest('.table-column-toggle')) return;
        var opacity = this.style.opacity == '1' ? '0' : '1';
        this.style.opacity = opacity;
      });
    });
  });
})();
