[![Deploy on Railway](https://railway.com/button.svg)](https://railway.com/new/template/tiddlywiki-1?utm_medium=integration&utm_source=button&utm_campaign=tiddlywiki)

# TiddlyWiki on Railway

A one-click Railway template for [TiddlyWiki](https://tiddlywiki.com/) 5, the open-source non-linear personal notebook (BSD-3-Clause, [TiddlyWiki/TiddlyWiki5](https://github.com/TiddlyWiki/TiddlyWiki5)). It runs TiddlyWiki's official Node.js server, so every edit is saved to the server as you make it, as one plain-text file per tiddler.

## What it deploys

| Service | Source | Data |
|---|---|---|
| **TiddlyWiki** | this repo's `Dockerfile`: TiddlyWiki **v5.4.1** (npm `tiddlywiki@5.4.1`, checksum verified at build) on the official `node:24.22.3-alpine3.24` image, pinned by digest | volume at `/data` (the wiki folder `/data/wiki`) |

TiddlyWiki has no official container image; its official server is the npm package, which is what this image installs. The service gets a public `*.up.railway.app` domain, a health check on `/healthz` (answers without login) and runs as the unprivileged `node` user.

## Variables

| Variable | Default | Notes |
|---|---|---|
| `TW_USERNAME` | `admin` | The wiki's login name. |
| `TW_PASSWORD` | `${{secret(24,"…letters and digits…")}}` | Generated per deploy. Read it in the service's **Variables** tab. The server refuses to start without one (8+ characters), so the wiki is never served without a login. |
| `PORT` | `8080` | Port the server listens on. |

Optional variables you can add later:

- `TW_READERS=(anon)`: anyone can read the wiki without logging in; editing still needs the login.
- `TW_DEBUG_LEVEL=full`: log every request.

## After deploy

1. Wait for the deploy to finish (about a minute). The first start creates a new, empty wiki on the volume from TiddlyWiki's `server` edition.
2. Copy `TW_PASSWORD` from the service's **Variables** tab.
3. Open `https://YOUR-DOMAIN/`, sign in as `admin` (or your `TW_USERNAME`) and start writing. Changes save automatically; the cloud icon in the sidebar shows the sync state.

To bring in an existing single-file wiki, drag its `.html` file onto the open wiki and click **Import**.

## Backups

- In the wiki: the cloud icon in the sidebar has **Save snapshot for offline use**, which downloads the whole wiki as one HTML file.
- Whole folder, with the [Railway CLI](https://docs.railway.com/guides/cli) linked to the project: `railway ssh -- tar czf - -C /data wiki | cat > tiddlywiki-backup.tgz`.

## Updates

Each TiddlyWiki release becomes a commit to `main` here that bumps `TIDDLYWIKI_VERSION`, its checksum and the pinned Node.js image, with a [`CHANGELOG.md`](CHANGELOG.md) entry (breaking changes first). Railway then shows an "update available" notice in projects deployed from this template, and you choose when to apply it. The wiki on the volume is kept; only the server and its core plugins change. Plugins you installed through the browser live in your wiki and stay as they are.

## Licence

TiddlyWiki is BSD-3-Clause, by Jeremy Ruston and contributors. This wrapper (a Dockerfile and a small start script) is MIT.
