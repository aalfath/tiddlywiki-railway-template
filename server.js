"use strict";
/*
TiddlyWiki on Railway: one Node.js process.

1. Prepares the wiki folder on the volume ($TW_DATA_DIR/wiki), creating it from
   TiddlyWiki's own "server" edition on the first start only.
2. Drops root to the `node` user once the volume is owned by it.
3. Starts TiddlyWiki's built-in server on 0.0.0.0:$PORT with basic auth
   (TW_USERNAME / TW_PASSWORD). It refuses to start without a password, so the
   wiki is never served anonymously by accident.
4. Answers GET /healthz with 200 before TiddlyWiki's auth, for Railway's health check.
*/
const fs = require("fs");
const path = require("path");

function log(msg) { console.log("[railway] " + msg); }
function fail(msg) { console.error("[railway] ERROR: " + msg); process.exit(1); }

const env = process.env;
const dataDir = env.TW_DATA_DIR || "/data";
const wikiDir = path.join(dataDir, "wiki");
const port = String(env.PORT || "8080");
const username = (env.TW_USERNAME || "admin").trim();
const password = env.TW_PASSWORD || "";
const readers = (env.TW_READERS || "").trim();     // e.g. "(anon)" for public read access
const debugLevel = (env.TW_DEBUG_LEVEL || "none").trim();

if (!/^[0-9]+$/.test(port)) fail("PORT must be a number, got '" + port + "'");
if (!username || /[,:]/.test(username) || username.startsWith("(")) fail("TW_USERNAME must be a plain name without ',' or ':'");
if (password.length < 8) fail("TW_PASSWORD must be set (8+ characters); the template generates one");

// --- 1. volume and ownership ------------------------------------------------
fs.mkdirSync(dataDir, { recursive: true });
const NODE_UID = 1000, NODE_GID = 1000;
if (typeof process.getuid === "function" && process.getuid() === 0) {
  // Railway mounts volumes owned by root. Hand the data to `node` (idempotent).
  const chownTree = (p) => {
    const st = fs.lstatSync(p);
    if (st.uid !== NODE_UID || st.gid !== NODE_GID) fs.lchownSync(p, NODE_UID, NODE_GID);
    if (st.isDirectory()) for (const e of fs.readdirSync(p)) chownTree(path.join(p, e));
  };
  chownTree(dataDir);
  process.setgroups([NODE_GID]);
  process.setgid(NODE_GID);
  process.setuid(NODE_UID);
  log("running as uid " + process.getuid());
}

const $tw = require("tiddlywiki/boot/boot.js").TiddlyWiki();

const firstStart = !fs.existsSync(path.join(wikiDir, "tiddlywiki.info"));
if (firstStart) {
  if (fs.existsSync(wikiDir) && fs.readdirSync(wikiDir).length > 0) {
    fail(wikiDir + " exists but has no tiddlywiki.info; refusing to overwrite it");
  }
  log("first start: creating a new wiki in " + wikiDir + " from the 'server' edition");
  // Separate process: plugins listed in tiddlywiki.info are only loaded at boot.
  const r = require("child_process").spawnSync(process.execPath,
    [require.resolve("tiddlywiki/tiddlywiki.js"), wikiDir, "--init", "server"], { stdio: "inherit" });
  if (r.status !== 0) fail("tiddlywiki --init server failed");
}

// --- 4. health check ahead of TiddlyWiki's auth ------------------------------
$tw.hooks.addHook("th-server-command-post-start", function (server, nodeServer) {
  const handlers = nodeServer.listeners("request");
  nodeServer.removeAllListeners("request");
  nodeServer.on("request", function (req, res) {
    const p = (req.url || "").split("?")[0];
    if ((req.method === "GET" || req.method === "HEAD") && p === "/healthz") {
      res.writeHead(200, { "Content-Type": "text/plain", "Cache-Control": "no-store" });
      res.end(req.method === "HEAD" ? undefined : "ok\n");
      return;
    }
    for (const h of handlers) h.call(nodeServer, req, res);
  });
  log("TiddlyWiki " + $tw.version + " serving " + wikiDir + " on port " + port + " (user '" + username + "')");
  const shutdown = (sig) => {
    log(sig + " received, closing");
    nodeServer.close();
    // give the filesystem adaptor a moment to finish pending writes
    setTimeout(() => process.exit(0), 1500).unref();
  };
  process.once("SIGTERM", () => shutdown("SIGTERM"));
  process.once("SIGINT", () => shutdown("SIGINT"));
  return server;
});

// --- 3. start TiddlyWiki ------------------------------------------------------
const listenArgs = [
  "--listen",
  "host=0.0.0.0",
  "port=" + port,
  "username=" + username,
  "password=" + password,
  "gzip=yes",
  "use-browser-cache=yes",
  "debug-level=" + debugLevel
];
if (readers) listenArgs.push("readers=" + readers);

$tw.boot.argv = [wikiDir].concat(listenArgs);
$tw.boot.boot();
