/* ==========================================================
   شبیه‌ساز بصری کوله‌پشتی (همه‌ی الگوریتم‌های جستجو)
   فقط همین یک فایل را با <script src="knapsack_simulator.js"></script>
   در یک صفحهٔ HTML بگذار؛ خودش همه‌چیز (ظاهر + داده ورودی) را می‌سازد.
   اگر عنصری با id="knapsack" باشد داخل آن، وگرنه آخر body ساخته می‌شود.
   ========================================================== */
(function () {
'use strict';

/* ---------- داده‌ها (حالت پیش‌فرض = عکس تو) ---------- */
const DEFAULT_TEXT = 'A 12 2\nB 10 3\nC 20 4\nD 15 5\nE 8 1';   // نام  ارزش  وزن
const DEFAULT_CAP = 7, DEFAULT_TARGET = 28, DEFAULT_LIM = 3, MAX_ITEMS = 8, MAX_STEPS = 800;
let IT = [], CAP = DEFAULT_CAP, TARGET = DEFAULT_TARGET, LIM = DEFAULT_LIM, N = 0;

/* ---------- موتور جستجو ---------- */
const info = id => { let w = 0, v = 0, g = 0, t = []; for (let i = 0; i < id.length; i++) { if (id[i] === '1') { w += IT[i][2]; v += IT[i][1]; t.push(IT[i][0]); } else g += IT[i][1]; } return { id, d: id.length, w, v, g, h: Math.max(0, TARGET - v), t }; };
const lb = id => id === '' ? 'شروع' : '{' + (info(id).t.join('،') || 'خالی') + '}';
const nm = id => id === '' ? 'شروع' : lb(id) + ' (تصمیم ' + IT[id.length - 1][0] + ')';
const ch = id => (id.slice(-1) === '1' ? '+' : '−') + IT[id.length - 1][0] + ' → ' + lb(id) + ' (وزن ' + info(id).w + ')';
const key = (a, x) => { const i = info(x); return a === 'ucs' ? i.g : a === 'greedy' ? i.h : i.g + i.h; };
const met = (a, id) => { const i = info(id); return a === 'ucs' ? 'g=' + i.g : a === 'greedy' ? 'h=' + i.h : a === 'astar' ? 'f=' + i.g + '+' + i.h + '=' + (i.g + i.h) : 'عمق ' + i.d; };
const isPQ = a => a === 'ucs' || a === 'greedy' || a === 'astar';
const disp = (a, F) => a === 'bfs' ? [...F] : isPQ(a) ? [...F].sort((x, y) => key(a, x) - key(a, y)) : [...F].reverse();

function meta() {
  return {
    bfs:   { n: '🌊 سطحی (BFS)', k: 0, r: 'طبقه‌به‌طبقه جلو می‌رود', f: 'صف FIFO', m: 'none', h: 'اولین گرهٔ صف' },
    dfs:   { n: '🕳️ عمقی (DFS)', k: 0, r: 'یک شاخه را تا ته می‌رود، بعد برمی‌گردد', f: 'پشته LIFO', m: 'none', h: 'جدیدترین گره (بالای پشته)' },
    dls:   { n: '🚧 عمقی محدود (DLS=' + LIM + ')', k: 0, r: 'مثل DFS ولی روی عمق ' + LIM + ' دیوار دارد', f: 'DFS با شرط عمق ≤ ' + LIM, m: 'none', h: 'بالای پشته' },
    ids:   { n: '🔄 عمیق‌کنندهٔ تکراری (IDS)', k: 0, r: 'DLS را با حد ۰، ۱، ۲، ... تکرار می‌کند', f: 'تکرار DLS برای l = 0, 1, 2, ...', m: 'none', h: 'بالای پشته' },
    ucs:   { n: '💰 هزینه یکنواخت (UCS)', k: 0, r: 'گره‌ای با کمترین g (ارزشِ ردشده) باز می‌شود', f: 'g = جمع ارزش کالاهای نبرده', m: 'g', h: 'مرتب از کمترین g' },
    greedy:{ n: '⚡ حریصانه (Greedy)', k: 1, r: 'فقط به h نگاه می‌کند (چقدر تا هدف مانده)', f: 'f = h = max(0, ' + TARGET + ' − ارزش)', m: 'h', h: 'مرتب از کمترین h' },
    astar: { n: '🧠 A*', k: 1, r: 'گذشته (g) + تخمین آینده (h)', f: 'f = g + h', m: 'f', h: 'مرتب از کمترین f' }
  };
}

function search(a, lim, tag) {
  let F = [''], E = [], C = [], P = [], S = [], found = false;
  const pq = isPQ(a);
  while (F.length) {
    if (S.length >= MAX_STEPS) { S.push({ a, tag, cur: null, end: true, add: [], E: [...E], F: disp(a, F), C: [...C], P: [...P], why: 'تعداد مرحله‌ها از سقف ' + MAX_STEPS + ' گذشت.', math: '', chg: 'برای سرعت، نمایش اینجا قطع شد.' }); return { S, found }; }
    let i = 0;
    if (a === 'bfs') i = 0;
    else if (pq) { let b = Infinity; F.forEach((x, j) => { const k = key(a, x); if (k < b) { b = k; i = j; } }); }
    else i = F.length - 1;
    const before = [...F], cur = F.splice(i, 1)[0], n = info(cur); E.push(cur);
    let why;
    if (cur === '') why = 'شروع کار: ریشه (کوله خالی) تنها گرهٔ صف است.';
    else if (a === 'bfs') why = nm(cur) + ' قدیمی‌ترین گرهٔ صف است؛ در صف FIFO هر که زودتر آمده زودتر بیرون می‌آید.';
    else if (!pq) why = nm(cur) + ' جدیدترین گره است؛ در پشته LIFO آخرین ورودی اول بیرون می‌آید، پس عمیق‌تر می‌رویم.';
    else why = 'بین گره‌های صف، ' + nm(cur) + ' کمترین ' + (a === 'ucs' ? 'g' : a === 'greedy' ? 'h' : 'f') + ' را دارد: ' + disp(a, before).slice(0, 4).map(x => lb(x) + '=' + key(a, x)).join('، ') + '.';
    let math = 'وزن = ' + n.w + ' از ' + CAP + '، ارزش = ' + n.v + '. آزمون هدف: ' + n.v + (n.v >= TARGET ? ' ≥ ' : ' < ') + TARGET + '.';
    if (a === 'ucs') math += ' g = ارزش ردشده = ' + n.g + '.';
    if (a === 'greedy') math += ' h = ' + TARGET + ' − ' + n.v + ' = ' + n.h + ' (کمبود تا هدف).';
    if (a === 'astar') math += ' g = ' + n.g + '، h = ' + n.h + '، f = ' + (n.g + n.h) + '.';
    const st = { a, tag, cur, add: [], goal: false, why, math };
    if (n.v >= TARGET) {
      st.goal = true; found = true;
      st.chg = '✅ هدف! ارزش ' + n.v + ' حداقل ' + TARGET + ' است. جستجو همین‌جا تمام می‌شود و بقیهٔ گره‌ها بررسی نمی‌شوند. جواب: ' + lb(cur) + ' با وزن ' + n.w + '.';
    } else if (n.d === N) {
      st.chg = 'بن‌بست: دربارهٔ همهٔ ' + N + ' کالا تصمیم گرفته شد ولی ارزش کافی نیست. برمی‌گردیم.';
    } else if (n.d >= lim && a !== 'bfs') {
      C.push(cur); st.chg = '🚧 به حد عمق ' + lim + ' رسید؛ این گره باز نمی‌شود (دیوار قرمز). برمی‌گردیم سراغ گرهٔ بعدی.';
    } else {
      const add = [], pr = [];
      ['1', '0'].forEach(c => { const x = cur + c; if (info(x).w > CAP) { pr.push(x); P.push(x); } else add.push(x); });
      (a === 'bfs' || pq ? add : [...add].reverse()).forEach(x => F.push(x));
      st.add = add;
      st.chg = (add.length ? 'اضافه شد: ' + add.map(ch).join(' و ') + '. ' : '') + (pr.length ? '⛔ حذف شد چون وزن از ' + CAP + ' بیشتر می‌شود: ' + pr.map(x => '+' + IT[x.length - 1][0] + ' (وزن ' + info(x).w + ')').join('، ') + '.' : '');
    }
    st.E = [...E]; st.F = disp(a, F); st.C = [...C]; st.P = [...P];
    S.push(st);
    if (found) break;
  }
  if (!found) S.push({ a, tag, cur: null, end: true, add: [], E: [...E], F: [], C: [...C], P: [...P], why: 'صف خالی شد.', math: 'گرهٔ دیگری برای بررسی نمانده.', chg: 'در این دور به ارزش ' + TARGET + ' نرسیدیم' + (tag ? '؛ حد عمق را بیشتر می‌کنیم.' : '.') });
  return { S, found };
}
function run(a) {
  if (a === 'ids') {
    let all = [];
    for (let l = 0; l <= N; l++) { const r = search('dfs', l, 'تکرار با حد عمق ' + l); all.push(...r.S); if (r.found) break; }
    return all.map(s => ({ ...s, a: 'ids' }));
  }
  return search(a, a === 'dls' ? LIM : 999, '').S;
}
function bestPossible() {
  let best = 0, set = [];
  for (let m = 0; m < (1 << N); m++) { let w = 0, v = 0, t = []; for (let i = 0; i < N; i++) if (m >> i & 1) { w += IT[i][2]; v += IT[i][1]; t.push(IT[i][0]); } if (w <= CAP && v > best) { best = v; set = t; } }
  return { best, set };
}
function parseItems(txt) {
  const fa = '۰۱۲۳۴۵۶۷۸۹', ar = '٠١٢٣٤٥٦٧٨٩';
  txt = txt.replace(/[۰-۹٠-٩]/g, c => { const k = fa.indexOf(c); return k >= 0 ? k : ar.indexOf(c); }).replace(/٫/g, '.');
  const out = [], names = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  for (const line of txt.split(/\n/)) {
    const t = line.trim().split(/[\s,،;\t]+/).filter(Boolean); if (!t.length) continue;
    let name, v, w;
    if (t.length >= 3) { name = t[0]; v = parseFloat(t[1]); w = parseFloat(t[2]); }
    else if (t.length === 2) { name = names[out.length] || ('x' + out.length); v = parseFloat(t[0]); w = parseFloat(t[1]); }
    else return { err: 'خط «' + line + '» درست نیست. قالب: نام ارزش وزن' };
    if (!(v >= 0) || !(w > 0)) return { err: 'ارزش و وزن باید عدد باشند (وزن بزرگ‌تر از صفر): «' + line + '»' };
    out.push([name, v, w]);
  }
  if (!out.length) return { err: 'حداقل یک کالا وارد کن.' };
  if (out.length > MAX_ITEMS) return { err: 'حداکثر ' + MAX_ITEMS + ' کالا (درخت بیشتر از آن خیلی بزرگ می‌شود).' };
  return { items: out };
}

/* ---------- ظاهر ---------- */
const CSS = `
#ks{--bg:#f1f5f9;--card:#fff;--bd:#cbd5e1;--tx:#0f172a;--mu:#64748b;--blue:#0284c7;--amb:#d97706;--grn:#16a34a;--red:#dc2626;--soft:#e2e8f0;--tree:#f8fafc;
 font-family:'Vazirmatn',Tahoma,sans-serif;background:var(--bg);color:var(--tx);line-height:1.8;padding:14px;direction:rtl;text-align:right;box-sizing:border-box}
@media(prefers-color-scheme:dark){#ks{--bg:#090e1a;--card:#131c2e;--bd:#2e3f5e;--tx:#f1f5f9;--mu:#94a3b8;--blue:#38bdf8;--amb:#fbbf24;--grn:#4ade80;--red:#f87171;--soft:#1c2840;--tree:#060a13}}
#ks *{box-sizing:border-box}
#ks .wrap{max-width:1200px;margin:0 auto}
#ks .box{background:var(--card);border:1px solid var(--bd);border-radius:14px;padding:14px;margin-bottom:14px}
#ks h1{font-size:1.3rem;margin:0 0 6px}#ks h3{margin:0}
#ks .pill{display:inline-block;background:var(--soft);border-radius:8px;padding:2px 10px;margin:3px;font-size:.84rem}
#ks .goal{border:1px solid var(--grn);color:var(--grn);font-weight:700}
#ks .row{display:flex;flex-wrap:wrap;gap:8px;margin:6px 0;align-items:center}
#ks .lab{font-size:.82rem;color:var(--mu);width:100%}
#ks button,#ks select,#ks input,#ks textarea{font-family:inherit;font-size:.85rem;background:var(--soft);color:var(--tx);border:1.5px solid var(--bd);border-radius:10px;padding:6px 12px}
#ks button{cursor:pointer}#ks button:disabled{opacity:.4;cursor:not-allowed}
#ks button.on{background:var(--blue);color:#fff;border-color:var(--blue)}
#ks button.go{background:var(--grn);color:#fff;border-color:var(--grn);font-weight:700}
#ks textarea{width:100%;min-height:130px;direction:ltr;text-align:left;font-family:monospace;font-size:.95rem}
#ks input{width:90px;direction:ltr;text-align:center}
#ks .err{color:var(--red);font-size:.85rem;font-weight:700}
#ks .grid{display:grid;grid-template-columns:1.3fr 1fr;gap:14px}
@media(max-width:900px){#ks .grid{grid-template-columns:1fr}}
#ks .tree{background:var(--tree);border:1px solid var(--bd);border-radius:10px;overflow:auto;min-height:380px;max-height:540px;padding:8px;direction:ltr}
#ks .blk{border-radius:10px;padding:9px 12px;margin-bottom:8px;border:1px solid;font-size:.9rem}
#ks .b1{border-color:var(--blue)}#ks .b2{border-color:var(--amb)}#ks .b3{border-color:var(--grn)}
#ks .blk h4{font-size:.85rem;margin:0 0 2px}
#ks .b1 h4{color:var(--blue)}#ks .b2 h4{color:var(--amb)}#ks .b3 h4{color:var(--grn)}
#ks .chips{display:flex;flex-wrap:wrap;gap:6px}
#ks .chip{background:var(--soft);border:1px solid var(--bd);border-radius:8px;padding:2px 9px;font-size:.78rem}
#ks .chip.first{border-color:var(--amb);color:var(--amb);font-weight:700}
#ks .bar{height:9px;background:var(--soft);border-radius:99px;overflow:hidden;margin:3px 0 8px}
#ks .bar i{display:block;height:100%;transition:width .3s}
#ks .sm{display:flex;justify-content:space-between;font-size:.8rem}
#ks .prog{height:5px;background:var(--soft);border-radius:9px;overflow:hidden;margin-top:6px}
#ks .prog i{display:block;height:100%;width:0;background:var(--blue)}
#ks .nd rect{fill:var(--soft);stroke:var(--bd);stroke-width:2}
#ks .nd text{fill:var(--tx);font-size:10.5px;text-anchor:middle}
#ks .nd .m{fill:var(--amb);font-weight:700}
#ks .nd.F rect{stroke:var(--amb);stroke-dasharray:4 2}
#ks .nd.E rect{stroke:var(--mu)}
#ks .nd.C rect,#ks .nd.P rect{stroke:var(--red);stroke-dasharray:4 3}
#ks .nd.cur rect{stroke:var(--blue);stroke-width:3.5;stroke-dasharray:0}
#ks .nd.win rect{stroke:var(--grn);stroke-width:3.5;stroke-dasharray:0}
#ks .e{stroke:var(--bd);stroke-width:1.6}#ks .e.on{stroke:var(--blue);stroke-width:3.5}#ks .e.nw{stroke:var(--amb);stroke-width:2.5}
#ks .tg{font-size:10px;font-weight:700;text-anchor:middle}
#ks .leg{font-size:.76rem;color:var(--mu);margin-top:6px;text-align:center}`;

const HTML = `<div class="wrap">
<div class="box">
  <h1>🎒 شبیه‌ساز بصری کوله‌پشتی و الگوریتم‌های جستجو</h1>
  <div class="row"><div class="lab">📝 داده‌ها را اینجا بنویس (هر خط یک کالا: «نام ارزش وزن»). پیش‌فرض همان جدول عکس است:</div></div>
  <textarea id="ks_txt" spellcheck="false"></textarea>
  <div class="row">
    <label>⚖️ حداکثر وزن <input id="ks_cap" type="text" inputmode="decimal"></label>
    <label>🎯 ارزش هدف <input id="ks_tgt" type="text" inputmode="decimal"></label>
    <label>🚧 حد عمق DLS <input id="ks_lim" type="text" inputmode="numeric"></label>
    <button id="ks_build" class="go">🔨 بساز</button><button id="ks_def">↺ داده‌های پیش‌فرض</button>
  </div>
  <div class="err" id="ks_err"></div>
  <div id="ks_sum"></div>
  <div class="row"><div class="lab">🔹 ناآگاهانه (کور):</div><div id="ks_blind" class="row" style="margin:0"></div>
  <div class="lab">✨ آگاهانه (هوشمند):</div><div id="ks_inf" class="row" style="margin:0"></div></div>
</div>
<div class="grid">
  <div class="box" style="margin:0">
    <div class="row">
      <button id="ks_prev">◀ قبلی</button><button id="ks_next" class="on">بعدی ▶</button><button id="ks_rst">↺ از اول</button>
      <button id="ks_play" class="go">▶ پخش خودکار</button>
      <select id="ks_spd"><option value="5000">آرام</option><option value="3000" selected>معمولی</option><option value="1500">سریع</option></select>
      <b id="ks_sp" style="margin-inline-start:auto"></b>
    </div>
    <div class="prog"><i id="ks_pg"></i></div>
    <div class="tree" id="ks_tree" style="margin-top:8px"></div>
    <div class="leg">آبی = گره فعال | نارنجی نقطه‌چین = منتظر در صف | خاکستری = باز شده | قرمز = حذف (وزن زیاد یا حد عمق) | سبز = جواب</div>
  </div>
  <div class="box" style="margin:0">
    <h3 id="ks_at"></h3><div id="ks_ar" style="color:var(--amb);font-size:.85rem;margin-bottom:8px"></div>
    <div id="ks_tg" style="font-weight:700;color:var(--blue);margin-bottom:6px"></div>
    <div class="blk b1"><h4>🎯 ۱. چرا این گره انتخاب شد؟</h4><div id="ks_t1"></div></div>
    <div class="blk b2"><h4>🧮 ۲. حساب و کتاب</h4><div id="ks_t2"></div></div>
    <div class="blk b3"><h4>🔄 ۳. چه تغییری افتاد؟</h4><div id="ks_t3"></div></div>
    <div class="sm"><b>📋 صف انتظار</b><span id="ks_fh" style="color:var(--mu)"></span></div>
    <div class="chips" id="ks_fc" style="margin-bottom:10px"></div>
    <div class="sm"><span id="ks_wl"></span><span id="ks_wt"></span></div><div class="bar"><i id="ks_wb" style="background:var(--amb)"></i></div>
    <div class="sm"><span id="ks_vl"></span><span id="ks_vt"></span></div><div class="bar"><i id="ks_vb" style="background:var(--grn)"></i></div>
  </div>
</div></div>`;

function mount() {
  if (!document.getElementById('ks_css')) {
    const st = document.createElement('style'); st.id = 'ks_css'; st.textContent = CSS; document.head.appendChild(st);
    const fl = document.createElement('link'); fl.rel = 'stylesheet'; fl.href = 'https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;700&display=swap'; document.head.appendChild(fl);
  }
  const host = document.getElementById('knapsack') || document.body.appendChild(document.createElement('div'));
  const root = document.createElement('div'); root.id = 'ks'; root.innerHTML = HTML; host.appendChild(root);
  const $ = id => document.getElementById('ks_' + id);

  let M = meta(), cur = 'astar', step = 0, steps = [], timer = null, pe = 0;

  function tree(s, m) {
    const vis = new Set(['']), anc = id => { for (let i = 0; i <= id.length; i++) vis.add(id.slice(0, i)); };
    [...s.E, ...s.F, ...s.C, ...s.P].forEach(anc); if (s.cur != null) anc(s.cur);
    const rows = Array.from({ length: N + 1 }, () => []); vis.forEach(id => rows[id.length].push(id)); rows.forEach(r => r.sort());
    const NW = 104, NH = 50, GX = 12, RH = 76, cols = Math.max(...rows.map(r => r.length));
    const W = Math.max(520, cols * (NW + GX) + 20); let md = 0; rows.forEach((r, i) => { if (r.length) md = i; });
    const H = (md + 1) * RH + 10, pos = {};
    rows.forEach((r, d) => { const tw = r.length * (NW + GX) - GX; r.forEach((id, i) => { pos[id] = { x: (W - tw) / 2 + i * (NW + GX) + NW / 2, y: 10 + d * RH + NH / 2 }; }); });
    const path = new Set(); if (s.cur) for (let i = 1; i <= s.cur.length; i++) path.add(s.cur.slice(0, i));
    const Es = new Set(s.E), Fs = new Set(s.F), Cs = new Set(s.C), Ps = new Set(s.P), As = new Set(s.add);
    let o = '<svg width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + ' ' + H + '" style="display:block;margin:0 auto">';
    vis.forEach(id => {
      if (id === '') return;
      const p = pos[id.slice(0, -1)], q = pos[id], t = id.slice(-1) === '1', mx = (p.x + q.x) / 2, my = (p.y + q.y) / 2;
      o += '<line class="e' + (path.has(id) ? ' on' : '') + (As.has(id) ? ' nw' : '') + '" x1="' + p.x + '" y1="' + (p.y + NH / 2) + '" x2="' + q.x + '" y2="' + (q.y - NH / 2) + '"/>';
      o += '<text class="tg" x="' + mx + '" y="' + (my + 3) + '" style="fill:var(--' + (t ? 'grn' : 'red') + ')">' + (t ? '+' : '−') + IT[id.length - 1][0] + '</text>';
    });
    vis.forEach(id => {
      const n = info(id), p = pos[id]; let c = 'nd';
      if (Ps.has(id)) c += ' P'; else if (Cs.has(id)) c += ' C'; else if (Fs.has(id)) c += ' F'; else if (Es.has(id)) c += ' E';
      if (s.cur === id) c += s.goal ? ' win' : ' cur';
      const l3 = Ps.has(id) ? 'وزن ' + n.w + ' > ' + CAP + ' ⛔' : met(m, id);
      o += '<g class="' + c + '"><rect x="' + (p.x - NW / 2) + '" y="' + (p.y - NH / 2) + '" width="' + NW + '" height="' + NH + '" rx="9"/><text x="' + p.x + '" y="' + (p.y - 9) + '" style="font-weight:700">' + lb(id) + '</text><text x="' + p.x + '" y="' + (p.y + 5) + '">وزن:' + n.w + ' | ارزش:' + n.v + '</text><text class="m" x="' + p.x + '" y="' + (p.y + 19) + '">' + l3 + '</text></g>';
    });
    $('tree').innerHTML = o + '</svg>';
  }
  function draw() {
    const m = M[cur], s = steps[step];
    root.querySelectorAll('[data-a]').forEach(b => b.classList.toggle('on', b.dataset.a === cur));
    $('at').textContent = m.n; $('ar').textContent = 'قانون: ' + m.r + ' | ' + m.f; $('tg').textContent = s.tag || '';
    $('sp').textContent = 'مرحله ' + (step + 1) + ' از ' + steps.length;
    $('prev').disabled = step === 0; $('next').disabled = step === steps.length - 1;
    $('t1').textContent = s.why; $('t2').textContent = s.math; $('t3').textContent = s.chg; $('fh').textContent = m.h;
    $('fc').innerHTML = s.F.length ? '' : '<span style="color:var(--mu);font-size:.8rem">صف خالی است</span>';
    s.F.forEach((id, i) => { const d = document.createElement('div'); d.className = 'chip' + (i === 0 ? ' first' : ''); d.textContent = (i === 0 ? '👈 ' : '') + nm(id) + (m.m === 'none' ? '' : ' (' + met(m.m, id) + ')'); $('fc').appendChild(d); });
    const n = info(s.cur == null ? '' : s.cur);
    $('wl').textContent = '⚖️ وزن کوله (حداکثر ' + CAP + ')'; $('vl').textContent = '💎 ارزش (هدف ' + TARGET + ')';
    $('wt').textContent = n.w + ' / ' + CAP; $('wb').style.width = Math.min(100, n.w / CAP * 100) + '%';
    $('vt').textContent = n.v + ' / ' + TARGET; $('vb').style.width = Math.min(100, n.v / TARGET * 100) + '%';
    tree(s, m.m);
  }
  const stop = () => { if (timer) { clearInterval(timer); timer = null; } $('pg').style.width = '0'; $('play').textContent = '▶ پخش خودکار'; };
  const nxt = () => { if (step < steps.length - 1) { step++; draw(); return true; } return false; };

  function buildAlgoButtons() {
    $('blind').innerHTML = ''; $('inf').innerHTML = '';
    Object.keys(M).forEach(k => { const b = document.createElement('button'); b.textContent = M[k].n; b.dataset.a = k; b.onclick = () => { stop(); cur = k; step = 0; steps = run(k); draw(); }; $(M[k].k ? 'inf' : 'blind').appendChild(b); });
  }
  function build() {
    stop(); $('err').textContent = '';
    const fa = s => s.replace(/[۰-۹]/g, c => '۰۱۲۳۴۵۶۷۸۹'.indexOf(c)).replace(/٫/g, '.');
    const p = parseItems($('txt').value);
    if (p.err) { $('err').textContent = '⚠️ ' + p.err; return; }
    const cap = parseFloat(fa($('cap').value)), tgt = parseFloat(fa($('tgt').value)), lim = parseInt(fa($('lim').value), 10);
    if (!(cap > 0)) { $('err').textContent = '⚠️ حداکثر وزن باید عدد مثبت باشد.'; return; }
    if (!(tgt > 0)) { $('err').textContent = '⚠️ ارزش هدف باید عدد مثبت باشد.'; return; }
    IT = p.items; N = IT.length; CAP = cap; TARGET = tgt; LIM = Math.max(1, Math.min(N, isNaN(lim) ? DEFAULT_LIM : lim));
    $('lim').value = LIM;
    const b = bestPossible();
    $('sum').innerHTML = IT.map(x => '<span class="pill"><b>' + x[0] + ':</b> وزن ' + x[2] + ' | ارزش ' + x[1] + '</span>').join('') +
      '<span class="pill goal">🎯 هدف: ارزش ≥ ' + TARGET + ' با وزن ≤ ' + CAP + '</span>' +
      '<span class="pill">🏆 بهترین ممکن: ' + b.best + ' ({' + b.set.join('،') + '})</span>' +
      (TARGET > b.best ? '<div class="err">⚠️ هدف ' + TARGET + ' از بهترین ممکن (' + b.best + ') بیشتر است؛ الگوریتم‌ها به جواب نمی‌رسند.</div>' : '');
    M = meta(); buildAlgoButtons();
    if (!M[cur]) cur = 'astar';
    step = 0; steps = run(cur); draw();
  }
  $('txt').value = DEFAULT_TEXT; $('cap').value = DEFAULT_CAP; $('tgt').value = DEFAULT_TARGET; $('lim').value = DEFAULT_LIM;
  $('build').onclick = build;
  $('def').onclick = () => { $('txt').value = DEFAULT_TEXT; $('cap').value = DEFAULT_CAP; $('tgt').value = DEFAULT_TARGET; $('lim').value = DEFAULT_LIM; build(); };
  $('next').onclick = () => { stop(); nxt(); };
  $('prev').onclick = () => { stop(); if (step > 0) { step--; draw(); } };
  $('rst').onclick = () => { stop(); step = 0; draw(); };
  $('play').onclick = () => {
    if (timer) { stop(); return; }
    if (step >= steps.length - 1) { step = 0; draw(); }
    $('play').textContent = '⏸ توقف'; pe = 0;
    timer = setInterval(() => { pe += 100; const iv = +$('spd').value; $('pg').style.width = Math.min(100, pe / iv * 100) + '%'; if (pe >= iv) { pe = 0; if (!nxt()) stop(); } }, 100);
  };
  build();
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount); else mount();
}
if (typeof module !== 'undefined') module.exports = { _set: (it, c, t, l) => { IT = it; N = it.length; CAP = c; TARGET = t; LIM = l; }, run, lb, bestPossible, parseItems };
})();
