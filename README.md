# Runner — phone PWA (read-only Fomo live view)

Dark, phone-first PWA with tabs: Home, Agents, Activity, Account, plus Token detail,
Deposit and Withdraw screens. **Read-only:** never trades, never moves money, never talks to Fomo.
Deposit / Withdraw / Send / Transfer only open fomo.family. Bot Arena data is filtered out.

Open the app with the access key in the URL: `https://YOUR-SERVICE.onrender.com/?k=KEY`
Key lives in `data/.key` (not served over HTTP).

## Local run

```bash
./start.sh
# or: PORT=8787 python3 server.py
# open http://localhost:8787/?k=$(cat data/.key)
```

Stdlib only (Python 3.10+). Env overrides: `FOMO_LIVE`, `BUS`, `FEED`, `STALE_S` (default 1800), `PORT`.

## Deploy on Render (free Web Service)

1. Push this folder to a **GitHub** repo (private is fine).
2. In [Render Dashboard](https://dashboard.render.com) → **New +** → **Web Service**.
3. Connect the GitHub repo (or use Blueprint with `render.yaml`).
4. Settings:

| Field | Value |
| --- | --- |
| Name | `runner-app` (or any) |
| Region | closest to you |
| Runtime | **Python 3** |
| Build Command | *(leave empty)* or `true` |
| Start Command | `python3 server.py` |
| Instance type | **Free** |

5. Deploy. Public URL pattern: `https://<service-name>.onrender.com`
6. Phone link: `https://<service-name>.onrender.com/?k=<contents of data/.key>`

Free tier sleeps after idle; first open after sleep can take ~30–60s.

### Live Fomo data on Render

By default the service reads bundled files under `data/`:

- `data/fomo-live.json` — account, cash, positions, trades (write atomically: tmp then rename)
- `data/signal-bus.jsonl` — activity bus events
- `data/runner-feed.json` — crawler candidates
- `data/history.jsonl` — balance chart samples (appended by the server)

On a free Web Service the disk is ephemeral. To keep live numbers:

- Periodically **upload** updated JSON via Render Shell / SFTP-style workflows you set up, or
- Point env vars `FOMO_LIVE` / `BUS` / `FEED` at a durable store you sync into the instance, or
- Re-deploy / push updated `data/fomo-live.json` when the bots write a new snapshot.

Locally (on the trading box) keep writing `/workspace/fomo-live.json` etc.; for Render, copy those into `data/` before deploy or sync them somehow.

## API (needs `?k=` or header `X-Runner-Key`)

- `GET /api/state` → `{server_ts, live, bus, feed, history, samples}`
  - `live.status`: `ok` | `stale` | `missing`. UI empty-state unless `ok`.
- `GET /api/token?a=<address>` → DexScreener pair for one token.

Client polls every 5s.

## Files

`index.html`, `style.css`, `app.js`, `server.py`, `manifest.json`, `sw.js`, icons,
`data/.key`, sample `data/*.json`, `Procfile`, `render.yaml`, `requirements.txt`.
