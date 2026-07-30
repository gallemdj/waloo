/**
 * Google Analytics 4 — deferred load (idle / first interaction) for performance.
 * Measurement ID: G-LM2FSBN9Z1
 */
(function () {
  "use strict";

  var GA_ID = "G-LM2FSBN9Z1";
  var loaded = false;
  var scheduled = false;

  function trackPage() {
    if (!window.gtag) return;
    window.gtag("event", "page_view", {
      page_title: document.title,
      page_location: window.location.href,
      page_path: window.location.pathname + window.location.search,
    });
  }

  function loadGA() {
    if (loaded || !GA_ID) return;
    loaded = true;

    var script = document.createElement("script");
    script.async = true;
    script.src = "https://www.googletagmanager.com/gtag/js?id=" + GA_ID;
    document.head.appendChild(script);

    window.dataLayer = window.dataLayer || [];
    window.gtag = function () {
      window.dataLayer.push(arguments);
    };
    window.gtag("js", new Date());
    window.gtag("config", GA_ID, { send_page_view: false });
    trackPage();
  }

  function scheduleGA() {
    if (scheduled || loaded) return;
    scheduled = true;

    function onReady() {
      if ("requestIdleCallback" in window) {
        requestIdleCallback(
          function () {
            loadGA();
          },
          { timeout: 8000 },
        );
      } else {
        setTimeout(loadGA, 4000);
      }
    }

    if (document.readyState === "complete") {
      onReady();
    } else {
      window.addEventListener("load", onReady, { once: true });
    }
  }

  function onInteraction() {
    loadGA();
    window.removeEventListener("scroll", onInteraction, { capture: true });
    window.removeEventListener("pointerdown", onInteraction, { capture: true });
    window.removeEventListener("keydown", onInteraction, { capture: true });
  }

  scheduleGA();
  window.addEventListener("scroll", onInteraction, { once: true, passive: true, capture: true });
  window.addEventListener("pointerdown", onInteraction, { once: true, capture: true });
  window.addEventListener("keydown", onInteraction, { once: true, capture: true });

  document.addEventListener("astro:page-load", function () {
    if (loaded) trackPage();
  });
})();
