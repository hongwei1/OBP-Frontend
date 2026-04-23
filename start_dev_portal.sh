#!/bin/bash
# Portal dev server — thin wrapper around apps/portal/start-dev.sh
# Runs on http://localhost:5174, logs at /tmp/obp-portal.log
exec "$(dirname "$0")/apps/portal/start-dev.sh"
