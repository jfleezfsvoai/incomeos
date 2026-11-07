# IncomeOS · 收入与理财

一个纯前端的个人理财 Web App，用来管理多渠道收入。它不用后端，不用登录，也不用上 App Store，手机上可以「添加到主屏幕」当 App 用。

## 功能

- **总览**：净资产、本月收入和支出（跟上个月比）、每日走势点阵图、被动收入占比（对比目标）、各收入来源的达成率、待付账单、最近记录
- **账目**：所有收入和支出，可以用收入／支出／待定筛选，也可以搜索
- **预算看板**：分四栏，固定账单（到期提醒、一键标记已付）、日常支出（分类预算）、储蓄目标、收入
- **投资组合**：股息股和成长股的市值、盈亏、预估年股息。支持 MYR、USD、SGD
- **设置**：白天／黑夜／跟随系统、基本资料、收入来源、支出分类（新增、改名、改颜色、删除）、导出／导入备份、示例数据

收入来源分成 **主动 / 半被动 / 被动** 三类，用来追踪被动收入占总收入的比例。

支出分类分成 **个人支出** 和 **生意支出**（例如广告投放），两种会分开统计：总览、账目、预算看板、收入去向都会各自列出。

## 每天早上提醒（Telegram）

网页 App 没办法自己定时推送通知，所以做法是这样的：

1. App 把一份「摘要」自动同步到你自己的 **私密 GitHub Gist**，内容只有现金余额、本月收支、个人预算、账单，没有逐笔流水。
2. **GitHub Actions** 每天马来西亚时间 8:07 执行 `scripts/daily-reminder.mjs`，读取这份摘要。
3. 再通过 **Telegram 机器人** 把「目前现金、本月还可以花、今天起每天可以花、超支、要付的账单」发到你手机。

App 里显示的「今天可以花」和这则通知用的是同一份计算（`summary.js`），所以数字会一样。

设置步骤写在 App 的「设置 → 每天早上提醒」。需要在仓库 **Settings → Secrets and variables → Actions** 加 3 个 secret：

| Secret | 内容 |
|---|---|
| `TELEGRAM_BOT_TOKEN` | @BotFather 给的 bot token |
| `TELEGRAM_CHAT_ID` | @userinfobot 给的 Id |
| `GIST_ID` | App 连接后显示的 Gist ID |

> 公开仓库如果 60 天都没有新的 commit，GitHub 会自动暂停定时任务，到时去 Actions 页面按 Enable 就好。

## 数据存在哪里？

所有数据只存在你自己浏览器的 `localStorage` 里，**不会上传**。这个仓库只有程序代码，没有任何个人数据。

换手机、换浏览器或清除 Safari 数据之前，先到「设置 → 导出备份」。

## 部署（GitHub Pages）

1. 打开仓库的 **Settings → Pages**
2. Source 选 **Deploy from a branch**，Branch 选 `main`，文件夹选 `/ (root)`，按 Save
3. 等 1–2 分钟，网址会是 `https://<你的用户名>.github.io/incomeos/`

## 装到手机主屏幕

- **iPhone**：用 Safari 打开网址，点「分享」→「添加到主屏幕」
- **Android**：用 Chrome 打开，点「安装」或右上角菜单的「安装应用」

装好之后会全屏打开，没有网络也能用（由 `sw.js` 负责离线缓存）。

## 文件结构

```
index.html            页面骨架
styles.css            样式（亮色；桌面有侧边栏，手机用底部导航）
app.js                全部逻辑
summary.js            「今天可以花」和早上提醒的计算（App 和 GitHub Actions 共用）
scripts/              daily-reminder.mjs：早上发 Telegram
.github/workflows/    daily-reminder.yml：每天 8:07 定时执行
manifest.webmanifest  PWA 设定（名字、图标、颜色）
sw.js                 离线缓存
icons/                App 图标
```

## 更新版本

改完代码之后，把 `sw.js` 里的 `CACHE = 'incomeos-v4'` 版本号加 1，手机才会拿到新版本。
