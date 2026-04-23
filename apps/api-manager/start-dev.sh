#!/bin/bash
################################################################################
# API Manager II Dev Server
#
# Runs `npm run dev` in the foreground and also writes a copy of stdout/stderr
# to /tmp/obp-api-manager.log so logs can be tailed from another terminal:
#
#   tail -f /tmp/obp-api-manager.log
################################################################################

set -e

RUNTIME_LOG=/tmp/obp-api-manager.log

cd "$(dirname "$0")"

echo "Starting API Manager II dev server (Ctrl+C to stop)"
echo "Runtime log also written to: $RUNTIME_LOG"
echo ""

npm run dev 2>&1 | tee "$RUNTIME_LOG"
