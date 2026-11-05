'use strict';
/* Runner — read-only live view. Data: /api/state (fomo-live.json + signal bus + crawler feed + DexScreener). */
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const LS={get:(k,d)=>{try{const v=localStorage.getItem('runner.'+k);return v==null?d:JSON.parse(v)}catch(e){return d}},set:(k,v)=>{try{localStorage.setItem('runner.'+k,JSON.stringify(v))}catch(e){}}};
const qk=new URLSearchParams(location.search).get('k'); if(qk) LS.set('key',qk);
const KEY=LS.get('key','');
const FOMO='https://fomo.family';
const POLL_MS=5000;

/* ---------- icons ---------- */
const I={
 home:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/></svg>',
 bot:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="4" y="7" width="16" height="13" rx="4"/><path d="M12 3v4M9 13h.01M15 13h.01M9.5 16.5h5"/></svg>',
 pulse:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12h4l3-8 4 16 3-8h6"/></svg>',
 user:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/></svg>',
 back:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>',
 chev:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M9 5l7 7-7 7"/></svg>',
 down:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M6 9l6 6 6-6"/></svg>',
 radar:'<svg viewBox="0 0 36 36" fill="none" stroke="#00FF66" stroke-width="1.6"><circle cx="18" cy="18" r="11" opacity=".5"/><circle cx="18" cy="18" r="5.5" opacity=".7"/><circle cx="18" cy="18" r="1.6" fill="#00FF66"/></svg>',
 mag:'<svg viewBox="0 0 24 24" fill="none" stroke="#7aa2ff" stroke-width="2.2" stroke-linecap="round"><circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.2-4.2"/></svg>',
 robot:'<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"><rect x="4" y="7" width="16" height="12" rx="3.5"/><path d="M12 3v4M9 12.5h.01M15 12.5h.01"/></svg>',
 shield:'<svg viewBox="0 0 24 24" fill="none" stroke="#ffb020" stroke-width="2" stroke-linejoin="round"><path d="M12 3l8 3v6c0 4.5-3.4 8-8 9-4.6-1-8-4.5-8-9V6z"/><path d="M9 12l2 2 4-4"/></svg>',
 crypto:'<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M9.5 8.5h4a2 2 0 0 1 0 4h-4h4.5a2 2 0 0 1 0 4h-4.5zM11 7v2M11 16v2" stroke-linecap="round"/></svg>',
 apple:'<svg viewBox="0 0 24 24" fill="#fff"><path d="M16.4 12.6c0-2.4 2-3.5 2-3.6-1.1-1.6-2.8-1.8-3.4-1.8-1.4-.1-2.8.9-3.5.9s-1.8-.9-3-.8C7 7.3 5.6 8.2 4.8 9.6c-1.6 2.8-.4 6.9 1.1 9.2.8 1.1 1.7 2.3 2.9 2.3 1.1 0 1.6-.7 3-.7s1.8.7 3 .7 2-1.1 2.8-2.2c.9-1.3 1.2-2.5 1.2-2.6 0 0-2.4-.9-2.4-3.7zM14.2 5.6c.6-.8 1.1-1.8.9-2.9-.9 0-2 .6-2.7 1.4-.6.7-1.1 1.7-1 2.8 1.1.1 2.1-.5 2.8-1.3z"/></svg>',
 card:'<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><rect x="3" y="5.5" width="18" height="13" rx="2.5"/><path d="M3 10h18M7 15h3"/></svg>',
 bank:'<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linejoin="round"><path d="M3 9l9-5 9 5zM5 9v9M9.5 9v9M14.5 9v9M19 9v9M3 20h18"/></svg>',
 plus:'<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
 upa:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg>',
 send:'<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linejoin="round"><path d="M21 3L10 14M21 3l-7 18-4-7-7-4z"/></svg>',
 share:'<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12M7 8l5-5 5 5M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6"/></svg>',
 gear:'<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>',
 star:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.8l2.8 5.8 6.3.9-4.6 4.4 1.1 6.3L12 17.2l-5.6 3 1.1-6.3L2.9 9.5l6.3-.9z"/></svg>',
 info:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/></svg>',
 bksp:'<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"><path d="M9 5h11a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H9l-6-7z"/><path d="M12 9.5l5 5M17 9.5l-5 5"/></svg>',
 buy:'<svg viewBox="0 0 24 24" fill="none" stroke="#2F6BFF" stroke-width="2.6" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
 sell:'<svg viewBox="0 0 24 24" fill="none" stroke="#00FF66" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5L20 7"/></svg>',
 warn:'<svg viewBox="0 0 24 24" fill="none" stroke="#FF3B4E" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l10 18H2z"/><path d="M12 10v5M12 18h.01"/></svg>',
 cool:'<svg viewBox="0 0 24 24" fill="none" stroke="#8e8e96" stroke-width="2.4" stroke-linecap="round"><path d="M5 12h14"/></svg>',
};
const LOGO='<svg class="logo" viewBox="0 0 512 512"><defs><linearGradient id="lg" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#2F6BFF"/><stop offset="1" stop-color="#00FF66"/></linearGradient></defs><rect width="512" height="512" rx="120" fill="url(#lg)"/><path d="M98 372 L200 260 L262 314 L392 168" fill="none" stroke="#050505" stroke-width="48" stroke-linecap="round" stroke-linejoin="round"/><path d="M318 158 L404 156 L402 242" fill="none" stroke="#050505" stroke-width="48" stroke-linecap="round" stroke-linejoin="round"/></svg>';

/* ---------- format ---------- */
const n2=(v,d=2)=>Number(v).toLocaleString('en-US',{minimumFractionDigits:d,maximumFractionDigits:d});
const usd=v=>v==null||isNaN(v)?'—':(v<0?'-$':'$')+n2(Math.abs(v));
const sUsd=v=>v==null||isNaN(v)?'—':(v>=0?'+$':'-$')+n2(Math.abs(v));
const pct=v=>v==null||isNaN(v)?'—':(v>=0?'+':'')+n2(v,1)+'%';
const cls=v=>v==null||isNaN(v)?'mut':v>=0?'up':'dn';
const mc=v=>{if(v==null||isNaN(v))return '—';v=+v;const a=Math.abs(v);return a>=1e9?'$'+n2(v/1e9,2)+'B':a>=1e6?'$'+n2(v/1e6,2)+'M':a>=1e3?'$'+n2(v/1e3,1)+'K':'$'+n2(v,0)};
const price=v=>{if(v==null||isNaN(v)||v===0)return '—';v=+v;if(v>=1)return '$'+n2(v,v>=1000?0:2);const s=v.toExponential(2);const e=-Math.floor(Math.log10(v));return e>=5?'$0.0'+toSub(e-1)+String(Math.round(v*10**(e+3))).slice(0,4):'$'+v.toPrecision(4)};
const toSub=n=>String(n).split('').map(c=>'₀₁₂₃₄₅₆₇₈₉'[c]).join('');
const kfmt=v=>v==null?'—':v>=1e6?n2(v/1e6,1)+'M':v>=1e3?n2(v/1e3,1)+'K':n2(v,0);
const etTime=t=>new Date(t*1000).toLocaleTimeString('en-US',{timeZone:'America/New_York',hour:'numeric',minute:'2-digit'})+' ET';
const etFull=t=>new Date(t*1000).toLocaleString('en-US',{timeZone:'America/New_York',month:'short',day:'numeric',hour:'numeric',minute:'2-digit',second:'2-digit'})+' ET';
const ago=s=>s==null?'—':s<60?Math.round(s)+'s ago':s<3600?Math.round(s/60)+'m ago':s<86400?Math.round(s/3600)+'h ago':Math.round(s/86400)+'d ago';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const hue=s=>{let h=0;for(const c of String(s))h=(h*31+c.charCodeAt(0))%360;return h};
const tokAv=(sym,img,lg)=>`<span class="av ${lg||''}" style="background:hsl(${hue(sym)} 85% 62%)">${img?`<img src="${esc(img)}" alt="" onerror="this.remove()">`:''}${img?'':esc((sym||'?')[0].toUpperCase())}</span>`;

