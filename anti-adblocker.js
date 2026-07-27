// anti-adblocker.js
(function() {
  var d = document;
  var b = d.body;
  var h = d.documentElement;

  var invisibleStyle = "pointer-events:none;height:1px;width:0;opacity:0;visibility:hidden;position:fixed;bottom:0;";

  var bait1 = d.createElement("div");
  bait1.id = "div-gpt-ad-123456789-0";
  bait1.style = invisibleStyle;

  var bait2 = d.createElement("div");
  bait2.className = "textads banner-ads banner_ads ad-unit ad-zone ad-space adsbox ads";
  bait2.style = invisibleStyle;

  var bait3 = d.createElement("ins");
  bait3.className = "adsbygoogle";
  bait3.style.display = "none";

  function blockScrollEvents(e) {
    e.preventDefault();
    e.stopPropagation();
    return false;
  }

  function lockScroll() {
    h.classList.add("adb-lock");
    window.addEventListener("wheel", blockScrollEvents, { passive: false });
    window.addEventListener("touchmove", blockScrollEvents, { passive: false });
    window.addEventListener("keydown", blockScrollEvents, { passive: false });
  }

  function detectAdBlock(callback) {
    b.appendChild(bait1);
    b.appendChild(bait2);
    b.appendChild(bait3);

    setTimeout(function() {
      var blocked = bait1.offsetHeight === 0 || bait2.offsetHeight === 0 || bait3.firstElementChild;
      bait1.remove();
      bait2.remove();
      bait3.remove();
      callback(blocked);
    }, 40);
  }

  function showPopup() {
    if (d.querySelector(".popSc")) return;
    lockScroll();

    var icon = '<svg viewBox="0 0 24 24" style="width:60px;height:60px;fill:#ff4d4d;"><path d="M12.2 9L10.2 7H13C14.1 7 15 7.9 15 9V11.8L13 9.8V9H12.2M22.1 21.5L20.8 22.8L1.9 3.9L3.2 2.6L22.1 21.5M5 9H3V11H5V9M13 14.9L11 12.9V15H13V14.9Z"/></svg>';

    var element = d.createElement("div");
    element.className = "popSc";
    element.innerHTML = '<div class="popBo">' + icon + '<h2>Bloqueador de anuncios detectado</h2><p>Estás usando un bloqueador de anuncios.</p><p>La publicidad mantiene este sitio activo.</p><p>Desactívalo para continuar.</p></div>';
    b.appendChild(element);
  }

  function init() {
    detectAdBlock(function(isBlocked) {
      if (isBlocked) showPopup();
    });
  }

  if (d.readyState === "complete" || d.readyState !== "loading") {
    init();
  } else {
    d.addEventListener("DOMContentLoaded", init);
  }
})();
