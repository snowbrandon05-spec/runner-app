#!/usr/bin/env python3
"""Runner backend: serves the PWA and /api/state (read-only).
Reads FOMO_LIVE / BUS / FEED (defaults: data/fomo-live.json, data/signal-bus.jsonl,
data/runner-feed.json) and live prices from the public DexScreener API.
Never trades, never moves money, never talks to Fomo.
/api/* requires the access key in data/.key (query ?k= or header X-Runner-Key)."""
import json, os, sys, time, threading, secrets, urllib.request
from datetime import datetime, timezone
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from urllib.parse import urlparse, parse_qs, unquote

ROOT = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(ROOT, "data")
FOMO_LIVE = os.environ.get("FOMO_LIVE", os.path.join(DATA, "fomo-live.json"))
BUS = os.environ.get("BUS", os.path.join(DATA, "signal-bus.jsonl"))
FEED = os.environ.get("FEED", os.path.join(DATA, "runner-feed.json"))
HIST = os.path.join(DATA, os.environ.get("HIST_NAME", "history.jsonl"))
STALE_S = int(os.environ.get("STALE_S", "1800"))      # fomo-live older than this = stale
PORT = int(os.environ.get("PORT", "8787"))
EXCLUDE = ("arena",)  # keep Bot Arena out
os.makedirs(DATA, exist_ok=True)
KEYF = os.path.join(DATA, ".key")
if not os.path.exists(KEYF):
    open(KEYF, "w").write(secrets.token_urlsafe(18))
KEY = open(KEYF).read().strip()

_lock = threading.Lock()
_px = {}     # addr -> (fetched_at, pair dict)
_samples = {}  # addr -> [(t, price, mcap)]

def now(): return time.time()

def parse_ts(s):
    try:
        d = datetime.fromisoformat(str(s).replace("Z", "+00:00"))
        if d.tzinfo is None: d = d.replace(tzinfo=timezone.utc)
        return d.timestamp()
    except Exception:
        return None

def read_json(p):
    try:
        with open(p) as f: return json.load(f)
    except Exception: return None

def no_arena(obj):
    return not any(x in json.dumps(obj).lower() for x in EXCLUDE)

def dex(addr):
    """Best (highest-liquidity) pair for a token address, cached 15 s."""
    if not addr: return None
    with _lock:
        c = _px.get(addr)
        if c and now() - c[0] < 15: return c[1]
    pair = None
    try:
        req = urllib.request.Request(f"https://api.dexscreener.com/latest/dex/tokens/{addr}",
                                     headers={"User-Agent": "runner-app/1.0"})
        with urllib.request.urlopen(req, timeout=8) as r:
            pairs = (json.load(r) or {}).get("pairs") or []
        pairs = [p for p in pairs if (p.get("baseToken") or {}).get("address", "").lower() == addr.lower()] or pairs
        if pairs:
            p = max(pairs, key=lambda p: (p.get("liquidity") or {}).get("usd") or 0)
            pair = {"price": float(p.get("priceUsd") or 0), "mcap": p.get("marketCap") or p.get("fdv"),
                    "fdv": p.get("fdv"), "liq": (p.get("liquidity") or {}).get("usd"),
                    "vol": p.get("volume") or {}, "chg": p.get("priceChange") or {},
                    "txns": p.get("txns") or {}, "created": p.get("pairCreatedAt"),
                    "symbol": (p.get("baseToken") or {}).get("symbol"), "name": (p.get("baseToken") or {}).get("name"),
                    "chain": p.get("chainId"), "url": p.get("url"),
                    "image": (p.get("info") or {}).get("imageUrl")}
    except Exception as e:
        pair = None
    with _lock:
        if pair:
            _px[addr] = (now(), pair)
            s = _samples.setdefault(addr, [])
            if not s or now() - s[-1][0] >= 5:
                s.append((now(), pair["price"], pair["mcap"])); del s[:-1500]
        elif c: return c[1]
    return pair

def num(*v):
    for x in v:
        try:
            if x is not None and x != "": return float(x)
        except Exception: pass
    return None

