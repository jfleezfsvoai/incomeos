/* IncomeOS — 多渠道收入与理财 Web App（纯前端，数据存在本机 localStorage） */
(() => {
'use strict';

/* ================= helpers ================= */
const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
const uid = () => Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-4);
const pad = n => String(n).padStart(2, '0');
const ymOf = d => d.getFullYear() + '-' + pad(d.getMonth() + 1);
const dOf = d => ymOf(d) + '-' + pad(d.getDate());
const num = x => { const n = parseFloat(String(x ?? '').replace(/,/g, '')); return isFinite(n) ? n : 0; };
const r2 = n => Math.round(n * 100) / 100;
const sum = arr => arr.reduce((a, t) => a + t.amount, 0);
const addMonth = (m, k) => { let [y, mo] = m.split('-').map(Number); mo += k; while (mo > 12) { mo -= 12; y++; } while (mo < 1) { mo += 12; y--; } return y + '-' + pad(mo); };
const daysIn = m => { const [y, mo] = m.split('-').map(Number); return new Date(y, mo, 0).getDate(); };
const mLabel = m => { const [y, mo] = m.split('-'); return `${y}年${+mo}月`; };
const fmt = (n, d = 2) => Math.abs(n).toLocaleString('en-MY', { minimumFractionDigits: d, maximumFractionDigits: d });
const money = (n, o = {}) => (n < 0 ? '-' : (o.plus && n > 0 ? '+' : '')) + 'RM ' + fmt(n, o.d ?? 2);
const money0 = (n, o = {}) => money(n, { ...o, d: Math.abs(n) >= 1000 ? 0 : 2 });
const short = n => n >= 1e6 ? (n / 1e6).toFixed(1) + 'M' : n >= 1000 ? (n / 1000).toFixed(n >= 1e4 ? 0 : 1) + 'K' : String(Math.round(n));
const pct = (a, b) => b ? a / b * 100 : 0;
const WD = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

const I = (p, s = 18) => `<svg viewBox="0 0 24 24" width="${s}" height="${s}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`;
const P = {
  home: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/><path d="M10 21v-6h4v6"/>',
  list: '<path d="M8 6h13M8 12h13M8 18h13"/><circle cx="3.5" cy="6" r="1"/><circle cx="3.5" cy="12" r="1"/><circle cx="3.5" cy="18" r="1"/>',
  board: '<rect x="3" y="4" width="5" height="16" rx="1.5"/><rect x="10" y="4" width="5" height="11" rx="1.5"/><rect x="17" y="4" width="4" height="7" rx="1.5"/>',
  trend: '<path d="M3 17l6-6 4 4 8-8"/><path d="M15 7h6v6"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
  chevL: '<path d="M15 18l-6-6 6-6"/>', chevR: '<path d="M9 18l6-6-6-6"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>', check: '<path d="M20 6 9 17l-5-5"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',
  wallet: '<rect x="3" y="6" width="18" height="14" rx="3"/><path d="M3 10h18"/><circle cx="16.5" cy="15" r="1"/>',
  in: '<path d="M17 7 7 17M16 17H7V8"/>', out: '<path d="M7 17 17 7M8 7h9v9"/>',
  leaf: '<path d="M11 20A7 7 0 0 1 4 13c0-6 7-9 16-9 0 9-3 16-9 16z"/><path d="M4 20c3-5 6-7 10-9"/>',
  phone: '<rect x="6" y="2" width="12" height="20" rx="3"/><path d="M11 18h2"/>',
  cal: '<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  receipt: '<path d="M5 3h14v18l-3-2-2 2-2-2-2 2-2-2-3 2z"/><path d="M9 8h6M9 12h6"/>',
  cart: '<circle cx="9" cy="20" r="1.4"/><circle cx="18" cy="20" r="1.4"/><path d="M3 4h2l2.4 11h11L21 7H6.3"/>',
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
  coins: '<ellipse cx="9" cy="7" rx="6" ry="3"/><path d="M3 7v5c0 1.7 2.7 3 6 3s6-1.3 6-3V7"/><path d="M9 15v2c0 1.7 2.7 3 6 3s6-1.3 6-3v-5c0-1.6-2.4-2.9-5.5-3"/>',
  edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/>',
  download: '<path d="M12 3v12M7 10l5 5 5-5"/><path d="M4 21h16"/>',
  upload: '<path d="M12 21V9M7 14l5-5 5 5"/><path d="M4 3h16"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  moon: '<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/>',
  auto: '<rect x="3" y="4" width="18" height="13" rx="2"/><path d="M8 21h8M12 17v4"/>',
  briefcase: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 13h18"/>',
  bell: '<path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10 21a2 2 0 0 0 4 0"/>',
  pie: '<path d="M21 12A9 9 0 1 1 12 3v9z"/><path d="M15 3.4A9 9 0 0 1 20.6 9H15z"/>',
  pig: '<path d="M19 9c1 .6 2 1.8 2 3.5 0 2-1 3-2 3.5V19h-3v-1.5h-5V19H8v-2.2A6 6 0 0 1 5 11.5C5 8 8 5.5 12 5.5c1.6 0 3 .3 4.2 1L19 5v4z"/>',
  cloud: '<path d="M7 18a5 5 0 0 1-.9-9.9A6 6 0 0 1 17.6 9 4.5 4.5 0 0 1 17 18z"/>',
  cloudOff: '<path d="M7 18a5 5 0 0 1-.9-9.9A6 6 0 0 1 17.6 9 4.5 4.5 0 0 1 17 18z"/><path d="M3 3l18 18"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  copy: '<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/>',
  tag: '<path d="M3 12V4h8l10 10-8 8z"/><circle cx="7.5" cy="8.5" r="1.3"/>',
  spark: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6"/>'
};

/* ================= data ================= */
const KEY = 'incomeos_v1';
const TYPES = {
  active:  { name: '主动',   color: '#EA580C', pill: 'warn' },
  semi:    { name: '半被动', color: '#7C3AED', pill: 'vio' },
  passive: { name: '被动',   color: '#16A34A', pill: 'ok' }
};
const GOAL_COLORS = ['#2045F5', '#7C3AED', '#16A34A', '#EA580C', '#DC2626', '#0891B2'];
const CAT_COLORS = ['#EA580C', '#2045F5', '#7C3AED', '#0891B2', '#DB2777', '#DC2626', '#65A30D', '#F59E0B', '#16A34A', '#CA8A04', '#0D9488', '#9333EA', '#71717C'];
function defaults() {
  const d = {
    v: 1,
    settings: { name: 'Jeffer', theme: 'auto', opening: 0, fx: { USD: 4.20, SGD: 3.25 }, passiveGoal: 50, lastBackup: null, demo: false, hideInstall: false },
    sources: [
      { id: 's1', name: '个人业绩利润', type: 'active', expected: 2000 },
      { id: 's2', name: 'Admin 工作', type: 'active', expected: 1500 },
      { id: 's3', name: '带 Partner 的 Staff', type: 'semi', expected: 1000 },
      { id: 's4', name: '招商佣金', type: 'active', expected: 0 },
      { id: 's5', name: '订阅抽成 20%', type: 'passive', expected: 0 },
      { id: 's6', name: '代投广告 Tier 佣金', type: 'semi', expected: 0 },
      { id: 's8', name: 'XHS 笔记 AI 订阅', type: 'passive', expected: 0 },
      { id: 'div', name: '股息', type: 'passive', expected: 0 }
    ],
    cats: [
      { id: 'food', name: '餐饮', color: '#EA580C' }, { id: 'transport', name: '交通', color: '#2045F5' },
      { id: 'home', name: '住房', color: '#7C3AED' }, { id: 'utility', name: '水电网络', color: '#0891B2' },
      { id: 'subs', name: '订阅软件', color: '#DB2777' }, { id: 'ads', name: '广告投放', color: '#DC2626', scope: 'business' },
      { id: 'bizOther', name: '其他生意开销', color: '#0D9488', scope: 'business' },
      { id: 'shop', name: '购物', color: '#65A30D' }, { id: 'family', name: '家庭', color: '#F59E0B' },
      { id: 'health', name: '健康', color: '#16A34A' }, { id: 'learn', name: '学习', color: '#CA8A04' },
      { id: 'other', name: '其他', color: '#71717C' }
    ],
    budgets: {}, tx: [], bills: [], goals: [], holdings: []
  };
  d.cats.forEach(c => { if (!c.scope) c.scope = 'personal'; });
  return d;
}
function migrate(d) {
  const base = defaults();
  const out = { ...base, ...d, settings: { ...base.settings, ...(d.settings || {}), fx: { ...base.settings.fx, ...((d.settings || {}).fx || {}) } } };
  for (const k of ['sources', 'cats', 'tx', 'bills', 'goals', 'holdings']) if (!Array.isArray(out[k])) out[k] = base[k];
  if (!out.budgets || typeof out.budgets !== 'object') out.budgets = {};
  out.cats.forEach(c => { if (!c.scope) c.scope = c.id === 'ads' ? 'business' : 'personal'; });
  if (!out.cats.some(c => c.id === 'bizOther')) out.cats.push({ id: 'bizOther', name: '其他生意开销', color: '#0D9488', scope: 'business' });
  return out;
}
let memStore = null;
function load() { try { const raw = localStorage.getItem(KEY); if (raw) return migrate(JSON.parse(raw)); } catch (e) { if (memStore) return memStore; } return defaults(); }
let applyingRemote = false;
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(db)); } catch (e) { memStore = db; }
  if (!applyingRemote && window.IncomeCloud) window.IncomeCloud.changed();
}
const hasContent = d => !!(d.tx.length || d.bills.length || d.goals.length || d.holdings.length);
/* 示例数据还在时开始记真的资料：先把示例清掉，避免之后「清空」连真的一起删 */
function ensureReal() {
  if (!db.settings.demo) return;
  const keep = { name: db.settings.name, theme: db.settings.theme };
  db = defaults(); Object.assign(db.settings, keep);
  setTimeout(() => toast('已清掉示例数据，开始记你自己的'), 1900);
}
let db = load();

/* ---- 白天 / 黑夜 ---- */
const darkMQ = window.matchMedia ? matchMedia('(prefers-color-scheme: dark)') : null;
const isDark = () => document.documentElement.getAttribute('data-theme') === 'dark';
function applyTheme() {
  const t = db.settings.theme || 'auto';
  const dark = t === 'dark' || (t === 'auto' && darkMQ && darkMQ.matches);
  document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
  const m = document.querySelector('meta[name="theme-color"]'); if (m) m.setAttribute('content', dark ? '#141417' : '#FFFFFF');
}
applyTheme();
if (darkMQ) { const f = () => { if ((db.settings.theme || 'auto') === 'auto') { applyTheme(); render(); } }; darkMQ.addEventListener ? darkMQ.addEventListener('change', f) : darkMQ.addListener(f); }
try { navigator.storage && navigator.storage.persist && navigator.storage.persist(); } catch (e) {}

const ROUTES = ['home', 'ledger', 'board', 'invest', 'settings'];
const TITLES = { home: '总览', ledger: '账目', board: '预算看板', invest: '投资组合', settings: '设置' };
const state = { tab: 'home', month: ymOf(new Date()), filter: 'all', q: '', chart: 'income' };

/* ================= selectors ================= */
const inMonth = (t, m) => t.date.slice(0, 7) === m;
const cleared = t => t.status !== 'pending';
const srcById = id => db.sources.find(s => s.id === id);
const catById = id => db.cats.find(c => c.id === id) || { name: '其他', color: '#71717C', scope: 'personal' };
const isBizCat = id => catById(id).scope === 'business';
const isBizTx = t => t.type === 'expense' && isBizCat(t.cat);
const goalDeposits = m => db.goals.reduce((a, g) => a + (g.log || []).filter(x => x.date.slice(0, 7) === m).reduce((b, x) => b + x.amount, 0), 0);
const sumTx = (m, type) => sum(db.tx.filter(t => inMonth(t, m) && t.type === type && cleared(t)));
function cashBalance() {
  const td = dOf(new Date());
  return db.settings.opening + db.tx.filter(t => cleared(t) && t.date <= td).reduce((a, t) => a + (t.type === 'income' ? t.amount : -t.amount), 0);
}
const fxr = cur => cur === 'USD' ? db.settings.fx.USD : cur === 'SGD' ? db.settings.fx.SGD : 1;
function portfolio() {
  let value = 0, cost = 0, div = 0, dv = 0, gr = 0;
  for (const h of db.holdings) {
    const r = fxr(h.cur), v = h.units * h.price * r;
    value += v; cost += h.units * h.cost * r; div += h.units * (h.dps || 0) * r;
    if (h.group === 'dividend') dv += v; else gr += v;
  }
  return { value, cost, pl: value - cost, plPct: pct(value - cost, cost), div, dv, gr };
}
function billStatus(b, m) {
  const cur = ymOf(new Date());
  if (b.paid && b.paid[m]) return { k: 'paid', label: '已付', cls: 'ok' };
  if (m < cur) return { k: 'over', label: '逾期', cls: 'bad' };
  if (m > cur) return { k: 'todo', label: '待付', cls: 'mut' };
  const d = new Date().getDate(), due = Math.min(b.dueDay, daysIn(m));
  if (d > due) return { k: 'over', label: `逾期 ${d - due} 天`, cls: 'bad' };
  if (d === due) return { k: 'today', label: '今天到期', cls: 'warn' };
  return { k: 'soon', label: `${due - d} 天后`, cls: due - d <= 3 ? 'warn' : 'mut' };
}
const overdueCount = () => { const cur = ymOf(new Date()); return db.bills.filter(b => billStatus(b, cur).k === 'over' || billStatus(b, cur).k === 'today').length; };
function txMeta(t) {
  if (t.type === 'income') { const s = srcById(t.src); return { name: s ? s.name : '收入', color: s ? TYPES[s.type].color : '#16A34A', sub: s ? TYPES[s.type].name + '收入' : '收入', biz: false }; }
  const c = catById(t.cat); return { name: c.name, color: c.color, sub: c.name, biz: c.scope === 'business' };
}
const bizPill = '<span class="pill info sm-pill">生意</span>';
const ic = (name, color) => `<span class="ic" style="color:${color};background:${color}12;border-color:${color}33">${esc(String(name).slice(0, 1))}</span>`;
const typePill = type => `<span class="pill ${TYPES[type].pill}"><i></i>${TYPES[type].name}</span>`;

