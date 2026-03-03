# CONVOY

Scripts for Webflow builds, served via JSDelivr.

## Setup

```bash
npm install
```

## Usage

### Add a script

Drop a `.js` file into `src/`, then build:

```bash
npm run build
```

This bundles and minifies each file into `dist/` (e.g. `src/nav.js` → `dist/nav.min.js`).

### Use in Webflow

Add scripts to your Webflow project via JSDelivr. After pushing to GitHub:

```html
<script src="https://cdn.jsdelivr.net/gh/shrinkstudio/convoy@latest/dist/YOUR_SCRIPT.min.js"></script>
```

For a pinned version (recommended for production):

```html
<script src="https://cdn.jsdelivr.net/gh/shrinkstudio/convoy@1.0.0/dist/YOUR_SCRIPT.min.js"></script>
```

### Development

Watch mode rebuilds on file changes:

```bash
npm run watch
```

## Purging JSDelivr cache

If you push an update and `@latest` still serves the old file:

```
https://purge.jsdelivr.net/gh/shrinkstudio/convoy@latest/dist/YOUR_SCRIPT.min.js
```