def split_tok(t):
    t = str(t or "")
    if ":" in t:
        a, b = t.split(":", 1); return a, b
    return t, None

def build_live():
    raw = read_json(FOMO_LIVE)
    if not isinstance(raw, dict):
        return {"status": "missing", "file": FOMO_LIVE}
    upd = parse_ts(raw.get("updated_at") or raw.get("ts"))
    if upd is None:
        try: upd = os.path.getmtime(FOMO_LIVE)
        except Exception: upd = None
    age = now() - upd if upd else None
    status = "ok" if age is not None and age <= STALE_S else "stale"
    cash = raw.get("cash")
    if not isinstance(cash, dict):
        cash = {"total": num(cash)}
    ct = num(cash.get("total"))
    tc, pc = num(cash.get("tokens")), num(cash.get("perps"))
    if ct is None and (tc is not None or pc is not None): ct = (tc or 0) + (pc or 0)
    if tc is None and pc is None and ct is not None: tc, pc = ct, 0.0
    positions = []
    for p in raw.get("positions") or []:
        if not no_arena(p): continue
        sym, addr = split_tok(p.get("token") or p.get("symbol"))
        addr = p.get("address") or addr
        amount = num(p.get("tokens"), p.get("amount"), p.get("qty"))
        value = num(p.get("value"), p.get("value_usd"))
        invested = num(p.get("invested"), p.get("cost"), p.get("cost_basis"))
        pct = num(p.get("percent_change"), p.get("pct_change"), p.get("pct"), p.get("change_pct"))
        d = dex(addr) if addr else None
        live_value = None
        if d and amount and d["price"]:
            live_value = amount * d["price"]
        v = live_value if live_value is not None else value
        if invested and v is not None:
            pct = (v / invested - 1) * 100
        elif invested is None and v is not None and pct is not None and pct > -100:
            invested = v / (1 + pct / 100)
        entry_price = num(p.get("entry_price"))
        if entry_price is None and invested and amount: entry_price = invested / amount
        positions.append({"symbol": sym or (d or {}).get("symbol") or "?", "name": p.get("name") or (d or {}).get("name") or sym,
                          "address": addr, "chain": p.get("chain") or (d or {}).get("chain") or "solana",
                          "amount": amount, "value": v, "file_value": value, "live": live_value is not None,
                          "invested": invested, "pct": pct, "entry_price": entry_price,
                          "stop": p.get("stop"), "opened_at": p.get("opened_at"), "dex": d})
    pos_val = sum(p["value"] or 0 for p in positions)
    bal = num(raw.get("balance"), raw.get("total"))
    if positions and any(p["live"] for p in positions) and ct is not None:
        bal = ct + pos_val
    elif bal is None and ct is not None:
        bal = ct + pos_val
    trades = []
    for t in raw.get("trades") or raw.get("recent_trades") or []:
        if not no_arena(t): continue
        sym, addr = split_tok(t.get("token") or t.get("symbol"))
        trades.append({"ts": t.get("ts") or t.get("time"), "t": parse_ts(t.get("ts") or t.get("time")),
                       "side": (t.get("side") or t.get("type") or "").lower(), "symbol": sym,
                       "address": t.get("address") or addr, "usd": num(t.get("usd"), t.get("amount_usd"), t.get("value")),
                       "mcap": num(t.get("mcap")), "price": num(t.get("price")),
                       "pnl": num(t.get("pnl_usd"), t.get("pnl")), "pnl_pct": num(t.get("pnl_pct")),
                       "by": t.get("by") or t.get("from"), "note": t.get("note") or t.get("detail")})
    trades.sort(key=lambda x: x["t"] or 0, reverse=True)
    acct = raw.get("account") or {}
    return {"status": status, "updated_at": raw.get("updated_at"), "updated_ts": upd, "age_s": age,
            "balance": bal, "cash": {"total": ct, "tokens": tc, "perps": pc},
            "change_24h": raw.get("change_24h"), "starting_balance": num(raw.get("starting_balance")),
            "risk": raw.get("risk"), "positions": positions, "tokens": raw.get("tokens") or [],
            "trades": trades, "account": acct, "bot": raw.get("bot") or {}}

