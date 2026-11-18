# TiddlyWiki 5 (Node.js client-server edition) for Railway.
# TiddlyWiki publishes no official container image; its official server is the
# `tiddlywiki` npm package. So this image is the official Node.js image, pinned by
# version and digest, plus that package, pinned by version and checksum.
FROM node:24.22.3-alpine3.24@sha256:116b800c3754b440ee0aa3ed2f20f5bf3d99a554bfd9adeea09ea8017f6e85f5

ARG TIDDLYWIKI_VERSION=5.4.1
ARG TIDDLYWIKI_SHA256=8d7f05b5376c4336feff181be45271b31bea95ba4bbb3b696aa69558e8477722

WORKDIR /app
RUN set -eux; \
    wget -q -O /tmp/tiddlywiki.tgz "https://registry.npmjs.org/tiddlywiki/-/tiddlywiki-${TIDDLYWIKI_VERSION}.tgz"; \
    echo "${TIDDLYWIKI_SHA256}  /tmp/tiddlywiki.tgz" | sha256sum -c -; \
    npm install --omit=dev --no-audit --no-fund --no-package-lock /tmp/tiddlywiki.tgz; \
    rm /tmp/tiddlywiki.tgz; \
    npm cache clean --force; \
    test "$(node -p 'require("tiddlywiki/package.json").version')" = "${TIDDLYWIKI_VERSION}"

COPY server.js /app/server.js
RUN node --check /app/server.js

ENV NODE_ENV=production \
    PORT=8080 \
    TW_DATA_DIR=/data
EXPOSE 8080

CMD ["node", "/app/server.js"]
