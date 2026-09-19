/**
 * Scales YouTube player times by playback speed:
 *   left  = currentTime / rate  (or -remaining/rate in remaining mode)
 *   right = duration / rate
 *
 * Updates on: new video / metadata, rate change.
 * While rate ≠ 1, also hooks timeupdate so YouTube cannot overwrite the left clock.
 * When rate returns to 1×, restores YouTube’s native (unscaled) times.
 */
(function () {
  if (window.__ytSpeedRemainingInstalled) return;
  window.__ytSpeedRemainingInstalled = true;

  const VIDEO_SEL = "video.html5-main-video, .html5-video-player video";

  let video = null;
  let currentEl = null;
  let durationEl = null;
  let listeningVideo = null;
  let lastRate = null;

  function formatTime(totalSeconds) {
    const s = Math.max(0, Math.floor(totalSeconds + 1e-9));
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    if (h > 0) {
      return (
        h +
        ":" +
        String(m).padStart(2, "0") +
        ":" +
        String(sec).padStart(2, "0")
      );
    }
    return m + ":" + String(sec).padStart(2, "0");
  }

  function getPlayerRoot() {
    const mini = document.querySelector(".ytp-miniplayer-ui");
    if (mini && getComputedStyle(mini).display !== "none") return mini;
    return (
      document.querySelector(".html5-video-player") ||
      document.querySelector(".ytp-chrome-bottom") ||
      document
    );
  }

  function refreshElements() {
    video = document.querySelector(VIDEO_SEL);
    const root = getPlayerRoot();
    currentEl = root.querySelector(".ytp-time-current");
    durationEl = root.querySelector(".ytp-time-duration");
    bindVideo();
  }

  function isLive() {
    if (!video) return true;
    const display = getPlayerRoot().querySelector(".ytp-time-display");
    if (display && display.classList.contains("ytp-live")) return true;
    return !isFinite(video.duration) || video.duration === Infinity;
  }

  function setText(el, text) {
    if (!el) return;
    let node = el.firstChild;
    while (node && node.nodeType !== Node.TEXT_NODE) {
      node = node.nextSibling;
    }
    if (node) {
      if (node.nodeValue !== text) node.nodeValue = text;
      return;
    }
    if (el.textContent !== text) el.textContent = text;
  }

  function isRemainingMode() {
    return !!(currentEl && /^\s*-/.test(currentEl.textContent || ""));
  }

  function writeTimes(rate) {
    if (!currentEl || !currentEl.isConnected || !durationEl || !durationEl.isConnected) {
      refreshElements();
    }
    if (!durationEl) return;

    setText(durationEl, formatTime(video.duration / rate));

    if (!currentEl) return;
    if (isRemainingMode()) {
      setText(
        currentEl,
        "-" + formatTime((video.duration - video.currentTime) / rate)
      );
    } else {
      setText(currentEl, formatTime(video.currentTime / rate));
    }
  }

  function update() {
    if (!video || !video.isConnected) {
      refreshElements();
      if (!video) return;
    }
    if (isLive()) return;
    if (!isFinite(video.duration) || !isFinite(video.currentTime)) return;

    const rate = video.playbackRate || 1;
    if (!isFinite(rate) || rate <= 0) return;

    const prev = lastRate;
    lastRate = rate;

    // Restore native times when returning to 1× (or staying at 1× after a scaled state)
    if (rate === 1) {
      if (prev !== 1) writeTimes(1);
      return;
    }

    writeTimes(rate);
  }

  function onRateChange() {
    update();
  }

  function onVideoStart() {
    lastRate = null;
    refreshElements();
    update();
  }

  function onTimeUpdate() {
    if (video && video.playbackRate !== 1) update();
  }

  function bindVideo() {
    if (!video || video === listeningVideo) return;
    if (listeningVideo) {
      listeningVideo.removeEventListener("ratechange", onRateChange);
      listeningVideo.removeEventListener("loadedmetadata", onVideoStart);
      listeningVideo.removeEventListener("durationchange", onVideoStart);
      listeningVideo.removeEventListener("play", onVideoStart);
      listeningVideo.removeEventListener("seeked", update);
      listeningVideo.removeEventListener("timeupdate", onTimeUpdate);
    }
    listeningVideo = video;
    lastRate = null;
    video.addEventListener("ratechange", onRateChange);
    video.addEventListener("loadedmetadata", onVideoStart);
    video.addEventListener("durationchange", onVideoStart);
    video.addEventListener("play", onVideoStart);
    video.addEventListener("seeked", update);
    video.addEventListener("timeupdate", onTimeUpdate);
  }

  function onNavigate() {
    lastRate = null;
    refreshElements();
    update();
  }

  ["yt-navigate-finish", "yt-page-data-updated", "yt-player-updated"].forEach(
    function (evt) {
      document.addEventListener(evt, onNavigate);
    }
  );

  refreshElements();
  update();
})();
