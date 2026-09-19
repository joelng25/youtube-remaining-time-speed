# YouTube Remaining Time (Speed)

Chrome extension that scales **both** YouTube player times by playback speed:

```text
left  (current)  = currentTime ÷ playback rate
right (duration) = duration ÷ playback rate
```

**Example at 2×:** media `12:39 / 26:00` shows as `6:19 / 13:00`.

If you click the clock into remaining mode (`-M:SS`), the left value is wall-clock remaining at the current speed.

[![Chrome Web Store](https://img.shields.io/badge/Chrome_Web_Store-Install-4285F4?logo=googlechrome&logoColor=white)](https://chromewebstore.google.com/search/YouTube%20Remaining%20Time%20(Speed))
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

![Player screenshot](store/screenshot-1280x800.png)

## Install

### Chrome Web Store (recommended)

Available on the [Chrome Web Store](https://chromewebstore.google.com/search/YouTube%20Remaining%20Time%20(Speed)) — search for **YouTube Remaining Time (Speed)**.

### From source

1. Clone this repository:
   ```bash
   git clone https://github.com/joelng25/youtube-remaining-time-speed.git
   cd youtube-remaining-time-speed
   ```
2. Open `chrome://extensions`
3. Enable **Developer mode**
4. Click **Load unpacked** and select this folder
5. Reload any open YouTube tabs

## How it works

| Speed | Left (current) | Right (duration) |
| --- | --- | --- |
| 1× | Normal elapsed | Normal total |
| 1.5× | Elapsed ÷ 1.5 | Duration ÷ 1.5 |
| 2× | Elapsed ÷ 2 | Duration ÷ 2 |

A content script on `youtube.com` updates `.ytp-time-current` and `.ytp-time-duration` in place.

## Privacy

No data collection, no analytics, no remote servers.

- [Privacy Policy](privacy-policy.html)

## Project layout

| File | Purpose |
| --- | --- |
| `manifest.json` | Chrome MV3 manifest |
| `content.js` | Extension content script |
| `custom-script.js` | Optional Enhancer for YouTube custom script |
| `icons/` | Extension icons |
| `store/` | Chrome Web Store screenshots |
| `privacy-policy.html` | Public privacy policy |

## Optional: Enhancer for YouTube

Prefer a userscript? Paste [`custom-script.js`](custom-script.js) into Enhancer’s **Custom script** and enable auto-execute. Do not run the extension and the custom script at the same time.

## License

MIT — see [LICENSE](LICENSE).
