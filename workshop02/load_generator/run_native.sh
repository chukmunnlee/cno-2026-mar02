#!/bin/sh
export K6_WEB_DASHBOARD_PORT=5665
export K6_BROWSER_HEADLESS=false
echo "http://localhost:${K6_WEB_DASHBOARD_PORT}"
$HOME/bin/k6 run --out dashboard $*
