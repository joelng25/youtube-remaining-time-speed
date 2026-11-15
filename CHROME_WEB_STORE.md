# Chrome Web Store — publishing guide

Listing: https://chromewebstore.google.com/detail/youtube-remaining-time-sp/aeiiffihjecajlabfllkkoenldfnamha

## File to upload

Build the ZIP (not a CRX) from the repo root:

```bash
bun run package   # or: npm run package
```

This writes:

`dist/youtube-remaining-time-speed-1.3.0.zip`

It contains only `manifest.json`, `content.js` and the icons. The version in the file name comes from `manifest.json`; bump it before every upload (the store rejects a version it has already seen).

## Updating the existing item

1. Developer dashboard: https://chrome.google.com/webstore/devconsole
2. Open **YouTube Remaining Time (Speed)** → **Package** → **Upload new package** → pick the ZIP.
3. Update the **Store listing** text below if behavior changed, then **Submit for review**.

## Store listing copy (paste)

### Name (max 75)
YouTube Remaining Time (Speed)

### Summary (max 132)
Scales YouTube’s clock by playback speed: elapsed, remaining and total time show real time at 1.5×, 2× and more.

### Detailed description

YouTube Remaining Time (Speed) adjusts the player clock to the speed you are watching at, so the numbers tell you how much of your time a video really takes.

What it does
• Divides both times on the player clock by the playback speed: at 2×, 12:39 / 26:00 shows as 6:19 / 13:00.
• Remaining mode: click YouTube’s clock to switch to remaining time (-M:SS); the remaining time is also scaled, so it is the real time left at your current speed.
• Updates live while you play, seek or change speed.
• Shows YouTube’s normal clock at 1×, during ads and on live streams.
• Works when you move between videos without reloading, and in the miniplayer.
• Screen-reader friendly: the adjusted times are announced, with a note saying they are adjusted for the current speed.

Privacy
No data collection, no accounts, no analytics and no network requests. It only changes the clock text on YouTube pages, locally in your browser.

### Category
Productivity (or Accessibility)

### Language
English (Spanish can be added as a second listing language)

## Single purpose declaration
Show YouTube’s player times (elapsed, remaining and total duration) adjusted for the current playback speed.

## Permission justification
Content script on youtube.com: required to read the video’s time and speed and show adjusted labels in the player clock. No other sites, no extra permissions, no remote code, no data collection.

## Privacy practices (form)

1. **Privacy practices → Data usage**: the extension **does not collect user data** (None).
2. **Privacy policy URL**: a public URL for `privacy-policy.html` (for example via GitHub Pages). Local file paths are not accepted.
3. Single purpose / permission justification: see above.

Files in this repo:
- `privacy-policy.html` — host this and use its public URL in the store
- `privacy-policy.md` — same text in Markdown

## Screenshots
Ready-made files (upload at least one; up to five are allowed):

- `store/screenshot-1280x800.png` — preferred size
- `store/screenshot-640x400.png` — alternate size

Recommended additions: 1× vs 2× side by side, remaining mode (`-M:SS`), and a small promo tile (440×280) such as “1:00:00 → 30:00 at 2×”.

Store icon: `icons/icon128.png` (128×128).

## After publishing
- Review usually takes hours to a few days.
- Next update: bump `version` in `manifest.json` (and `package.json`), run `bun run package`, upload the new ZIP.

## Local install (no store)
1. `chrome://extensions` → Developer mode → Load unpacked → this project folder.
2. Load the folder, not the ZIP.
