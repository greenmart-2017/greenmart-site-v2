#!/usr/bin/env bash
set -euo pipefail

PORT=8080

if curl -sf "http://127.0.0.1:${PORT}/" > /dev/null 2>&1; then
  echo "Dev server already running on port ${PORT}"
  exit 0
fi

nohup python3 -m http.server "${PORT}" --bind 0.0.0.0 > /tmp/greenmart-dev-server.log 2>&1 &

for _ in $(seq 1 30); do
  if curl -sf "http://127.0.0.1:${PORT}/" > /dev/null 2>&1; then
    echo "Dev server ready on port ${PORT}"
    exit 0
  fi
  sleep 0.5
done

echo "Dev server failed to start on port ${PORT}" >&2
exit 1
