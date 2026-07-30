/**
 * Home — case studies slider (CSS transitions; no anime.js).
 * Crossfade bg + slide copy via .is-active; arrows, dots, swipe, autoplay.
 * Re-inits on Astro view transitions (astro:page-load).
 */
(function () {
  function initCasesSlider() {
  const root = document.querySelector("[data-cases-slider]");
  if (!root || root.dataset.walooCasesSliderInit === "1") return;
  root.dataset.walooCasesSliderInit = "1";

  const reducedMotion =
    window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const AUTOPLAY_MS = 6500;
  const SWIPE_THRESHOLD = 48;

  const bgs = [...root.querySelectorAll(".cases-slider__bg")];
  const slides = [...root.querySelectorAll(".cases-slider__slide")];
  const dotsNav = root.querySelector("[data-cases-dots]");
  const btnPrev = root.querySelector("[data-cases-prev]");
  const btnNext = root.querySelector("[data-cases-next]");
  const cta = root.querySelector("[data-cases-cta]");
  const ctaLabel = root.querySelector("[data-cases-cta-label]");
  const slideCount = slides.length;

  if (!slideCount) return;

  function setCta(index) {
    const slide = slides[index];
    if (!slide || !cta) return;
    const href = slide.getAttribute("data-case-href");
    const label = slide.getAttribute("data-case-label") || "Open case study";
    if (href) cta.setAttribute("href", href);
    if (ctaLabel) ctaLabel.textContent = label;
    const title = slide.querySelector("h3")?.textContent?.trim();
    cta.setAttribute(
      "aria-label",
      title ? `${label}: ${title}` : label,
    );
  }

  if (slideCount === 1) {
    root.classList.add("cases-slider--single");
    setCta(0);
    return;
  }

  if (!dotsNav || !btnPrev || !btnNext) return;

  let current = 0;
  let busy = false;
  let autoplayId = null;
  let paused = false;

  function preloadSlideImages() {
    bgs.forEach((bg) => {
      const img = bg.querySelector("img");
      if (!img?.src || img.dataset.walooPreloaded === "1") return;
      img.dataset.walooPreloaded = "1";
      const pre = new Image();
      pre.src = img.src;
    });
  }

  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        preloadSlideImages();
        io.disconnect();
      },
      { rootMargin: "160px 0px" },
    );
    io.observe(root);
  } else {
    preloadSlideImages();
  }

  const labels = slides.map((slide) => slide.getAttribute("aria-label") || "Case study");

  slides.forEach((_, i) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "cases-slider__dot";
    btn.setAttribute("data-slide", String(i));
    btn.setAttribute("aria-label", labels[i] || `Case study ${i + 1}`);
    btn.classList.toggle("is-active", i === 0);
    if (i === 0) btn.setAttribute("aria-current", "true");
    dotsNav.appendChild(btn);
  });

  const dots = [...dotsNav.querySelectorAll(".cases-slider__dot")];

  function clamp(index) {
    return Math.max(0, Math.min(index, slideCount - 1));
  }

  function wrap(index) {
    return ((index % slideCount) + slideCount) % slideCount;
  }

  function setBg(index) {
    bgs.forEach((bg, n) => bg.classList.toggle("is-active", n === index));
  }

  function setDots(index) {
    dots.forEach((dot, n) => {
      const on = n === index;
      dot.classList.toggle("is-active", on);
      if (on) dot.setAttribute("aria-current", "true");
      else dot.removeAttribute("aria-current");
    });
  }

  function setSlides(index) {
    slides.forEach((slide, n) => {
      const on = n === index;
      slide.classList.toggle("is-active", on);
      slide.classList.remove("is-entering");
      slide.style.opacity = "";
      slide.style.transform = "";
      slide.setAttribute("aria-hidden", on ? "false" : "true");
    });
    root.setAttribute("data-active-index", String(index));
  }

  function goTo(index) {
    const i = clamp(index);
    if (i === current || busy) return;
    busy = true;
    pauseAutoplay();

    current = i;
    setBg(i);
    setDots(i);
    setSlides(i);
    setCta(i);

    busy = false;
    resumeAutoplay();
  }

  function step(delta) {
    goTo(wrap(current + delta));
  }

  function pauseAutoplay() {
    if (autoplayId) {
      clearInterval(autoplayId);
      autoplayId = null;
    }
  }

  function resumeAutoplay() {
    if (reducedMotion || paused || document.hidden) return;
    pauseAutoplay();
    autoplayId = window.setInterval(() => {
      if (!busy && !paused && !document.hidden) step(1);
    }, AUTOPLAY_MS);
  }

  function userPause() {
    paused = true;
    pauseAutoplay();
  }

  function userResume() {
    paused = false;
    resumeAutoplay();
  }

  dots.forEach((dot) => {
    dot.addEventListener("click", () => {
      const i = Number(dot.getAttribute("data-slide"));
      if (!Number.isNaN(i)) goTo(i);
    });
  });

  btnPrev.addEventListener("click", () => step(-1));
  btnNext.addEventListener("click", () => step(1));

  root.setAttribute("tabindex", "0");
  root.addEventListener("keydown", (e) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    e.preventDefault();
    step(e.key === "ArrowRight" ? 1 : -1);
  });

  root.addEventListener("mouseenter", userPause);
  root.addEventListener("mouseleave", userResume);
  root.addEventListener("focusin", userPause);
  root.addEventListener("focusout", (e) => {
    if (!root.contains(e.relatedTarget)) userResume();
  });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) pauseAutoplay();
    else resumeAutoplay();
  });

  let touchStartX = 0;
  let touchStartY = 0;
  let touchAxis = null;

  root.addEventListener(
    "touchstart",
    (e) => {
      if (e.touches.length !== 1) return;
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
      touchAxis = null;
      userPause();
    },
    { passive: true },
  );

  root.addEventListener(
    "touchmove",
    (e) => {
      if (e.touches.length !== 1 || touchAxis === "y") return;
      const dx = e.touches[0].clientX - touchStartX;
      const dy = e.touches[0].clientY - touchStartY;
      if (touchAxis === null && (Math.abs(dx) > 8 || Math.abs(dy) > 8)) {
        touchAxis = Math.abs(dx) >= Math.abs(dy) ? "x" : "y";
      }
      if (touchAxis === "x" && Math.abs(dx) > 10) e.preventDefault();
    },
    { passive: false },
  );

  root.addEventListener(
    "touchend",
    (e) => {
      const touch = e.changedTouches[0];
      if (!touch || touchAxis === "y") {
        userResume();
        return;
      }
      const dx = touch.clientX - touchStartX;
      if (Math.abs(dx) >= SWIPE_THRESHOLD) {
        step(dx < 0 ? 1 : -1);
      }
      touchAxis = null;
      userResume();
    },
    { passive: true },
  );

  setBg(0);
  setDots(0);
  setSlides(0);
  setCta(0);
  resumeAutoplay();
  }

  initCasesSlider();
  document.addEventListener("astro:page-load", initCasesSlider);
})();
