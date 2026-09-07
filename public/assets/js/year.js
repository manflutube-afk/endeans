/* year.js — keeps the copyright year in the footer current without anyone
   having to remember to edit five HTML files every January. */
(function () {
  "use strict";
  var el = document.getElementById("year");
  if (el) el.textContent = new Date().getFullYear();
})();
