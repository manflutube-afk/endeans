/* nav.js — the mobile menu button. Loaded on every page with defer.
   The links themselves are ordinary <a href> elements, so navigation
   works with JavaScript switched off; this only handles the burger. */
(function () {
  "use strict";
  var burger = document.getElementById("burger");
  var links = document.getElementById("navlinks");
  if (!burger || !links) return;

  function setOpen(open) {
    document.body.classList.toggle("menu", open);
    burger.setAttribute("aria-expanded", open ? "true" : "false");
  }

  burger.setAttribute("aria-expanded", "false");
  burger.addEventListener("click", function () {
    setOpen(!document.body.classList.contains("menu"));
  });

  /* Escape closes it, and focus goes back to the button. */
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && document.body.classList.contains("menu")) {
      setOpen(false);
      burger.focus();
    }
  });

  /* Tapping anywhere outside the panel closes it too. */
  document.addEventListener("click", function (e) {
    if (!document.body.classList.contains("menu")) return;
    if (links.contains(e.target) || burger.contains(e.target)) return;
    setOpen(false);
  });

  /* If the viewport grows past the mobile breakpoint the panel is no
     longer a panel, so drop the state rather than leave it stuck open. */
  window.matchMedia("(min-width: 861px)").addEventListener("change", function (m) {
    if (m.matches) setOpen(false);
  });
})();
