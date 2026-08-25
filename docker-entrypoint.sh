#!/bin/sh
set -eu
node --env-file-if-exists=.env --no-warnings --experimental-strip-types scripts/check-env.ts
node --env-file-if-exists=.env --no-warnings --experimental-strip-types scripts/init-db.ts
exec node server.js
