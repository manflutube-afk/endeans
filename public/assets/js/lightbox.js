/* lightbox.js — full-screen photo viewer.

   It picks up every element with class .ph on the page, in document order,
   and uses the <img> inside it: data-full for the large version (falling back
   to src) and alt for the caption. Nothing needs registering by hand — add a
   photo to the markup and it joins the viewer. */
(function () {
  "use strict";

  var box = document.getElementById("lb");
  if (!box) return;

  var img = document.getElementById("lbImg");
  var cap = document.getElementById("lbCap");
  var count = document.getElementById("lbCount");
  var items = [].slice.call(document.querySelectorAll(".ph"));
  if (!items.length) return;

  var index = 0;
  var lastFocus = null;

  function show(i) {
    index = (i + items.length) % items.length;
    var source = items[index].querySelector("img");
    img.src = source.getAttribute("data-full") || source.src;
    img.alt = source.alt || "";
    cap.textContent = source.alt || "";
    count.textContent = (index + 1) + " / " + items.length;
  }

  function open(i) {
    lastFocus = document.activeElement;
    show(i);
    box.classList.add("open");
    document.body.style.overflow = "hidden";
    box.focus();
  }

  function close() {
    box.classList.remove("open");
    document.body.style.overflow = "";
    if (lastFocus) lastFocus.focus();
  }

  /* Each photo becomes a button for keyboard and screen-reader users. */
  items.forEach(function (el, i) {
    el.setAttribute("role", "button");
    el.setAttribute("tabindex", "0");
    var alt = el.querySelector("img").alt;
    if (alt) el.setAttribute("aria-label", "Open photo: " + alt);
    el.addEventListener("click", function () { open(i); });
    el.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(i); }
    });
  });

  document.getElementById("lbClose").addEventListener("click", close);
  document.getElementById("lbPrev").addEventListener("click", function () { show(index - 1); });
  document.getElementById("lbNext").addEventListener("click", function () { show(index + 1); });

  /* Clicking the dark surround closes; clicking the photo itself does not. */
  box.addEventListener("click", function (e) {
    if (e.target === box) close();
  });

  document.addEventListener("keydown", function (e) {
    if (!box.classList.contains("open")) return;
    if (e.key === "Escape") close();
    else if (e.key === "ArrowLeft") show(index - 1);
    else if (e.key === "ArrowRight") show(index + 1);
  });

  /* Swipe left and right on a touchscreen. */
  var startX = null;
  box.addEventListener("touchstart", function (e) { startX = e.touches[0].clientX; }, { passive: true });
  box.addEventListener("touchend", function (e) {
    if (startX === null) return;
    var dx = e.changedTouches[0].clientX - startX;
    if (Math.abs(dx) > 50) show(index + (dx < 0 ? 1 : -1));
    startX = null;
  }, { passive: true });
})();
