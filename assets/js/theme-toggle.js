(function() {
  const toggle = document.getElementById("theme-toggle");
  const stored = localStorage.getItem("theme");

  if (stored) {
    document.documentElement.setAttribute("data-theme", stored);
    //updateIconVisibility(stored);
  }

  toggle.addEventListener("click", () => {
    const current = document.documentElement.getAttribute("data-theme");
    const next = current === "dark" ? "light" : "dark";

    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("theme", next);
    //updateIconVisibility(next);
  });

  function updateIconVisibility(theme) {
    const moonIcons = document.querySelectorAll(".moon-icon");
    const sunIcons = document.querySelectorAll(".sun-icon");
    
    if (theme === "dark") {
      moonIcons.forEach(el => el.style.display = "none");
      sunIcons.forEach(el => el.style.display = "stroke");
    } else {
      moonIcons.forEach(el => el.style.display = "stroke");
      sunIcons.forEach(el => el.style.display = "none");
    }
  }
})();
