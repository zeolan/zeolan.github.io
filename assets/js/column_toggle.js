(function () {
  document.addEventListener("DOMContentLoaded", function () {
    var toggle_ro_element = document.getElementById("toggle-ro");
    if (toggle_ro_element) {
      // Check if the element exists
      toggle_ro_element.addEventListener("change", function () {
        var opacity = this.checked ? "1" : "0";
        document.querySelectorAll(".col-ro").forEach(function (cell) {
          cell.style.opacity = opacity;
        });
      });
      document.querySelectorAll(".col-ro").forEach(function (cell) {
        cell.style.opacity = "1";
        cell.addEventListener("click", function () {
          var opacity = this.style.opacity == "1" ? "0" : "1";
          this.style.opacity = opacity;
        });
      });
    }
    var toggle_ua_element = document.getElementById("toggle-ua");
    if (toggle_ua_element) {
      document
        .getElementById("toggle-ua")
        .addEventListener("change", function () {
          var opacity = this.checked ? "1" : "0";
          document.querySelectorAll(".col-ua").forEach(function (cell) {
            cell.style.opacity = opacity;
          });
        });
      document.querySelectorAll(".col-ua").forEach(function (cell) {
        cell.style.opacity = "1";
        cell.addEventListener("click", function () {
          var opacity = this.style.opacity == "1" ? "0" : "1";
          this.style.opacity = opacity;
        });
      });
    }
  });
})();
