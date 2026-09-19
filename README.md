# YouTube Remaining Time (Speed)

Chrome extension that replaces YouTube’s **right-side** duration (e.g. `1:06:24`) with the total video length at the current playback speed: `duration / playbackRate`.

That number stays fixed while the video plays and only changes when you change speed (or switch videos). The left time is left unchanged.

## Install (Chrome)

1. Open `chrome://extensions`
2. Enable **Developer mode** (top right)
3. Click **Load unpacked**
4. Select this folder: `C:\Users\joeln\youtube-remaining-time-speed`
5. Reload any open YouTube tabs

## Publish to Chrome Web Store

See [CHROME_WEB_STORE.md](CHROME_WEB_STORE.md). Upload:

`dist/youtube-remaining-time-speed-1.0.0.zip`

## Optional: Enhancer custom script

If you prefer Enhancer for YouTube instead of the extension, paste `custom-script.js` into **Custom script** and enable auto-execute. Do not run both at once.
