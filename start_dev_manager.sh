#!/bin/bash
# API Manager dev server — thin wrapper around apps/api-manager/start-dev.sh
# Runs on http://localhost:3003, logs at /tmp/obp-api-manager.log
exec "$(dirname "$0")/apps/api-manager/start-dev.sh"
