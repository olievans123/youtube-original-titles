# YouTube Original Titles

Safari extension that restores original (untranslated) video titles on YouTube. When YouTube auto-translates titles to your browser's language, this extension fetches the original title via the oEmbed API and replaces it.

![Screenshot](screenshot.png)

## Features

**Title Restoration**
- Restores original titles on homepage, search results, and sidebar recommendations
- Restores the main video title on watch pages
- Handles YouTube's SPA navigation without requiring a page reload

**Mix/Playlist Detection**
- Automatically skips Mix and playlist cards so their titles are left untouched

**Simple Controls**
- On/off toggle via the toolbar popup
- Enabled by default -- toggle off to see translated titles again

## How It Works

1. **Injection** (`inject.js`) -- Content script checks if the extension is enabled, then injects the main script into the page context
2. **Detection** (`content.js`) -- A MutationObserver watches for new video cards appearing in the DOM
3. **Lookup** -- For each card, extracts the video ID from its link and calls YouTube's `/oembed` endpoint to get the original title
4. **Replacement** -- If the displayed title differs from the original, it's replaced. Results are cached per session to avoid redundant requests
5. **Filtering** -- Cards with `list=` in their links (Mixes, playlists) are skipped entirely

## Install

1. Download the latest release from [Releases](https://github.com/olievans/youtube-original-titles/releases)
2. Unzip and move `YouTube Original Titles.app` to `/Applications`
3. Open the app once to register the extension
4. Go to Safari > Settings > Extensions and enable **YouTube Original Titles Extension**

### Build from Source

```bash
xcrun safari-web-extension-converter extension/ \
  --project-location . \
  --app-name "YouTube Original Titles" \
  --bundle-identifier com.olievans.yt-original-titles \
  --macos-only --no-open

xcodebuild -project "YouTube Original Titles/YouTube Original Titles.xcodeproj" \
  -scheme "YouTube Original Titles" build
```

## Tech Stack

- **Extension**: Manifest V3 Safari Web Extension
- **Title source**: YouTube oEmbed API (`/oembed?url=...&format=json`)
- **Packaging**: Xcode project generated via `safari-web-extension-converter`

## License

MIT
