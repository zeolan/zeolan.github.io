(function () {
  document.addEventListener("DOMContentLoaded", function () {
    document
      .getElementById("toggle-ro")
      .addEventListener("change", function () {
        var opacity = this.checked ? "1" : "0";
        document.querySelectorAll(".col-ro").forEach(function (cell) {
          cell.style.opacity = opacity;
        });
      });
    document
      .getElementById("toggle-ua")
      .addEventListener("change", function () {
        var opacity = this.checked ? "1" : "0";
        document.querySelectorAll(".col-ua").forEach(function (cell) {
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
    document.querySelectorAll(".col-ua").forEach(function (cell) {
      cell.style.opacity = "1";
      cell.addEventListener("click", function () {
        var opacity = this.style.opacity == "1" ? "0" : "1";
        this.style.opacity = opacity;
      });
    });
  });
})();
