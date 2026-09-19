/**
 * Enhancer for YouTube™ — Custom script (same logic as content.js).
 * Paste into Custom script and enable auto-execute.
 *
 * Scales times without flicker: hides native clock, shows our labels.
 */
(function () {
  if (window.__ytSpeedRemainingInstalled) return;
  window.__ytSpeedRemainingInstalled = true;

  const VIDEO_SEL = "video.html5-main-video, .html5-video-player video";
  const STYLE_ID = "yt-speed-time-style";
  const CLS_PLAYER = "yt-speed-scaled";
  const CLS_CUR = "yt-speed-current";
  const CLS_DUR = "yt-speed-duration";

  let video = null;
  let currentEl = null;
  let durationEl = null;
  let ourCurrent = null;
  let ourDuration = null;
  let listeningVideo = null;
  let remainingMode = false;
  let raf = 0;
  let lastLeft = "";
  let lastRight = "";
  let cachedFontSize = "13px";

  function ensureStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent =
      "." + CLS_PLAYER + " .ytp-time-current," +
      "." + CLS_PLAYER + " .ytp-time-duration{" +
      "font-size:0!important;color:transparent!important;caret-color:transparent!important}" +
      "." + CLS_PLAYER + " ." + CLS_CUR + "," +
      "." + CLS_PLAYER + " ." + CLS_DUR + "{" +
      "font-weight:inherit;color:inherit;" +
      "font-family:inherit;letter-spacing:inherit;white-space:nowrap}";
    (document.head || document.documentElement).appendChild(style);
  }

  function formatTime(totalSeconds) {
    const s = Math.max(0, Math.floor(totalSeconds + 1e-9));
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    if (h > 0) {
      return h + ":" + String(m).padStart(2, "0") + ":" + String(sec).padStart(2, "0");
    }
    return m + ":" + String(sec).padStart(2, "0");
  }

  function getPlayer() {
    return document.querySelector(".html5-video-player");
  }

  function getPlayerRoot() {
    const mini = document.querySelector(".ytp-miniplayer-ui");
    if (mini && getComputedStyle(mini).display !== "none") return mini;
    return getPlayer() || document.querySelector(".ytp-chrome-bottom") || document;
  }

  function isLive() {
    if (!video) return true;
    const display = getPlayerRoot().querySelector(".ytp-time-display");
    if (display && display.classList.contains("ytp-live")) return true;
    return !isFinite(video.duration) || video.duration === Infinity;
  }

  function ensureOverlays() {
    const root = getPlayerRoot();
    currentEl = root.querySelector(".ytp-time-current");
    durationEl = root.querySelector(".ytp-time-duration");
    if (!currentEl || !durationEl) return false;

    ourCurrent = root.querySelector("." + CLS_CUR);
    if (!ourCurrent) {
      ourCurrent = document.createElement("span");
      ourCurrent.className = CLS_CUR;
      ourCurrent.setAttribute("aria-hidden", "true");
      currentEl.insertAdjacentElement("afterend", ourCurrent);
    }

    ourDuration = root.querySelector("." + CLS_DUR);
    if (!ourDuration) {
      ourDuration = document.createElement("span");
      ourDuration.className = CLS_DUR;
      ourDuration.setAttribute("aria-hidden", "true");
      durationEl.insertAdjacentElement("afterend", ourDuration);
    }

    const probe =
      root.querySelector(".ytp-time-separator") ||
      root.querySelector(".ytp-time-contents") ||
      currentEl;
    const size = getComputedStyle(probe).fontSize || "13px";
    if (size && size !== "0px") cachedFontSize = size;
    ourCurrent.style.fontSize = cachedFontSize;
    ourDuration.style.fontSize = cachedFontSize;

    return true;
  }

  function setScaledActive(on) {
    const player = getPlayer();
    if (!player) return;
    player.classList.toggle(CLS_PLAYER, on);
    if (ourCurrent) ourCurrent.style.display = on ? "" : "none";
    if (ourDuration) ourDuration.style.display = on ? "" : "none";
  }

  function syncRemainingMode() {
    if (!currentEl) return;
    const t = currentEl.textContent || "";
    if (/^\s*-\d/.test(t)) remainingMode = true;
    else if (/^\s*\d/.test(t)) remainingMode = false;
  }

  function update() {
    if (!video || !video.isConnected) {
      refresh();
      if (!video) return;
    }
    if (isLive()) {
      setScaledActive(false);
      stopLoop();
      return;
    }
    if (!isFinite(video.duration) || !isFinite(video.currentTime)) return;

    const rate = video.playbackRate || 1;
    if (!isFinite(rate) || rate <= 0) return;

    if (rate === 1) {
      setScaledActive(false);
      stopLoop();
      return;
    }

    if (!ensureOverlays()) return;
    setScaledActive(true);
    syncRemainingMode();

    const right = formatTime(video.duration / rate);
    const left = remainingMode
      ? "-" + formatTime((video.duration - video.currentTime) / rate)
      : formatTime(video.currentTime / rate);

    if (left !== lastLeft) {
      ourCurrent.textContent = left;
      lastLeft = left;
    }
    if (right !== lastRight) {
      ourDuration.textContent = right;
      lastRight = right;
    }
  }

  function loop() {
    update();
    if (video && (video.playbackRate || 1) !== 1) {
      raf = requestAnimationFrame(loop);
    } else {
      raf = 0;
    }
  }

  function startLoop() {
    if (raf) return;
    raf = requestAnimationFrame(loop);
  }

  function stopLoop() {
    if (!raf) return;
    cancelAnimationFrame(raf);
    raf = 0;
  }

  function onRateChange() {
    lastLeft = "";
    lastRight = "";
    if (video && (video.playbackRate || 1) !== 1) startLoop();
    else {
      setScaledActive(false);
      stopLoop();
    }
    update();
  }

  function onVideoReady() {
    refresh();
    lastLeft = "";
    lastRight = "";
    if (video && (video.playbackRate || 1) !== 1) startLoop();
    update();
  }

  function bindVideo() {
    if (!video || video === listeningVideo) return;
    if (listeningVideo) {
      listeningVideo.removeEventListener("ratechange", onRateChange);
      listeningVideo.removeEventListener("loadedmetadata", onVideoReady);
      listeningVideo.removeEventListener("durationchange", onVideoReady);
      listeningVideo.removeEventListener("play", onVideoReady);
      listeningVideo.removeEventListener("seeked", update);
    }
    listeningVideo = video;
    video.addEventListener("ratechange", onRateChange);
    video.addEventListener("loadedmetadata", onVideoReady);
    video.addEventListener("durationchange", onVideoReady);
    video.addEventListener("play", onVideoReady);
    video.addEventListener("seeked", update);
  }

  function onTimeDisplayClick() {
    setTimeout(function () {
      syncRemainingMode();
      lastLeft = "";
      update();
    }, 0);
  }

  function bindTimeDisplayClick() {
    const contents = getPlayerRoot().querySelector(".ytp-time-contents");
    if (!contents || contents.dataset.ytSpeedBound) return;
    contents.dataset.ytSpeedBound = "1";
    contents.addEventListener("click", onTimeDisplayClick);
  }

  function refresh() {
    ensureStyle();
    video = document.querySelector(VIDEO_SEL);
    ensureOverlays();
    bindVideo();
    bindTimeDisplayClick();
  }

  function onNavigate() {
    remainingMode = false;
    lastLeft = "";
    lastRight = "";
    ourCurrent = null;
    ourDuration = null;
    refresh();
    if (video && (video.playbackRate || 1) !== 1) startLoop();
    update();
  }

  ["yt-navigate-finish", "yt-page-data-updated", "yt-player-updated"].forEach(
    function (evt) {
      document.addEventListener(evt, onNavigate);
    }
  );

  const mo = new MutationObserver(function () {
    if (video && (video.playbackRate || 1) !== 1) {
      if (!document.querySelector("." + CLS_CUR) || !document.querySelector("." + CLS_DUR)) {
        ourCurrent = null;
        ourDuration = null;
        ensureOverlays();
        update();
      }
    }
  });
  mo.observe(document.documentElement, { childList: true, subtree: true });

  refresh();
  if (video && (video.playbackRate || 1) !== 1) startLoop();
  update();
})();
