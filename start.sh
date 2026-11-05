#!/bin/sh
# Local: background on 8787. On Render, use `python3 server.py` (Procfile / startCommand).
cd "$(dirname "$0")" || exit 1
mkdir -p logs data
if [ -n "$RENDER" ] || [ -n "$PORT" ] && [ "${PORT}" != "8787" ]; then
  exec python3 server.py
fi
nohup setsid python3 server.py > logs/server.log 2>&1 &
sleep 1
cat logs/server.log