/* ---------- rolling number ---------- */
function roll(el,str){
  if(!el)return;
  const chars=[...str];
  if(el._s===str)return;
  if(!el._s||el._s.length!==str.length||el._s.replace(/\d/g,'0')!==str.replace(/\d/g,'0')){
    el.className='roll';
    el.innerHTML=chars.map(c=>/\d/.test(c)?`<span class="d"><i>${'0123456789'.split('').map(x=>`<span>${x}</span>`).join('')}</i></span>`:`<span class="c">${esc(c)}</span>`).join('');
    const ds=$$('.d>i',el);
    ds.forEach(i=>{i.style.transition='none';i.style.transform='translateY(0)';});
    void el.offsetWidth;
    ds.forEach(i=>i.style.transition='');
  }
  let k=0;const ds=$$('.d>i',el);
  chars.forEach(c=>{if(/\d/.test(c)){ds[k].style.transform=`translateY(${-1.15*+c}em)`;k++}});
  el._s=str;
}
function countUp(el,to,fmt=v=>Math.round(v).toLocaleString('en-US')){
  if(!el)return;const from=el._v??0;if(from===to){el.textContent=fmt(to);return}
  const t0=performance.now(),d=900;el._v=to;
  const step=t=>{const p=Math.min(1,(t-t0)/d),e=1-Math.pow(1-p,3);el.textContent=fmt(from+(to-from)*e);if(p<1)requestAnimationFrame(step)};requestAnimationFrame(step);
}

/* ---------- state ---------- */
const S={data:null,err:null,lastOk:0,tab:'home',homeSeg:'tokens',homeChip:'trending',tf:'LIVE',seen:new Set(LS.get('seen',[])),first:true,stars:new Set(LS.get('stars',[])),evRendered:new Set()};
function freshLive(){const L=S.data?.live;return L&&L.status==='ok'?L:null}

/* ---------- events (unified) ---------- */
const AGENT={hunter:'Executor',guard:'Risk',crawler:'Scanner',risk:'Risk',executor:'Executor',analyst:'Analyst',scanner:'Scanner'};
function parseDetail(d){
  d=String(d||'');const o={};
  let m=d.match(/(?:spent|for|proceeds ~?)\s*\$?([\d,.]+)/i);if(m)o.usd=+m[1].replace(/,/g,'');
  m=d.match(/^\s*\$([\d,.]+)/);if(!o.usd&&m)o.usd=+m[1].replace(/,/g,'');
  m=d.match(/(loss|profit|gain)\s*~?\$?([\d,.]+)/i);if(m)o.pnl=(m[1].toLowerCase()==='loss'?-1:1)*+m[2].replace(/,/g,'');
  m=d.match(/m(?:ca)?p?\s*~?\$?([\d.]+)\s*([KMB])/i)||d.match(/at ~?\$?([\d.]+)([KMB]) m(?:ca)?p/i);if(m)o.mcap=+m[1]*{K:1e3,M:1e6,B:1e9}[m[2].toUpperCase()];
  m=d.match(/score ([\d.]+)/);if(m)o.score=+m[1];
  return o;
}
function events(){
  const D=S.data;if(!D)return[];
  const out=[];const L=D.live||{};
  (L.trades||[]).forEach(t=>{if(!t.t)return;out.push({id:'tr|'+t.t+'|'+t.symbol+'|'+t.side,t:t.t,kind:t.side.startsWith('s')?'sell':'buy',sym:t.symbol,addr:t.address,agent:AGENT[(t.by||'').toLowerCase()]||(t.by||'Executor'),usd:t.usd,mcap:t.mcap,pnl:t.pnl,pnlPct:t.pnl_pct,note:t.note,src:'fomo-live'})});
  (D.bus||[]).forEach(e=>{if(!e.t)return;const p=parseDetail(e.detail);
    const kind={bought:'buy',sold:'sell',runner_found:'found',runner_cooling:'cool',rug_risk:'rug',hi_topup:'buy',skipped:'skip'}[e.type]||e.type;
    if(out.some(x=>x.src==='fomo-live'&&x.sym===e.symbol&&x.kind===kind&&Math.abs(x.t-e.t)<180))return;
    let pp=null;if(kind==='sell'&&p.pnl!=null&&p.usd)pp=p.pnl/(p.usd-p.pnl)*100;
    out.push({id:'bus|'+e.ts+'|'+e.type+'|'+e.token,t:e.t,kind,sym:e.symbol,addr:e.address,agent:AGENT[e.from]||e.from,usd:p.usd,mcap:p.mcap,pnl:p.pnl,pnlPct:pp,score:p.score,note:e.detail,src:'bus'})});
  return out.sort((a,b)=>b.t-a.t);
}
const evTitle=e=>({buy:'Bought ',sell:'Sold ',found:'Runner found ',cool:'Cooling ',rug:'Rug risk ',skip:'Skipped '}[e.kind]||e.kind+' ')+e.sym;
const evIcon=e=>({buy:I.buy,sell:I.sell,found:I.radar,rug:I.warn,cool:I.cool}[e.kind]||I.pulse);
function evRow(e,isNew){
  let right='';
  if(e.kind==='sell'||e.kind==='buy'){right=`<div class="rt"><div class="t1 ${e.kind==='sell'?cls(e.pnl):''}">${e.kind==='sell'&&e.pnl!=null?sUsd(e.pnl):usd(e.usd)}</div><div class="t2 ${cls(e.pnlPct)}">${e.pnlPct!=null?pct(e.pnlPct):(e.mcap?mc(e.mcap)+' MC':'')}</div></div>`}
  else if(e.score!=null)right=`<div class="rt"><div class="t1 ${e.kind==='found'?'up':'mut'}">${n2(e.score,0)}</div><div class="t2">score</div></div>`;
  return `<div class="row ${isNew?'new':''}" data-sym="${esc(e.sym)}" data-addr="${esc(e.addr||'')}"><span class="ev-ic">${evIcon(e)}</span><div class="mid"><div class="t1">${esc(evTitle(e))}<span class="tag">${esc(e.agent)}</span></div><div class="t2">${etTime(e.t)} · ${esc(e.note||'')}</div></div>${right}</div>`;
}