def read_bus(limit=300):
    out = []
    try:
        with open(BUS) as f: lines = f.readlines()[-3000:]
    except Exception:
        return out
    for line in lines:
        try: ev = json.loads(line)
        except Exception: continue
        if not no_arena(ev): continue
        sym, addr = split_tok(ev.get("token"))
        ev["symbol"], ev["address"], ev["t"] = sym, addr, parse_ts(ev.get("ts"))
        out.append(ev)
    return out[-limit:]

def read_feed():
    f = read_json(FEED)
    if not isinstance(f, dict): return None
    keep = ["symbol", "name", "address", "chainId", "price_usd", "mcap", "liquidity_usd", "age_min", "chg_m5",
            "chg_h1", "chg_h24", "vol_h1", "vol_m5", "h1_buys", "h1_sells", "score", "flags", "rug_risk", "dexscreener_url"]
    cands = [{k: c.get(k) for k in keep} for c in (f.get("candidates") or [])]
    return {"updated_at": f.get("updated_at"), "updated_ts": parse_ts(f.get("updated_at")),
            "scanned_tokens": f.get("scanned_tokens"), "best": {k: (f.get("best") or {}).get(k) for k in keep} if f.get("best") else None,
            "candidates": cands}

def history():
    out = []
    try:
        with open(HIST) as f:
            for l in f.readlines()[-5000:]:
                try: out.append(json.loads(l))
                except Exception: pass
    except Exception: pass
    return out

_last_hist = [0, None]
def record(live):
    if live.get("status") != "ok" or live.get("balance") is None: return
    t = now()
    if t - _last_hist[0] < 20 and _last_hist[1] == live["balance"]: return
    if t - _last_hist[0] < 5: return
    _last_hist[0], _last_hist[1] = t, live["balance"]
    with open(HIST, "a") as f:
        f.write(json.dumps({"t": round(t, 1), "v": round(live["balance"], 4)}) + "\n")

def state():
    live = build_live()
    record(live)
    samples = {}
    with _lock:
        for p in live.get("positions") or []:
            a = p.get("address")
            if a and a in _samples: samples[a] = _samples[a][-720:]
    return {"server_ts": now(), "live": live, "bus": read_bus(), "feed": read_feed(),
            "history": history(), "samples": samples}

def recorder():
    while True:
        try: record(build_live())
        except Exception as e: print("recorder", e, file=sys.stderr)
        time.sleep(20)

class H(SimpleHTTPRequestHandler):
    def __init__(self, *a, **k): super().__init__(*a, directory=ROOT, **k)
    def log_message(self, *a): pass
    def end_headers(self):
        self.send_header("Cache-Control", "no-cache")
        super().end_headers()
    def do_GET(self):
        u = urlparse(self.path)
        rp = os.path.normpath(unquote(u.path)).lower()
        if rp.startswith("/data") or rp.endswith(".py") or "/." in rp or rp.endswith(".md"):
            return self.send_error(404)
        if u.path.startswith("/api/"):
            k = (parse_qs(u.query).get("k") or [""])[0] or self.headers.get("X-Runner-Key", "")
            if not secrets.compare_digest(k, KEY):
                return self._json({"error": "access key required"}, 401)
            if u.path == "/api/state": return self._json(state())
            if u.path == "/api/token":
                a = (parse_qs(u.query).get("a") or [""])[0]
                return self._json({"dex": dex(a) if a else None})
            return self._json({"error": "not found"}, 404)
        return super().do_GET()
    def _json(self, obj, code=200):
        b = json.dumps(obj, default=str).encode()
        self.send_response(code); self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(b))); self.end_headers(); self.wfile.write(b)

if __name__ == "__main__":
    threading.Thread(target=recorder, daemon=True).start()
    print(f"Runner on http://0.0.0.0:{PORT}/?k={KEY}", flush=True)
    ThreadingHTTPServer(("0.0.0.0", PORT), H).serve_forever()
