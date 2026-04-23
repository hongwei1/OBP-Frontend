#!/bin/bash
################################################################################
# OBP-Portal Dev Server
#
# Runs `npm run dev` in the foreground and also writes a copy of stdout/stderr
# to /tmp/obp-portal.log so logs can be tailed from another terminal:
#
#   tail -f /tmp/obp-portal.log
################################################################################

set -e

RUNTIME_LOG=/tmp/obp-portal.log

cd "$(dirname "$0")"

echo "Starting OBP-Portal dev server (Ctrl+C to stop)"
echo "Runtime log also written to: $RUNTIME_LOG"
echo ""

npm run dev 2>&1 | tee "$RUNTIME_LOG"