/* ---------- data fetch ---------- */
async function poll(){
  try{
    const r=await fetch('api/state?k='+encodeURIComponent(KEY),{cache:'no-store'});
    if(r.status===401){S.err='key';S.data=null}
    else if(!r.ok)throw new Error(r.status);
    else{S.data=await r.json();S.err=null;S.lastOk=Date.now()}
  }catch(e){S.err='net'}
  render();
  notifyNew();
}
function notifyNew(){
  const ev=events();
  const trades=ev.filter(e=>e.kind==='buy'||e.kind==='sell'||e.kind==='rug');
  if(S.first){trades.forEach(e=>S.seen.add(e.id));S.first=false;LS.set('seen',[...S.seen].slice(-500));return}
  const fresh=trades.filter(e=>!S.seen.has(e.id)&&Date.now()/1000-e.t<3600);
  trades.forEach(e=>S.seen.add(e.id));LS.set('seen',[...S.seen].slice(-500));
  if(fresh.length)banner(fresh[0]);
}
let bTimer;
function banner(e){
  const b=$('#banner');
  let txt;
  if(e.kind==='sell')txt=`Sold ${e.usd!=null?usd(e.usd)+' ':''}${e.sym}${e.mcap?' at '+mc(e.mcap)+' MC':''}${e.pnl!=null?' • '+sUsd(e.pnl)+(e.pnlPct!=null?' ('+pct(e.pnlPct)+')':''):''}`;
  else if(e.kind==='buy')txt=`Bought ${e.usd!=null?usd(e.usd)+' ':''}${e.sym}${e.mcap?' at '+mc(e.mcap)+' MC':''}`;
  else txt=`Rug risk on ${e.sym}: ${e.note||''}`;
  b.innerHTML=`${tokAv(e.sym)}<div class="bt"><b>${esc(e.agent)} · now</b>${esc(txt)}</div>`;
  b.onclick=()=>{b.classList.remove('in');openToken(e.sym,e.addr)};
  requestAnimationFrame(()=>b.classList.add('in'));
  if(navigator.vibrate)navigator.vibrate(20);
  clearTimeout(bTimer);bTimer=setTimeout(()=>b.classList.remove('in'),5000);
}

/* ---------- common bits ---------- */
function updLine(){
  const D=S.data,L=D?.live;
  if(S.err==='key')return `<div class="upd stale">Access key missing — open the link with ?k=…</div>`;
  if(S.err==='net'&&!D)return `<div class="upd stale">Can't reach the Runner server</div>`;
  if(!L)return '';
  const st=L.status==='ok'?'':'stale';
  const when=L.updated_ts?`${etFull(L.updated_ts)} (${ago(Date.now()/1000-L.updated_ts)})`:'never';
  return `<div class="upd ${st}"><span style="color:${L.status==='ok'?'var(--g)':'#ffb020'}">●</span> Last updated ${when}${S.err==='net'?' · reconnecting':''}</div>`;
}
function emptyState(){
  const L=S.data?.live;
  if(S.err==='key')return `<div class="empty"><b>Access key needed</b>Open the private link that includes <code>?k=</code>.</div>`;
  if(!S.data)return `<div class="empty"><b>Connecting…</b>Waiting for the Runner server.</div>`;
  if(!L||L.status==='missing')return `<div class="empty"><b>No live data yet</b>The Fomo bot hasn't written its live file yet. Numbers will appear here as soon as it does.</div>`;
  if(L.status==='stale')return `<div class="empty"><b>Live data is stale</b>The last update was ${ago(L.age_s)}. Numbers are hidden until fresh data arrives.</div>`;
  return '';
}

/* ---------- tabs ---------- */
function setupTabs(){
  const tb=$('#tabbar');
  tb.innerHTML=[['home',I.home],['agents',I.bot],['activity',I.pulse],['account',I.user]].map(([k,ic])=>`<button data-t="${k}" aria-label="${k}">${ic}</button>`).join('');
  tb.onclick=e=>{const b=e.target.closest('button');if(b)go(b.dataset.t)};
  go(LS.get('tab','home'));
}
function go(t){S.tab=t;LS.set('tab',t);$$('#tabbar button').forEach(b=>b.classList.toggle('on',b.dataset.t===t));$$('.tab').forEach(x=>x.classList.toggle('on',x.id==='tab-'+t));render(true)}
function render(force){
  const f={home:renderHome,agents:renderAgents,activity:renderActivity,account:renderAccount}[S.tab];f&&f(force);
  if(S.cur&&S.cur.refresh)S.cur.refresh();
}

/* ---------- HOME ---------- */
function renderHome(){
  const el=$('#tab-home');
  if(!el._built){
    el.innerHTML=`<div class="top">${LOGO}<button class="pill btn-b" id="hDep">Deposit</button></div>
    <div id="hUpd"></div><div class="bal"><div class="big"><span id="hBal"></span></div><div class="chg" id="hChg"></div></div>
    <div id="hEmpty"></div>
    <div class="sec">Weekly Top Trades</div><div class="hs" id="hTop"></div>
    <div class="seg" id="hSeg"><button data-s="watch">Watchlist</button><button data-s="tokens">Tokens</button><button data-s="perps">Perps<span class="badge">New</span></button></div>
    <div class="chips" id="hChips"></div><div class="list" id="hList"></div>`;
    $('#hDep').onclick=depositSheet;
    $('#hSeg').onclick=e=>{const b=e.target.closest('button');if(b){S.homeSeg=b.dataset.s;renderHome()}};
    $('#hChips').onclick=e=>{const b=e.target.closest('button');if(b){S.homeChip=b.dataset.c;renderHome()}};
    el.addEventListener('click',e=>{const r=e.target.closest('[data-sym]');if(r)openToken(r.dataset.sym,r.dataset.addr)});
    el._built=1;
  }
  const L=freshLive();
  $('#hUpd').innerHTML=updLine();
  $('#hEmpty').innerHTML=L?'':emptyState();
  if(L&&L.balance!=null){roll($('#hBal'),usd(L.balance));
    let c=L.change_24h;let cu=c?.usd??null,cp=c?.pct??null;
    if(cu==null){const h=(S.data.history||[]);const t24=Date.now()/1000-86400;const old=h.find(p=>p.t>=t24);if(old&&h.length>1&&old.t<Date.now()/1000-3600){cu=L.balance-old.v;cp=old.v?cu/old.v*100:null}}
    $('#hChg').innerHTML=cu==null?'<span class="mut">24h change builds as data arrives</span>':`<span class="${cls(cu)}">${sUsd(cu)} (${pct(cp)})</span> <span class="mut">24h</span>`;
  }else{$('#hBal').className='';$('#hBal')._s=null;$('#hBal').textContent='—';$('#hChg').innerHTML=''}
  // top trades
  const wk=Date.now()/1000-7*86400;
  const tops=events().filter(e=>e.kind==='sell'&&e.pnl>0&&e.t>wk).sort((a,b)=>b.pnl-a.pnl).slice(0,8);
  const hd=S.data?.live?.account?.handle;
  $('#hTop').innerHTML=tops.length?tops.map(e=>`<div class="tt" data-sym="${esc(e.sym)}" data-addr="${esc(e.addr||'')}"><div class="h"><span class="av" style="background:#2F6BFF;color:#fff">${esc((hd||e.agent||'R')[0].toUpperCase())}</span>${esc(hd?'@'+hd:e.agent)}<span style="margin-left:auto">${tokAv(e.sym)}</span></div><div class="p up">${sUsd(e.pnl)}</div><div class="t2 mut" style="font-size:13px;margin-top:4px">${esc(e.sym)} · ${etTime(e.t)}</div></div>`).join('')
    :`<div class="tt" style="width:100%;color:var(--tx2);font-size:14px">No profitable trades in the last 7 days.</div>`;
  $$('#hSeg button').forEach(b=>b.classList.toggle('on',b.dataset.s===S.homeSeg));
  const chips=S.homeSeg==='tokens'?[['crypto','Crypto'],['trending','Trending'],['held','Most held'],['grad','Graduate']]:[];
  $('#hChips').innerHTML=chips.map(([k,v])=>`<button class="chip ${S.homeChip===k?'on':''}" data-c="${k}">${v}</button>`).join('');
  $('#hChips').style.display=chips.length?'':'none';
  const list=$('#hList');
  if(S.homeSeg==='perps'){list.innerHTML=`<div class="empty"><b>Perps not tracked</b>Runner only shows Fomo token trading. Perps are off for this account.</div>`;return}
  let rows=[];
  if(S.homeSeg==='watch'){
    (L?.positions||[]).forEach(p=>rows.push({sym:p.symbol,addr:p.address,sub:(p.amount?kfmt(p.amount)+' tokens · ':'')+(p.dex?mc(p.dex.mcap)+' MC':'held'),val:usd(p.value),chg:p.pct,img:p.dex?.image}));
    (S.data?.feed?.candidates||[]).filter(c=>S.stars.has(c.address)&&!rows.some(r=>r.addr===c.address)).forEach(c=>rows.push({sym:c.symbol,addr:c.address,sub:mc(c.mcap)+' MC',val:price(c.price_usd),chg:c.chg_h1}));
    list.innerHTML=rows.length?rows.map(tokRow).join(''):`<div class="empty"><b>Nothing here yet</b>Open positions and starred tokens show up here.</div>`;return;
  }
  const F=S.data?.feed;let c=[...(F?.candidates||[])];
  if(!c.length){list.innerHTML=`<div class="empty"><b>No scanner data</b>The runner crawler feed is empty or offline.</div>`;return}
  const srt={crypto:(a,b)=>(b.mcap||0)-(a.mcap||0),trending:(a,b)=>(b.score||0)-(a.score||0),held:(a,b)=>(b.h1_buys||0)-(a.h1_buys||0),grad:(a,b)=>(a.age_min??1e9)-(b.age_min??1e9)}[S.homeChip];
  c.sort(srt);
  list.innerHTML=`<div class="upd">Scanner feed ${F.updated_ts?'updated '+ago(Date.now()/1000-F.updated_ts):''} · DexScreener</div>`+c.slice(0,25).map(x=>tokRow({sym:x.symbol,addr:x.address,sub:mc(x.mcap)+' MC'+(x.rug_risk&&x.rug_risk.length?' · ⚠︎ '+x.rug_risk[0]:''),val:price(x.price_usd),chg:x.chg_h1})).join('');
  flashPrices(list);
}
const tokRow=r=>`<div class="row" data-sym="${esc(r.sym)}" data-addr="${esc(r.addr||'')}">${tokAv(r.sym,r.img,'lg')}<div class="mid"><div class="t1">${esc(r.sym)}</div><div class="t2">${esc(r.sub)}</div></div><div class="rt"><div class="t1 px" data-k="${esc(r.addr)}">${r.val}</div><div class="t2 ${cls(r.chg)}">${pct(r.chg)}${r.chg!=null?' <span class="mut">1h</span>':''}</div></div></div>`;
const lastPx={};
function flashPrices(root){$$('.px',root).forEach(e=>{const k=e.dataset.k,v=e.textContent;if(lastPx[k]&&lastPx[k]!==v){e.classList.remove('flash-u','flash-d');void e.offsetWidth;e.classList.add(parseFloat(v.replace(/[^\d.]/g,''))>=parseFloat(lastPx[k].replace(/[^\d.]/g,''))?'flash-u':'flash-d')}lastPx[k]=v})}

