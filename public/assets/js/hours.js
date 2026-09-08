/* hours.js — highlights today's row in any opening-hours list and works out
   whether the shop is open right now. Used by the Visit page and the footer.

   The opening times live here once. If they change, change them here and in
   the <li> markup and the structured data on the Visit page. */
(function () {
  "use strict";

  /* Indexed by JavaScript's day number: 0 = Sunday. Minutes past midnight. */
  var WEEK = [
    null,                    /* Sunday    — closed */
    null,                    /* Monday    — closed */
    [17 * 60, 21 * 60],      /* Tuesday   5:00pm – 9:00pm */
    [8 * 60 + 30, 17 * 60],  /* Wednesday 8:30am – 5:00pm */
    [8 * 60 + 30, 17 * 60],  /* Thursday  8:30am – 5:00pm */
    [8 * 60 + 30, 17 * 60],  /* Friday    8:30am – 5:00pm */
    [8 * 60 + 30, 12 * 60]   /* Saturday  8:30am – 12:00pm */
  ];

  var now = new Date();
  var day = now.getDay();
  var minutes = now.getHours() * 60 + now.getMinutes();

  /* Mark today's row wherever an hours list appears on the page. */
  var rows = document.querySelectorAll("[data-day]");
  for (var i = 0; i < rows.length; i++) {
    if (Number(rows[i].getAttribute("data-day")) === day) {
      rows[i].classList.add("today");
    }
  }

  /* The open/closed pill on the Visit page. */
  var pill = document.getElementById("openNow");
  if (!pill) return;

  var today = WEEK[day];
  var open = today !== null && minutes >= today[0] && minutes < today[1];

  if (open) {
    pill.textContent = "Open now";
    return;
  }

  /* Closed — say when we next open, which is more use than just "closed". */
  var names = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  for (var step = 0; step < 8; step++) {
    var d = (day + step) % 7;
    var slot = WEEK[d];
    if (!slot) continue;
    /* Later the same day still counts as next. */
    if (step === 0 && minutes >= slot[0]) continue;
    var h = Math.floor(slot[0] / 60);
    var m = slot[0] % 60;
    var label = (h > 12 ? h - 12 : h) + (m ? ":" + (m < 10 ? "0" + m : m) : "") + (h < 12 ? "am" : "pm");
    pill.textContent = "Closed — opens " +
      (step === 0 ? "today" : step === 1 ? "tomorrow" : names[d]) + " at " + label;
    return;
  }
  pill.textContent = "Closed";
})();
