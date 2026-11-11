/* IncomeOS 云端同步 —— Firebase Auth（邮箱 + 密码）+ Cloud Firestore
   结构：users/{uid}/data/meta        除流水外的所有资料（设置、分类、账单、目标、持仓…）
        users/{uid}/months/{YYYY-MM}  当月的流水
   每份文件都只存一个 JSON 字符串，方便整份对比、整份覆盖。 */
import { initializeApp } from 'https://www.gstatic.com/firebasejs/13.1.0/firebase-app.js';
import {
  getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword,
  sendPasswordResetEmail, signOut
} from 'https://www.gstatic.com/firebasejs/13.1.0/firebase-auth.js';
import {
  initializeFirestore, persistentLocalCache, persistentMultipleTabManager,
  doc, collection, getDoc, getDocs, onSnapshot, writeBatch, serverTimestamp
} from 'https://www.gstatic.com/firebasejs/13.1.0/firebase-firestore.js';

const firebaseConfig = {
  apiKey: 'AIzaSyC1sR1Yvmk5m83GyYO5TOY5ypSQZHwhmY8',
  authDomain: 'incomeos-2d7ab.firebaseapp.com',
  projectId: 'incomeos-2d7ab',
  storageBucket: 'incomeos-2d7ab.firebasestorage.app',
  messagingSenderId: '762467382275',
  appId: '1:762467382275:web:0c0da9acd8c27a6b870a36',
  measurementId: 'G-619KL972DK'
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
let fs;
try { fs = initializeFirestore(app, { localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }) }); }
catch (e) { fs = initializeFirestore(app, {}); }

const App = window.IncomeApp;
const LINK_KEY = 'incomeos_cloud_uid';           // 这台设备上次连的是哪个账号
const S = { user: null, status: 'off', lastSync: 0, error: '', ready: false };
let remote = { meta: null, months: {} };          // 云端目前的内容（JSON 字符串）
let unsubs = [], pushTimer = null, gotMeta = false, gotMonths = false, starting = false;

const ERR = {
  'auth/invalid-credential': '邮箱或密码不对', 'auth/wrong-password': '邮箱或密码不对', 'auth/user-not-found': '找不到这个账号，请先注册',
  'auth/invalid-email': '邮箱格式不对', 'auth/email-already-in-use': '这个邮箱已经注册过，请直接登录',
  'auth/weak-password': '密码至少要 6 位', 'auth/missing-password': '请输入密码', 'auth/too-many-requests': '试太多次了，稍后再试',
  'auth/network-request-failed': '网络连不上', 'auth/operation-not-allowed': 'Firebase 还没开启「Email/Password」登录（看设置页的步骤 1）',
  'permission-denied': 'Firestore 拒绝读写：安全规则还没贴上（看设置页的步骤 3）',
  'not-found': '还没建立 Firestore 数据库（看设置页的步骤 2）', 'failed-precondition': '还没建立 Firestore 数据库（看设置页的步骤 2）',
  'unavailable': '暂时连不上云端，恢复网络后会自动同步'
};
const msg = e => ERR[e && e.code] || (e && e.message) || '发生错误';
const refresh = () => { try { App.refreshCloud(); } catch (e) {} };
const setStatus = (status, error = '') => { S.status = status; S.error = error; if (status === 'synced') S.lastSync = Date.now(); refresh(); };

/* ---------- 资料拆分 / 合并 ---------- */
function split(d) {
  const { tx, ...meta } = d, months = {};
  (tx || []).forEach(t => { const k = String(t.date || '').slice(0, 7) || 'unknown'; (months[k] = months[k] || []).push(t); });
  const m = {}; for (const k of Object.keys(months)) m[k] = JSON.stringify(months[k]);
  return { meta: JSON.stringify(meta), months: m };
}
function join(r) {
  const meta = r.meta ? JSON.parse(r.meta) : {};
  const tx = []; Object.keys(r.months).sort().forEach(k => tx.push(...JSON.parse(r.months[k])));
  return { ...meta, tx };
}
const hasContent = d => !!(d && ((d.tx || []).length || (d.bills || []).length || (d.goals || []).length || (d.holdings || []).length));
const same = (a, b) => { const x = split(a), y = split(b); if (x.meta !== y.meta) return false; const ka = Object.keys(x.months), kb = Object.keys(y.months); return ka.length === kb.length && ka.every(k => x.months[k] === y.months[k]); };
function merge(cloud, local) {
  const out = JSON.parse(JSON.stringify(cloud));
  const byId = (a, b) => { const ids = new Set((a || []).map(x => x.id)); return [...(a || []), ...(b || []).filter(x => !ids.has(x.id))]; };
  for (const k of ['tx', 'bills', 'goals', 'holdings', 'sources', 'cats']) out[k] = byId(out[k], local[k]);
  out.budgets = { ...(local.budgets || {}), ...(cloud.budgets || {}) };
  return out;
}

/* ---------- 读 / 写 ---------- */
const refs = uid => ({ meta: doc(fs, 'users', uid, 'data', 'meta'), months: collection(fs, 'users', uid, 'months') });

