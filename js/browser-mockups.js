/**
 * Work detail — single browser frame with multiple screens (carousel).
 * Requires [data-browser-carousel] on .browser-mockups--carousel.
 * Re-inits on Astro view transitions (astro:page-load).
 */
(function () {
  "use strict";

  var SWIPE_THRESHOLD = 48;
  var AXIS_LOCK_PX = 10;
  var FADE_MS = 500;

  function initThemedCarousel(root, frame) {
    var slides = Array.prototype.slice.call(
      root.querySelectorAll(".browser-frame__slide[data-section][data-theme]")
    );
    if (!slides.length) return;

    var sectionTabs = Array.prototype.slice.call(
      root.querySelectorAll("[data-browser-section]")
    );
    var themeTabs = Array.prototype.slice.call(
      root.querySelectorAll("[data-browser-theme]")
    );
    var urlEl = frame.querySelector(".browser-frame__url");
    var reducedMotion =
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var fadeMs = reducedMotion ? 0 : FADE_MS;

    var section = sectionTabs.length
      ? sectionTabs[0].getAttribute("data-browser-section") || "0"
      : slides[0].getAttribute("data-section") || "0";
    var theme = "light";
    var fading = false;

    function findSlide(sec, th) {
      for (var i = 0; i < slides.length; i++) {
        if (
          slides[i].getAttribute("data-section") === String(sec) &&
          slides[i].getAttribute("data-theme") === th
        ) {
          return slides[i];
        }
      }
      return null;
    }

    function resolveTheme(sec, th) {
      if (findSlide(sec, th)) return th;
      if (findSlide(sec, "light")) return "light";
      if (findSlide(sec, "dark")) return "dark";
      return th;
    }

    function syncChrome() {
      sectionTabs.forEach(function (tab) {
        var on = tab.getAttribute("data-browser-section") === String(section);
        tab.classList.toggle("is-active", on);
        tab.setAttribute("aria-selected", on ? "true" : "false");
        if (on) tab.setAttribute("aria-current", "true");
        else tab.removeAttribute("aria-current");
      });
      themeTabs.forEach(function (tab) {
        var th = tab.getAttribute("data-browser-theme");
        var available = !!findSlide(section, th);
        var on = th === theme;
        tab.disabled = !available;
        tab.classList.toggle("is-active", on);
        tab.setAttribute("aria-pressed", on ? "true" : "false");
      });
      root.setAttribute("data-browser-section", String(section));
      root.setAttribute("data-browser-theme", theme);
      root.style.setProperty(
        "--browser-screen-bg",
        theme === "dark" ? "#171a21" : "#e9eaf1"
      );
      var active = findSlide(section, theme);
      if (active && urlEl) {
        var address = active.getAttribute("data-address");
        if (address) urlEl.textContent = address;
      }
    }

    function show(sec, th) {
      th = resolveTheme(sec, th);
      var next = findSlide(sec, th);
      if (!next || fading) return;
      var prev = root.querySelector(".browser-frame__slide.is-active");
      if (prev === next) {
        section = String(sec);
        theme = th;
        syncChrome();
        return;
      }

      section = String(sec);
      theme = th;
      syncChrome();

      function finish() {
        slides.forEach(function (slide) {
          slide.classList.remove("is-fading-out", "is-active");
          slide.setAttribute("aria-hidden", "true");
        });
        next.classList.add("is-active");
        next.setAttribute("aria-hidden", "false");
        var scroll = next.querySelector(".browser-frame__scroll");
        if (scroll) scroll.scrollTop = 0;
        fading = false;
      }

      if (fadeMs === 0 || !prev) {
        finish();
        return;
      }

      fading = true;
      next.classList.add("is-active");
      next.setAttribute("aria-hidden", "false");
      prev.classList.remove("is-active");
      prev.classList.add("is-fading-out");
      prev.setAttribute("aria-hidden", "true");
      window.setTimeout(finish, fadeMs);
    }

    sectionTabs.forEach(function (tab) {
      tab.addEventListener("click", function () {
        show(tab.getAttribute("data-browser-section"), theme);
      });
    });
    themeTabs.forEach(function (tab) {
      tab.addEventListener("click", function () {
        show(section, tab.getAttribute("data-browser-theme"));
      });
    });

    slides.forEach(function (slide) {
      slide.removeAttribute("hidden");
      slide.classList.remove("is-active", "is-fading-out");
      slide.setAttribute("aria-hidden", "true");
    });

    root.setAttribute("data-browser-ready", "true");
    show(section, theme);
  }

  function initBrowserMockups() {
    document.querySelectorAll("[data-browser-carousel]").forEach(function (root) {
      if (root.getAttribute("data-browser-ready") === "true") return;

      var frame = root.querySelector(".browser-frame--showcase");
      if (!frame) return;

      if (root.hasAttribute("data-browser-themes")) {
        initThemedCarousel(root, frame);
        return;
      }

      var slides = Array.prototype.slice.call(
        root.querySelectorAll(".browser-frame__slide")
      );
      if (slides.length < 2) return;

      var reducedMotion =
        window.matchMedia &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      var fadeMs = reducedMotion ? 0 : FADE_MS;

      var urlEl = frame.querySelector(".browser-frame__url");
      var tabs = Array.prototype.slice.call(
        root.querySelectorAll("[data-browser-slide]")
      );
      var swipeEl =
        root.querySelector(".browser-frame__screen") ||
        root.querySelector(".browser-frame__slides") ||
        frame;

      var current = 0;
      var fading = false;
      var touchStartX = null;
      var touchStartY = null;
      var touchAxis = null;
      var pointerId = null;
      var pointerStartX = null;

      function clamp(index) {
        return Math.max(0, Math.min(index, slides.length - 1));
      }

      function wrap(index) {
        return ((index % slides.length) + slides.length) % slides.length;
      }

      function syncTabs(index) {
        tabs.forEach(function (tab, n) {
          var on = n === index;
          tab.classList.toggle("is-active", on);
          tab.setAttribute("aria-selected", on ? "true" : "false");
          if (on) tab.setAttribute("aria-current", "true");
          else tab.removeAttribute("aria-current");
        });
      }

      function syncUrl(index) {
        if (!urlEl) return;
        var address = slides[index].getAttribute("data-address");
        if (address) urlEl.textContent = address;
      }

      function finishTransition(prevIndex, nextIndex) {
        slides.forEach(function (slide, n) {
          slide.classList.remove("is-fading-out");
          if (n === nextIndex) {
            slide.classList.add("is-active");
            slide.setAttribute("aria-hidden", "false");
          } else {
            slide.classList.remove("is-active");
            slide.setAttribute("aria-hidden", "true");
          }
        });
        var scroll = slides[nextIndex].querySelector(".browser-frame__scroll");
        if (scroll) scroll.scrollTop = 0;
        fading = false;
      }

      function apply(index) {
        index = clamp(index);
        if (index === current || fading) return;

        var prevIndex = current;
        current = index;
        var outgoing = slides[prevIndex];
        var incoming = slides[current];

        syncTabs(current);
        syncUrl(current);
        root.setAttribute("data-browser-active", String(current));

        if (fadeMs === 0) {
          finishTransition(prevIndex, current);
          return;
        }

        fading = true;
        incoming.classList.add("is-active");
        incoming.setAttribute("aria-hidden", "false");
        outgoing.classList.remove("is-active");
        outgoing.classList.add("is-fading-out");
        outgoing.setAttribute("aria-hidden", "true");

        window.setTimeout(function () {
          finishTransition(prevIndex, current);
        }, fadeMs);
      }

      function goByDelta(delta) {
        apply(wrap(current + delta));
      }

      function resetTouch() {
        touchStartX = null;
        touchStartY = null;
        touchAxis = null;
      }

      function resetPointer() {
        pointerId = null;
        pointerStartX = null;
      }

      tabs.forEach(function (tab) {
        tab.addEventListener("click", function () {
          var idx = parseInt(tab.getAttribute("data-browser-slide"), 10);
          if (!Number.isNaN(idx)) apply(idx);
        });
      });

      root.addEventListener("keydown", function (e) {
        if (e.key === "ArrowLeft") {
          e.preventDefault();
          goByDelta(-1);
        } else if (e.key === "ArrowRight") {
          e.preventDefault();
          goByDelta(1);
        } else if (e.key === "Home") {
          e.preventDefault();
          apply(0);
        } else if (e.key === "End") {
          e.preventDefault();
          apply(slides.length - 1);
        }
      });

      swipeEl.addEventListener(
        "touchstart",
        function (e) {
          if (!e.touches.length) return;
          touchStartX = e.touches[0].clientX;
          touchStartY = e.touches[0].clientY;
          touchAxis = null;
        },
        { passive: true }
      );

      swipeEl.addEventListener(
        "touchmove",
        function (e) {
          if (touchStartX === null || !e.touches.length) return;
          var dx = e.touches[0].clientX - touchStartX;
          var dy = e.touches[0].clientY - touchStartY;
          if (touchAxis === null) {
            if (
              Math.abs(dx) < AXIS_LOCK_PX &&
              Math.abs(dy) < AXIS_LOCK_PX
            ) {
              return;
            }
            touchAxis = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
          }
          if (touchAxis === "x") e.preventDefault();
        },
        { passive: false }
      );

      swipeEl.addEventListener(
        "touchend",
        function (e) {
          if (touchStartX === null || !e.changedTouches.length) {
            resetTouch();
            return;
          }
          var dx = e.changedTouches[0].clientX - touchStartX;
          if (touchAxis === "x" && Math.abs(dx) >= SWIPE_THRESHOLD) {
            goByDelta(dx < 0 ? 1 : -1);
          }
          resetTouch();
        },
        { passive: true }
      );

      swipeEl.addEventListener("touchcancel", resetTouch, { passive: true });

      swipeEl.addEventListener(
        "pointerdown",
        function (e) {
          if (e.pointerType === "touch") return;
          if (e.button !== 0) return;
          pointerId = e.pointerId;
          pointerStartX = e.clientX;
          swipeEl.setPointerCapture(e.pointerId);
        },
        { passive: true }
      );

      swipeEl.addEventListener(
        "pointerup",
        function (e) {
          if (e.pointerType === "touch") return;
          if (pointerId !== e.pointerId || pointerStartX === null) {
            resetPointer();
            return;
          }
          var dx = e.clientX - pointerStartX;
          if (Math.abs(dx) >= SWIPE_THRESHOLD) goByDelta(dx < 0 ? 1 : -1);
          resetPointer();
          try {
            swipeEl.releasePointerCapture(e.pointerId);
          } catch (err) {
            /* already released */
          }
        },
        { passive: true }
      );

      swipeEl.addEventListener("pointercancel", resetPointer, { passive: true });

      slides.forEach(function (slide, n) {
        slide.removeAttribute("hidden");
        slide.classList.toggle("is-active", n === 0);
        slide.setAttribute("aria-hidden", n === 0 ? "false" : "true");
        var img = slide.querySelector("img");
        if (img && img.src && !img.complete) {
          var pre = new Image();
          pre.src = img.src;
        }
      });

      root.setAttribute("data-browser-ready", "true");
      syncTabs(0);
      syncUrl(0);
      root.setAttribute("data-browser-active", "0");
    });
  }

  function resetBrowserMockups(scope) {
    var root = scope || document;
    root.querySelectorAll("[data-browser-carousel]").forEach(function (el) {
      el.removeAttribute("data-browser-ready");
      el.removeAttribute("data-browser-active");
    });
  }

  function bootBrowserMockups() {
    if (!document.querySelector("[data-browser-carousel]")) return;
    resetBrowserMockups();
    initBrowserMockups();
  }

  bootBrowserMockups();
  document.addEventListener("astro:page-load", bootBrowserMockups);
  document.addEventListener("astro:before-swap", function () {
    resetBrowserMockups();
  });
})();