/* ================= ui primitives ================= */
const toastEl = $('#toast'); let toastT;
function toast(msg) { toastEl.textContent = msg; toastEl.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => toastEl.classList.remove('show'), 1800); }
function ask(msg, yes = '确定') {
  return new Promise(res => {
    $('#dlgMsg').textContent = msg; $('#dlgYes').textContent = yes; $('#dlg').classList.add('open');
    const done = v => { $('#dlg').classList.remove('open'); res(v); };
    $('#dlgYes').onclick = () => done(true); $('#dlgNo').onclick = () => done(false);
  });
}
const modal = $('#modal'), mbody = $('#modalBody');
function openModal() { modal.classList.add('open'); }
function closeModal() { modal.classList.remove('open'); }
modal.querySelector('.modal-bg').onclick = closeModal;
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeModal();
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); const g = $('#gq'); if (g) g.focus(); }
});

function fieldHtml(f, v) {
  const val = v[f.key] ?? '';
  const lab = f.label ? `<label class="l">${esc(f.label)}</label>` : '';
  const on = o => String(val) === String(o.value) ? 'on' : '';
  switch (f.type) {
    case 'seg': return `${lab}<div class="segc">${f.options.map(o => `<button type="button" class="${on(o)}" data-k="${f.key}" data-opt="${esc(o.value)}">${esc(o.label)}</button>`).join('')}</div>`;
    case 'chips': return `${lab}<div class="opts">${f.options.map(o => `<button type="button" class="opt ${on(o)}" data-k="${f.key}" data-opt="${esc(o.value)}">${o.color ? `<i class="dot" style="background:${o.color}"></i>` : ''}${esc(o.label)}${o.tag ? `<small class="otag">${esc(o.tag)}</small>` : ''}</button>`).join('')}</div>`;
    case 'amount': return `${lab}<input class="inp amount num" data-k="${f.key}" inputmode="decimal" placeholder="0.00" value="${esc(val)}" autocomplete="off">`;
    case 'number': return `${lab}<input class="inp num" data-k="${f.key}" inputmode="decimal" placeholder="${esc(f.placeholder || '')}" value="${esc(val)}" autocomplete="off">`;
    case 'date': return `${lab}<input class="inp" type="date" data-k="${f.key}" value="${esc(val)}">`;
    case 'toggle': return `<label class="tg"><span>${esc(f.label)}</span><input type="checkbox" data-k="${f.key}" ${val ? 'checked' : ''}><i></i></label>`;
    case 'note': return `<p class="note">${f.html}</p>`;
    case 'grid': return `${f.label ? `<div class="fsec">${f.label}</div>` : ''}<div class="fgrid">${f.items.map(it => `<div><label class="l">${it.color ? `<span class="dot" style="background:${it.color}"></span>` : ''}${esc(it.label)}</label>
      <input class="inp num" data-k="${it.key}" inputmode="decimal" placeholder="${esc(it.placeholder || '')}" value="${esc(v[it.key] ?? '')}" autocomplete="off">${it.hint ? `<div class="hint ${it.hintCls || ''}">${it.hint}</div>` : ''}</div>`).join('')}</div>`;
    default: return `${lab}<input class="inp" data-k="${f.key}" placeholder="${esc(f.placeholder || '')}" value="${esc(val)}" autocomplete="off">`;
  }
}
function openForm(cfg) {
  const v = { ...(cfg.values || {}) }; let first = true;
  modal.querySelector('.modal-panel').classList.toggle('wide', !!cfg.wide);
  const draw = () => {
    const fields = (typeof cfg.fields === 'function' ? cfg.fields(v) : cfg.fields).filter(Boolean);
    mbody.innerHTML = `<div class="mh"><h3>${esc(cfg.title)}</h3><button class="x" data-close aria-label="关闭">${I(P.x, 16)}</button></div>
      <div>${fields.map(f => fieldHtml(f, v)).join('')}</div>${cfg.footer || ''}
      ${cfg.onSave || cfg.onDelete ? `<div class="m-actions">${cfg.onDelete ? '<button class="btn lg danger" data-del>删除</button>' : ''}${cfg.onSave ? `<button class="btn lg primary" data-save>${esc(cfg.saveText || '保存')}</button>` : ''}</div>` : ''}`;
    mbody.querySelector('[data-close]').onclick = closeModal;
    mbody.querySelectorAll('[data-opt]').forEach(el => el.onclick = () => { v[el.dataset.k] = el.dataset.opt; draw(); });
    mbody.querySelectorAll('input[data-k]').forEach(el => {
      const k = el.dataset.k;
      if (el.type === 'checkbox') el.onchange = () => { v[k] = el.checked; };
      else {
        el.oninput = () => { v[k] = el.value; }; el.onchange = () => { v[k] = el.value; };
        el.onkeydown = e => { if (e.key === 'Enter') { const sv = mbody.querySelector('[data-save]'); if (sv) sv.click(); } };
      }
    });
    const sv = mbody.querySelector('[data-save]');
    if (sv) sv.onclick = () => { const err = cfg.validate && cfg.validate(v); if (err) { toast(err); return; } if (cfg.onSave(v) !== false) closeModal(); };
    const dl = mbody.querySelector('[data-del]');
    if (dl) dl.onclick = async () => { if (await ask(cfg.delText || '确定删除？', '删除')) { cfg.onDelete(); closeModal(); } };
    if (cfg.bind) cfg.bind(mbody, v, draw);
    if (first && cfg.focus) { const el = mbody.querySelector(`input[data-k="${cfg.focus}"]`); if (el) setTimeout(() => el.focus(), 260); }
    first = false;
  };
  draw(); openModal();
}
const upsert = (arr, rec) => { const i = arr.findIndex(x => x.id === rec.id); if (i >= 0) arr[i] = rec; else arr.push(rec); };
const commit = msg => { save(); render(); if (msg) toast(msg); scheduleSync(); };