async function pushNow(force) {
  clearTimeout(pushTimer); pushTimer = null;
  if (!S.user || !S.ready) return;
  const d = App.getData();
  if (d.settings && d.settings.demo) { setStatus('synced'); return; }      // 示例数据不上传
  const r = refs(S.user.uid), s = split(d), batch = writeBatch(fs); let n = 0;
  if (force || s.meta !== remote.meta) { batch.set(r.meta, { json: s.meta, updatedAt: serverTimestamp() }); remote.meta = s.meta; n++; }
  for (const [k, j] of Object.entries(s.months)) if (force || j !== remote.months[k]) { batch.set(doc(r.months, k), { json: j, updatedAt: serverTimestamp() }); remote.months[k] = j; n++; }
  for (const k of Object.keys(remote.months)) if (!(k in s.months)) { batch.delete(doc(r.months, k)); delete remote.months[k]; n++; }
  if (!n) { setStatus('synced'); return; }
  setStatus(navigator.onLine === false ? 'offline' : 'syncing');
  try { await batch.commit(); setStatus('synced'); }
  catch (e) { setStatus('error', msg(e)); }
}
function schedulePush() {
  if (!S.user || !S.ready) return;
  clearTimeout(pushTimer); setStatus(navigator.onLine === false ? 'offline' : 'syncing');
  pushTimer = setTimeout(() => pushNow(false), 1200);
}
function applyRemote() {
  if (!gotMeta || !gotMonths || pushTimer || !remote.meta) return;
  const data = join(remote);
  if (!same(data, App.getData())) App.replaceData(data, '已从云端更新');
  setStatus('synced');
}
function listen(uid) {
  const r = refs(uid);
  unsubs.push(onSnapshot(r.meta, snap => {
    remote.meta = snap.exists() ? snap.data().json : null; gotMeta = true;
    if (!snap.metadata.hasPendingWrites) applyRemote();
  }, e => setStatus('error', msg(e))));
  unsubs.push(onSnapshot(r.months, snap => {
    const m = {}; snap.forEach(d => { m[d.id] = d.data().json; }); remote.months = m; gotMonths = true;
    if (!snap.metadata.hasPendingWrites) applyRemote();
  }, e => setStatus('error', msg(e))));
}

/* 登录后第一次：决定用云端、上传本机，还是两边合并 */
async function start(user) {
  if (starting) return; starting = true;
  S.user = user; S.ready = false; setStatus('syncing');
  try {
    const r = refs(user.uid);
    const [ms, mo] = await Promise.all([getDoc(r.meta), getDocs(r.months)]);
    remote = { meta: ms.exists() ? ms.data().json : null, months: {} };
    mo.forEach(d => { remote.months[d.id] = d.data().json; });
    const local = App.getData(), localReal = hasContent(local) && !(local.settings && local.settings.demo);
    const linked = localStorage.getItem(LINK_KEY) === user.uid;
    S.ready = true;
    if (!remote.meta) {
      if (localReal || !(local.settings && local.settings.demo)) await pushNow(true);    // 云端是空的：上传这台设备的资料
    } else {
      const cloud = join(remote);
      if (localReal && !linked && !same(cloud, local)) {                                // 第一次在这台设备登录：合并
        const merged = merge(cloud, local);
        App.replaceData(merged, `已合并：云端 ${(cloud.tx || []).length} 笔 + 这台设备 ${(local.tx || []).length} 笔`);
        await pushNow(false);
      } else if (!same(cloud, local)) App.replaceData(cloud, '已载入云端资料');
    }
    localStorage.setItem(LINK_KEY, user.uid);
    gotMeta = gotMonths = false; listen(user.uid);
    setStatus('synced');
  } catch (e) { S.ready = false; setStatus('error', msg(e)); }
  finally { starting = false; }
}
function stop() { unsubs.forEach(u => u()); unsubs = []; clearTimeout(pushTimer); pushTimer = null; S.user = null; S.ready = false; remote = { meta: null, months: {} }; setStatus('off'); }

onAuthStateChanged(auth, user => { if (user) start(user); else stop(); });
window.addEventListener('online', () => { if (S.user) schedulePush(); });
window.addEventListener('offline', () => { if (S.user) setStatus('offline'); });

window.IncomeCloud = {
  state: () => ({ ...S, email: S.user ? S.user.email : '' }),
  changed: () => schedulePush(),
  syncNow: () => (S.ready ? pushNow(true) : S.user ? start(S.user) : null),
  async signIn(email, pw) { try { await signInWithEmailAndPassword(auth, email, pw); return ''; } catch (e) { return msg(e); } },
  async signUp(email, pw) { try { await createUserWithEmailAndPassword(auth, email, pw); return ''; } catch (e) { return msg(e); } },
  async reset(email) { try { await sendPasswordResetEmail(auth, email); return ''; } catch (e) { return msg(e); } },
  async signOut() { await pushNow(false).catch(() => {}); localStorage.removeItem(LINK_KEY); await signOut(auth); }
};
refresh();