/* ---------- AGENTS ---------- */
function renderAgents(force){
  const el=$('#tab-agents');
  if(!el._built){
    el.innerHTML=`<div class="ahead"><div><div class="nm" id="aName"></div><div class="sub" id="aSub"></div></div><span class="live" id="aLive"><span class="dot"></span><span>Live</span></span></div>
    <div id="aUpd"></div><div id="aEmpty"></div>
    <div class="bal"><div class="big"><span id="aBal"></span></div></div>
    <div class="stats"><div><span>Total profit</span><b id="aPnl">—</b></div><div><span>Multiplier</span><b id="aMul">—</b></div><div><span>Open</span><b id="aOpen">—</b></div></div>
    <div class="chart"><canvas id="aChart"></canvas></div>
    <div class="tf" id="aTf">${['LIVE','1H','4H','1D','1W','ALL'].map(x=>`<button data-f="${x}" class="${x==='LIVE'?'lv':''}">${x}</button>`).join('')}</div>
    <div class="sec"><span id="aRun">Agents</span></div>
    <div class="hs" id="aCards">
      <div class="card"><div class="radar">${I.radar}</div><div class="nm">Scanner</div><div class="v" id="cScan">—</div><div class="s" id="cScanS">tokens scanned</div></div>
      <div class="card"><div class="ic">${I.mag}</div><div class="nm">Analyst</div><div style="display:flex;align-items:flex-end;gap:10px;margin-top:auto"><div class="gauge" id="cGauge"><svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="27" stroke="#24242b" stroke-width="7" fill="none"/><circle id="cGArc" cx="32" cy="32" r="27" stroke="#00FF66" stroke-width="7" fill="none" stroke-linecap="round" stroke-dasharray="169.6" stroke-dashoffset="169.6"/></svg><b id="cScore">—</b></div><div class="s" id="cAnS" style="flex:1"></div></div></div>
      <div class="card"><div class="ic">${I.robot}</div><div class="nm">Executor</div><div class="v" id="cEx">—</div><div class="s" id="cExS">trades</div></div>
      <div class="card"><div class="ic">${I.shield}</div><div class="nm">Risk</div><div class="v" id="cRisk" style="font-size:18px">—</div><div class="s" id="cRiskS"></div></div>
    </div>
    <div class="sec">Activity <small id="aFeedN"></small></div><div class="feed" id="aFeed"></div>`;
    $('#aTf').onclick=e=>{const b=e.target.closest('button');if(b){S.tf=b.dataset.f;drawChart(true);syncTf()}};
    $('#aName').onclick=agentSheet;
    $('#aFeed').onclick=e=>{const r=e.target.closest('[data-sym]');if(r)openToken(r.dataset.sym,r.dataset.addr)};
    syncTf();el._built=1;force=true;
  }
  const D=S.data,L=freshLive(),F=D?.feed;
  $('#aName').innerHTML=`${esc(D?.live?.bot?.name||'Fomo bots')} ${I.down}`;
  const nOpen=L?L.positions.length:null;
  $('#aSub').textContent=L?`connected · ${nOpen} open position${nOpen===1?'':'s'}`:(S.err?'disconnected':'waiting for live data');
  $('#aLive').classList.toggle('off',!L);$('#aLive span:last-child').textContent=L?'Live':'Offline';
  $('#aUpd').innerHTML=updLine();$('#aEmpty').innerHTML=L?'':emptyState();
  if(L&&L.balance!=null){
    roll($('#aBal'),usd(L.balance));
    let pnl=null,mul=null;
    if(L.starting_balance){pnl=L.balance-L.starting_balance;mul=L.balance/L.starting_balance}
    else{const ps=events().filter(e=>e.kind==='sell'&&e.pnl!=null);if(ps.length)pnl=ps.reduce((a,e)=>a+e.pnl,0)}
    $('#aPnl').innerHTML=`<span class="${cls(pnl)}">${sUsd(pnl)}</span>`;$('#aMul').textContent=mul?n2(mul,2)+'x':'—';$('#aOpen').textContent=nOpen;
  }else{const b=$('#aBal');b.className='';b._s=null;b.textContent='—';$('#aPnl').textContent='—';$('#aMul').textContent='—';$('#aOpen').textContent='—'}
  // cards
  const now=Date.now()/1000,fFresh=F&&F.updated_ts&&now-F.updated_ts<600;
  const ev=events();
  if(F){countUp($('#cScan'),F.scanned_tokens||0);const nf=ev.filter(e=>e.kind==='found'&&now-e.t<3600).length;$('#cScanS').textContent=`tokens per sweep · ${nf} runners found 1h · ${F.updated_ts?ago(now-F.updated_ts):''}`}
  else{$('#cScan').textContent='—';$('#cScanS').textContent='scanner offline'}
  const best=F?.best||(F?.candidates||[]).slice().sort((a,b)=>(b.score||0)-(a.score||0))[0];
  if(best&&best.score!=null){const g=$('#cGauge');if($('#cScore').textContent!==String(Math.round(best.score))){g.classList.remove('spin');void g.offsetWidth;g.classList.add('spin')}
    $('#cScore').textContent=Math.round(best.score);$('#cGArc').style.strokeDashoffset=169.6*(1-Math.min(100,best.score)/100);$('#cGArc').setAttribute('stroke',best.score>=60?'#00FF66':best.score>=40?'#ffb020':'#FF3B4E');
    $('#cAnS').innerHTML=`scoring<br><b style="color:#fff">${esc(best.symbol)}</b><br>${mc(best.mcap)} MC`}
  else{$('#cScore').textContent='—';$('#cAnS').textContent='no candidates'}
  const tr=ev.filter(e=>e.kind==='buy'||e.kind==='sell');
  $('#cEx').textContent=tr.length?tr.length:'0';
  $('#cExS').innerHTML=tr.length?`fills · last: ${esc(evTitle(tr[0]))}<br>${ago(now-tr[0].t)}`:'no fills yet';
  const rk=L?.risk||{};const rugs=ev.filter(e=>e.kind==='rug'&&now-e.t<3600).length;
  $('#cRisk').innerHTML=rk.stop||rk.max?`${rk.stop?'stop '+esc(rk.stop):''}${rk.max?'<br>max '+esc(rk.max):''}`:'—';
  $('#cRiskS').textContent=`${rugs} rug flags in 1h${rk.note?' · '+rk.note:''}`;
  const running=[fFresh,fFresh,!!L,!!L].filter(Boolean).length;$('#aRun').textContent=`${running} running`;
  // feed
  const feed=$('#aFeed');const items=ev.filter(e=>e.kind!=='cool').slice(0,40);
  $('#aFeedN').textContent=items.length?'':'';
  const html=items.map(e=>evRow(e,!S.evRendered.has(e.id)&&S.evRendered.size>0)).join('')||`<div class="empty"><b>No bot activity</b>Events from the signal bus show up here.</div>`;
  if(feed._h!==html){feed.innerHTML=html;feed._h=html}
  items.forEach(e=>S.evRendered.add(e.id));
  drawChart(force);
}
function syncTf(){$$('#aTf button').forEach(b=>b.classList.toggle('on',b.dataset.f===S.tf))}
const TFS={LIVE:1800,'1H':3600,'4H':14400,'1D':86400,'1W':604800,ALL:1e12};
let chartAnim=1;
function drawChart(animate){
  const cv=$('#aChart');if(!cv||S.tab!=='agents')return;
  const dpr=devicePixelRatio||1,w=cv.clientWidth,h=cv.clientHeight;if(!w)return;
  cv.width=w*dpr;cv.height=h*dpr;const c=cv.getContext('2d');c.scale(dpr,dpr);
  const L=freshLive();const now=Date.now()/1000;
  let pts=(S.data?.history||[]).filter(p=>p.t>=now-TFS[S.tf]);
  if(L&&L.balance!=null)pts=[...pts,{t:now,v:L.balance}];
  c.clearRect(0,0,w,h);
  if(!L||pts.length<2){c.fillStyle='#5c5c64';c.font='13px -apple-system,system-ui,sans-serif';c.textAlign='center';c.fillText(L?'Chart builds as live updates arrive':'No live data',w/2,h/2);return}
  const t0=S.tf==='ALL'?pts[0].t:now-TFS[S.tf],t1=now;
  let mn=Math.min(...pts.map(p=>p.v)),mx=Math.max(...pts.map(p=>p.v));if(mx-mn<mx*0.002){mx+=mx*0.002+0.01;mn-=mn*0.002+0.01}
  const X=t=>12+(t-t0)/(t1-t0||1)*(w-30),Y=v=>14+(1-(v-mn)/(mx-mn))*(h-28);
  const draw=p=>{
    c.clearRect(0,0,w,h);
    const cut=t0+(t1-t0)*p;const vis=pts.filter(q=>q.t<=cut);if(vis.length<1)return;
    const g=c.createLinearGradient(0,0,0,h);g.addColorStop(0,'rgba(0,255,102,.22)');g.addColorStop(1,'rgba(0,255,102,0)');
    c.beginPath();vis.forEach((q,i)=>i?c.lineTo(X(q.t),Y(q.v)):c.moveTo(X(q.t),Y(q.v)));
    c.lineTo(X(vis.at(-1).t),h);c.lineTo(X(vis[0].t),h);c.fillStyle=g;c.fill();
    c.beginPath();vis.forEach((q,i)=>i?c.lineTo(X(q.t),Y(q.v)):c.moveTo(X(q.t),Y(q.v)));
    c.strokeStyle='#00FF66';c.lineWidth=2.2;c.lineJoin='round';c.stroke();
    const vAt=t=>{let a=pts[0];for(const q of pts){if(q.t>=t){if(q===a)return q.v;const f=(t-a.t)/(q.t-a.t);return a.v+(q.v-a.v)*f}a=q}return pts.at(-1).v};
    events().filter(e=>(e.kind==='buy'||e.kind==='sell')&&e.t>=Math.max(t0,pts[0].t)&&e.t<=cut).forEach(e=>{c.beginPath();c.arc(X(e.t),Y(vAt(e.t)),5,0,7);c.fillStyle=e.kind==='buy'?'#2F6BFF':'#00FF66';c.fill();c.lineWidth=2;c.strokeStyle='#000';c.stroke()});
    const last=vis.at(-1);if(p>=1){c.beginPath();c.arc(X(last.t),Y(last.v),4.5,0,7);c.fillStyle='#00FF66';c.fill();c.beginPath();c.arc(X(last.t),Y(last.v),9,0,7);c.fillStyle='rgba(0,255,102,.2)';c.fill()}
  };
  if(animate){const s=performance.now();const f=t=>{const p=Math.min(1,(t-s)/900);draw(1-Math.pow(1-p,3));if(p<1)requestAnimationFrame(f)};requestAnimationFrame(f)}else draw(1);
}
function agentSheet(){
  const D=S.data,F=D?.feed,L=freshLive(),now=Date.now()/1000;
  const rows=[['Scanner','Runner crawler (DexScreener)',F&&now-(F.updated_ts||0)<600],['Analyst','Scores scanner candidates',F&&now-(F.updated_ts||0)<600],['Executor','Fomo buys and sells',!!L],['Risk','Stops and rug checks',!!L]];
  sheet(`<h3>Agents</h3>${rows.map(([n,d,on])=>`<div class="srow"><span class="ic" style="background:#202026">${{Scanner:I.radar,Analyst:I.mag,Executor:I.robot,Risk:I.shield}[n]}</span><div><b>${n}</b><small>${d}</small></div><span class="live ${on?'':'off'}" style="margin-left:auto"><span class="dot"></span>${on?'Live':'Idle'}</span></div>`).join('')}<div class="foot">Read-only. Runner can't start, stop or trade with these bots.</div>`);
}

