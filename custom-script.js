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
  const CLS_SR = "yt-speed-sr";
  const OUR_SEL = "." + CLS_CUR + ",." + CLS_DUR + ",." + CLS_SR;
  const PLAYER_STATE_CLASSES = ["ad-showing", "ytp-player-minimized", "ytp-live"];
  const VIDEO_EVENTS = {
    timeupdate: onTick,
    seeked: onTick,
    pause: onTick,
    play: onVideoReady,
    ratechange: onVideoReady,
    loadedmetadata: onVideoReady,
    durationchange: onVideoReady,
    emptied: onVideoReady
  };

  let previousPlayer = null;
  let video = null;
  let currentEl = null;
  let durationEl = null;
  let ourCurrent = null;
  let ourDuration = null;
  let ourNote = null;
  let listeningVideo = null;
  let observedPlayer = null;
  let observedDisplay = null;
  let remainingMode = false;
  let lastLeft = "";
  let lastRight = "";
  let lastNote = "";
  let cachedFontSize = "13px";
  let hiddenNatives = [];

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
      "font-family:inherit;letter-spacing:inherit;white-space:nowrap}" +
      "." + CLS_SR + "{position:absolute!important;width:1px;height:1px;" +
      "margin:-1px;padding:0;border:0;overflow:hidden;clip:rect(0 0 0 0);" +
      "clip-path:inset(50%);white-space:nowrap}";
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

  function formatRate(rate) {
    return String(Math.round(rate * 100) / 100) + "×";
  }

  function getPlayer() {
    return document.querySelector(".html5-video-player");
  }

  function getPlayerRoot() {
    const mini = document.querySelector(".ytp-miniplayer-ui");
    if (mini && getComputedStyle(mini).display !== "none") return mini;
    return getPlayer() || document.querySelector(".ytp-chrome-bottom") || document;
  }

  function isAdShowing() {
    const player = getPlayer();
    return !!(player && player.classList.contains("ad-showing"));
  }

  function isLive() {
    if (!video) return true;
    const display = getPlayerRoot().querySelector(".ytp-time-display");
    if (display && display.classList.contains("ytp-live")) return true;
    return !isFinite(video.duration) || video.duration === Infinity;
  }

  function makeLabel(cls, after) {
    const el = document.createElement("span");
    el.className = cls;
    after.insertAdjacentElement("afterend", el);
    return el;
  }

  function ensureOverlays() {
    const root = getPlayerRoot();
    currentEl = root.querySelector(".ytp-time-current");
    durationEl = root.querySelector(".ytp-time-duration");
    if (!currentEl || !durationEl) return false;

    ourCurrent = root.querySelector("." + CLS_CUR);
    if (!ourCurrent) {
      ourCurrent = makeLabel(CLS_CUR, currentEl);
      lastLeft = "";
    }

    ourDuration = root.querySelector("." + CLS_DUR);
    if (!ourDuration) {
      ourDuration = makeLabel(CLS_DUR, durationEl);
      lastRight = "";
    }

    ourNote = root.querySelector("." + CLS_SR);
    if (!ourNote) {
      ourNote = makeLabel(CLS_SR, ourDuration);
      lastNote = "";
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

  function restoreNatives() {
    hiddenNatives.forEach(function (el) {
      el.removeAttribute("aria-hidden");
    });
    hiddenNatives = [];
  }

  function hideNatives() {
    const els = [currentEl, durationEl].filter(Boolean);
    if (els.length === hiddenNatives.length && els.every(function (el, i) {
      return el === hiddenNatives[i];
    })) return;
    restoreNatives();
    els.forEach(function (el) {
      el.setAttribute("aria-hidden", "true");
    });
    hiddenNatives = els;
  }

  function setScaledActive(on) {
    const player = getPlayer();
    if (player) player.classList.toggle(CLS_PLAYER, on);
    [ourCurrent, ourDuration, ourNote].forEach(function (el) {
      if (el) el.style.display = on ? "" : "none";
    });
    if (on) hideNatives();
    else restoreNatives();
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
    if (isLive() || isAdShowing()) {
      setScaledActive(false);
      return;
    }
    if (!isFinite(video.duration) || !isFinite(video.currentTime)) return;

    const rate = video.playbackRate || 1;
    if (!isFinite(rate) || rate <= 0) return;

    if (rate === 1) {
      setScaledActive(false);
      return;
    }

    if (!ensureOverlays()) return;
    setScaledActive(true);
    syncRemainingMode();

    const right = formatTime(video.duration / rate);
    const left = remainingMode
      ? "-" + formatTime((video.duration - video.currentTime) / rate)
      : formatTime(video.currentTime / rate);
    const note =
      (remainingMode ? "Remaining" : "Elapsed") +
      " time and duration adjusted for " + formatRate(rate) + " playback speed";

    if (left !== lastLeft) {
      ourCurrent.textContent = left;
      lastLeft = left;
    }
    if (right !== lastRight) {
      ourDuration.textContent = right;
      lastRight = right;
    }
    if (note !== lastNote) {
      ourNote.textContent = note;
      lastNote = note;
    }
  }

  function onTick() {
    // Cheap path for frequent events: only redraw when speed is not 1×.
    if (!video || (video.playbackRate || 1) === 1) return;
    update();
  }

  function onVideoReady() {
    lastLeft = "";
    lastRight = "";
    lastNote = "";
    update();
  }

  function bindVideo() {
    if (video === listeningVideo) return;
    if (listeningVideo) {
      Object.keys(VIDEO_EVENTS).forEach(function (evt) {
        listeningVideo.removeEventListener(evt, VIDEO_EVENTS[evt]);
      });
    }
    listeningVideo = video;
    if (!video) return;
    Object.keys(VIDEO_EVENTS).forEach(function (evt) {
      video.addEventListener(evt, VIDEO_EVENTS[evt]);
    });
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

  function classSet(value) {
    return (value || "").split(/\s+/);
  }

  function stateClassChanged(record) {
    const before = classSet(record.oldValue);
    const target = record.target;
    return PLAYER_STATE_CLASSES.some(function (cls) {
      return before.includes(cls) !== !!(target.classList && target.classList.contains(cls));
    });
  }

  function isOurNode(node) {
    return !!(node && node.nodeType === 1 && node.matches && node.matches(OUR_SEL));
  }

  function isOwnRecord(record) {
    const target = record.target;
    const el = target && target.nodeType === 1 ? target : target && target.parentNode;
    if (el && el.closest && el.closest(OUR_SEL)) return true;
    if (record.type !== "childList") return false;
    const nodes = Array.from(record.addedNodes || []).concat(Array.from(record.removedNodes || []));
    return nodes.length > 0 && nodes.every(isOurNode);
  }

  function overlaysAttached() {
    return !!(ourCurrent && ourCurrent.isConnected && ourDuration && ourDuration.isConnected);
  }

  // Player element: only its class attribute (ads, miniplayer, live).
  const playerObserver = new MutationObserver(function (records) {
    if (!records.some(stateClassChanged)) return;
    refresh();
    onVideoReady();
  });

  // Player's parent: detects the player node being replaced or removed.
  const containerObserver = new MutationObserver(function () {
    if (observedPlayer && observedPlayer.isConnected && getPlayer() === observedPlayer) return;
    refresh();
    onVideoReady();
  });

  // Time display: YouTube re-rendering its clock (our labels dropped), the
  // live badge toggling, or the native clock switching to remaining mode.
  const displayObserver = new MutationObserver(function (records) {
    const relevant = records.filter(function (r) { return !isOwnRecord(r); });
    if (!relevant.length) return;
    const classChange = relevant.some(function (r) {
      return r.type === "attributes" && stateClassChanged(r);
    });
    const wasRemaining = remainingMode;
    syncRemainingMode();
    if (!classChange && overlaysAttached() && wasRemaining === remainingMode) return;
    if (!video || (video.playbackRate || 1) === 1) {
      if (classChange) update();
      return;
    }
    if (!overlaysAttached()) refresh();
    onVideoReady();
  });

  // Bootstrap only: waits for the first player, then disconnects.
  let bootstrapActive = false;
  const bootstrapObserver = new MutationObserver(function () {
    if (!getPlayer()) return;
    refresh();
    onVideoReady();
  });

  function setBootstrap(on) {
    if (on === bootstrapActive) return;
    bootstrapActive = on;
    if (on) bootstrapObserver.observe(document.documentElement, { childList: true, subtree: true });
    else bootstrapObserver.disconnect();
  }

  function bindObservers(player) {
    if (player !== observedPlayer) {
      playerObserver.disconnect();
      containerObserver.disconnect();
      observedPlayer = player;
      if (player) {
        playerObserver.observe(player, {
          attributes: true,
          attributeFilter: ["class"],
          attributeOldValue: true
        });
        if (player.parentNode) containerObserver.observe(player.parentNode, { childList: true });
      }
    }
    const display = player ? getPlayerRoot().querySelector(".ytp-time-display") : null;
    if (display !== observedDisplay) {
      displayObserver.disconnect();
      observedDisplay = display;
      if (display) {
        displayObserver.observe(display, {
          childList: true,
          subtree: true,
          characterData: true,
          attributes: true,
          attributeFilter: ["class"],
          attributeOldValue: true
        });
      }
    }
    setBootstrap(!player || !display);
  }

  function refresh() {
    ensureStyle();
    const player = getPlayer();
    if (previousPlayer && previousPlayer !== player) {
      restoreNatives();
      previousPlayer.classList.remove(CLS_PLAYER);
      previousPlayer.querySelectorAll(OUR_SEL).forEach(function (el) { el.remove(); });
      lastLeft = lastRight = lastNote = "";
    }
    previousPlayer = player;
    video = player ? player.querySelector(VIDEO_SEL) : null;
    ensureOverlays();
    bindVideo();
    bindTimeDisplayClick();
    bindObservers(player);
  }

  function onNavigate() {
    remainingMode = false;
    ourCurrent = null;
    ourDuration = null;
    ourNote = null;
    refresh();
    onVideoReady();
  }

  ["yt-navigate-finish", "yt-page-data-updated", "yt-player-updated"].forEach(
    function (evt) {
      document.addEventListener(evt, onNavigate);
    }
  );

  refresh();
  onVideoReady();
})();