/* ================= forms ================= */
function txForm(tx, preset = {}) {
  const now = new Date();
  const defDate = state.month === ymOf(now) ? dOf(now) : state.month + '-01';
  const v = tx ? { ...tx, amount: String(tx.amount), pending: tx.status === 'pending', ...preset }
               : { type: 'expense', amount: '', date: defDate, cat: 'food', src: (db.sources[0] || {}).id, note: '', pending: false, ...preset };
  openForm({
    title: tx ? '编辑记录' : '记一笔', values: v, focus: tx || preset.amount ? null : 'amount',
    bind: (b, v) => bindAddCat(b, id => txForm(tx, { ...v, cat: id })),
    fields: v => [
      { key: 'type', type: 'seg', options: [{ value: 'expense', label: '支出' }, { value: 'income', label: '收入' }] },
      { key: 'amount', type: 'amount', label: '金额 (RM)' },
      v.type === 'income'
        ? { key: 'src', type: 'chips', label: '收入来源', options: db.sources.map(s => ({ value: s.id, label: s.name, color: TYPES[s.type].color })) }
        : { key: 'cat', type: 'chips', label: '分类', options: catOptions() },
      { key: 'date', type: 'date', label: '日期' },
      { key: 'note', type: 'text', label: '备注', placeholder: v.type === 'income' ? '例如：10 月订阅抽成' : '例如：午餐 / Grab' },
      { key: 'pending', type: 'toggle', label: v.type === 'income' ? '待到账（还没收到钱）' : '待付（还没付钱）' }
    ],
    validate: v => !(num(v.amount) > 0) ? '请输入金额' : (!v.date ? '请选日期' : (v.type === 'income' && !srcById(v.src) ? '请选收入来源' : '')),
    onSave: v => {
      if (!tx) ensureReal();
      const rec = { id: tx ? tx.id : uid(), type: v.type, amount: r2(num(v.amount)), date: v.date, note: (v.note || '').trim(), status: v.pending ? 'pending' : 'cleared', ts: (tx && tx.ts) || Date.now() };
      if (v.type === 'income') rec.src = v.src; else rec.cat = v.cat;
      if (tx && tx.billId) rec.billId = tx.billId;
      upsert(db.tx, rec); commit(tx ? '已更新' : '已记录');
    },
    onDelete: tx ? () => { deleteTx(tx.id); commit('已删除'); } : null
  });
}
function deleteTx(id) {
  const t = db.tx.find(x => x.id === id);
  db.tx = db.tx.filter(x => x.id !== id);
  if (t && t.billId) { const b = db.bills.find(x => x.id === t.billId); if (b && b.paid) for (const k in b.paid) if (b.paid[k] === id) delete b.paid[k]; }
}
function billForm(b, preset = {}) {
  openForm({
    title: b ? '编辑账单' : '新增固定账单',
    values: b ? { ...b, amount: String(b.amount), dueDay: String(b.dueDay), ...preset } : { name: '', amount: '', dueDay: '1', cat: 'home', ...preset },
    bind: (el, v) => bindAddCat(el, id => billForm(b, { ...v, cat: id })),
    fields: [
      { key: 'name', label: '名称', placeholder: '例如：房租 / TNB 电费 / Unifi' },
      { key: 'amount', type: 'number', label: '每月金额 (RM)' },
      { key: 'dueDay', type: 'number', label: '每月几号到期 (1–31)' },
      { key: 'cat', type: 'chips', label: '分类', options: catOptions() }
    ],
    validate: v => !v.name.trim() ? '请输入名称' : (!(num(v.amount) > 0) ? '请输入金额' : (!(num(v.dueDay) >= 1 && num(v.dueDay) <= 31) ? '到期日要在 1–31' : '')),
    onSave: v => { if (!b) ensureReal(); upsert(db.bills, { id: b ? b.id : uid(), name: v.name.trim(), amount: r2(num(v.amount)), dueDay: Math.round(num(v.dueDay)), cat: v.cat, paid: b ? (b.paid || {}) : {} }); commit('已保存'); },
    onDelete: b ? () => { db.bills = db.bills.filter(x => x.id !== b.id); commit('已删除'); } : null,
    delText: '删除这个账单？（已记下的付款记录会保留）'
  });
}
async function payBill(id) {
  const b = db.bills.find(x => x.id === id); if (!b) return;
  const m = state.month; b.paid = b.paid || {};
  if (b.paid[m]) {
    if (!(await ask(`把「${b.name}」${mLabel(m)}改回未付？对应的支出记录会删除。`, '改回未付'))) return;
    const txId = b.paid[m]; db.tx = db.tx.filter(t => t.id !== txId); delete b.paid[m]; commit('已改回未付'); return;
  }
  const cur = ymOf(new Date());
  const date = m === cur ? dOf(new Date()) : m + '-' + pad(Math.min(b.dueDay, daysIn(m)));
  const t = { id: uid(), type: 'expense', amount: b.amount, date, cat: b.cat, note: b.name, status: 'cleared', billId: b.id, ts: Date.now() };
  db.tx.push(t); b.paid[m] = t.id; commit(`已付 ${b.name}`);
}
function goalForm(g) {
  openForm({
    title: g ? '编辑目标' : '新增储蓄目标',
    values: g ? { ...g, target: String(g.target), saved: String(g.saved) } : { name: '', target: '', saved: '0', deadline: '', color: GOAL_COLORS[db.goals.length % GOAL_COLORS.length] },
    fields: [
      { key: 'name', label: '目标名称', placeholder: '例如：紧急备用金 / 银行股首仓' },
      { key: 'target', type: 'number', label: '目标金额 (RM)' },
      { key: 'saved', type: 'number', label: '已存 (RM)' },
      { key: 'deadline', type: 'date', label: '完成日期（可留空）' },
      { key: 'color', type: 'chips', label: '颜色', options: GOAL_COLORS.map(c => ({ value: c, label: '', color: c })) }
    ],
    validate: v => !v.name.trim() ? '请输入名称' : (!(num(v.target) > 0) ? '请输入目标金额' : ''),
    onSave: v => { if (!g) ensureReal(); upsert(db.goals, { id: g ? g.id : uid(), name: v.name.trim(), target: r2(num(v.target)), saved: r2(num(v.saved)), deadline: v.deadline || '', color: v.color, log: g ? (g.log || []) : [] }); commit('已保存'); },
    onDelete: g ? () => { db.goals = db.goals.filter(x => x.id !== g.id); commit('已删除'); } : null
  });
}
function depositForm(g) {
  openForm({
    title: g.name, values: { amount: '' }, focus: 'amount', saveText: '存入',
    fields: [
      { key: 'amount', type: 'amount', label: `存入金额（取出填负数）· 目前 ${money0(g.saved)} / ${money0(g.target)}` },
      { type: 'note', key: 'n', html: '存入的金额会算在「收入去向」的「存起来」里，不算支出。' }
    ],
    footer: '<div class="stack"><button class="btn lg" data-edit>编辑这个目标</button></div>',
    bind: b => { b.querySelector('[data-edit]').onclick = () => goalForm(g); },
    validate: v => num(v.amount) === 0 ? '请输入金额' : '',
    onSave: v => { const a = r2(num(v.amount)); g.saved = r2(Math.max(0, g.saved + a)); (g.log = g.log || []).push({ date: dOf(new Date()), amount: a }); commit(g.saved >= g.target ? `「${g.name}」达成了` : '已更新'); }
  });
}
function srcForm(s) {
  openForm({
    title: s ? '编辑收入来源' : '新增收入来源',
    values: s ? { ...s, expected: String(s.expected || '') } : { name: '', type: 'passive', expected: '' },
    fields: [
      { key: 'name', label: '名称', placeholder: '例如：XHS 笔记 AI 订阅' },
      { key: 'type', type: 'seg', label: '类型', options: Object.entries(TYPES).map(([k, t]) => ({ value: k, label: t.name })) },
      { key: 'expected', type: 'number', label: '每月预期 (RM，不固定可留空)' },
      { type: 'note', key: 'n', html: '主动＝要你亲自做才有；半被动＝要管理但不用每天做；被动＝不做事也会进来（订阅、股息）。' }
    ],
    validate: v => !v.name.trim() ? '请输入名称' : '',
    onSave: v => { upsert(db.sources, { id: s ? s.id : uid(), name: v.name.trim(), type: v.type, expected: r2(num(v.expected)) }); commit('已保存'); },
    onDelete: s && s.id !== 'div' ? () => { db.sources = db.sources.filter(x => x.id !== s.id); commit('已删除'); } : null,
    delText: '删除这个来源？旧记录会保留，但会显示成「收入」。'
  });
}
function catOptions() {
  const o = c => ({ value: c.id, label: c.name, color: c.color, tag: c.scope === 'business' ? '生意' : '' });
  return [...db.cats.filter(c => c.scope !== 'business').map(o), ...db.cats.filter(c => c.scope === 'business').map(o), { value: '__new', label: '+ 新增分类' }];
}
function bindAddCat(el, back) {
  const b = el.querySelector('[data-opt="__new"]'); if (!b) return;
  b.classList.add('add');
  b.onclick = e => { e.stopPropagation(); catForm(null, back); };
}
function catForm(c, back) {
  const used = c ? db.tx.filter(t => t.cat === c.id).length : 0;
  openForm({
    title: c ? '编辑分类' : '新增支出分类',
    values: c ? { name: c.name, color: c.color, scope: c.scope || 'personal', budget: db.budgets[c.id] ? String(db.budgets[c.id]) : '' } : { name: '', color: CAT_COLORS[db.cats.length % CAT_COLORS.length], scope: 'personal', budget: '' },
    fields: [
      { key: 'name', label: '分类名称', placeholder: '例如：保险 / 宠物 / 旅行 / 素材拍摄' },
      { key: 'scope', type: 'seg', label: '属于', options: [{ value: 'personal', label: '个人支出' }, { value: 'business', label: '生意支出' }] },
      { key: 'budget', type: 'number', label: '每月预算 (RM，可留空)', placeholder: '不设' },
      { key: 'color', type: 'chips', label: '颜色', options: CAT_COLORS.map(x => ({ value: x, label: '', color: x })) },
      c ? { type: 'note', key: 'n', html: `这个分类目前有 ${used} 笔记录。` } : null
    ],
    focus: c ? null : 'name',
    validate: v => { const n = v.name.trim(); if (!n) return '请输入名称'; if (db.cats.some(x => x.name === n && (!c || x.id !== c.id))) return '已经有这个分类'; return ''; },
    onSave: v => {
      const id = c ? c.id : 'c' + uid();
      upsert(db.cats, { id, name: v.name.trim(), color: v.color, scope: v.scope });
      const bn = r2(num(v.budget)); if (bn > 0) db.budgets[id] = bn; else delete db.budgets[id];
      save(); render(); toast(c ? '分类已更新' : `已新增「${v.name.trim()}」`);
      if (back) { back(id); return false; }
    },
    onDelete: c && c.id !== 'other' ? () => {
      db.cats = db.cats.filter(x => x.id !== c.id);
      db.tx.forEach(t => { if (t.cat === c.id) t.cat = 'other'; });
      db.bills.forEach(b => { if (b.cat === c.id) b.cat = 'other'; });
      delete db.budgets[c.id]; commit('已删除');
    } : null,
    delText: `删除「${c ? c.name : ''}」？用到它的 ${used} 笔记录会改成「其他」。`
  });
}
function budgetForm() {
  const m = state.month, spent = {};
  db.tx.filter(t => inMonth(t, m) && t.type === 'expense').forEach(t => spent[t.cat] = (spent[t.cat] || 0) + t.amount);
  const v = {}; db.cats.forEach(c => v[c.id] = db.budgets[c.id] ? String(db.budgets[c.id]) : '');
  const per = db.cats.filter(c => c.scope !== 'business'), biz = db.cats.filter(c => c.scope === 'business');
  const tot = (list, vals) => list.reduce((a, c) => a + num(vals[c.id]), 0);
  const items = list => list.map(c => {
    const sp = spent[c.id] || 0, l = num(v[c.id]);
    return { key: c.id, label: c.name, color: c.color, placeholder: '不设', hint: sp ? `已花 ${money0(sp)}` : '本月还没花', hintCls: l && sp > l ? 'over' : '' };
  });
  openForm({
    title: '每月预算', values: v, wide: true,
    fields: [
      { type: 'note', key: 'n', html: `每个分类每月最多花多少，留空＝不设预算。小字是 ${mLabel(m)} 已经花的。早上提醒的「每天可以花」是用<b>个人预算</b>算的。` },
      { type: 'grid', key: 'gp', label: `${I(P.wallet, 14)}个人支出`, items: items(per) },
      biz.length ? { type: 'grid', key: 'gb', label: `${I(P.briefcase, 14)}生意支出`, items: items(biz) } : null
    ],
    footer: `<div class="sumbar"><span>个人预算 / 月 <b class="num" id="bper">${money0(tot(per, v))}</b></span><span>生意预算 / 月 <b class="num" id="bbiz">${money0(tot(biz, v))}</b></span></div>
      <div class="stack"><button class="btn" data-newcat>${I(P.plus, 15)}新增支出分类</button></div>`,
    bind: (el, vals) => {
      el.querySelectorAll('.fgrid input').forEach(inp => inp.addEventListener('input', () => {
        el.querySelector('#bper').textContent = money0(tot(per, vals)); el.querySelector('#bbiz').textContent = money0(tot(biz, vals));
      }));
      el.querySelector('[data-newcat]').onclick = () => {
        db.cats.forEach(c => { const n = r2(num(vals[c.id])); if (n > 0) db.budgets[c.id] = n; else delete db.budgets[c.id]; }); save();
        catForm(null, () => budgetForm());
      };
    },
    onSave: v => { db.cats.forEach(c => { const n = r2(num(v[c.id])); if (n > 0) db.budgets[c.id] = n; else delete db.budgets[c.id]; }); commit('预算已保存'); }
  });
}
function holdForm(h) {
  openForm({
    title: h ? `编辑 ${h.symbol}` : '新增持仓',
    values: h ? { ...h, units: String(h.units), cost: String(h.cost), price: String(h.price), dps: String(h.dps || '') } : { symbol: '', name: '', group: 'dividend', cur: 'MYR', units: '', cost: '', price: '', dps: '' },
    fields: v => [
      { key: 'symbol', label: '代号', placeholder: '例如：1155 / NVDA' },
      { key: 'name', label: '名称', placeholder: '例如：Maybank' },
      { key: 'group', type: 'seg', label: '类型', options: [{ value: 'dividend', label: '股息股' }, { value: 'growth', label: '成长股' }] },
      { key: 'cur', type: 'seg', label: '货币', options: [{ value: 'MYR', label: 'MYR' }, { value: 'USD', label: 'USD' }, { value: 'SGD', label: 'SGD' }] },
      { key: 'units', type: 'number', label: '股数' },
      { key: 'cost', type: 'number', label: `平均成本 / 股 (${v.cur})` },
      { key: 'price', type: 'number', label: `现价 / 股 (${v.cur})` },
      { key: 'dps', type: 'number', label: `每股年股息 (${v.cur}，没有留空)`, placeholder: '0' },
      { type: 'note', key: 'n', html: '现价要手动更新（在券商 App 看）。USD / SGD 会用「设置」里的汇率换算成 RM。' }
    ],
    validate: v => !v.symbol.trim() ? '请输入代号' : (!(num(v.units) > 0) ? '请输入股数' : (!(num(v.price) > 0) ? '请输入现价' : '')),
    onSave: v => { if (!h) ensureReal(); upsert(db.holdings, { id: h ? h.id : uid(), symbol: v.symbol.trim().toUpperCase(), name: v.name.trim(), group: v.group, cur: v.cur, units: num(v.units), cost: num(v.cost) || num(v.price), price: num(v.price), dps: num(v.dps) }); commit('已保存'); },
    onDelete: h ? () => { db.holdings = db.holdings.filter(x => x.id !== h.id); commit('已删除'); } : null
  });
}
function divForm() {
  openForm({
    title: '记录收到的股息', values: { amount: '', date: dOf(new Date()), hold: (db.holdings.find(h => h.dps > 0) || db.holdings[0] || {}).id || '' }, focus: 'amount',
    fields: [
      { key: 'amount', type: 'amount', label: '到账金额 (RM)' },
      db.holdings.length ? { key: 'hold', type: 'chips', label: '哪一只', options: db.holdings.map(h => ({ value: h.id, label: h.name || h.symbol })) } : null,
      { key: 'date', type: 'date', label: '到账日期' },
      { type: 'note', key: 'n', html: '会记成「股息」收入，算进被动收入。' }
    ],
    validate: v => !(num(v.amount) > 0) ? '请输入金额' : '',
    onSave: v => {
      ensureReal();
      if (!srcById('div')) db.sources.push({ id: 'div', name: '股息', type: 'passive', expected: 0 });
      const h = db.holdings.find(x => x.id === v.hold);
      db.tx.push({ id: uid(), type: 'income', amount: r2(num(v.amount)), date: v.date, src: 'div', note: h ? `${h.name || h.symbol} 股息` : '股息', status: 'cleared', ts: Date.now() });
      commit('股息已记录');
    }
  });
}

/* ================= backup / demo ================= */
async function exportData() {
  const name = `incomeos-backup-${dOf(new Date())}.json`;
  const json = JSON.stringify(db, null, 2);
  const mark = () => { db.settings.lastBackup = dOf(new Date()); save(); render(); };
  try {
    const file = new File([json], name, { type: 'application/json' });
    if (navigator.canShare && navigator.canShare({ files: [file] }) && matchMedia('(max-width:760px)').matches) { await navigator.share({ files: [file], title: name }); mark(); toast('已导出'); return; }
  } catch (e) { if (e && e.name === 'AbortError') return; }
  try {
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([json], { type: 'application/json' })); a.download = name;
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 3000); mark(); toast('已下载备份');
  } catch (e) { toast('这个环境不能下载'); }
}
function importData() {
  const inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'application/json,.json';
  inp.onchange = () => {
    const f = inp.files[0]; if (!f) return;
    const r = new FileReader();
    r.onload = async () => {
      try {
        const d = JSON.parse(r.result); if (!d || !Array.isArray(d.tx)) throw 0;
        if (!(await ask('导入会覆盖现有的数据，继续？', '导入'))) return;
        db = migrate(d); save(); render(); toast('已导入');
      } catch (e) { toast('文件格式不对'); }
    };
    r.readAsText(f);
  };
  inp.click();
}
async function wipeAll() {
  const cs = window.IncomeCloud && IncomeCloud.state();
  if (!(await ask(cs && cs.user ? '清空所有记录、账单、目标和持仓？已登录云端，云端和所有设备上的资料也会一起清空，不能撤回。' : '清空所有记录、账单、目标和持仓？这个动作不能撤回。', '清空'))) return;
  const name = db.settings.name;
  db = defaults(); db.settings.name = name; save(); state.month = ymOf(new Date()); go('home'); toast('已清空');
}
async function loadDemo() {
  if (hasContent(db) && !db.settings.demo) { toast('你已经有自己的资料，示例数据只能在空白时看'); return; }
  const d = defaults(); d.settings.demo = true; d.settings.opening = 15000; d.settings.name = db.settings.name;
  const now = new Date(), cur = ymOf(now);
  const rnd = (a, b) => r2(a + Math.random() * (b - a));
  d.bills = [
    { id: 'b1', name: '房租', amount: 1200, dueDay: 1, cat: 'home', paid: {} },
    { id: 'b5', name: 'AI / 设计工具订阅', amount: 150, dueDay: 8, cat: 'subs', paid: {} },
    { id: 'b2', name: '手机月费', amount: 58, dueDay: 15, cat: 'utility', paid: {} },
    { id: 'b3', name: 'TNB 电费', amount: 130, dueDay: 20, cat: 'utility', paid: {} },
    { id: 'b4', name: '家用网络', amount: 99, dueDay: 25, cat: 'utility', paid: {} }
  ];
  for (let k = -2; k <= 0; k++) {
    const m = addMonth(cur, k), last = k === 0 ? now.getDate() : daysIn(m);
    const add = (type, amount, day, extra) => {
      if (day > last) return;
      const [yy, mm] = m.split('-').map(Number), when = new Date(yy, mm - 1, day, 8 + Math.floor(Math.random() * 13), Math.floor(Math.random() * 60));
      if (when > now) when.setTime(now.getTime() - Math.random() * 3600e3);
      d.tx.push({ id: uid(), type, amount: r2(amount), date: m + '-' + pad(day), status: 'cleared', note: '', ts: when.getTime(), ...extra });
    };
    add('income', 1500, 1, { src: 's2', note: 'Admin 月薪' });
    add('income', 1000, 1, { src: 's3' });
    add('income', rnd(160, 260), 3, { src: 's5', note: 'USD 49 订阅 × 20%' });
    add('income', rnd(1800, 2400), 5, { src: 's1' });
    add('income', 11 * Math.round(rnd(18, 45)), 8, { src: 's6', note: '罐数 × RM 11' });
    if (k !== -1) add('income', 2000, 12, { src: 's4', note: '新伙伴加入' });
    if (k === -1) add('income', rnd(90, 140), 20, { src: 'div', note: '银行股股息' });
    for (let i = 1; i <= last; i++) {
      if (Math.random() < .75) add('expense', rnd(12, 42), i, { cat: 'food' });
      if (Math.random() < .3) add('expense', rnd(10, 55), i, { cat: 'transport', note: 'Grab / 油钱' });
    }
    add('expense', rnd(600, 1100), 2, { cat: 'ads', note: 'Meta 广告充值' });
    add('expense', rnd(400, 900), 9, { cat: 'ads', note: 'Meta 广告充值' });
    add('expense', rnd(400, 900), 16, { cat: 'ads', note: 'Meta 广告充值' });
    add('expense', rnd(150, 350), 6, { cat: 'bizOther', note: '素材拍摄' });
    add('expense', rnd(120, 380), 18, { cat: 'shop' });
    add('expense', rnd(60, 160), 22, { cat: 'family' });
    for (const b of d.bills) {
      if (k === 0 && (b.dueDay > now.getDate() || b.id === 'b3')) continue;
      const id = uid(); d.tx.push({ id, type: 'expense', amount: b.amount, date: m + '-' + pad(b.dueDay), cat: b.cat, note: b.name, status: 'cleared', billId: b.id }); b.paid[m] = id;
    }
  }
  d.tx.push({ id: uid(), type: 'income', amount: 980, date: dOf(now), src: 's6', note: '本月 Tier 佣金（待结算）', status: 'pending', ts: now.getTime() - 600e3 });
  const plus = n => { const x = new Date(now); x.setMonth(x.getMonth() + n); return dOf(x); };
  d.goals = [
    { id: 'g1', name: '紧急备用金（6 个月开销）', target: 30000, saved: 8400, deadline: plus(10), color: '#2045F5', log: [{ date: cur + '-01', amount: 500 }] },
    { id: 'g2', name: '银行股加仓', target: 10000, saved: 3200, deadline: plus(4), color: '#16A34A', log: [{ date: cur + '-01', amount: 300 }] },
    { id: 'g3', name: 'XHS 笔记 AI 开发', target: 5000, saved: 1800, deadline: plus(3), color: '#7C3AED', log: [] }
  ];
  d.holdings = [
    { id: 'h1', symbol: '1155', name: 'Maybank', group: 'dividend', cur: 'MYR', units: 2000, cost: 9.6, price: 10.1, dps: 0.6 },
    { id: 'h2', symbol: '1023', name: 'CIMB', group: 'dividend', cur: 'MYR', units: 1500, cost: 7.2, price: 7.8, dps: 0.42 },
    { id: 'h3', symbol: '1295', name: 'Public Bank', group: 'dividend', cur: 'MYR', units: 3000, cost: 4.3, price: 4.45, dps: 0.2 },
    { id: 'h4', symbol: 'U11', name: 'UOB', group: 'dividend', cur: 'SGD', units: 100, cost: 34, price: 35.5, dps: 1.7 },
    { id: 'h5', symbol: 'META', name: 'Meta', group: 'growth', cur: 'USD', units: 5, cost: 600, price: 640, dps: 2.1 },
    { id: 'h6', symbol: 'TSLA', name: 'Tesla', group: 'growth', cur: 'USD', units: 8, cost: 300, price: 330, dps: 0 },
    { id: 'h7', symbol: 'NVDA', name: 'Nvidia', group: 'growth', cur: 'USD', units: 20, cost: 130, price: 150, dps: 0.04 }
  ];
  d.budgets = { food: 900, transport: 400, ads: 2500, shop: 300, subs: 200, family: 300 };
  d.sources.find(s => s.id === 's4').expected = 2000;
  d.sources.find(s => s.id === 's5').expected = 200;
  d.sources.find(s => s.id === 's6').expected = 400;
  db = d; save(); state.month = cur; go('home'); toast('已载入示例数据');
}

