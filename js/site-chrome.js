/**
 * Shared: theme toggle, mobile nav, optional home lead form → /contact/, Calendly inline on contact.
 * Re-inits page features on Astro view transitions (astro:page-load).
 */
(function () {
  "use strict";

  var chromeBound = false;

  function normPath(pathname) {
    var p = pathname || "";
    if (p.length > 1 && p.endsWith("/")) p = p.slice(0, -1);
    return p || "/";
  }

  function syncNavCurrent() {
    var panel = document.getElementById("siteNavPanel");
    if (!panel) return;

    var path = normPath(window.location.pathname);

    panel.querySelectorAll(".nl > li:not(.nl-tools)").forEach(function (li) {
      var anchor = li.querySelector("a");
      if (!anchor) return;

      var href = anchor.getAttribute("href");
      if (!href) return;

      var linkPath = normPath(new URL(href, window.location.origin).pathname);
      var isActive =
        linkPath === path ||
        (linkPath !== "/" && path.startsWith(linkPath + "/"));

      if (isActive) {
        anchor.setAttribute("aria-current", "page");
        li.classList.add("active");
      } else {
        anchor.removeAttribute("aria-current");
        li.classList.remove("active");
      }
    });
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("waloo-theme", theme);
    syncHeroPoster(theme);
    var themeToggle = document.getElementById("themeToggle");
    if (themeToggle) {
      themeToggle.setAttribute("aria-pressed", String(theme === "dark"));
      themeToggle.setAttribute(
        "aria-label",
        theme === "dark" ? "Switch to light mode" : "Switch to dark mode"
      );
    }
  }

  function ensureTheme() {
    var stored = localStorage.getItem("waloo-theme");
    var prefersDark =
      window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    applyTheme(stored || (prefersDark ? "dark" : "light"));
  }

  function heroPosterMobileSrcset(base, name) {
    return base + name + "-m-824.webp 468w";
  }

  function heroPosterLandscapeSrcset(base, name) {
    return (
      base +
      name +
      "-412.webp 412w, " +
      base +
      name +
      "-824.webp 824w, " +
      base +
      name +
      ".webp 1280w"
    );
  }

  function heroPosterSrc(base, name) {
    return base + name + "-412.webp";
  }

  function heroPosterSrcset(base, name) {
    return heroPosterLandscapeSrcset(base, name);
  }

  function applyHeroPosterMedia(img, base, name, cls) {
    var picture = img.closest("picture");
    if (picture) {
      var mobile = picture.querySelector("source");
      if (mobile) mobile.srcset = heroPosterMobileSrcset(base, name);
    }
    img.className = "section--hero-bg-img section--hero-bg-img--" + cls;
    img.src = heroPosterSrc(base, name);
    img.srcset = heroPosterLandscapeSrcset(base, name);
  }

  function syncHeroPoster(theme) {
    var name = theme === "dark" ? "dark" : "white";
    var cls = theme === "dark" ? "dark" : "light";
    var base = "/assets/videos/posters/";
    document.querySelectorAll(".section--hero-bg").forEach(function (bg) {
      if (bg.closest(".section--hero--photo")) return;
      if (!bg.querySelector(".section--hero-bg-video")) return;
      var img = bg.querySelector(".section--hero-bg-img");
      if (!img) return;
      applyHeroPosterMedia(img, base, name, cls);
    });
  }

  function ensureHeroPoster(bg) {
    if (!bg || bg.closest(".section--hero--photo")) return;
    if (!bg.querySelector(".section--hero-bg-video")) return;
    if (bg.querySelector(".section--hero-bg-img")) return;

    var theme =
      document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
    var posterName = theme === "dark" ? "dark" : "white";
    var cls = theme === "dark" ? "dark" : "light";
    var base = "/assets/videos/posters/";
    var picture = document.createElement("picture");
    picture.setAttribute("data-hero-poster", "");
    var mobile = document.createElement("source");
    mobile.media = "(max-width: 56.25rem)";
    mobile.srcset = heroPosterMobileSrcset(base, posterName);
    picture.appendChild(mobile);
    var img = document.createElement("img");
    img.className = "section--hero-bg-img section--hero-bg-img--" + cls;
    img.src = heroPosterSrc(base, posterName);
    img.srcset = heroPosterLandscapeSrcset(base, posterName);
    img.sizes = "100vw";
    img.alt = "";
    img.width = 1280;
    img.height = 720;
    img.decoding = "sync";
    img.setAttribute("fetchpriority", "high");
    picture.appendChild(img);
    bg.insertBefore(picture, bg.querySelector(".section--hero-bg-video") || bg.firstChild);
  }

  function ensureAllHeroPosters() {
    document.querySelectorAll(".section--hero-bg").forEach(ensureHeroPoster);
  }

  function resetHeroVideoState() {
    if (window.__walooHeroIO) {
      window.__walooHeroIO.disconnect();
      window.__walooHeroIO = null;
    }
    if (window.__walooHeroThemeMO) {
      window.__walooHeroThemeMO.disconnect();
      window.__walooHeroThemeMO = null;
    }
    document.querySelectorAll(".section--hero-bg").forEach(function (bg) {
      bg.classList.remove("is-video-active");
      bg.querySelectorAll(".section--hero-bg-video").forEach(function (video) {
        video.pause();
      });
    });
  }

  function ensureHeroVisible() {
    var main = document.getElementById("main-content");
    if (main) {
      main.style.setProperty("opacity", "1", "important");
      main.style.setProperty("visibility", "visible", "important");
      main.style.setProperty("animation", "none", "important");
    }
    document.querySelectorAll(".section--hero, .hero-copy, .section--hero .section-inner").forEach(function (el) {
      el.style.setProperty("opacity", "1", "important");
      el.style.setProperty("visibility", "visible", "important");
    });
  }

  function bindHeroSwapOnce() {
    if (window.__walooHeroSwapBound) return;
    window.__walooHeroSwapBound = true;
    document.addEventListener("astro:after-swap", function () {
      ensureAllHeroPosters();
      syncHeroPoster(
        document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light",
      );
      if (window.matchMedia && window.matchMedia("(max-width: 56.26rem)").matches) {
        ensureHeroVisible();
        requestAnimationFrame(ensureHeroVisible);
      }
    });
  }

  function bindChromeOnce() {
    if (chromeBound) return;
    chromeBound = true;

    var themeToggle = document.getElementById("themeToggle");
    if (themeToggle) {
      themeToggle.addEventListener("click", function () {
        var cur =
          document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
        applyTheme(cur);
      });
    }

    var siteNav = document.getElementById("siteNav");
    var navPanel = document.getElementById("siteNavPanel");
    var navBurger = document.getElementById("navBurger");
    var mqNavDesk = window.matchMedia("(min-width: 56.26rem)");

    function setNavOpen(open) {
      if (!siteNav || !navBurger || !navPanel) return;
      if (open && typeof window.__walooSetViewportHeight === "function") {
        window.__walooSetViewportHeight();
      }
      siteNav.classList.toggle("nav-is-open", open);
      navBurger.setAttribute("aria-expanded", open ? "true" : "false");
      navBurger.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      document.documentElement.classList.toggle("nav-mobile-open", open);
    }

    if (siteNav && navBurger && navPanel) {
      var navCompactOn = 56;
      var navCompactOff = 24;
      var navCompactActive = false;
      var navCompactRaf = 0;

      function syncNavCompact(force) {
        if (navCompactRaf) return;
        navCompactRaf = window.requestAnimationFrame(function () {
          navCompactRaf = 0;
          var y = window.scrollY || document.documentElement.scrollTop;
          if (force) {
            navCompactActive = y > navCompactOn;
          } else if (!navCompactActive && y > navCompactOn) {
            navCompactActive = true;
          } else if (navCompactActive && y < navCompactOff) {
            navCompactActive = false;
          }
          siteNav.classList.toggle("nav--compact", navCompactActive);
        });
      }

      window.__walooSyncNavCompact = syncNavCompact;

      syncNavCompact(true);
      window.addEventListener("scroll", function () {
        syncNavCompact(false);
      }, { passive: true });

      navBurger.addEventListener("click", function () {
        setNavOpen(!siteNav.classList.contains("nav-is-open"));
      });

      navPanel.querySelectorAll("a").forEach(function (el) {
        el.addEventListener("click", function () {
          setNavOpen(false);
        });
      });

      function onMqNav() {
        if (mqNavDesk.matches) setNavOpen(false);
      }
      if (mqNavDesk.addEventListener) mqNavDesk.addEventListener("change", onMqNav);
      else mqNavDesk.addListener(onMqNav);
    }
  }

  /* Calendly inline embed — contact page */
  var CALENDLY_WIDGET_CSS =
    "https://assets.calendly.com/assets/external/widget.css";
  var CALENDLY_WIDGET_JS =
    "https://assets.calendly.com/assets/external/widget.js";
  var calendlyAssetsPromise = null;

  function calendlyUrlFor(el) {
    return (
      el.getAttribute("data-calendly-url") ||
      "https://calendly.com/waloo/30min"
    );
  }

  function loadCalendlyAssets() {
    if (window.Calendly) {
      return Promise.resolve();
    }
    if (calendlyAssetsPromise) {
      return calendlyAssetsPromise;
    }
    calendlyAssetsPromise = new Promise(function (resolve, reject) {
      if (!document.querySelector('link[data-waloo-calendly-css]')) {
        var link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = CALENDLY_WIDGET_CSS;
        link.setAttribute("data-waloo-calendly-css", "");
        document.head.appendChild(link);
      }
      var existing = document.querySelector('script[data-waloo-calendly-js]');
      if (existing) {
        if (window.Calendly) {
          resolve();
          return;
        }
        existing.addEventListener("load", function () {
          resolve();
        });
        existing.addEventListener("error", reject);
        return;
      }
      var script = document.createElement("script");
      script.src = CALENDLY_WIDGET_JS;
      script.async = true;
      script.setAttribute("data-waloo-calendly-js", "");
      script.onload = function () {
        resolve();
      };
      script.onerror = reject;
      document.head.appendChild(script);
    });
    return calendlyAssetsPromise;
  }

  function initCalendlyInline(embedEl) {
    if (!embedEl || embedEl.dataset.calendlyInitialized === "1") {
      return;
    }
    var url = calendlyUrlFor(embedEl);
    loadCalendlyAssets()
      .then(function () {
        if (!window.Calendly || embedEl.dataset.calendlyInitialized === "1") {
          return;
        }
        window.Calendly.initInlineWidget({
          url: url,
          parentElement: embedEl,
          resize: true,
        });
        embedEl.dataset.calendlyInitialized = "1";
      })
      .catch(function () {
        /* widget failed to load */
      });
  }

  function deferBrandFonts() {
    var configEl = document.getElementById("waloo-brand-fonts");
    var section = document.querySelector(".section--work-tokens");
    if (!configEl || !section) return;

    var config;
    try {
      config = JSON.parse(configEl.textContent || "{}");
    } catch (e) {
      return;
    }
    if (!config.url || section.dataset.walooBrandFontsLoaded === "1") return;

    function loadBrandFonts() {
      if (section.dataset.walooBrandFontsLoaded === "1") return;
      section.dataset.walooBrandFontsLoaded = "1";

      if (config.preconnect) {
        ["https://fonts.googleapis.com", "https://fonts.gstatic.com"].forEach(function (href) {
          if (!document.querySelector('link[rel="preconnect"][href="' + href + '"]')) {
            var preconnect = document.createElement("link");
            preconnect.rel = "preconnect";
            preconnect.href = href;
            preconnect.crossOrigin = "";
            document.head.appendChild(preconnect);
          }
        });
      }

      var link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = config.url;
      document.head.appendChild(link);
    }

    if (!("IntersectionObserver" in window)) {
      loadBrandFonts();
      return;
    }

    var observer = new IntersectionObserver(
      function (entries) {
        if (
          !entries.some(function (entry) {
            return entry.isIntersecting;
          })
        ) {
          return;
        }
        observer.disconnect();
        loadBrandFonts();
      },
      { rootMargin: "240px 0px" },
    );
    observer.observe(section);
  }

  function deferCalendlyInit() {
    var widgets = document.querySelectorAll(".cal-panel__widget[data-calendly-url]");
    if (!widgets.length) return;

    function initAll() {
      widgets.forEach(function (embed) {
        initCalendlyInline(embed);
      });
    }

    if (window.location.hash === "#schedule-call") {
      initAll();
      return;
    }

    if (!("IntersectionObserver" in window)) {
      initAll();
      return;
    }

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          initCalendlyInline(entry.target);
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: "160px 0px" },
    );

    widgets.forEach(function (embed) {
      observer.observe(embed);
    });
  }

  function bindWeb3Forms(form) {
    if (!form || form.dataset.walooWeb3formsBound === "1") return;
    form.dataset.walooWeb3formsBound = "1";

    var panel = document.getElementById("contactFormPanel") || form.closest(".form-panel");
    var successEl = document.getElementById("contactFormSuccess");
    var errorEl = document.getElementById("contactFormError");
    var loadingEl = document.getElementById("contactFormLoading");
    var fields = form.querySelectorAll("input, textarea, button, select");

    function setSubmitting(busy) {
      if (panel) panel.classList.toggle("is-submitting", busy);
      if (loadingEl) {
        loadingEl.hidden = !busy;
        loadingEl.setAttribute("aria-busy", busy ? "true" : "false");
      }
      fields.forEach(function (el) {
        el.disabled = busy;
      });
    }

    function showSuccess() {
      setSubmitting(false);
      if (panel) panel.classList.add("is-success");
      if (successEl) successEl.hidden = false;
      if (errorEl) errorEl.hidden = true;
      if (successEl && successEl.focus) {
        successEl.setAttribute("tabindex", "-1");
        successEl.focus();
      }
    }

    function showError(message) {
      setSubmitting(false);
      if (panel) panel.classList.remove("is-success");
      if (successEl) successEl.hidden = true;
      if (errorEl) {
        errorEl.hidden = false;
        if (message) errorEl.textContent = message;
      }
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();

      var config = window.WALOO_WEB3FORMS || {};

      var botcheck = form.querySelector('[name="botcheck"]');
      if (botcheck && botcheck.checked) return;

      if (!config.accessKey || config.accessKey === "YOUR_WEB3FORMS_ACCESS_KEY") {
        showError(
          "Form is not configured yet. Email us at contact@waloo.co or try again later."
        );
        return;
      }

      var website = (form.querySelector('[name="website"]') || {}).value || "";
      var email = (form.querySelector('[name="email"]') || {}).value || "";
      var notes = (form.querySelector('[name="notes"]') || {}).value || "";

      var body = new FormData();
      body.append("access_key", config.accessKey);
      body.append("subject", config.subject || "New enquiry — waloo.co");
      body.append("email", email);
      body.append("from_name", "WALOO contact form");
      body.append(
        "message",
        "Website: " + website + "\n\n" + (notes.trim() || "(No additional notes)")
      );

      if (errorEl) errorEl.hidden = true;
      setSubmitting(true);

      fetch(config.endpoint || "https://api.web3forms.com/submit", {
        method: "POST",
        headers: { Accept: "application/json" },
        body: body,
      })
        .then(function (res) {
          return res.json().then(function (data) {
            return { ok: res.ok, data: data };
          });
        })
        .then(function (result) {
          if (result.ok && result.data && result.data.success) {
            form.reset();
            showSuccess();
            return;
          }
          showError(
            (result.data && result.data.message) ||
              "Something went wrong. Please try again or email contact@waloo.co."
          );
        })
        .catch(function () {
          showError(
            "Network error. Please try again or email contact@waloo.co."
          );
        });
    });
  }

  function walooInitHeroBgVideos() {
    var heroBg = document.querySelector(".section--hero-bg");
    var heroBgVideos = {
      light: document.querySelector(".section--hero-bg-video--light"),
      dark: document.querySelector(".section--hero-bg-video--dark"),
    };

    if (!heroBgVideos.light && !heroBgVideos.dark) {
      var single = document.querySelector(
        ".section--hero-bg .section--hero-bg-video:not(.section--hero-bg-video--light):not(.section--hero-bg-video--dark)",
      );
      if (single) heroBgVideos = { active: single };
    }

    if (!heroBgVideos.light && !heroBgVideos.dark && !heroBgVideos.active) return;

    var prefersReducedMotion =
      window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var isMobileViewport =
      window.matchMedia && window.matchMedia("(max-width: 56.26rem)").matches;

    /* Defer MP4 until after full load + idle — poster stays LCP; interaction unlocks early. */
    var heroVideoUnlocked = !!window.__walooHeroVideoUnlocked;
    var heroVideoAllowed = heroVideoUnlocked;

    function unlockHeroVideo() {
      if (heroVideoUnlocked) return;
      heroVideoUnlocked = true;
      window.__walooHeroVideoUnlocked = true;
      heroVideoAllowed = true;
      syncHeroBgVideo();
    }

    function scheduleHeroVideoAutoplay() {
      if (heroVideoUnlocked || isMobileViewport) return;
      var run = function () {
        unlockHeroVideo();
      };
      if (typeof requestIdleCallback === "function") {
        requestIdleCallback(run, { timeout: 4000 });
      } else {
        setTimeout(run, 2500);
      }
    }

    if (!heroVideoUnlocked) {
      ["scroll", "pointerdown", "keydown", "touchstart", "wheel"].forEach(function (eventName) {
        window.addEventListener(eventName, unlockHeroVideo, { once: true, passive: true });
      });

      if (document.readyState === "complete") {
        scheduleHeroVideoAutoplay();
      } else {
        window.addEventListener("load", scheduleHeroVideoAutoplay, { once: true });
      }
    }

    function heroTheme() {
      return document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
    }

    function syncHeroVideoActive(video) {
      if (!heroBg || !video) return;
      if (!video.paused && !video.error) {
        heroBg.classList.add("is-video-active");
      } else {
        heroBg.classList.remove("is-video-active");
      }
    }

    function markVideoActive(video) {
      if (!heroBg || !video || video.dataset.walooHeroBound === "1") return;
      video.dataset.walooHeroBound = "1";
      video.addEventListener("playing", function () {
        syncHeroVideoActive(video);
      });
      ["pause", "waiting", "emptied", "error"].forEach(function (eventName) {
        video.addEventListener(eventName, function () {
          syncHeroVideoActive(video);
        });
      });
    }

    function ensureSource(video) {
      var source = video.querySelector("source[data-src]");
      if (!source || source.getAttribute("src")) return Promise.resolve();
      return new Promise(function (resolve) {
        source.setAttribute("src", source.getAttribute("data-src"));
        video.load();
        if (video.readyState >= 2) resolve();
        else video.addEventListener("loadeddata", resolve, { once: true });
      });
    }

    function syncHeroBgVideo() {
      if (!heroVideoAllowed) return;
      if (prefersReducedMotion) {
        Object.keys(heroBgVideos).forEach(function (key) {
          var video = heroBgVideos[key];
          if (!video) return;
          video.pause();
          video.removeAttribute("autoplay");
        });
        return;
      }

      if (heroBgVideos.active) {
        markVideoActive(heroBgVideos.active);
        ensureSource(heroBgVideos.active).then(function () {
          heroBgVideos.active.playbackRate = 1;
          heroBgVideos.active.defaultPlaybackRate = 1;
          heroBgVideos.active.play().catch(function () {
            if (heroBg) heroBg.classList.remove("is-video-active");
          });
        });
        return;
      }

      var active = heroTheme();
      Object.keys(heroBgVideos).forEach(function (theme) {
        var video = heroBgVideos[theme];
        if (!video) return;
        if (theme === active) {
          markVideoActive(video);
          ensureSource(video).then(function () {
            video.playbackRate = 1;
            video.defaultPlaybackRate = 1;
            video.play().catch(function () {
              if (heroBg) heroBg.classList.remove("is-video-active");
            });
          });
        } else {
          video.pause();
        }
      });
    }

    function bindWhenVisible() {
      if (!heroBg || !("IntersectionObserver" in window)) {
        if (heroVideoAllowed) syncHeroBgVideo();
        return;
      }

      var observer = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting && heroVideoAllowed) syncHeroBgVideo();
            else {
              if (heroBg) heroBg.classList.remove("is-video-active");
              Object.keys(heroBgVideos).forEach(function (key) {
                var video = heroBgVideos[key];
                if (video) video.pause();
              });
            }
          });
        },
        { rootMargin: "80px 0px", threshold: 0.01 },
      );
      observer.observe(heroBg);
      window.__walooHeroIO = observer;
    }

    bindWhenVisible();

    if (heroBgVideos.light || heroBgVideos.dark) {
      if (window.__walooHeroThemeMO) {
        window.__walooHeroThemeMO.disconnect();
      }
      window.__walooHeroThemeMO = new MutationObserver(syncHeroBgVideo);
      window.__walooHeroThemeMO.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["data-theme"],
      });
    }

    if (heroVideoAllowed) {
      syncHeroBgVideo();
    }
  }

  function initWalooPage() {
    bindChromeOnce();
    bindHeroSwapOnce();
    ensureTheme();
    syncNavCurrent();

    var leadForm = document.getElementById("leadForm");
    if (leadForm && leadForm.dataset.walooLeadBound !== "1") {
      leadForm.dataset.walooLeadBound = "1";
      leadForm.addEventListener("submit", function (e) {
        e.preventDefault();
        window.location.href = "/contact/";
      });
    }

    deferBrandFonts();
    deferCalendlyInit();

    if (window.location.hash === "#schedule-call") {
      var scheduleSection = document.getElementById("schedule-call");
      if (scheduleSection) {
        requestAnimationFrame(function () {
          scheduleSection.scrollIntoView({ behavior: "smooth", block: "start" });
        });
      }
    }

    var contactForm = document.getElementById("contactForm");
    if (contactForm && contactForm.hasAttribute("data-waloo-web3forms")) {
      bindWeb3Forms(contactForm);
    }

    ensureAllHeroPosters();
    resetHeroVideoState();
    walooInitHeroBgVideos();
    if (typeof window.__walooSyncNavCompact === "function") {
      window.__walooSyncNavCompact(true);
    }
    if (window.matchMedia && window.matchMedia("(max-width: 56.26rem)").matches) {
      ensureHeroVisible();
    }
  }

  initWalooPage();
  document.addEventListener("astro:page-load", initWalooPage);
})();