/* ---------- ACTIVITY ---------- */
function renderActivity(){
  const el=$('#tab-activity');
  if(!el._built){el.innerHTML=`<div class="top"><div style="font-size:28px;font-weight:800">Activity</div></div><div id="acUpd"></div><div class="chips" id="acChips"></div><div class="feed" id="acList"></div>`;
    el.addEventListener('click',e=>{const c=e.target.closest('[data-c]');if(c){S.acF=c.dataset.c;renderActivity();return}const r=e.target.closest('[data-sym]');if(r)openToken(r.dataset.sym,r.dataset.addr)});el._built=1}
  S.acF=S.acF||'all';
  $('#acUpd').innerHTML=updLine();
  $('#acChips').innerHTML=[['all','All'],['trades','Trades'],['found','Runners'],['rug','Risk']].map(([k,v])=>`<button class="chip ${S.acF===k?'on':''}" data-c="${k}">${v}</button>`).join('');
  const f={all:()=>true,trades:e=>e.kind==='buy'||e.kind==='sell',found:e=>e.kind==='found'||e.kind==='cool',rug:e=>e.kind==='rug'}[S.acF];
  const ev=events().filter(f).slice(0,250);
  const html=ev.length?ev.map(e=>evRow(e)).join(''):`<div class="empty"><b>No events</b>${S.data?'Nothing on the signal bus yet.':'Connecting…'}</div>`;
  if($('#acList')._h!==html){$('#acList').innerHTML=html;$('#acList')._h=html}
}

