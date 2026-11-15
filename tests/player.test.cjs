const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { Window } = require('happy-dom');

const ROOT = path.join(__dirname, '..');
const PLAYER_HTML =
  '<div id="container"><div class="html5-video-player">' +
  '<video class="html5-main-video"></video>' +
  '<div class="ytp-time-display"><span class="ytp-time-contents">' +
  '<span class="ytp-time-current">12:00</span><span class="ytp-time-separator"> / </span>' +
  '<span class="ytp-time-duration">26:00</span></span></div>' +
  '</div></div>';

function stubVideo(video, { duration = 1560, currentTime = 720, playbackRate = 2 } = {}) {
  Object.defineProperties(video, {
    duration: { value: duration, writable: true, configurable: true },
    currentTime: { value: currentTime, writable: true, configurable: true },
    playbackRate: { value: playbackRate, writable: true, configurable: true }
  });
  return video;
}

function setup(script, { withPlayer = true } = {}) {
  const w = new Window();
  w.document.body.innerHTML = withPlayer ? PLAYER_HTML : '';
  const observers = [];
  class FakeObserver {
    constructor(cb) { this.cb = cb; this.targets = []; observers.push(this); }
    observe(target, opts) { this.targets.push({ target, opts }); }
    disconnect() { this.targets = []; }
  }
  let rafCalls = 0;
  const ctx = vm.createContext({
    window: w,
    document: w.document,
    getComputedStyle: w.getComputedStyle.bind(w),
    MutationObserver: FakeObserver,
    requestAnimationFrame: () => { rafCalls++; return 1; },
    cancelAnimationFrame: () => {},
    setTimeout: (fn) => fn(),
    isFinite
  });
  const player = () => w.document.querySelector('.html5-video-player');
  if (withPlayer) stubVideo(player().querySelector('video'));
  vm.runInContext(fs.readFileSync(path.join(ROOT, script), 'utf8'), ctx);
  const observing = (target) => observers.filter((o) => o.targets.some((t) => t.target === target));
  const active = () => observers.filter((o) => o.targets.length);
  return {
    w, observers, observing, active, player,
    rafCalls: () => rafCalls,
    video: () => player().querySelector('video'),
    cur: () => player().querySelector('.yt-speed-current'),
    dur: () => player().querySelector('.yt-speed-duration'),
    note: () => player().querySelector('.yt-speed-sr'),
    fire: (el, type) => el.dispatchEvent(new w.Event(type))
  };
}

