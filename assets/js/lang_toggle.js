(function () {
  "use strict";

  const STORAGE_KEY = "siteLang";
  const LANG_UA = "UA";
  const LANG_RU = "RU";

  function safeGetStorage(key) {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      return null;
    }
  }

  function safeSetStorage(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      /* ignore storage errors (e.g. private mode) */
    }
  }

  function normalizeLang(value) {
    if (!value) return null;
    value = String(value).trim().toUpperCase();
    return value === LANG_RU ? LANG_RU : LANG_UA;
  }

  function toggle(current) {
    return current === LANG_RU ? LANG_UA : LANG_RU;
  }

  function updateUi(toggleEl, lang) {
    // update toggle label
    if (toggleEl) toggleEl.textContent = lang;

    // set an explicit data attribute / class on root for CSS-based switching
    document.documentElement.setAttribute("data-site-lang", lang);

    const uaCells = document.querySelectorAll(".col-ua");
    const ruCells = document.querySelectorAll(".col-ru");

    if (lang === LANG_UA) {
      uaCells.forEach((c) => {
        c.style.display = "table-cell";
      });
      ruCells.forEach((c) => {
        c.style.display = "none";
      });
    } else {
      ruCells.forEach((c) => {
        c.style.display = "table-cell";
      });
      uaCells.forEach((c) => {
        c.style.display = "none";
      });
    }
  }

  function setLang(toggleEl, lang) {
    lang = normalizeLang(lang) || LANG_UA;
    updateUi(toggleEl, lang);
    safeSetStorage(STORAGE_KEY, lang);
  }

  document.addEventListener("DOMContentLoaded", function () {
    const toggleEl = document.getElementById("site-header-lang-label");
    if (!toggleEl) return;
    toggleEl.addEventListener("click", function () {
      const currentLang = normalizeLang(toggleEl.textContent);
      const nextLang = toggle(currentLang);
      setLang(toggleEl, nextLang);
      //updateUi(toggleEl, nextLang);
    });
  });

  const toggleEl = document.getElementById("site-header-lang-label");
  if (!toggleEl) return;
  const storedLang = normalizeLang(safeGetStorage(STORAGE_KEY));
  setLang(toggleEl, storedLang);
})();