/* ---------- ACCOUNT ---------- */
function renderAccount(){
  const el=$('#tab-account');
  if(!el._built){
    el.innerHTML=`<div class="prof"><div class="hd"><button id="pShare" aria-label="share">${I.share}</button><button id="pSet" aria-label="settings">${I.gear}</button></div><div id="pBody"></div></div>
    <div id="pUpd"></div>
    <div class="cashc"><div class="mut" style="font-size:14px">Total cash</div><div class="big" style="font-size:36px"><span id="pCash">—</span></div>
      <div class="split"><div>Tokens cash<b id="pTok">—</b></div><div>Perps cash<b id="pPerp">—</b></div></div>
      <button class="btn-full btn-grey" style="color:#fff;padding:13px;font-size:16px" id="pXfer">Transfer cash</button></div>
    <button class="arow" id="rDep"><span class="ic">${I.plus}</span><div><div class="t1" style="font-weight:600">Deposit</div><div class="t2 mut" style="font-size:13px">Add cash in Fomo</div></div><span class="chev">${I.chev}</span></button>
    <button class="arow" id="rWd"><span class="ic">${I.bank}</span><div><div style="font-weight:600">Withdraw</div><div class="mut" style="font-size:13px">Bank account or crypto wallet</div></div><span class="chev">${I.chev}</span></button>
    <button class="arow" id="rSend"><span class="ic">${I.send}</span><div><div style="font-weight:600">Send</div><div class="mut" style="font-size:13px">Transfer cash to anyone</div></div><span class="chev">${I.chev}</span></button>
    <div class="foot">Runner is a read-only view of your Fomo bots' live data (bot status files + public DexScreener prices). It never trades or moves money. Deposit, withdraw, send and transfer finish in the Fomo app. Not affiliated with Fomo.</div>`;
    $('#rDep').onclick=depositSheet;$('#rWd').onclick=openWithdraw;$('#rSend').onclick=()=>handoff('Send cash','Sending cash happens in Fomo. Runner can\'t move money.');
    $('#pXfer').onclick=()=>handoff('Transfer cash','Moving cash between Tokens and Perps happens in Fomo.');
    $('#pShare').onclick=async()=>{const h=S.data?.live?.account?.handle;const u=h?FOMO+'/profile/'+h:FOMO;try{await navigator.share({url:u})}catch(e){try{await navigator.clipboard.writeText(u);toast('Profile link copied')}catch(_){toast(u)}}};
    $('#pSet').onclick=settingsSheet;
    el._built=1;
  }
  const A=S.data?.live?.account||{},L=freshLive();
  const h=A.handle||'';
  $('#pBody').innerHTML=`<span class="av xl" style="background:linear-gradient(135deg,#2F6BFF,#00FF66);color:#000">${A.avatar?`<img src="${esc(A.avatar)}" alt="">`:esc((A.display_name||h||'?')[0].toUpperCase())}</span>
    <div class="n">${esc(A.display_name||h||'Your account')}</div><div class="h">${h?'@'+esc(h):'—'}</div>${A.bio?`<div class="bio">${esc(A.bio)}</div>`:''}
    <div class="fw"><span><b>${A.followers??'—'}</b> followers</span><span><b>${A.following??'—'}</b> following</span></div>`;
  $('#pUpd').innerHTML=updLine();
  if(L&&L.cash.total!=null){roll($('#pCash'),usd(L.cash.total));$('#pTok').textContent=usd(L.cash.tokens);$('#pPerp').textContent=usd(L.cash.perps)}
  else{const c=$('#pCash');c.className='';c._s=null;c.textContent='—';$('#pTok').textContent='—';$('#pPerp').textContent='—'}
}
function settingsSheet(){sheet(`<h3>Settings</h3><div class="srow"><div><b>Refresh</b><small>Every ${POLL_MS/1000} seconds</small></div></div><div class="srow"><div><b>Data sources</b><small>fomo-live.json · signal bus · runner crawler · DexScreener</small></div></div><button class="srow" id="clrS"><div><b>Clear starred tokens</b><small>${S.stars.size} starred</small></div></button>`,s=>{$('#clrS',s).onclick=()=>{S.stars.clear();LS.set('stars',[]);closeSheet();toast('Cleared')}})}

/* ---------- sheets / stack ---------- */
function sheet(html,init){
  closeSheet(true);
  const host=$('#sheets');host.innerHTML=`<div class="ov"></div><div class="sheet"><div class="grab"></div>${html}</div>`;
  const ov=$('.ov',host),sh=$('.sheet',host);ov.onclick=()=>closeSheet();
  let y0=null;sh.addEventListener('touchstart',e=>{if(sh.scrollTop<=0)y0=e.touches[0].clientY},{passive:true});
  sh.addEventListener('touchmove',e=>{if(y0==null)return;const d=e.touches[0].clientY-y0;if(d>0){sh.style.transition='none';sh.style.transform=`translateY(${d}px)`}},{passive:true});
  sh.addEventListener('touchend',e=>{if(y0==null)return;const d=e.changedTouches[0].clientY-y0;sh.style.transition='';sh.style.transform='';y0=null;if(d>110)closeSheet()});
  init&&init(sh);requestAnimationFrame(()=>requestAnimationFrame(()=>{ov.classList.add('in');sh.classList.add('in')}));return sh;
}
function closeSheet(now){const host=$('#sheets');if(!host.firstChild)return;if(now){host.innerHTML='';return}$$('.ov,.sheet',host).forEach(x=>x.classList.remove('in'));setTimeout(()=>{if(!$('.sheet.in',host))host.innerHTML=''},380)}
const stack=[];
function push(build){
  const s=document.createElement('div');s.className='screen';$('#stack').appendChild(s);
  const api=build(s)||{};s._api=api;stack.push(s);S.cur=api;
  const prev=stack.at(-2);requestAnimationFrame(()=>requestAnimationFrame(()=>{s.classList.add('in');prev&&prev.classList.add('under')}));
  let x0=null;s.addEventListener('touchstart',e=>{const x=e.touches[0].clientX;if(x<24)x0=x},{passive:true});
  s.addEventListener('touchend',e=>{if(x0!=null&&e.changedTouches[0].clientX-x0>80)pop();x0=null},{passive:true});
  return s;
}
function pop(){const s=stack.pop();if(!s)return;s._api.destroy&&s._api.destroy();s.classList.remove('in');const prev=stack.at(-1);prev&&prev.classList.remove('under');S.cur=prev?prev._api:null;setTimeout(()=>s.remove(),360)}
function popAll(){while(stack.length)pop()}
function hdr(title,back='',right=''){return `<div class="sh"><button class="bk">${I.back}${esc(back)}</button><div class="ttl">${esc(title)}</div>${right}</div>`}
let tT;function toast(m){const t=$('#toast');t.textContent=m;t.classList.add('in');clearTimeout(tT);tT=setTimeout(()=>t.classList.remove('in'),2200)}
function handoff(title,msg,amt){sheet(`<h3>${esc(title)}${amt?' '+usd(amt):''}</h3><div class="mut" style="margin:0 4px 18px;font-size:15px;line-height:1.45">${esc(msg)} Nothing has been charged or moved.</div><a class="btn-full btn-b" style="display:block;text-align:center;text-decoration:none" href="${FOMO}" target="_blank" rel="noopener">Open Fomo</a><button class="btn-full" style="margin-top:8px;color:var(--tx2)" id="hoX">Not now</button>`,s=>{$('#hoX',s).onclick=()=>closeSheet()})}