/* ================= 每日提醒：同步摘要到 GitHub Gist ================= */
const SYNC_KEY = 'incomeos_sync';   // 跟主数据分开放，导出备份时不会带出 token
function loadSync() { try { return JSON.parse(localStorage.getItem(SYNC_KEY)) || {}; } catch (e) { return {}; } }
function saveSync(c) { try { localStorage.setItem(SYNC_KEY, JSON.stringify(c)); } catch (e) {} }
function snapshot() {
  const now = new Date(), m = ymOf(now), txm = db.tx.filter(t => inMonth(t, m));
  const exp = txm.filter(t => t.type === 'expense'), spentBy = {};
  exp.forEach(t => spentBy[t.cat] = (spentBy[t.cat] || 0) + t.amount);
  return {
    v: 1, updatedAt: now.toISOString(), name: db.settings.name, month: m,
    cash: r2(cashBalance()),
    income: r2(sum(txm.filter(t => t.type === 'income' && cleared(t)))),
    personalExp: r2(sum(exp.filter(t => !isBizTx(t)))), businessExp: r2(sum(exp.filter(isBizTx))),
    budgets: db.cats.filter(c => c.scope !== 'business' && db.budgets[c.id] > 0).map(c => ({ name: c.name, budget: db.budgets[c.id], spent: r2(spentBy[c.id] || 0) })),
    bills: db.bills.map(b => ({ name: b.name, amount: b.amount, dueDay: b.dueDay, paid: !!(b.paid && b.paid[m]) }))
  };
}
let syncTimer = null, syncing = false;
function scheduleSync() { clearTimeout(syncTimer); syncTimer = setTimeout(() => syncNow(false), 2500); }
async function syncNow(manual) {
  const cfg = loadSync();
  if (!cfg.token) { if (manual) toast('先填 GitHub token'); return; }
  if (db.settings.demo) { if (manual) toast('示例数据不会同步，先清空再记自己的'); return; }
  if (syncing) return; syncing = true;
  try {
    const body = { description: 'IncomeOS 每日提醒摘要（App 自动同步）', files: { 'incomeos-summary.json': { content: JSON.stringify(snapshot(), null, 2) } } };
    if (!cfg.gistId) body.public = false;
    const r = await fetch(cfg.gistId ? `https://api.github.com/gists/${cfg.gistId}` : 'https://api.github.com/gists', {
      method: cfg.gistId ? 'PATCH' : 'POST',
      headers: { Authorization: 'Bearer ' + cfg.token, Accept: 'application/vnd.github+json', 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (!r.ok) throw new Error(r.status === 401 ? 'token 无效或过期' : r.status === 404 ? '找不到 Gist（token 要勾 gist 权限）' : 'GitHub 回应 ' + r.status);
    const j = await r.json();
    const first = !cfg.gistId;
    Object.assign(cfg, { gistId: j.id, lastSync: new Date().toISOString(), lastError: '' }); saveSync(cfg);
    if (manual || first) { toast(first ? '已连接，记下 Gist ID' : '已同步'); if (state.tab === 'settings') render(); }
  } catch (e) {
    cfg.lastError = e.message || '网络错误'; saveSync(cfg);
    if (manual) { toast('同步失败：' + cfg.lastError); if (state.tab === 'settings') render(); }
  } finally { syncing = false; }
}

/* ================= 给 cloud.js 用的接口 ================= */
window.IncomeApp = {
  getData: () => db,
  replaceData(d, note) {
    applyingRemote = true;
    try { db = migrate(d); save(); applyTheme(); } finally { applyingRemote = false; }
    if (!modal.classList.contains('open')) render(); else renderShellOnly();
    if (note) toast(note);
  },
  refreshCloud() { if (state.tab === 'settings' && !modal.classList.contains('open') && !document.activeElement.closest('#cloudCard')) render(); else renderShellOnly(); }
};
const cloudState = () => (window.IncomeCloud ? IncomeCloud.state() : null);
function cloudBadge() {
  const c = cloudState();
  if (!c) return { cls: 'off', label: '云端未连接' };
  if (!c.user) return { cls: 'off', label: '未登录云端' };
  return { synced: { cls: 'ok', label: '已同步' }, syncing: { cls: 'busy', label: '同步中…' }, offline: { cls: 'busy', label: '离线（恢复网络后同步）' }, error: { cls: 'bad', label: '同步出错' } }[c.status] || { cls: 'busy', label: '连接中…' };
}

/* ================= install ================= */
let deferredPrompt = null;
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferredPrompt = e; render(); });
const isStandalone = () => (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true;
const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

/* ================= shared blocks ================= */
function banners() {
  let h = '';
  if (db.settings.demo) h += `<div class="banner info">${I(P.spark, 16)}<span class="g">现在看到的是<b>示例数据</b>。看完到「设置 → 清空所有数据」开始记你自己的。</span><button data-act="go" data-id="settings">去设置</button></div>`;
  if (!isStandalone() && !db.settings.hideInstall && (deferredPrompt || isIOS)) {
    h += `<div class="banner info">${I(P.phone, 16)}<span class="g">${deferredPrompt ? '把 IncomeOS 装到主屏幕，像 App 一样全屏打开、离线也能用。' : '用 Safari 打开，点「分享」→「添加到主屏幕」，就能像 App 一样用。'}</span>${deferredPrompt ? '<button data-act="install">安装</button>' : ''}<button data-act="hideInstall" aria-label="关闭">${I(P.x, 14)}</button></div>`;
  }
  const cs = cloudState();
  if (cs && !cs.user && hasContent(db) && !db.settings.demo) h += `<div class="banner warn">${I(P.cloudOff, 16)}<span class="g">资料现在只存在这个浏览器里。<b>登录云端同步</b>，换手机、换浏览器都不会不见。</span><button data-act="go" data-id="settings">去登录</button></div>`;
  if (cs && cs.user && cs.status === 'error') h += `<div class="banner warn">${I(P.cloudOff, 16)}<span class="g">云端同步出错：${esc(cs.error)}</span><button data-act="go" data-id="settings">查看</button></div>`;
  const lb = db.settings.lastBackup, days = lb ? Math.floor((Date.now() - new Date(lb).getTime()) / 864e5) : null;
  if (!db.settings.demo && !(cs && cs.user) && db.tx.length >= 20 && (days === null || days >= 14)) h += `<div class="banner warn">${I(P.download, 16)}<span class="g">${days === null ? '还没备份过' : `已经 ${days} 天没备份`}，数据只存在这个浏览器里。</span><button data-act="export">导出备份</button></div>`;
  return h;
}
function ph(title, sub, acts = '', cls = '') {
  return `<div class="ph ${cls}"><div><h1>${title}</h1>${sub ? `<p>${sub}</p>` : ''}</div>${acts ? `<div class="acts">${acts}</div>` : ''}</div>`;
}
const cardH = (icon, color, title, right = '') => `<div class="card-h"><span class="ico" style="background:${color}14;color:${color}">${I(icon, 14)}</span>${title}<span class="sp"></span>${right}</div>`;
function txRowTable(t) {
  const m = txMeta(t), inc = t.type === 'income', dt = new Date(t.date + 'T00:00:00');
  const st = t.status === 'pending' ? `<span class="pill warn"><i></i>${inc ? '待到账' : '待付'}</span>` : `<span class="pill ok"><i></i>${inc ? '已到账' : '已付'}</span>`;
  return `<div class="tr t-tx tap" data-act="tx" data-id="${t.id}">
    <div class="h-m muted num">${dt.getMonth() + 1}月${dt.getDate()}日 ${WD[dt.getDay()]}</div>
    <div class="cell-main">${ic(m.name, m.color)}<div class="t"><div class="t1">${esc(t.note || m.name)}</div><div class="t2"><span class="m-inl">${dt.getMonth() + 1}/${dt.getDate()} · </span>${esc(t.note ? m.name : m.sub)}${t.status === 'pending' ? `<span class="m-inl" style="color:var(--orange)"> · ${inc ? '待到账' : '待付'}</span>` : ''}</div></div></div>
    <div class="h-m t2">${inc ? typePill((srcById(t.src) || { type: 'active' }).type) : `<span class="dot" style="background:${m.color};margin-right:6px"></span>${esc(m.name)}`}</div>
    <div class="h-m">${st}</div>
    <div class="ra amt num ${inc ? 'up' : ''}">${inc ? '+' : '-'}${fmt(t.amount)}</div></div>`;
}
function billLi(b, m) {
  const st = billStatus(b, m), c = catById(b.cat), paid = st.k === 'paid';
  return `<div class="li">${ic(b.name, c.color)}
    <div class="grow tap" data-act="bill" data-id="${b.id}"><div class="t1">${esc(b.name)}</div><div class="t2">每月 ${b.dueDay} 号 · ${esc(c.name)}</div></div>
    <span class="pill ${st.cls}">${st.label}</span>
    <div class="amt num" style="min-width:74px;text-align:right;${paid ? 'color:var(--muted)' : ''}">${money0(b.amount)}</div>
    <button class="pay ${paid ? 'done' : ''}" data-act="payBill" data-id="${b.id}">${paid ? I(P.check, 14) + '已付' : '付款'}</button></div>`;
}

/* ================= views ================= */
/* ---------- 流水（MAE 风格：按天分隔） ---------- */
const hhmm = ts => { const d = new Date(ts); return pad(d.getHours()) + ':' + pad(d.getMinutes()); };
function dayLabel(date) {
  const d = new Date(date + 'T00:00:00'), now = new Date();
  const y = new Date(now); y.setDate(now.getDate() - 1);
  const main = date === dOf(now) ? '今天' : date === dOf(y) ? '昨天' : `${d.getMonth() + 1}月${d.getDate()}日`;
  return { main, sub: `${main === '今天' || main === '昨天' ? `${d.getMonth() + 1}月${d.getDate()}日 ` : ''}${WD[d.getDay()]}` };
}
function feedRow(t) {
  const m = txMeta(t), inc = t.type === 'income', pend = t.status === 'pending';
  const sub = [m.note2 || (t.note ? m.name : m.sub), t.ts ? hhmm(t.ts) : ''].filter(Boolean).join(' · ');
  return `<div class="fr" data-act="tx" data-id="${t.id}">
    <span class="av" style="color:${m.color};background:${m.color}16">${esc(m.name.slice(0, 1))}</span>
    <div class="grow"><div class="t1">${esc(t.note || m.name)}${m.biz ? bizPill : ''}${pend ? `<span class="pill warn sm-pill">${inc ? '待到账' : '待付'}</span>` : ''}</div><div class="t2">${esc(sub)}</div></div>
    <div class="fa num ${inc ? 'in' : ''} ${pend ? 'pend' : ''}">${inc ? '+' : '-'}RM ${fmt(t.amount)}</div></div>`;
}
function feed(list, limit) {
  const sorted = [...list].sort((a, b) => b.date.localeCompare(a.date) || (b.ts || 0) - (a.ts || 0));
  const rows = limit ? sorted.slice(0, limit) : sorted;
  const groups = []; rows.forEach(t => { const g = groups[groups.length - 1]; if (g && g.date === t.date) g.items.push(t); else groups.push({ date: t.date, items: [t] }); });
  return `<div class="feed">${groups.map(g => {
    const l = dayLabel(g.date), inn = sum(g.items.filter(t => t.type === 'income' && cleared(t))), out = sum(g.items.filter(t => t.type === 'expense' && cleared(t)));
    return `<div class="day-h"><span class="d">${l.main}</span><span>${l.sub}</span><span class="sp"></span>${inn ? `<span class="in num">+${fmt(inn)}</span>` : ''}${out ? `<span class="num">-${fmt(out)}</span>` : ''}</div>${g.items.map(feedRow).join('')}`;
  }).join('')}</div>`;
}

/* ---------- 收入去向 ---------- */
function allocation(m) {
  const txm = db.tx.filter(t => inMonth(t, m) && cleared(t));
  const inc = sum(txm.filter(t => t.type === 'income'));
  const by = {}; txm.filter(t => t.type === 'expense').forEach(t => by[t.cat] = (by[t.cat] || 0) + t.amount);
  const rows = scope => Object.keys(by).filter(id => (catById(id).scope === 'business') === (scope === 'business'))
    .map(id => ({ c: catById(id), a: by[id] })).sort((a, b) => b.a - a.a);
  const biz = rows('business'), per = rows('personal');
  const bizT = biz.reduce((a, x) => a + x.a, 0), perT = per.reduce((a, x) => a + x.a, 0);
  const saved = Math.max(0, goalDeposits(m));
  const left = Math.max(0, inc - bizT - perT - saved);
  const base = Math.max(inc, bizT + perT + saved);
  return { inc, biz, per, bizT, perT, saved, left, base, gap: bizT + perT + saved - inc };
}
function allocCard(m) {
  const A = allocation(m), B = A.base || 1;
  const SAVE = '#2045F5', LEFT = '#16A34A';
  const segs = [...A.biz.map(x => [x.a, x.c.color, x.c.name]), ...A.per.map(x => [x.a, x.c.color, x.c.name]), [A.saved, SAVE, '存入储蓄目标'], [A.left, LEFT, '剩余未用']].filter(x => x[0] > 0);
  const row = (name, color, a) => `<div class="al-row"><span class="dot" style="background:${color}"></span><span class="nm">${esc(name)}</span><span class="al-bar"><i style="width:${Math.min(100, pct(a, B))}%;background:${color}"></i></span><span class="num amt">${money0(a)}</span><span class="num pc">${pct(a, B).toFixed(1)}%</span></div>`;
  const sec = (icon, title, a, sub) => `<div class="al-sec">${I(icon, 14)}<b>${title}</b><span class="sp"></span><span class="num">${money0(a)}</span><span class="num pc">${pct(a, B).toFixed(1)}%</span></div>${sub}`;
  if (!A.base) return `<div class="card">${cardH(P.pie, '#2045F5', '收入去向')}<div class="empty">这个月还没有收入和支出</div></div>`;
  return `<div class="card">${cardH(P.pie, '#2045F5', '收入去向', `<span class="badge">${A.inc >= A.base ? `本月收入 ${money0(A.inc)} = 100%` : `支出比收入多 ${money0(A.gap)}`}</span>`)}
    <div class="card-b">
      <div class="stack-bar">${segs.map(s => `<i style="width:${pct(s[0], B)}%;background:${s[1]}" title="${esc(s[2])} ${money0(s[0])}"></i>`).join('')}</div>
      <div class="al-sum">
        <div><span class="dot" style="background:#0D9488"></span>生意支出<b class="num">${pct(A.bizT, B).toFixed(0)}%</b></div>
        <div><span class="dot" style="background:#EA580C"></span>个人支出<b class="num">${pct(A.perT, B).toFixed(0)}%</b></div>
        <div><span class="dot" style="background:${SAVE}"></span>存起来<b class="num">${pct(A.saved, B).toFixed(0)}%</b></div>
        <div><span class="dot" style="background:${LEFT}"></span>剩余<b class="num">${pct(A.left, B).toFixed(0)}%</b></div>
      </div>
      <div class="al-tbl">
        ${A.biz.length ? sec(P.briefcase, '生意支出', A.bizT, A.biz.map(x => row(x.c.name, x.c.color, x.a)).join('')) : ''}
        ${sec(P.wallet, '个人支出', A.perT, A.per.map(x => row(x.c.name, x.c.color, x.a)).join('') || '<div class="al-row muted" style="grid-template-columns:1fr">还没有个人支出</div>')}
        ${sec(P.pig, '存起来', A.saved, row('存入储蓄目标', SAVE, A.saved))}
        ${sec(P.check, '剩余未用', A.left, '')}
      </div>
    </div></div>`;
}

/* ---------- 今天可以花（跟早上通知同一套计算） ---------- */
function planCard() {
  const p = IncomeSummary.plan(snapshot(), new Date());
  const sync = loadSync();
  return `<div class="card">${cardH(P.bell, '#EA580C', '今天可以花', `<button class="btn sm" data-act="go" data-id="settings" title="每日提醒">${I(P.bell, 13)}${sync.gistId ? '提醒已开' : '开早上提醒'}</button>`)}
    <div class="card-b">
      <div class="kv num ${p.perDay <= 0 ? 'down' : ''}">${money0(p.perDay)}<span class="unit"> / 天</span></div>
      <div class="ks">本月还可以花 <b>${money0(p.canSpend)}</b> · 剩 <b>${p.daysLeft}</b> 天${p.basis === 'budget' ? '' : '<br><span class="dim">还没设个人预算，先用「收入 − 支出 − 待付账单」算</span>'}</div>
      ${p.basis === 'budget' ? `<div class="bar r" style="margin-top:12px;height:8px"><i style="width:${Math.min(100, pct(p.spent, p.budgetTotal))}%;background:${p.spent > p.budgetTotal ? 'var(--red)' : '#EA580C'}"></i></div>
      <div class="ks" style="margin-top:6px">个人预算 ${money0(p.budgetTotal)}，已用 <b>${pct(p.spent, p.budgetTotal).toFixed(0)}%</b></div>` : ''}
      <div class="mini-rows">
        <div><span>目前现金</span><b class="num">${money0(p.cash)}</b></div>
        <div><span>待付账单</span><b class="num">${money0(p.billsTotal)}</b></div>
        <div><span>付完账单后</span><b class="num ${p.cashAfterBills < 0 ? 'down' : ''}">${money0(p.cashAfterBills)}</b></div>
      </div>
      ${p.over.length ? `<div class="warn-list">${p.over.map(o => `<div>⚠️ ${esc(o.name)} 已超支 <b>${money0(o.over)}</b></div>`).join('')}</div>` : ''}
    </div></div>`;
}

function vHome() {
  const m = state.month, prev = addMonth(m, -1), cur = ymOf(new Date());
  const head = ph(`你好，${esc(db.settings.name)}`, `${mLabel(m)} 收入、支出、储蓄与投资`, `<button class="btn" data-act="go" data-id="board">${I(P.board, 15)}预算看板</button><button class="btn" data-act="go" data-id="invest">${I(P.trend, 15)}投资组合</button>`, 'hide-m');
  if (!db.tx.length && !db.holdings.length && !db.goals.length) {
    return head + banners() + `<div class="card"><div class="card-b" style="padding:28px">
      <div class="lbl" style="margin-bottom:8px">开始使用</div>
      <h2 style="font-size:22px;letter-spacing:-.02em;margin-bottom:6px">把所有收入来源放在一个地方</h2>
      <p class="muted" style="max-width:560px;margin-bottom:20px">收入、个人支出、生意支出、固定账单、储蓄目标和股息一起记，每个月看清楚钱去了哪里、被动收入占了多少。你的收入来源已经帮你建好了。</p>
      <div class="row-btns" style="max-width:420px"><button class="btn lg primary" data-act="addTx">记第一笔</button><button class="btn lg" data-act="demo">先看示例数据</button></div>
      <p class="note">建议先到「设置」填起始余额，再设每月预算。</p></div></div>`;
  }
  const txm = db.tx.filter(t => inMonth(t, m));
  const incT = txm.filter(t => t.type === 'income' && cleared(t)), expT = txm.filter(t => t.type === 'expense' && cleared(t));
  const inc = sum(incT), perE = sum(expT.filter(t => !isBizTx(t))), bizE = sum(expT.filter(isBizTx));
  const pm = db.tx.filter(t => inMonth(t, prev) && cleared(t));
  const incPrev = sum(pm.filter(t => t.type === 'income')), perPrev = sum(pm.filter(t => t.type === 'expense' && !isBizTx(t))), bizPrev = sum(pm.filter(isBizTx));
  const pend = sum(txm.filter(t => t.type === 'income' && !cleared(t)));
  const Pf = portfolio(), cash = cashBalance(), net = cash + Pf.value;
  const chg = (a, b) => b ? pct(a - b, b) : null;
  const chgBadge = (c, invert) => c === null ? '' : `<span class="badge ${(c >= 0) !== !!invert ? 'up' : 'down'}">${c >= 0 ? '↑' : '↓'} ${Math.abs(c).toFixed(1)}%</span>`;

  // dot chart
  const isExp = state.chart === 'expense', src = isExp ? expT : incT;
  const days = daysIn(m), daily = Array(days).fill(0); src.forEach(t => daily[+t.date.slice(8) - 1] += t.amount);
  const mx = Math.max(...daily, 1), L = 10, td = new Date().getDate();
  const cols = daily.map((x, i) => { const lv = x > 0 ? Math.max(1, Math.round(x / mx * L)) : 0; return `<div class="c ${m === cur && i + 1 === td ? 'today' : ''}" title="${i + 1}日 ${money(x)}">${Array.from({ length: L }, (_, j) => `<i class="${j < lv ? 'on' : ''}"></i>`).join('')}</div>`; }).join('');

  const byType = { active: 0, semi: 0, passive: 0 }, bySrc = {}, cnt = {};
  incT.forEach(t => { const s = srcById(t.src); byType[s ? s.type : 'active'] += t.amount; bySrc[t.src] = (bySrc[t.src] || 0) + t.amount; cnt[t.src] = (cnt[t.src] || 0) + 1; });
  const pp = pct(byType.passive, inc), goal = db.settings.passiveGoal, cover = pct(byType.passive, perE);
  const srcRows = db.sources.filter(s => (s.expected || 0) > 0 || bySrc[s.id]).map(s => ({ s, a: bySrc[s.id] || 0 })).sort((a, b) => b.a - a.a || (b.s.expected || 0) - (a.s.expected || 0));
  const bills = db.bills.filter(b => !(b.paid && b.paid[m])).sort((a, b) => a.dueDay - b.dueDay).slice(0, 4);

  return head + banners() + `
  <div class="grid g4 m2">
    <div class="card">${cardH(P.wallet, '#2045F5', '净资产')}
      <div class="card-b"><div class="kv num">${money0(net)}</div><div class="ks">现金 <b>${money0(cash)}</b> · 投资 <b>${money0(Pf.value)}</b></div></div></div>
    <div class="card">${cardH(P.in, '#16A34A', '本月收入', chgBadge(chg(inc, incPrev)))}
      <div class="card-b"><div class="kv num">${money0(inc)}</div><div class="ks">上月 <b>${money0(incPrev)}</b>${pend ? ` · <span style="color:var(--orange)">${money0(pend)} 待到账</span>` : ''}</div></div></div>
    <div class="card">${cardH(P.wallet, '#EA580C', '个人支出', chgBadge(chg(perE, perPrev), true))}
      <div class="card-b"><div class="kv num">${money0(perE)}</div><div class="ks">占收入 <b>${pct(perE, inc).toFixed(0)}%</b> · 上月 ${money0(perPrev)}</div>
      <div class="bar r" style="margin-top:10px"><i style="width:${Math.min(100, pct(perE, inc))}%;background:#EA580C"></i></div></div></div>
    <div class="card">${cardH(P.briefcase, '#0D9488', '生意支出', chgBadge(chg(bizE, bizPrev), true))}
      <div class="card-b"><div class="kv num">${money0(bizE)}</div><div class="ks">占收入 <b>${pct(bizE, inc).toFixed(0)}%</b> · 上月 ${money0(bizPrev)}</div>
      <div class="bar r" style="margin-top:10px"><i style="width:${Math.min(100, pct(bizE, inc))}%;background:#0D9488"></i></div></div></div>
  </div>

  <div class="grid g21">${allocCard(m)}${planCard()}</div>

  <div class="grid g21">
    <div class="card"><div class="card-h">每日走势<span class="sp"></span><div class="chipset">
        <button class="chip ${!isExp ? 'on' : ''}" data-act="chart" data-id="income"><span class="sq"></span>收入</button>
        <button class="chip ${isExp ? 'on' : ''}" data-act="chart" data-id="expense"><span class="sq"></span>支出</button></div></div>
      <div class="card-b"><div class="dotc"><div class="yax num"><span>${short(mx)}</span><span>${short(mx / 2)}</span><span>0</span></div>
        <div class="dots ${isExp ? 'exp' : ''}" style="grid-template-columns:repeat(${days},1fr)">${cols}</div></div>
        <div class="xax num"><span>${+m.slice(5)}/1</span><span>${+m.slice(5)}/8</span><span>${+m.slice(5)}/15</span><span>${+m.slice(5)}/22</span><span>${+m.slice(5)}/${days}</span></div></div></div>
    <div class="card">${cardH(P.leaf, '#16A34A', '被动收入占比', `<span class="badge">目标 ${goal}%</span>`)}
      <div class="card-b"><div class="kv num" style="color:${pp >= goal ? 'var(--green)' : 'var(--text)'}">${pp.toFixed(1)}%</div>
        <div class="ks">${inc ? (pp >= goal ? '已达到目标' : `离目标还差 <b>${(goal - pp).toFixed(1)}%</b>（约 ${money0(inc * goal / 100 - byType.passive)}）`) : '记下收入后会自动计算'}</div>
        <div class="bw"><div class="bar" style="height:8px">${['passive', 'semi', 'active'].map(k => `<i style="width:${pct(byType[k], inc)}%;background:${TYPES[k].color}"></i>`).join('')}</div><span class="goal-mark" style="left:calc(${goal}% - 1px)"></span></div>
        <div class="legend">${['passive', 'semi', 'active'].map(k => `<div><span class="dot" style="background:${TYPES[k].color}"></span>${TYPES[k].name}<b class="num">${money0(byType[k])}</b><span class="p num">${pct(byType[k], inc).toFixed(0)}%</span></div>`).join('')}</div>
        ${perE ? `<div class="ks" style="margin-top:12px;padding-top:12px;border-top:1px solid var(--line2)">被动收入可覆盖个人支出 <b>${cover.toFixed(0)}%</b></div>` : ''}</div></div>
  </div>

  <div class="card" style="margin-bottom:14px"><div class="card-h">收入来源<span class="sp"></span><button class="btn sm" data-act="go" data-id="settings">管理来源</button><button class="btn sm" data-act="addIncome">${I(P.plus, 13)}收入</button></div>
    <div class="tbl" style="padding-top:10px">
      <div class="tr th t-src"><span>来源</span><span>类型</span><span class="ra">笔数</span><span class="ra">占比</span><span class="ra">金额</span></div>
      ${srcRows.length ? srcRows.map(({ s, a }) => `<div class="tr t-src tap" data-act="src" data-id="${s.id}">
        <div class="cell-main">${ic(s.name, TYPES[s.type].color)}<div class="t" style="flex:1"><div class="t1">${esc(s.name)}</div>
          <div class="t2">${s.expected ? `预期 ${money0(s.expected)} · 达成 ${pct(a, s.expected).toFixed(0)}%` : '不固定'}<span class="m-inl"> · ${TYPES[s.type].name}</span></div></div></div>
        <div class="h-m">${typePill(s.type)}</div><div class="h-m ra num muted">${cnt[s.id] || 0}</div><div class="h-m ra num muted">${pct(a, inc).toFixed(1)}%</div>
        <div class="ra amt num">${money0(a)}</div></div>`).join('') : '<div class="empty">这个月还没有收入记录</div>'}
    </div></div>

  <div class="grid g2">
    <div class="card"><div class="card-h">待付账单<span class="sp"></span><button class="btn sm" data-act="go" data-id="board">全部</button></div>
      ${bills.length ? bills.map(b => billLi(b, m)).join('') : `<div class="empty">${db.bills.length ? '这个月的账单都付清了' : '还没有固定账单'}</div>`}</div>
    <div class="card"><div class="card-h">最近流水<span class="sp"></span><button class="btn sm" data-act="go" data-id="ledger">全部</button></div>
      ${txm.length ? feed(txm, 8) : '<div class="empty">这个月还没有记录</div>'}</div>
  </div>`;
}

function vLedger() {
  const m = state.month, txm = db.tx.filter(t => inMonth(t, m));
  const cl = txm.filter(cleared);
  const inc = sum(cl.filter(t => t.type === 'income')), perE = sum(cl.filter(t => t.type === 'expense' && !isBizTx(t))), bizE = sum(cl.filter(isBizTx));
  const pc = txm.filter(t => !cleared(t)).length;
  return ph('账目流水', `${mLabel(m)} · 共 ${txm.length} 笔`, `<button class="btn" data-act="addIncome">${I(P.in, 15)}记收入</button><button class="btn" data-act="export">${I(P.download, 15)}导出</button>`, 'hide-m') + `
  <div class="grid g4 m2">
    <div class="card"><div class="card-b"><div class="lbl">收入</div><div class="kv md num up" style="margin-top:6px">${money0(inc)}</div></div></div>
    <div class="card"><div class="card-b"><div class="lbl">个人支出</div><div class="kv md num" style="margin-top:6px">${money0(perE)}</div></div></div>
    <div class="card"><div class="card-b"><div class="lbl">生意支出</div><div class="kv md num" style="margin-top:6px">${money0(bizE)}</div></div></div>
    <div class="card"><div class="card-b"><div class="lbl">结余</div><div class="kv md num ${inc - perE - bizE >= 0 ? '' : 'down'}" style="margin-top:6px">${money0(inc - perE - bizE)}</div></div></div>
  </div>
  <div class="card"><div class="card-h" style="flex-wrap:wrap;gap:10px">
      <div class="chipset">${[['all', '全部'], ['income', '收入'], ['personal', '个人支出'], ['business', '生意支出'], ['pending', `待定${pc ? ' · ' + pc : ''}`]].map(([k, l]) => `<button class="chip ${state.filter === k ? 'on' : ''}" data-act="filter" data-id="${k}">${l}</button>`).join('')}</div>
      <span class="sp"></span>
      <div class="search" style="display:flex;width:min(260px,100%)">${I(P.search, 15)}<input id="q" type="search" placeholder="搜索备注、来源、分类" value="${esc(state.q)}"></div></div>
    <div id="txList">${ledgerRows()}</div></div>`;
}
function ledgerRows() {
  const q = state.q.trim().toLowerCase();
  let list = db.tx.filter(t => inMonth(t, state.month));
  const f = state.filter;
  if (f === 'income') list = list.filter(t => t.type === 'income');
  if (f === 'personal') list = list.filter(t => t.type === 'expense' && !isBizTx(t));
  if (f === 'business') list = list.filter(isBizTx);
  if (f === 'pending') list = list.filter(t => !cleared(t));
  if (q) list = list.filter(t => (t.note + ' ' + txMeta(t).name).toLowerCase().includes(q));
  if (!list.length) return `<div class="empty">${q ? '找不到相关记录' : '这个月还没有记录'}</div>`;
  return feed(list);
}

function vBoard() {
  const m = state.month, now = new Date();
  const spent = {}; db.tx.filter(t => inMonth(t, m) && t.type === 'expense').forEach(t => spent[t.cat] = (spent[t.cat] || 0) + t.amount);
  const catsOf = scope => db.cats.filter(c => (c.scope === 'business') === (scope === 'business') && (db.budgets[c.id] > 0 || spent[c.id] > 0))
    .sort((a, b) => (db.budgets[b.id] ? 1 : 0) - (db.budgets[a.id] ? 1 : 0) || (spent[b.id] || 0) - (spent[a.id] || 0));
  const perCats = catsOf('personal'), bizCats = catsOf('business');
  const perL = db.cats.filter(c => c.scope !== 'business').reduce((a, c) => a + (db.budgets[c.id] || 0), 0);
  const perS = db.cats.filter(c => c.scope !== 'business' && db.budgets[c.id]).reduce((a, c) => a + (spent[c.id] || 0), 0);
  const bizTotal = db.cats.filter(c => c.scope === 'business').reduce((a, c) => a + (spent[c.id] || 0), 0);
  const unpaid = db.bills.filter(b => !(b.paid && b.paid[m]));
  const incTx = db.tx.filter(t => inMonth(t, m) && t.type === 'income');
  const incBy = {}, pendBy = {}; incTx.forEach(t => { const o = cleared(t) ? incBy : pendBy; o[t.src] = (o[t.src] || 0) + t.amount; });
  const gSaved = db.goals.reduce((a, g) => a + g.saved, 0), gTarget = db.goals.reduce((a, g) => a + g.target, 0);
  const srcs = db.sources.filter(s => s.expected > 0 || incBy[s.id] || pendBy[s.id]);
  const colH = (icon, title, n, act, extra = '') => `<div class="col-h">${I(icon, 15)}${title}<span class="n">${n}</span>${extra}<span class="sp"></span>${act ? `<button data-act="${act}" aria-label="新增">${I(P.plus, 15)}</button>` : ''}</div>`;

  const billsCol = [...db.bills].sort((a, b) => a.dueDay - b.dueDay).map(b => {
    const st = billStatus(b, m), c = catById(b.cat), paid = st.k === 'paid';
    return `<div class="bc" data-act="bill" data-id="${b.id}"><div class="bc-top"><span class="lbl"><span class="dot" style="background:${c.color};width:6px;height:6px"></span>${esc(c.name)}</span><span class="pill ${st.cls}">${st.label}</span></div>
      <div class="bc-t">${esc(b.name)}</div><div class="bc-v num">${money(b.amount)}</div>
      <div class="bc-f">${I(P.cal, 12)}每月 <b>${b.dueDay}</b> 号<span class="sp"></span><button class="pay ${paid ? 'done' : ''}" data-act="payBill" data-id="${b.id}">${paid ? I(P.check, 13) + '已付' : '标记已付'}</button></div></div>`;
  }).join('');

  const spendCards = list => list.map(c => {
    const s = spent[c.id] || 0, l = db.budgets[c.id] || 0, p = pct(s, l);
    const st = !l ? ['mut', '未设预算'] : p > 100 ? ['bad', '超支'] : p >= 80 ? ['warn', '接近上限'] : ['ok', '正常'];
    const col = !l ? c.color : p > 100 ? 'var(--red)' : p >= 80 ? 'var(--orange)' : c.color;
    return `<div class="bc" data-act="cat" data-id="${c.id}"><div class="bc-top"><span class="lbl"><span class="dot" style="background:${c.color};width:6px;height:6px"></span>${esc(c.name)}</span><span class="pill ${st[0]}">${st[1]}</span></div>
      <div class="bc-t">本月已花</div><div class="bc-v num">${money(s)}${l ? ` <small>/ ${money0(l)}</small>` : ''}</div>
      ${l ? `<div class="bar r"><i style="width:${Math.min(100, p)}%;background:${col}"></i></div>` : ''}
      <div class="bc-f">${I(P.receipt, 12)}${l ? `预算 <b>${money0(l)}</b>` : '没有上限'}<span class="sp"></span>${l ? (p > 100 ? `<span class="down">超出 ${money0(s - l)}</span>` : `剩 <b>${money0(l - s)}</b>`) : ''}</div></div>`;
  }).join('');

  const goalsCol = db.goals.map(g => {
    const p = pct(g.saved, g.target), rem = Math.max(0, g.target - g.saved);
    let monthly = '';
    if (g.deadline && rem > 0) { const dl = new Date(g.deadline + 'T00:00:00'); const months = (dl.getFullYear() - now.getFullYear()) * 12 + dl.getMonth() - now.getMonth(); monthly = months > 0 ? `每月存 <b>${money0(rem / months)}</b>` : '<span class="down">已过期限</span>'; }
    const st = p >= 100 ? ['ok', '已达成'] : p >= 75 ? ['info', '快达成'] : ['vio', '进行中'];
    return `<div class="bc" data-act="goal" data-id="${g.id}"><div class="bc-top"><span class="lbl">${I(P.target, 12)}${p.toFixed(0)}%</span><span class="pill ${st[0]}">${st[1]}</span></div>
      <div class="bc-t">${esc(g.name)}</div><div class="bc-v num">${money0(g.saved)} <small>/ ${money0(g.target)}</small></div>
      <div class="bar r"><i style="width:${Math.min(100, p)}%;background:${g.color}"></i></div>
      <div class="bc-f">${I(P.cal, 12)}${g.deadline ? '目标 <b>' + g.deadline.slice(0, 7) + '</b>' : '没有期限'}<span class="sp"></span>${monthly || (rem ? `还差 <b>${money0(rem)}</b>` : '')}</div></div>`;
  }).join('');

  const incCol = srcs.map(s => {
    const a = incBy[s.id] || 0, pd = pendBy[s.id] || 0;
    const st = a > 0 ? ['ok', '已到账'] : pd > 0 ? ['warn', '待到账'] : ['mut', '未到账'];
    return `<div class="bc" data-act="src" data-id="${s.id}"><div class="bc-top"><span class="lbl"><span class="dot" style="background:${TYPES[s.type].color};width:6px;height:6px"></span>${TYPES[s.type].name}</span><span class="pill ${st[0]}">${st[1]}</span></div>
      <div class="bc-t">${esc(s.name)}</div><div class="bc-v num up">+${money(a)}</div>
      ${s.expected ? `<div class="bar r"><i style="width:${Math.min(100, pct(a, s.expected))}%;background:${TYPES[s.type].color}"></i></div>` : ''}
      <div class="bc-f">${I(P.coins, 12)}${s.expected ? `预期 <b>${money0(s.expected)}</b>` : '不固定'}<span class="sp"></span>${pd ? `<span style="color:var(--orange)">+${money0(pd)} 待到</span>` : s.expected ? `达成 <b>${pct(a, s.expected).toFixed(0)}%</b>` : ''}</div></div>`;
  }).join('');

  return ph('预算看板', `${mLabel(m)} · 固定账单、个人支出、生意支出、储蓄目标、收入`, `<button class="btn" data-act="budgets">${I(P.edit, 15)}设置预算</button><button class="btn" data-act="addBill">${I(P.receipt, 15)}新增账单</button><button class="btn" data-act="addGoal">${I(P.target, 15)}新增目标</button>`, 'hide-m') + `
  <div class="grid g4 m2">
    <div class="card"><div class="card-b"><div class="lbl">个人预算已用</div><div class="kv md num" style="margin-top:6px">${perL ? pct(perS, perL).toFixed(0) + '%' : '—'}</div><div class="ks">${perL ? `${money0(perS)} / ${money0(perL)}` : '还没设预算'}</div></div></div>
    <div class="card"><div class="card-b"><div class="lbl">生意支出</div><div class="kv md num" style="margin-top:6px">${money0(bizTotal)}</div><div class="ks">${bizCats.length} 个分类</div></div></div>
    <div class="card"><div class="card-b"><div class="lbl">未付账单</div><div class="kv md num ${unpaid.length ? '' : 'up'}" style="margin-top:6px">${money0(unpaid.reduce((a, b) => a + b.amount, 0))}</div><div class="ks">${unpaid.length} 笔待付</div></div></div>
    <div class="card"><div class="card-b"><div class="lbl">储蓄进度</div><div class="kv md num" style="margin-top:6px">${gTarget ? pct(gSaved, gTarget).toFixed(0) + '%' : '—'}</div><div class="ks">${db.goals.length} 个目标 · ${money0(gSaved)}</div></div></div>
  </div>
  <div class="board">
    <div class="col">${colH(P.receipt, '固定账单', db.bills.length, 'addBill')}${billsCol}<button class="col-add" data-act="addBill">${I(P.plus, 14)}新增账单</button></div>
    <div class="col">${colH(P.wallet, '个人支出', perCats.length, 'addCat')}${spendCards(perCats) || '<div class="empty" style="padding:16px 8px">本月还没有个人支出</div>'}<button class="col-add" data-act="budgets">${I(P.edit, 14)}设置每月预算</button></div>
    <div class="col biz">${colH(P.briefcase, '生意支出', bizCats.length, 'addCat')}${spendCards(bizCats) || '<div class="empty" style="padding:16px 8px">本月还没有生意支出</div>'}<button class="col-add" data-act="addBizTx">${I(P.plus, 14)}记一笔生意支出</button></div>
    <div class="col">${colH(P.target, '储蓄目标', db.goals.length, 'addGoal')}${goalsCol}<button class="col-add" data-act="addGoal">${I(P.plus, 14)}新增目标</button></div>
    <div class="col">${colH(P.coins, '收入', srcs.length, 'addSrc')}${incCol || '<div class="empty" style="padding:16px 8px">本月还没有收入</div>'}<button class="col-add" data-act="addIncome">${I(P.plus, 14)}记一笔收入</button></div>
  </div>`;
}

function vInvest() {
  const Pf = portfolio(), y = String(new Date().getFullYear());
  const divYTD = sum(db.tx.filter(t => t.type === 'income' && t.src === 'div' && cleared(t) && t.date.startsWith(y)));
  const fx = db.settings.fx;
  const head = ph('投资组合', '银行股拿股息，成长股长期持有', `<button class="btn" data-act="addDiv">${I(P.coins, 15)}记录股息</button><button class="btn primary" data-act="addHold">${I(P.plus, 15)}新增持仓</button>`);
  if (!db.holdings.length) return head + `<div class="card"><div class="card-b" style="padding:28px"><h2 style="font-size:20px;margin-bottom:6px">还没有持仓</h2>
    <p class="muted" style="max-width:520px;margin-bottom:18px">记下银行股（Maybank、CIMB、Public Bank、UOB）和成长股，自动算市值、盈亏，以及每年股息能带来多少被动收入。</p>
    <button class="btn lg primary" data-act="addHold">${I(P.plus, 16)}新增第一只</button></div></div>`;
  const hRow = h => {
    const r = fxr(h.cur), v = h.units * h.price * r, pl = pct(h.price - h.cost, h.cost), yl = pct(h.dps || 0, h.price);
    const color = h.group === 'dividend' ? '#16A34A' : '#2045F5';
    return `<div class="tr t-hold tap" data-act="hold" data-id="${h.id}">
      <div class="cell-main"><span class="ic" style="color:${color};background:${color}12;border-color:${color}33;font-size:${h.symbol.length > 3 ? 9 : 11}px;width:38px">${esc(h.symbol.slice(0, 4))}</span><div class="t"><div class="t1">${esc(h.name || h.symbol)}</div><div class="t2">${h.units.toLocaleString()} 股<span class="m-inl"> × ${h.cur} ${h.price}</span></div></div></div>
      <div class="h-mid h-m"><span class="pill ${h.group === 'dividend' ? 'ok' : 'info'}">${h.group === 'dividend' ? '股息' : '成长'}</span></div>
      <div class="h-mid h-m ra num muted">${h.units.toLocaleString()}</div>
      <div class="h-m ra num">${h.cur} ${h.price}</div>
      <div class="ra amt num">${money0(v)}</div>
      <div class="ra num ${pl >= 0 ? 'up' : 'down'}">${pl >= 0 ? '+' : ''}${pl.toFixed(1)}%</div>
      <div class="h-m ra num muted">${h.dps ? yl.toFixed(yl < 1 ? 2 : 1) + '%' : '—'}</div></div>`;
  };
  const sorted = [...db.holdings].sort((a, b) => (a.group === 'dividend' ? 0 : 1) - (b.group === 'dividend' ? 0 : 1) || b.units * b.price * fxr(b.cur) - a.units * a.price * fxr(a.cur));
  return head + `
  <div class="grid g3 keep2">
    <div class="card">${cardH(P.trend, '#2045F5', '总市值')}<div class="card-b"><div class="kv num">${money0(Pf.value)}</div>
      <div class="bar" style="margin-top:12px;height:8px"><i style="width:${pct(Pf.dv, Pf.value)}%;background:var(--green)"></i><i style="width:${pct(Pf.gr, Pf.value)}%;background:var(--blue)"></i></div>
      <div class="ks"><span class="dot" style="background:var(--green);width:7px;height:7px"></span> 股息股 <b>${pct(Pf.dv, Pf.value).toFixed(0)}%</b> &nbsp; <span class="dot" style="background:var(--blue);width:7px;height:7px"></span> 成长股 <b>${pct(Pf.gr, Pf.value).toFixed(0)}%</b></div></div></div>
    <div class="card">${cardH(Pf.pl >= 0 ? P.out : P.in, Pf.pl >= 0 ? '#16A34A' : '#DC2626', '浮动盈亏')}<div class="card-b"><div class="kv md num ${Pf.pl >= 0 ? 'up' : 'down'}">${money0(Pf.pl, { plus: true })}</div><div class="ks">成本 <b>${money0(Pf.cost)}</b> · ${Pf.plPct >= 0 ? '+' : ''}${Pf.plPct.toFixed(1)}%</div></div></div>
    <div class="card">${cardH(P.leaf, '#16A34A', '股息 / 年（预估）')}<div class="card-b"><div class="kv md num up">${money0(Pf.div)}</div><div class="ks">≈ 每月 <b>${money0(Pf.div / 12)}</b> · 息率 ${pct(Pf.div, Pf.value).toFixed(2)}% · ${y} 已收 ${money0(divYTD)}</div></div></div>
  </div>
  <div class="card"><div class="card-h">持仓<span class="sp"></span><span class="muted" style="font-size:12px;font-weight:500">1 USD = RM ${fx.USD} · 1 SGD = RM ${fx.SGD}</span></div>
    <div class="tbl" style="padding-top:10px">
      <div class="tr th t-hold"><span>股票</span><span class="h-mid">类型</span><span class="h-mid ra">股数</span><span class="ra">现价</span><span class="ra">市值 (RM)</span><span class="ra">盈亏</span><span class="ra">息率</span></div>
      ${sorted.map(hRow).join('')}</div></div>
  <p class="note" style="margin:10px 4px 0">现价需手动更新：点任何一只就能改。汇率在「设置」里更新。</p>`;
}

function reminderCard() {
  const c = loadSync(), on = !!c.gistId;
  const preview = IncomeSummary.buildMessage(snapshot(), new Date());
  const last = c.lastSync ? new Date(c.lastSync) : null;
  return `<div class="card" style="margin-bottom:14px"><div class="card-h">${I(P.bell, 16)}每天早上提醒（Telegram 推送到手机）<span class="sp"></span>${on ? '<span class="pill ok"><i></i>已连接</span>' : '<span class="pill mut">未设置</span>'}</div>
    <div class="card-b"><div class="rem">
      <div>
        <p class="muted" style="margin-bottom:12px">网页 App 本身没办法在固定时间推送通知，所以用 <b style="color:var(--text)">GitHub Actions</b> 每天早上 8:07 读取 App 同步的摘要，再通过 <b style="color:var(--text)">Telegram 机器人</b> 发到你手机，跟普通 App 通知一样会响。</p>
        <ol class="steps">
          <li><div>Telegram 搜 <b>@BotFather</b> → 发 <code>/newbot</code> → 照指示取名，拿到 <b>bot token</b>。再打开你的新 bot，按 <b>Start</b>。</div></li>
          <li><div>Telegram 搜 <b>@userinfobot</b> → 按 Start，它回的 <b>Id</b> 数字就是你的 <b>chat id</b>。</div></li>
          <li><div>GitHub → Settings → Developer settings → Personal access tokens → <b>Tokens (classic)</b> → Generate，只勾 <b>gist</b>，Expiration 选 No expiration。把 token 贴到下面按「连接」。</div></li>
          <li><div>仓库 <b>incomeos → Settings → Secrets and variables → Actions</b> → New repository secret，加 3 个：<code>TELEGRAM_BOT_TOKEN</code>、<code>TELEGRAM_CHAT_ID</code>、<code>GIST_ID</code>（下面会显示）。</div></li>
          <li><div>仓库 <b>Actions → 每日早上提醒 → Run workflow</b>，手机收到就成功了。</div></li>
        </ol>
        <label class="l">GitHub token（只存在这台设备，导出备份不会带出）</label>
        <div class="row-in"><input class="inp" id="sy-token" type="password" placeholder="ghp_..." value="${esc(c.token || '')}" autocomplete="off"><button class="btn lg primary" data-act="syncConnect">${on ? '立即同步' : '连接'}</button></div>
        ${on ? `<label class="l">GIST_ID（复制到第 4 步）</label><div class="row-in"><input class="inp num" readonly value="${esc(c.gistId)}"><button class="btn lg" data-act="copyGist">${I(P.copy, 15)}复制</button></div>` : ''}
        <p class="note">${last ? `上次同步：${last.getMonth() + 1}/${last.getDate()} ${pad(last.getHours())}:${pad(last.getMinutes())}。之后每次记账都会自动同步。` : '连接后，每次记账都会自动同步最新数字。'}${c.lastError ? ` <span class="down">上次同步失败：${esc(c.lastError)}</span>` : ''}${on ? ' <a href="#" data-act="syncOff" class="down">断开</a>' : ''}</p>
      </div>
      <div><div class="lbl" style="margin-bottom:8px">明天早上会收到</div><div class="tg-msg">${preview}</div></div>
    </div></div></div>`;
}
function cloudCard() {
  const c = cloudState(), b = cloudBadge();
  const steps = `<ol class="steps" style="margin-top:4px">
      <li><div>Firebase Console → <b>Authentication → Sign-in method</b> → 开启 <b>Email/Password</b>。</div></li>
      <li><div><b>Firestore Database → Create database</b>（地区选 <code>asia-southeast1</code> 新加坡，模式随便选）。</div></li>
      <li><div>Firestore → <b>Rules</b>，整段换成下面这个，按 Publish：
        <pre class="code">rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid}/{document=**} {
      allow read, write: if request.auth != null
                         && request.auth.uid == uid;
    }
  }
}</pre></div></li>
      <li><div>回到这里用邮箱 <b>注册</b>。之后在其他设备用同一个邮箱 <b>登录</b> 就会自动同步。</div></li>
    </ol>`;
  if (!c) return `<div class="card" id="cloudCard" style="margin-bottom:14px"><div class="card-h">${I(P.cloud, 16)}云端同步（Firebase）<span class="sp"></span><span class="pill mut">载入中</span></div><div class="card-b"><p class="muted">正在连接 Firebase… 如果一直停在这里，检查网络后重新整理。</p></div></div>`;
  if (!c.user) return `<div class="card" id="cloudCard" style="margin-bottom:14px"><div class="card-h">${I(P.cloud, 16)}云端同步（Firebase）<span class="sp"></span><span class="pill mut">未登录</span></div>
    <div class="card-b"><div class="rem">
      <div><p class="muted" style="margin-bottom:6px">登录后，所有资料会存在你自己的 Firebase，手机、电脑、Safari、主屏幕 App 都看到同一份，换手机也不会不见。<b style="color:var(--text)">第一次登录时，这台设备上的资料会自动合并进云端。</b></p>
        <label class="l">邮箱</label><input class="inp" id="cl-email" type="email" autocomplete="username" placeholder="you@gmail.com">
        <label class="l">密码（至少 6 位）</label><input class="inp" id="cl-pw" type="password" autocomplete="current-password" placeholder="••••••">
        <div class="row-btns" style="margin-top:14px"><button class="btn lg primary" data-act="cloudIn">登录</button><button class="btn lg" data-act="cloudUp">注册新账号</button></div>
        <p class="note"><a href="#" data-act="cloudReset">忘记密码？</a>　第一次用要先完成「设置 Firebase」的 1–3 步（只要做一次）。</p></div>
      <div><div class="lbl" style="margin-bottom:8px">第一次设置 Firebase（只要做一次）</div>${steps}</div>
    </div></div></div>`;
  const last = c.lastSync ? new Date(c.lastSync) : null;
  return `<div class="card" id="cloudCard" style="margin-bottom:14px"><div class="card-h">${I(P.cloud, 16)}云端同步（Firebase）<span class="sp"></span><span class="pill ${b.cls === 'ok' ? 'ok' : b.cls === 'bad' ? 'bad' : 'warn'}"><i></i>${b.label}</span></div>
    <div class="card-b">
      <div class="cloud-row"><span class="avatar">${I(P.user, 16)}</span><div class="grow"><b>${esc(c.email)}</b><div class="t2">${last ? `上次同步 ${pad(last.getHours())}:${pad(last.getMinutes())} · ` : ''}每次记账都会自动上传，其他设备几秒内就会更新</div></div>
        <button class="btn" data-act="cloudSync">${I(P.cloud, 15)}立即同步</button><button class="btn" data-act="cloudOut">登出</button></div>
      ${c.status === 'error' ? `<div class="banner warn" style="margin:14px 0 0">${I(P.cloudOff, 16)}<span class="g">${esc(c.error)}</span></div><details style="margin-top:10px"><summary class="muted" style="cursor:pointer">查看 Firebase 设置步骤</summary>${steps}</details>` : ''}
    </div></div>`;
}
function vSettings() {
  const s = db.settings, cur = state.month;
  const incBy = {}; db.tx.filter(t => inMonth(t, cur) && t.type === 'income' && cleared(t)).forEach(t => incBy[t.src] = (incBy[t.src] || 0) + t.amount);
  const lb = s.lastBackup ? `上次备份：${s.lastBackup}` : '还没有备份过';
  const installTxt = isStandalone() ? '<p class="muted">已经装在主屏幕上了。</p>'
    : `<ol class="steps"><li>iPhone：用 <b>Safari</b> 打开这个网址</li><li>点底部的「分享」按钮</li><li>选「添加到主屏幕」，名字保留 IncomeOS</li></ol>
       <p class="note">Android：用 Chrome 打开，会出现「安装」提示，或在右上角菜单选「安装应用」。</p>${deferredPrompt ? '<div class="stack"><button class="btn lg primary" data-act="install">安装到这台设备</button></div>' : ''}`;
  const th = s.theme || 'auto';
  const catSpent = {}; db.tx.filter(t => inMonth(t, cur) && t.type === 'expense').forEach(t => catSpent[t.cat] = (catSpent[t.cat] || 0) + t.amount);
  return ph('设置', '云端同步、外观、基本资料、收入来源、支出分类、提醒和备份') + cloudCard() + `
  <div class="card" style="margin-bottom:14px"><div class="card-h">${I(isDark() ? P.moon : P.sun, 16)}外观</div><div class="card-b" style="padding-top:8px">
    <div class="theme-seg" style="max-width:420px">${[['auto', '跟随系统', P.auto], ['light', '白天', P.sun], ['dark', '黑夜', P.moon]].map(([k, l, ic]) => `<button class="${th === k ? 'on' : ''}" data-act="setTheme" data-id="${k}">${I(ic, 15)}${l}</button>`).join('')}</div>
    <p class="note">「跟随系统」会跟手机或电脑的深色模式自动切换。右上角的太阳／月亮按钮也可以随时切换。</p></div></div>
  <div class="grid g2">
    <div class="card"><div class="card-h">基本设置</div><div class="card-b" style="padding-top:2px">
      <div class="form-grid">
        <div><label class="l">你的名字</label><input class="inp" id="s-name" value="${esc(s.name)}"></div>
        <div><label class="l">被动收入目标 (% of 每月收入)</label><input class="inp num" id="s-goal" inputmode="decimal" value="${s.passiveGoal}"></div>
        <div><label class="l">起始余额 (RM)</label><input class="inp num" id="s-open" inputmode="decimal" value="${s.opening}"></div>
        <div><label class="l">1 USD = ? RM</label><input class="inp num" id="s-usd" inputmode="decimal" value="${s.fx.USD}"></div>
        <div><label class="l">1 SGD = ? RM</label><input class="inp num" id="s-sgd" inputmode="decimal" value="${s.fx.SGD}"></div>
      </div>
      <p class="note">起始余额＝开始记账那天，现金＋银行一共有多少。汇率要手动更新。</p>
      <div class="stack"><button class="btn lg primary" id="s-save">保存设置</button></div></div></div>
    <div class="card"><div class="card-h">${I(P.phone, 16)}安装到手机</div><div class="card-b">${installTxt}</div></div>
  </div>
  <div class="card" style="margin-bottom:14px"><div class="card-h">收入来源<span class="sp"></span><button class="btn sm primary" data-act="addSrc">${I(P.plus, 13)}新增</button></div>
    <div class="tbl" style="padding-top:10px">
      <div class="tr th t-src2"><span>名称</span><span>类型</span><span class="ra">每月预期</span><span class="ra">本月实际</span><span></span></div>
      ${db.sources.map(x => `<div class="tr t-src2 tap" data-act="src" data-id="${x.id}"><div class="cell-main">${ic(x.name, TYPES[x.type].color)}<div class="t"><div class="t1">${esc(x.name)}</div><div class="t2 m-only">${TYPES[x.type].name}${x.expected ? ' · 预期 ' + money0(x.expected) : ''}</div></div></div>
        <div class="h-m">${typePill(x.type)}</div><div class="h-m ra num muted">${x.expected ? money0(x.expected) : '不固定'}</div><div class="ra amt num">${money0(incBy[x.id] || 0)}</div><div class="ra muted">${I(P.edit, 15)}</div></div>`).join('')}
    </div></div>
  ${reminderCard()}
  <div class="card" style="margin-bottom:14px"><div class="card-h">${I(P.tag, 16)}支出分类<span class="sp"></span><button class="btn sm" data-act="budgets">${I(P.edit, 13)}每月预算</button><button class="btn sm primary" data-act="addCat">${I(P.plus, 13)}新增分类</button></div>
    <div class="card-b">${['personal', 'business'].map(sc => `<div class="fsec" style="margin-top:${sc === 'personal' ? 0 : 18}px">${I(sc === 'personal' ? P.wallet : P.briefcase, 14)}${sc === 'personal' ? '个人支出' : '生意支出'}</div>
      <div class="catgrid">${db.cats.filter(c => (c.scope === 'business') === (sc === 'business')).map(c => `<button class="catitem" data-act="cat" data-id="${c.id}"><span class="dot" style="background:${c.color}"></span><span class="t1">${esc(c.name)}</span><small class="num">${db.budgets[c.id] ? money0(db.budgets[c.id]) : (catSpent[c.id] ? money0(catSpent[c.id]) : '')}</small></button>`).join('')}
      <button class="catitem add" data-act="addCat" data-id="${sc}">${I(P.plus, 14)}新增</button></div>`).join('')}
      <p class="note">点任何一个分类可以改名、换颜色、改成个人／生意、设预算或删除。右边的金额是每月预算（没设预算的显示本月已花）。生意支出会跟个人支出分开统计。</p></div></div>
  <div class="card"><div class="card-h">数据与备份</div><div class="card-b">
    <p class="muted" style="margin-bottom:14px">${cloudState() && cloudState().user ? '已登录云端同步，资料存在你自己的 Firebase。导出备份是额外的保险。' : '还没登录云端：资料只存在这个浏览器里。换手机、换浏览器或清除 Safari 数据前，先导出备份，或登录上面的云端同步。'}GitHub 上只有程序，没有你的资料。<b style="color:var(--text)">${esc(lb)}</b></p>
    <div class="chipset" style="gap:8px"><button class="btn" data-act="export">${I(P.download, 15)}导出备份 (.json)</button><button class="btn" data-act="import">${I(P.upload, 15)}导入备份</button>
      <button class="btn" data-act="demo">${I(P.spark, 15)}载入示例数据</button><button class="btn danger" data-act="wipe">清空所有数据</button></div></div></div>`;
}
function bindSettings() {
  const b = $('#s-save'); if (!b) return;
  b.onclick = () => {
    const s = db.settings;
    s.name = $('#s-name').value.trim() || 'Jeffer';
    s.passiveGoal = Math.min(100, Math.max(0, Math.round(num($('#s-goal').value)))) || 50;
    s.opening = r2(num($('#s-open').value));
    s.fx.USD = num($('#s-usd').value) || s.fx.USD; s.fx.SGD = num($('#s-sgd').value) || s.fx.SGD;
    commit('设置已保存');
  };
}

async function cloudAuth(kind) {
  if (!window.IncomeCloud) { toast('Firebase 还没载入，检查网络'); return; }
  const e = $('#cl-email').value.trim(), p = $('#cl-pw').value;
  if (!e || !p) { toast('请填邮箱和密码'); return; }
  const btn = document.querySelector(kind === 'signIn' ? '[data-act=cloudIn]' : '[data-act=cloudUp]'); if (btn) { btn.disabled = true; btn.textContent = '处理中…'; }
  const err = await IncomeCloud[kind](e, p);
  if (err) { toast(err); if (btn) { btn.disabled = false; btn.textContent = kind === 'signIn' ? '登录' : '注册新账号'; } return; }
  toast(kind === 'signIn' ? '已登录，正在同步…' : '注册成功，正在上传资料…'); render();
}

/* ================= shell ================= */
function renderSidebar() {
  const nav = (id, icon, label, extra = '') => `<a class="nav ${state.tab === id ? 'on' : ''}" href="#${id}" title="${label}">${I(icon, 18)}<span>${label}</span>${extra}</a>`;
  const od = overdueCount();
  $('#sidebar').innerHTML = `<div class="brand"><img src="icons/icon-192.png" alt=""><span>IncomeOS</span></div>
    ${nav('home', P.home, '总览')}${nav('ledger', P.list, '账目')}
    <div class="nav-sec">规划</div>${nav('board', P.board, '预算看板', od ? `<span class="cnt">${od}</span>` : '')}
    <div class="nav-sec">资产</div>${nav('invest', P.trend, '投资组合')}
    <div class="side-foot">${nav('settings', P.gear, '设置')}
      <div class="user"><span class="avatar">${esc((db.settings.name || 'J').slice(0, 1).toUpperCase())}</span><div><b>${esc(db.settings.name)}</b><span>数据存在本机</span></div><span class="tag-pro">${db.settings.demo ? '示例' : '个人'}</span></div></div>`;
}
function renderTopbar() {
  const showMonth = state.tab !== 'invest' && state.tab !== 'settings';
  const mt = state.tab === 'home' ? `你好，${esc(db.settings.name)}` : TITLES[state.tab];
  $('#topbar').innerHTML = `<div class="crumb">IncomeOS <span class="dim">›</span> <b>${TITLES[state.tab]}</b></div><div class="m-title">${mt}</div>
    <span class="tb-sp"></span>
    <label class="search">${I(P.search, 15)}<input id="gq" placeholder="搜索记录…" value="${state.tab === 'ledger' ? '' : ''}"><span class="kbd">⌘K</span></label>
    ${showMonth ? `<div class="month"><button data-act="prevM" aria-label="上个月">${I(P.chevL, 16)}</button><span>${mLabel(state.month)}</span><button data-act="nextM" aria-label="下个月">${I(P.chevR, 16)}</button></div>` : ''}
    <button class="icon-btn cloud-btn ${cloudBadge().cls}" data-act="go" data-id="settings" title="${cloudBadge().label}" aria-label="${cloudBadge().label}">${I(cloudState() && cloudState().user ? P.cloud : P.cloudOff, 17)}<i></i></button>
    <button class="icon-btn" data-act="toggleTheme" aria-label="切换白天/黑夜" title="${isDark() ? '切换到白天' : '切换到黑夜'}">${I(isDark() ? P.sun : P.moon, 17)}</button>
    <button class="btn primary tb-new" data-act="addTx">${I(P.plus, 15)}记一笔</button>
    <button class="icon-btn m-gear cloud-btn ${cloudBadge().cls}" data-act="go" data-id="settings" aria-label="设置">${I(P.gear, 17)}<i></i></button>`;
  const gq = $('#gq');
  gq.onkeydown = e => { if (e.key === 'Enter') { state.q = gq.value; state.filter = 'all'; go('ledger'); } };
}
function renderTabbar() {
  const t = (id, icon, label) => `<button class="tab ${state.tab === id ? 'on' : ''}" data-act="go" data-id="${id}">${I(icon, 22)}<span>${label}</span></button>`;
  $('#tabbar').innerHTML = t('home', P.home, '总览') + t('ledger', P.list, '账目') + `<div class="fab-w"><button class="fab" data-act="addTx" aria-label="记一笔">${I(P.plus, 24)}</button></div>` + t('board', P.board, '看板') + t('invest', P.trend, '投资');
}
function renderShellOnly() { renderSidebar(); renderTopbar(); }
function render() {
  renderSidebar(); renderTopbar(); renderTabbar();
  $('#page').innerHTML = { home: vHome, ledger: vLedger, board: vBoard, invest: vInvest, settings: vSettings }[state.tab]();
  document.title = `${TITLES[state.tab]} · IncomeOS`;
  document.documentElement.style.setProperty('--tbh', $('#topbar').offsetHeight + 'px');
  const q = $('#q'); if (q) q.oninput = () => { state.q = q.value; $('#txList').innerHTML = ledgerRows(); };
  bindSettings();
}
function go(tab) {
  if (location.hash.slice(1) !== tab) location.hash = tab; // hashchange → render
  else { state.tab = tab; render(); }
  window.scrollTo(0, 0);
}
function fromHash() { const h = location.hash.slice(1); state.tab = ROUTES.includes(h) ? h : 'home'; render(); }
window.addEventListener('hashchange', () => { fromHash(); window.scrollTo(0, 0); });

const ACT = {
  go: id => go(id),
  prevM: () => { state.month = addMonth(state.month, -1); render(); },
  nextM: () => { state.month = addMonth(state.month, 1); render(); },
  addTx: () => txForm(),
  addIncome: () => txForm(null, { type: 'income' }),
  tx: id => txForm(db.tx.find(t => t.id === id)),
  filter: id => { state.filter = id; render(); },
  chart: id => { state.chart = id; render(); },
  demo: () => loadDemo(), export: () => exportData(), import: () => importData(), wipe: () => wipeAll(),
  addBill: () => billForm(), bill: id => billForm(db.bills.find(b => b.id === id)), payBill: id => payBill(id),
  addGoal: () => goalForm(), goal: id => depositForm(db.goals.find(g => g.id === id)),
  addSrc: () => srcForm(), src: id => srcForm(srcById(id)),
  budgets: () => budgetForm(),
  addCat: id => { catForm(null); if (id === 'business') { const b = mbody.querySelector('[data-opt="business"]'); if (b) b.click(); } },
  cat: id => catForm(db.cats.find(c => c.id === id)),
  addBizTx: () => txForm(null, { cat: (db.cats.find(c => c.scope === 'business') || {}).id || 'ads' }),
  cloudIn: () => cloudAuth('signIn'), cloudUp: () => cloudAuth('signUp'),
  cloudReset: async () => { const e = ($('#cl-email') || {}).value || ''; if (!e.trim()) { toast('先填邮箱'); return; } const err = await IncomeCloud.reset(e.trim()); toast(err || '重设密码的邮件已寄出'); },
  cloudSync: () => { IncomeCloud.syncNow(); toast('同步中…'); },
  cloudOut: async () => { if (!(await ask('登出云端？这台设备上的资料会保留，之后可以再登录。', '登出'))) return; await IncomeCloud.signOut(); render(); toast('已登出'); },
  syncConnect: () => { const t = $('#sy-token').value.trim(); if (!t) { toast('先贴 GitHub token'); return; } const c = loadSync(); c.token = t; saveSync(c); syncNow(true); },
  copyGist: async () => { try { await navigator.clipboard.writeText(loadSync().gistId); toast('已复制 GIST_ID'); } catch (e) { toast('复制失败，请手动选取'); } },
  syncOff: async () => { if (!(await ask('断开每日提醒？手机不会再收到最新数字（GitHub 上的 Gist 不会删除）。', '断开'))) return; saveSync({}); render(); toast('已断开'); },
  setTheme: id => { db.settings.theme = id; save(); applyTheme(); render(); },
  toggleTheme: () => { db.settings.theme = isDark() ? 'light' : 'dark'; save(); applyTheme(); render(); toast(isDark() ? '已切换到黑夜' : '已切换到白天'); },
  addHold: () => holdForm(), hold: id => holdForm(db.holdings.find(h => h.id === id)), addDiv: () => divForm(),
  hideInstall: () => { db.settings.hideInstall = true; commit(); },
  install: async () => { if (!deferredPrompt) return; deferredPrompt.prompt(); try { await deferredPrompt.userChoice; } catch (e) {} deferredPrompt = null; render(); }
};
document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]'); if (!el || el.closest('#modalBody')) return;
  e.stopPropagation(); if (el.tagName === 'A' && el.getAttribute('href') === '#') e.preventDefault();
  const f = ACT[el.dataset.act]; if (f) f(el.dataset.id, el, e);
});
document.addEventListener('visibilitychange', () => { if (!document.hidden) { if (!modal.classList.contains('open')) render(); if (loadSync().gistId) scheduleSync(); } });

fromHash();
if (loadSync().gistId) setTimeout(() => syncNow(false), 1500);
window.addEventListener('resize', () => document.documentElement.style.setProperty('--tbh', $('#topbar').offsetHeight + 'px'));

if ('serviceWorker' in navigator && location.protocol === 'https:') {
  try { navigator.serviceWorker.register('./sw.js').catch(() => {}); } catch (e) {}
}
})();
