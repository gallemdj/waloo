/**
 * Work archive — Isotope filters (layout script; re-init on Astro navigations).
 */
(function () {
  "use strict";

  var VENDOR = [
    "/js/vendor/isotope.pkgd.min.js",
    "/js/vendor/imagesloaded.pkgd.min.js",
  ];
  var vendorsLoaded = false;
  var vendorsLoading = null;

  function loadScript(url) {
    return new Promise(function (resolve, reject) {
      if (document.querySelector('script[src="' + url + '"]')) {
        resolve();
        return;
      }
      var script = document.createElement("script");
      script.src = url;
      script.async = false;
      script.onload = resolve;
      script.onerror = reject;
      document.body.appendChild(script);
    });
  }

  function loadVendors() {
    if (vendorsLoaded) {
      return Promise.resolve();
    }
    if (vendorsLoading) {
      return vendorsLoading;
    }
    vendorsLoading = VENDOR.reduce(function (chain, url) {
      return chain.then(function () {
        return loadScript(url);
      });
    }, Promise.resolve())
      .then(function () {
        vendorsLoaded = true;
        vendorsLoading = null;
      })
      .catch(function (err) {
        vendorsLoading = null;
        throw err;
      });
    return vendorsLoading;
  }

  function initWorkGrid() {
    var grid = document.querySelector("[data-work-grid]");
    var filtersRoot = document.querySelector("[data-work-filters]");
    if (!grid || !filtersRoot || typeof Isotope === "undefined") return;

    if (grid.__walooIso) {
      grid.__walooIso.destroy();
      grid.__walooIso = null;
    }

    var reducedMotion =
      window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var ANIM_MS = reducedMotion ? 0 : "0.45s";

    var gridReady = false;
    var transitionsOn = false;

    var iso = new Isotope(grid, {
      itemSelector: ".work-tile",
      layoutMode: "masonry",
      percentPosition: true,
      masonry: {
        columnWidth: ".work-grid-sizer",
      },
      transitionDuration: 0,
      hiddenStyle: { opacity: 0 },
      visibleStyle: { opacity: 1 },
    });

    grid.__walooIso = iso;

    function syncFilteredA11y() {
      grid.querySelectorAll(".work-tile").forEach(function (tile) {
        tile.setAttribute(
          "aria-hidden",
          tile.classList.contains("isotope-hidden") ? "true" : "false",
        );
      });
    }

    function enableTransitions() {
      if (transitionsOn) return;
      transitionsOn = true;
      iso.options.transitionDuration = ANIM_MS;
    }

    function markGridReady() {
      if (gridReady) return;
      gridReady = true;
      enableTransitions();
      syncFilteredA11y();
    }

    function initGridLayout() {
      iso.layout();
      markGridReady();
    }

    iso.on("arrangeComplete", syncFilteredA11y);

    var filterButtons = filtersRoot.querySelectorAll(".work-filter");

    function setActiveButton(active) {
      filterButtons.forEach(function (btn) {
        btn.classList.remove("is-active");
        btn.setAttribute("aria-pressed", "false");
      });
      active.classList.add("is-active");
      active.setAttribute("aria-pressed", "true");
    }

    filterButtons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        var filterValue = btn.getAttribute("data-filter");
        if (!filterValue) return;
        setActiveButton(btn);
        enableTransitions();
        iso.arrange({ filter: filterValue });
      });
    });

    if (typeof imagesLoaded !== "undefined") {
      imagesLoaded(grid, initGridLayout);
    } else if (document.readyState === "complete") {
      initGridLayout();
    } else {
      window.addEventListener("load", initGridLayout, { once: true });
    }

    if (!window.__walooWorkGridResize) {
      var resizeTimer;
      window.addEventListener(
        "resize",
        function () {
          var g = document.querySelector("[data-work-grid]");
          if (!g || !g.__walooIso) return;
          clearTimeout(resizeTimer);
          resizeTimer = setTimeout(function () {
            g.__walooIso.layout();
          }, 120);
        },
        { passive: true },
      );
      window.__walooWorkGridResize = true;
    }
  }

  function bootWorkGrid() {
    if (!document.querySelector("[data-work-grid]")) return;
    loadVendors()
      .then(initWorkGrid)
      .catch(function () {});
  }

  bootWorkGrid();
  document.addEventListener("astro:page-load", bootWorkGrid);
})();