/* ---------- DEPOSIT ---------- */
function depositSheet(){
  const opts=[['crypto','Crypto','Receive USDC from a crypto wallet',I.crypto,'#2F6BFF'],['apple','Apple Pay','Buy tokens with Apple Pay',I.apple,'#000;border:1px solid #333'],['debit','Debit','Deposit cash with a debit card',I.card,'#7a3cff'],['ex','Exchanges and apps','Cash App, Coinbase, Binance',I.bank,'#0aa36b']];
  sheet(`<h3>Deposit with</h3>${opts.map(([k,t,d,ic,bg])=>`<button class="srow" data-k="${k}"><span class="ic" style="background:${bg}">${ic}</span><div><b>${t}</b><small>${d}</small></div><span style="margin-left:auto;color:var(--tx3)">${I.chev}</span></button>`).join('')}`,
   s=>s.onclick=e=>{const b=e.target.closest('[data-k]');if(b){closeSheet();setTimeout(()=>openAmount('deposit',b.dataset.k),120)}});
}
function openAmount(mode,method){
  push(s=>{
    const isW=mode==='withdraw';let v='0';
    const avail=()=>freshLive()?.cash?.total;
    s.innerHTML=`${hdr(isW?'Withdraw':'Deposit')}<div class="amt"><div class="v" id="amV">$0</div>
      <div class="qp">${(isW?['10%','25%','50%','Max']:['$20','$100','$250','$500']).map(x=>`<button data-q="${x}">${x}</button>`).join('')}</div></div>
      ${isW?'':`<div class="info">${I.info} Debit cards have higher success rates</div>`}
      <div class="kp">${['1','2','3','4','5','6','7','8','9','.','0','<'].map(k=>`<button data-k="${k}">${k==='<'?I.bksp:k}</button>`).join('')}</div>
      <div class="bbar">${isW?'<div class="av2" id="amAv"></div>':''}<button class="btn-full ${isW?'btn-grey':'btn-b'}" id="amGo">${isW?'Enter an amount':'Continue'}</button></div>`;
    const V=$('#amV',s),go=$('#amGo',s);
    const upd=()=>{V.textContent='$'+(v.includes('.')?v:Number(v).toLocaleString('en-US'));V.classList.add('bump');setTimeout(()=>V.classList.remove('bump'),100);
      if(isW){const a=avail();$('#amAv',s).textContent=a!=null?usd(a)+' available':'Balance unavailable (no fresh data)';const ok=+v>0;go.className='btn-full '+(ok?'btn-g':'btn-grey');go.textContent=ok?'Withdraw':'Enter an amount'}};
    s.querySelector('.bk').onclick=pop;
    $('.kp',s).onclick=e=>{const b=e.target.closest('button');if(!b)return;const k=b.dataset.k;
      if(k==='<')v=v.length>1?v.slice(0,-1):'0';
      else if(k==='.'){if(!v.includes('.'))v+='.'}
      else{if(v.includes('.')&&v.split('.')[1].length>=2){V.classList.add('shake');setTimeout(()=>V.classList.remove('shake'),300);return}v=v==='0'?k:v+k;if(+v>1e6)v=v.slice(0,-1)}
      upd()};
    $('.qp',s).onclick=e=>{const b=e.target.closest('button');if(!b)return;const q=b.dataset.q;
      if(q.startsWith('$'))v=q.slice(1);else{const a=avail();if(a==null){toast('No fresh balance data');return}v=String(Math.floor(a*(q==='Max'?1:parseFloat(q)/100)*100)/100)}upd()};
    go.onclick=()=>{const a=+v;if(!(a>0)){V.classList.add('shake');setTimeout(()=>V.classList.remove('shake'),300);return}
      if(isW){const av=avail();if(av!=null&&a>av){toast('More than available');return}handoff('Withdraw','Withdrawals are made in Fomo. Open Fomo to withdraw',a)}
      else handoff('Deposit','Deposits are made in Fomo'+(method==='apple'?' with Apple Pay':method==='debit'?' with a debit card':method==='crypto'?' (USDC)':'')+'. Open Fomo to add',a)};
    upd();return{refresh:upd};
  });
}
function openWithdraw(){openAmount('withdraw')}

