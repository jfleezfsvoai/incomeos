// 每天早上由 GitHub Actions 执行：读取 App 同步到 Gist 的摘要 → 发 Telegram 通知到手机
import '../summary.js';

const { GIST_ID, TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID } = process.env;
const missing = Object.entries({ GIST_ID, TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID }).filter(([, v]) => !v).map(([k]) => k);
if (missing.length) {
  console.error(`缺少 GitHub Secrets：${missing.join(', ')}。请到仓库 Settings → Secrets and variables → Actions 添加。`);
  process.exit(1);
}

const gr = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
  headers: { Accept: 'application/vnd.github+json', 'User-Agent': 'incomeos-daily-reminder' }
});
if (!gr.ok) { console.error(`读不到 Gist（${gr.status}）。检查 GIST_ID 对不对。`); process.exit(1); }
const gist = await gr.json();
const file = gist.files && gist.files['incomeos-summary.json'];
if (!file) { console.error('Gist 里没有 incomeos-summary.json，先在 App 里按一次「立即同步」。'); process.exit(1); }
const content = file.truncated ? await (await fetch(file.raw_url)).text() : file.content;
const snap = JSON.parse(content);

const text = globalThis.IncomeSummary.buildMessage(snap, new Date());
console.log(text);

const api = (method, body) => fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/${method}`, {
  method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body || {})
});
const send = chat => api('sendMessage', { chat_id: chat, text, parse_mode: 'HTML', disable_web_page_preview: true });

const botId = String(TELEGRAM_BOT_TOKEN).split(':')[0];
let chatId = String(TELEGRAM_CHAT_ID).trim();
let tr = chatId === botId ? null : await send(chatId);

if (!tr || !tr.ok) {
  const why = tr ? await tr.text() : 'TELEGRAM_CHAT_ID 填的是 bot 自己的 ID';
  console.error(`用 TELEGRAM_CHAT_ID 发送失败：${why}`);
  // 自动找出最近跟 bot 私聊的人（就是你），改发给他，并告诉他正确的 ID
  const up = await (await api('getUpdates', { limit: 100 })).json();
  const chats = (up.result || []).map(u => (u.message || u.edited_message || {}).chat).filter(c => c && c.type === 'private');
  const me = chats[chats.length - 1];
  if (!me) {
    console.error('找不到你的私聊记录：请在 Telegram 打开你的 bot，发一句「hi」，再重新 Run workflow。');
    process.exit(1);
  }
  chatId = String(me.id);
  tr = await send(chatId);
  if (tr.ok) {
    await api('sendMessage', { chat_id: chatId, parse_mode: 'HTML',
      text: `⚙️ 你在 GitHub 填的 TELEGRAM_CHAT_ID 不对（${chatId === botId ? '' : '那是 bot 自己的 ID'}）。\n你本人的 chat id 是：<code>${chatId}</code>\n请到 incomeos → Settings → Secrets and variables → Actions，把 TELEGRAM_CHAT_ID 改成这个数字。` });
  }
}
if (!tr.ok) {
  console.error(`Telegram 发送失败（${tr.status}）：${await tr.text()}`);
  process.exit(1);
}
console.log('✅ 已发送到 Telegram');
