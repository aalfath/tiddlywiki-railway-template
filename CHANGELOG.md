# Changelog

Breaking changes are listed first in each entry. Read the entry before you apply an update in Railway. Your wiki lives on the volume at `/data/wiki` and is never rewritten by an update; back it up first anyway (see the README).

## v5.4.1 (2026-11-18)

- First release of this template: TiddlyWiki [v5.4.1](https://github.com/TiddlyWiki/TiddlyWiki5/releases/tag/v5.4.1) (npm `tiddlywiki@5.4.1`, tarball sha256 `8d7f05b5376c4336feff181be45271b31bea95ba4bbb3b696aa69558e8477722`) on `node:24.22.3-alpine3.24@sha256:116b800c3754b440ee0aa3ed2f20f5bf3d99a554bfd9adeea09ea8017f6e85f5`.
- Node.js client-server wiki on a volume at `/data`, created from TiddlyWiki's `server` edition on the first start only. Basic auth with a generated password, health check on `/healthz`, runs as the unprivileged `node` user. No prompts.