/* ---------- TOKEN DETAIL ---------- */
const ticks={};
function openToken(sym,addr){
  if(!sym)return;
  push(s=>{
    const back=({home:'Home',agents:'Agents',activity:'Activity',account:'Account'})[S.tab];
    s.innerHTML=`${hdr('',back)}<div class="scr"><div class="th" id="tdH"></div><div class="bal" style="padding-top:12px"><div class="lbl" id="tdVL">Price</div><div class="big"><span id="tdV">—</span></div><div class="chg" id="tdC"></div></div>
      <div class="chart" style="height:230px"><canvas id="tdChart"></canvas></div><div class="upd" id="tdU"></div>
      <div class="kv" style="margin-top:10px"><div>Market cap<b id="tdMc">—</b></div><div>5m volume<b id="tdVol">—</b></div><div>Liquidity<b id="tdLq">—</b></div></div>
      <div id="tdPos"></div><div id="tdRisk"></div><div id="tdLinks" style="padding:16px;display:flex;gap:8px"></div></div>`;
    s.querySelector('.bk').onclick=pop;
    let dex=null,alive=true;
    const key=addr||sym;ticks[key]=ticks[key]||[];
    const pos=()=>freshLive()?.positions?.find(p=>(addr&&p.address===addr)||p.symbol===sym);
    const fc=()=>(S.data?.feed?.candidates||[]).find(c=>(addr&&c.address===addr)||c.symbol===sym);
    const load=async()=>{if(!addr)return;try{const r=await fetch('api/token?k='+encodeURIComponent(KEY)+'&a='+encodeURIComponent(addr));if(r.ok){const j=await r.json();if(j.dex){dex=j.dex;const tk=ticks[key];if(!tk.length||tk.at(-1).p!==dex.price||Date.now()/1000-tk.at(-1).t>20)tk.push({t:Date.now()/1000,p:dex.price});if(tk.length>2000)tk.shift()}}}catch(e){}if(alive)refresh()};
    const refresh=()=>{
      const P=pos(),C=fc(),d=dex||P?.dex;const age=d?.created?(Date.now()-d.created)/1000:(C?.age_min!=null?C.age_min*60:null);
      const st=S.stars.has(addr||sym);
      $('#tdH',s).innerHTML=`${tokAv(sym,d?.image,'lg')}<div><div class="nm">${esc(d?.name||P?.name||sym)}</div><div class="mt">${esc(sym)} · ${esc(d?.chain||P?.chain||C?.chainId||'solana')}${age!=null?' · '+ago(age).replace(' ago',''):''}</div></div><button class="star ${st?'on':''}" id="tdStar">${I.star}</button>`;
      $('#tdStar',s).onclick=()=>{const k=addr||sym;S.stars.has(k)?S.stars.delete(k):S.stars.add(k);LS.set('stars',[...S.stars]);toast(S.stars.has(k)?'Added to watchlist':'Removed');refresh()};
      if(P&&P.value!=null){$('#tdVL',s).textContent='Position value';roll($('#tdV',s),usd(P.value));$('#tdC',s).innerHTML=P.pct!=null?`<span class="${cls(P.pct)}">${pct(P.pct)}</span> <span class="mut">since entry</span>`:''}
      else{const pr=d?.price??C?.price_usd;$('#tdVL',s).textContent='Price';$('#tdV',s).textContent=price(pr);const ch=d?.chg?.h1??C?.chg_h1;$('#tdC',s).innerHTML=ch!=null?`<span class="${cls(ch)}">${pct(ch)}</span> <span class="mut">1h</span>`:''}
      $('#tdMc',s).textContent=mc(d?.mcap??C?.mcap);$('#tdVol',s).textContent=mc(d?.vol?.m5??C?.vol_m5);$('#tdLq',s).textContent=mc(d?.liq??C?.liquidity_usd);
      $('#tdU',s).textContent=addr?(dex?'DexScreener live · refreshed '+new Date().toLocaleTimeString('en-US',{timeZone:'America/New_York',hour:'numeric',minute:'2-digit',second:'2-digit'})+' ET':'Loading DexScreener…'):'No contract address for this token';
      const sells=events().filter(e=>e.sym===sym&&e.kind==='sell');const pnlR=sells.reduce((a,e)=>a+(e.pnl||0),0);
      if(P){const unr=P.invested!=null&&P.value!=null?P.value-P.invested:null;
        $('#tdPos',s).innerHTML=`<div class="pc"><h4>Position</h4><div class="ln">Invested<b>${usd(P.invested)}</b></div><div class="ln">Value<b>${usd(P.value)}</b></div><div class="ln">Tokens<b>${P.amount!=null?kfmt(P.amount):'—'}</b></div><div class="ln">Total profit<b class="${cls(unr)}">${sUsd(unr)}</b></div>${P.live?'':'<div class="ln" style="font-size:12px">Value from bot file (no live price)</div>'}</div>`}
      else $('#tdPos',s).innerHTML=sells.length?`<div class="pc"><h4>Closed trades</h4><div class="ln">Sells<b>${sells.length}</b></div><div class="ln">Realized profit<b class="${cls(pnlR)}">${sUsd(pnlR)}</b></div></div>`:'';
      const stop=P?.stop||freshLive()?.risk?.stop;
      const rugs=(C?.rug_risk||[]);
      $('#tdRisk',s).innerHTML=`<div class="pc"><h4>${I.shield.replace('<svg','<svg width="18" height="18"')} Risk</h4><div class="ln">Stop<b>${stop?esc(stop)+' under entry':'none set'}</b></div><div class="ln">Scanner flags<b class="${rugs.length?'dn':''}">${rugs.length?esc(rugs.join(', ')):'none'}</b></div>${C?.score!=null?`<div class="ln">Analyst score<b>${n2(C.score,0)}</b></div>`:''}</div>`;
      $('#tdLinks',s).innerHTML=addr?`<a class="pill btn-grey" style="color:#fff;text-decoration:none;flex:1;text-align:center" target="_blank" rel="noopener" href="${FOMO}/tokens/solana/${encodeURIComponent(addr)}">Open in Fomo</a><a class="pill btn-grey" style="color:#fff;text-decoration:none;flex:1;text-align:center" target="_blank" rel="noopener" href="${esc(d?.url||'https://dexscreener.com/solana/'+addr)}">DexScreener</a>`:'';
      candles(s,key,P,sells,d);
    };
    load();const iv=setInterval(load,POLL_MS);
    return{refresh,destroy:()=>{alive=false;clearInterval(iv)}};
  });
}
function candles(s,key,P,sells,d){
  const cv=$('#tdChart',s);if(!cv)return;const dpr=devicePixelRatio||1,w=cv.clientWidth,h=cv.clientHeight;if(!w)return;
  cv.width=w*dpr;cv.height=h*dpr;const c=cv.getContext('2d');c.scale(dpr,dpr);c.clearRect(0,0,w,h);
  let tk=[...(S.data?.samples?.[P?.address]||[]).map(x=>({t:x[0],p:x[1]})),...(ticks[key]||[])].filter(x=>x.p>0).sort((a,b)=>a.t-b.t);
  const span=tk.length?tk.at(-1).t-tk[0].t:0;const B=span>7200?300:span>1800?60:span>300?30:10;
  const cs=[];tk.forEach(x=>{const b=Math.floor(x.t/B)*B;let k=cs.at(-1);if(!k||k.b!==b){k={b,o:k?k.c:x.p,h:x.p,l:x.p,c:x.p};k.h=Math.max(k.h,k.o);k.l=Math.min(k.l,k.o);cs.push(k)}k.h=Math.max(k.h,x.p);k.l=Math.min(k.l,x.p);k.c=x.p});
  const vis=cs.slice(-40);
  c.font='12px -apple-system,system-ui,sans-serif';
  if(vis.length<2){c.fillStyle='#5c5c64';c.textAlign='center';c.fillText(d?'Collecting live ticks for candles…':'No live price yet',w/2,h/2);return}
  let mn=Math.min(...vis.map(k=>k.l)),mx=Math.max(...vis.map(k=>k.h));const ep=P?.entry_price;
  if(ep&&ep>0&&ep<mx*3&&ep>mn/3){mn=Math.min(mn,ep);mx=Math.max(mx,ep)}
  if(mx-mn<mx*1e-4){mx*=1.001;mn*=.999}
  const Y=v=>12+(1-(v-mn)/(mx-mn))*(h-34),cw=(w-24)/40,X=i=>12+i*cw+cw/2;
  vis.forEach((k,i)=>{const up=k.c>=k.o;c.strokeStyle=c.fillStyle=up?'#00FF66':'#FF3B4E';c.beginPath();c.moveTo(X(i),Y(k.h));c.lineTo(X(i),Y(k.l));c.lineWidth=1;c.stroke();const y1=Y(Math.max(k.o,k.c)),y2=Y(Math.min(k.o,k.c));c.fillRect(X(i)-cw*.35,y1,cw*.7,Math.max(1.5,y2-y1))});
  if(ep){c.setLineDash([5,4]);c.strokeStyle='#2F6BFF';c.lineWidth=1.3;c.beginPath();c.moveTo(0,Y(ep));c.lineTo(w,Y(ep));c.stroke();c.setLineDash([]);c.fillStyle='#2F6BFF';c.textAlign='left';c.fillText('Entry',6,Y(ep)-5)}
  sells.forEach(e=>{const i=vis.findIndex(k=>e.t>=k.b&&e.t<k.b+B);if(i<0)return;const y=Y(vis[i].h)-14;c.fillStyle='#00FF66';c.beginPath();c.roundRect?c.roundRect(X(i)-16,y-10,32,16,6):c.rect(X(i)-16,y-10,32,16);c.fill();c.fillStyle='#000';c.textAlign='center';c.font='bold 10px -apple-system,system-ui';c.fillText('Sold',X(i),y+2)});
  c.fillStyle='#5c5c64';c.textAlign='right';c.font='11px -apple-system,system-ui';c.fillText(price(vis.at(-1).c),w-6,h-6);c.textAlign='left';c.fillText(B+'s candles',6,h-6);
}

/* ---------- boot ---------- */
setupTabs();poll();setInterval(poll,POLL_MS);
setInterval(()=>{if(S.data)render()},1000*15);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)poll()});
window.addEventListener('resize',()=>drawChart());
if('serviceWorker' in navigator)navigator.serviceWorker.register('sw.js').catch(()=>{});
