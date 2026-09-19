# YouTube Remaining Time (Speed)

Chrome extension that replaces YouTube’s **right-side duration** with the total video length at your current playback speed:

```text
displayed duration = video duration ÷ playback rate
```

The value stays fixed while the video plays. It only updates when you change speed or switch videos. The left-hand time is left alone.

**Example:** a `1:06:24` video at **2×** shows `33:12` on the right.

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

| Speed | Right-side clock |
| --- | --- |
| 1× | Normal total duration |
| 1.5× | Duration ÷ 1.5 |
| 2× | Duration ÷ 2 |

A content script on `youtube.com` updates `.ytp-time-duration` in place. It does not change `.ytp-time-current`.

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
