/**
 * Enhancer for YouTube™ — Custom script
 * Replaces the right-side duration (.ytp-time-duration) with the
 * total video length at the current playback speed:
 *   duration / playbackRate
 * Does not tick down with currentTime — only changes when speed (or video) changes.
 * Does not touch the left time (.ytp-time-current).
 *
 * Install: Enhancer options → Custom script → paste → Save
 * Enable: "Automatically execute the script when YouTube is loaded"
 */
(function () {
  if (window.__ytSpeedRemainingInstalled) return;
  window.__ytSpeedRemainingInstalled = true;

  const VIDEO_SEL = "video.html5-main-video, .html5-video-player video";

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

  function getPlayerRoot() {
    const mini = document.querySelector(".ytp-miniplayer-ui");
    if (mini && getComputedStyle(mini).display !== "none") return mini;
    return (
      document.querySelector(".html5-video-player") ||
      document.querySelector(".ytp-chrome-bottom") ||
      document
    );
  }

  function getVideo() {
    return document.querySelector(VIDEO_SEL);
  }

  function getDurationEl() {
    return getPlayerRoot().querySelector(".ytp-time-duration");
  }

  function isLive(video) {
    const display = getPlayerRoot().querySelector(".ytp-time-display");
    if (display && display.classList.contains("ytp-live")) return true;
    return !isFinite(video.duration) || video.duration === Infinity;
  }

  function setText(el, text) {
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

  function tick() {
    const video = getVideo();
    const el = getDurationEl();
    if (!video || !el || isLive(video)) return;

    const rate = video.playbackRate || 1;
    if (!isFinite(rate) || rate <= 0) return;
    if (!isFinite(video.duration)) return;

    // Total wall-clock length at current speed (stable while playing)
    setText(el, formatTime(video.duration / rate));
  }

  let raf = 0;
  function loop() {
    tick();
    raf = requestAnimationFrame(loop);
  }

  function start() {
    if (!raf) raf = requestAnimationFrame(loop);
  }

  ["yt-navigate-finish", "yt-page-data-updated", "yt-player-updated"].forEach(
    function (evt) {
      document.addEventListener(evt, start);
    }
  );

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();
