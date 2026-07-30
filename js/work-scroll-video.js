/**
 * Work detail — campaign video: YouTube embed or local <video>, autoplay when scrolled into view.
 * Requires [data-work-scroll-video] and iframe[data-youtube-id] or a child <video>.
 * Re-inits on Astro view transitions (astro:page-load).
 */
(function () {
  "use strict";

  function embedSrc(id, autoplay) {
    var params = [
      "autoplay=" + (autoplay ? "1" : "0"),
      "mute=1",
      "playsinline=1",
      "rel=0",
      "modestbranding=1",
      "controls=1",
    ];
    return "https://www.youtube-nocookie.com/embed/" + id + "?" + params.join("&");
  }

  function initLocalVideo(root, video) {
    var readyKey = "data-scroll-video-ready";
    if (root.getAttribute(readyKey) === "true" && root._scrollVideoState && root._scrollVideoState.local) {
      return;
    }

    if (root._scrollVideoState && root._scrollVideoState.observer) {
      root._scrollVideoState.observer.disconnect();
    }

    var state = { local: true, playing: false, observer: null };
    root._scrollVideoState = state;

    function play() {
      root.classList.add("is-loaded", "is-playing");
      state.playing = true;
      var playPromise = video.play();
      if (playPromise && typeof playPromise.catch === "function") {
        playPromise.catch(function () {});
      }
    }

    function pause() {
      state.playing = false;
      video.pause();
      root.classList.remove("is-playing");
    }

    if (!("IntersectionObserver" in window)) {
      play();
      root.setAttribute(readyKey, "true");
      return;
    }

    state.observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.intersectionRatio >= 0.45) {
            play();
          } else if (entry.intersectionRatio >= 0.2) {
            root.classList.add("is-loaded");
          } else {
            pause();
          }
        });
      },
      { root: null, rootMargin: "0px 0px -5% 0px", threshold: [0, 0.2, 0.45, 0.6] }
    );

    state.observer.observe(root);
    root.setAttribute(readyKey, "true");

    requestAnimationFrame(function () {
      var rect = root.getBoundingClientRect();
      var vh = window.innerHeight || document.documentElement.clientHeight;
      if (rect.top < vh * 0.85 && rect.bottom > vh * 0.1) {
        if (rect.top < vh * 0.55) play();
        else root.classList.add("is-loaded");
      }
    });
  }

  function initWorkScrollVideos() {
    document.querySelectorAll("[data-work-scroll-video]").forEach(function (root) {
      var video = root.querySelector("video");
      if (video) {
        initLocalVideo(root, video);
        return;
      }

      var iframe = root.querySelector("iframe[data-youtube-id]");
      if (!iframe) return;

      var videoId = iframe.getAttribute("data-youtube-id");
      if (!videoId) return;

      var readyKey = "data-scroll-video-ready";
      var wasReady = root.getAttribute(readyKey) === "true";
      var state = root._scrollVideoState;

      if (!state || state.videoId !== videoId) {
        state = {
          videoId: videoId,
          loaded: false,
          playing: false,
          observer: null,
        };
        root._scrollVideoState = state;
        root.removeAttribute(readyKey);
        wasReady = false;
      }

      if (wasReady && state.observer) return;

      if (state.observer) {
        state.observer.disconnect();
      }

      function setSrc(autoplay) {
        var next = embedSrc(videoId, autoplay);
        if (iframe.getAttribute("src") !== next) {
          iframe.src = next;
        }
      }

      function loadPreview() {
        if (state.loaded) return;
        state.loaded = true;
        setSrc(false);
        root.classList.add("is-loaded");
      }

      function play() {
        loadPreview();
        if (state.playing) return;
        state.playing = true;
        setSrc(true);
        root.classList.add("is-playing");
      }

      function pause() {
        if (!state.loaded) return;
        state.playing = false;
        setSrc(false);
        root.classList.remove("is-playing");
      }

      if (!("IntersectionObserver" in window)) {
        play();
        root.setAttribute(readyKey, "true");
        return;
      }

      state.observer = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.intersectionRatio >= 0.2) {
              if (entry.intersectionRatio >= 0.45) {
                play();
              } else {
                loadPreview();
              }
            } else {
              pause();
            }
          });
        },
        { root: null, rootMargin: "0px 0px -5% 0px", threshold: [0, 0.2, 0.45, 0.6] }
      );

      state.observer.observe(root);
      root.setAttribute(readyKey, "true");

      /* Astro: section may already be in view on first paint */
      requestAnimationFrame(function () {
        var rect = root.getBoundingClientRect();
        var vh = window.innerHeight || document.documentElement.clientHeight;
        if (rect.top < vh * 0.85 && rect.bottom > vh * 0.1) {
          if (rect.top < vh * 0.55) play();
          else loadPreview();
        }
      });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initWorkScrollVideos);
  } else {
    initWorkScrollVideos();
  }

  document.addEventListener("astro:page-load", initWorkScrollVideos);
})();
