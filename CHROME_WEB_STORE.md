# Chrome Web Store — publishing guide

## File to upload

Use the **ZIP** (not a CRX) for the Chrome Web Store:

`dist/youtube-remaining-time-speed-1.0.0.zip`

CRX is optional (local packing only). The store **requires a ZIP**.

## Prerequisites

1. Chrome Web Store Developer account: https://chrome.google.com/webstore/devconsole  
2. One-time developer registration fee (~USD 5).  
3. Click **New item** → upload the ZIP.

## Store listing copy (paste)

### Name (max 75)
YouTube Remaining Time (Speed)

### Summary (max 132)
Shows YouTube’s total video duration adjusted for playback speed (duration ÷ speed).

### Detailed description
YouTube Remaining Time (Speed) replaces the right-hand number on the player clock (total duration) so it reflects how long the video takes at the current playback speed.

How it works:
• At 1× you see the normal duration.
• At 2× you see half (e.g. 1:00:00 → 30:00).
• The value does not count down while playing — it only changes when you change speed or switch videos.
• It does not modify the left-hand time.

Privacy:
This extension does not collect data, does not use accounts, and does not send information to any server. It only updates the clock text on youtube.com.

### Category
Productivity (or Accessibility)

### Language
English

## Single purpose declaration
Adjust YouTube’s displayed total duration according to the current playback speed.

## Permission justification
Host access to youtube.com: required to update the player’s duration text on YouTube watch pages via a content script. No other sites. No remote code. No data collection.

## Privacy practices (form)

In the Chrome Web Store dashboard:

1. **Privacy practices → Data usage**  
   Select that the extension **does not collect user data** (None).

2. **Privacy policy URL** (required field in many listings)  
   Host `privacy-policy.html` publicly, then paste that URL.

   Quick free options:
   - Upload `privacy-policy.html` to GitHub and use the raw/GitHub Pages URL  
   - Or paste the HTML into a public Google Doc / Notion page and use the public link  

   Local file paths (`C:\...`) are **not** accepted.

3. Single purpose / permission justifications: see sections above.

Files in this repo:
- `privacy-policy.html` — host this and use its public URL in the store  
- `privacy-policy.md` — same text in Markdown  

## Screenshots (required)
Ready-made files (upload at least one):

- `store/screenshot-1280x800.png` — preferred size for Chrome Web Store
- `store/screenshot-640x400.png` — alternate size

Shows a YouTube-like player with speed **2x** and right-side duration adjusted (e.g. `12:34 / 30:00`).

Store icon: use `icons/icon128.png` (128×128).

## After publishing
- Google review usually takes hours to a few days.
- To update: upload a new ZIP with a higher `version` in `manifest.json` (e.g. 1.0.1).

## Local install (no store)
1. `chrome://extensions` → Developer mode → Load unpacked → this project folder.
2. Do not drag the ZIP as unpacked; use the folder. Modern Chrome limits CRX installs outside the store.
