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

const tr = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text, parse_mode: 'HTML', disable_web_page_preview: true })
});
if (!tr.ok) {
  console.error(`Telegram 发送失败（${tr.status}）：${await tr.text()}`);
  console.error('常见原因：还没在 Telegram 打开你的 bot 按「Start」，或 TELEGRAM_CHAT_ID 不对。');
  process.exit(1);
}
console.log('✅ 已发送到 Telegram');