for (const script of ['content.js', 'custom-script.js']) {
  test(script + ' handles speed, ads, live and navigation', () => {
    const t = setup(script);
    const old = t.player();
    assert.equal(t.dur().textContent, '13:00');
    assert.equal(t.cur().textContent, '6:00');

    const [playerObs] = t.observing(old).filter((o) => o.targets.some((x) => x.opts.attributes));
    old.classList.add('ad-showing');
    playerObs.cb([{ type: 'attributes', target: old, oldValue: 'html5-video-player yt-speed-scaled' }]);
    assert.equal(old.classList.contains('yt-speed-scaled'), false);
    old.classList.remove('ad-showing');
    playerObs.cb([{ type: 'attributes', target: old, oldValue: 'html5-video-player ad-showing' }]);
    assert.equal(old.classList.contains('yt-speed-scaled'), true);

    const video = t.video();
    video.playbackRate = 1; t.fire(video, 'ratechange');
    assert.equal(old.classList.contains('yt-speed-scaled'), false);
    video.duration = Infinity; video.playbackRate = 2; t.fire(video, 'ratechange');
    assert.equal(old.classList.contains('yt-speed-scaled'), false);

    const replacement = old.cloneNode(true);
    replacement.querySelectorAll('.yt-speed-current,.yt-speed-duration,.yt-speed-sr').forEach((n) => n.remove());
    old.remove();
    t.w.document.querySelector('#container').append(replacement);
    stubVideo(replacement.querySelector('video'), { duration: 600, currentTime: 120 });
    t.fire(t.w.document, 'yt-navigate-finish');
    assert.equal(old.classList.contains('yt-speed-scaled'), false);
    assert.equal(replacement.querySelectorAll('.yt-speed-duration').length, 1);
    assert.equal(replacement.querySelector('.yt-speed-duration').textContent, '5:00');
    assert.equal(t.observing(old).length, 0, 'old player is no longer observed');
  });

  test(script + ' is event-driven: no rAF loop, no document-wide observers', () => {
    const t = setup(script);
    assert.equal(t.rafCalls(), 0);
    const docEl = t.w.document.documentElement;
    assert.equal(t.observing(docEl).length, 0, 'documentElement not observed once the player exists');
    for (const o of t.active()) {
      for (const { target, opts } of o.targets) {
        if (target === t.player()) {
          assert.deepEqual([...opts.attributeFilter], ['class']);
          assert.ok(!opts.childList && !opts.subtree, 'player observed for class only');
        }
      }
    }

    const video = t.video();
    video.currentTime = 780; t.fire(video, 'timeupdate');
    assert.equal(t.cur().textContent, '6:30');
    video.currentTime = 100; t.fire(video, 'seeked');
    assert.equal(t.cur().textContent, '0:50');
    t.fire(video, 'pause');
    assert.equal(t.rafCalls(), 0, 'pausing schedules no frames');

    video.playbackRate = 1.5; t.fire(video, 'ratechange');
    assert.equal(t.dur().textContent, '17:20');
    assert.equal(t.cur().textContent, '1:06');

    video.playbackRate = 1; t.fire(video, 'ratechange');
    const before = t.cur().textContent;
    video.currentTime = 1000; t.fire(video, 'timeupdate');
    assert.equal(t.cur().textContent, before, 'no redraw at 1×');
    assert.equal(t.cur().style.display, 'none');
  });

  test(script + ' supports remaining mode via the clock', () => {
    const t = setup(script);
    t.player().querySelector('.ytp-time-current').textContent = '-14:00';
    t.fire(t.player().querySelector('.ytp-time-contents'), 'click');
    assert.equal(t.cur().textContent, '-7:00');
    assert.match(t.note().textContent, /^Remaining/);
    t.player().querySelector('.ytp-time-current').textContent = '12:00';
    const [displayObs] = t.observing(t.player().querySelector('.ytp-time-display'));
    displayObs.cb([{ type: 'childList', target: t.player().querySelector('.ytp-time-current'), addedNodes: [], removedNodes: [] }]);
    assert.equal(t.cur().textContent, '6:00');
  });

  test(script + ' exposes scaled times to assistive tech', () => {
    const t = setup(script);
    const nativeCur = t.player().querySelector('.ytp-time-current');
    const nativeDur = t.player().querySelector('.ytp-time-duration');
    assert.equal(t.cur().getAttribute('aria-hidden'), null);
    assert.equal(t.dur().getAttribute('aria-hidden'), null);
    assert.equal(nativeCur.getAttribute('aria-hidden'), 'true');
    assert.equal(nativeDur.getAttribute('aria-hidden'), 'true');
    assert.equal(t.note().textContent, 'Elapsed time and duration adjusted for 2× playback speed');

    const video = t.video();
    video.playbackRate = 1; t.fire(video, 'ratechange');
    assert.equal(nativeCur.getAttribute('aria-hidden'), null);
    assert.equal(nativeDur.getAttribute('aria-hidden'), null);
  });

  test(script + ' rebuilds labels when YouTube re-renders the clock', () => {
    const t = setup(script);
    const display = t.player().querySelector('.ytp-time-display');
    const [displayObs] = t.observing(display);
    assert.ok(displayObs, 'time display is observed');
    const label = t.cur();
    displayObs.cb([{ type: 'childList', target: label, addedNodes: [], removedNodes: [] }]);
    assert.equal(t.cur(), label, 'own text updates are ignored');
    t.cur().remove(); t.dur().remove();
    displayObs.cb([{ type: 'childList', target: display, addedNodes: [], removedNodes: [] }]);
    assert.equal(t.cur().textContent, '6:00');
    assert.equal(t.dur().textContent, '13:00');
  });

  test(script + ' waits for a late player with a temporary document observer', () => {
    const t = setup(script, { withPlayer: false });
    const docEl = t.w.document.documentElement;
    const [boot] = t.observing(docEl);
    assert.ok(boot, 'bootstrap observer armed');
    t.w.document.body.innerHTML = PLAYER_HTML;
    stubVideo(t.video());
    boot.cb([]);
    assert.equal(t.dur().textContent, '13:00');
    assert.equal(t.observing(docEl).length, 0, 'bootstrap observer disconnected');
  });
}
