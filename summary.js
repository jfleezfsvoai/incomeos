/* IncomeOS 每日摘要 —— App（浏览器）和 GitHub Actions（Node）共用同一份计算，
   所以 App 里看到的「今天可以花」跟早上 Telegram 收到的数字一定一样。 */
(function (root) {
  'use strict';
  const pad = n => String(n).padStart(2, '0');
  const ym = d => d.getFullYear() + '-' + pad(d.getMonth() + 1);
  const WD = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  const esc = s => String(s == null ? '' : s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
  const rm = (n, d) => {
    if (d == null) d = Math.abs(n) >= 1000 ? 0 : 2;
    return (n < 0 ? '-' : '') + 'RM ' + Math.abs(n).toLocaleString('en-MY', { minimumFractionDigits: d, maximumFractionDigits: d });
  };
  const total = (arr, k) => arr.reduce((a, x) => a + (x[k] || 0), 0);

  /* s = App 产生的快照（snapshot），now = 现在时间 */
  function plan(s, now) {
    now = now || new Date();
    const stale = s.month !== ym(now);              // 新的一个月，App 还没打开过
    const days = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const today = now.getDate(), daysLeft = days - today + 1;
    const budgets = (s.budgets || []).map(b => ({ name: b.name, budget: b.budget, spent: stale ? 0 : b.spent }));
    const budgetTotal = total(budgets, 'budget');
    const spent = total(budgets, 'spent');
    const left = budgets.reduce((a, b) => a + Math.max(0, b.budget - b.spent), 0);
    const over = budgets.filter(b => b.spent > b.budget).map(b => ({ name: b.name, over: b.spent - b.budget }));
    const bills = (s.bills || []).filter(b => stale || !b.paid);
    const billsTotal = total(bills, 'amount');
    const soon = bills.filter(b => b.dueDay <= today + 3).sort((a, b) => a.dueDay - b.dueDay)
      .map(b => ({ name: b.name, amount: b.amount, dueDay: b.dueDay, overdue: b.dueDay < today, dueToday: b.dueDay === today }));
    const income = stale ? 0 : (s.income || 0);
    const personalExp = stale ? 0 : (s.personalExp || 0);
    const businessExp = stale ? 0 : (s.businessExp || 0);
    let canSpend, basis;
    if (budgetTotal > 0) { canSpend = left; basis = 'budget'; }
    else { canSpend = Math.max(0, income - personalExp - businessExp - billsTotal); basis = 'income'; }
    const cash = s.cash || 0;
    return {
      stale, days, today, daysLeft, budgetTotal, spent, left, over, bills, billsTotal, soon,
      income, personalExp, businessExp, canSpend, basis, perDay: canSpend / daysLeft,
      cash, cashAfterBills: cash - billsTotal
    };
  }

  /* Telegram 消息（HTML 格式） */
  function buildMessage(s, now) {
    now = now || new Date();
    const p = plan(s, now);
    const L = [];
    L.push(`☀️ <b>早安${s.name ? ' ' + esc(s.name) : ''}</b>｜${now.getMonth() + 1}月${now.getDate()}日 ${WD[now.getDay()]}`);
    L.push('');
    L.push(`💰 目前现金：<b>${rm(p.cash)}</b>`);
    if (p.billsTotal) L.push(`🧾 扣掉待付账单 ${rm(p.billsTotal)} 后：${rm(p.cashAfterBills)}`);
    L.push(`🛍️ 本月还可以花：<b>${rm(p.canSpend)}</b>${p.basis === 'budget' ? '（个人预算）' : '（收入扣掉支出和账单）'}`);
    L.push(`📅 今天起每天可以花：<b>${rm(p.perDay)}</b>（剩 ${p.daysLeft} 天）`);
    if (p.over.length) {
      L.push('');
      p.over.forEach(o => L.push(`⚠️ ${esc(o.name)} 已超支 ${rm(o.over)}`));
    }
    if (p.soon.length) {
      L.push('');
      L.push('📌 要付的账单：');
      p.soon.forEach(b => L.push(`• ${esc(b.name)} ${rm(b.amount)}（${b.overdue ? '已逾期' : b.dueToday ? '今天到期' : `${now.getMonth() + 1}/${b.dueDay}`}）`));
    }
    L.push('');
    L.push(`📊 本月至今：收入 ${rm(p.income)}｜个人支出 ${rm(p.personalExp)}｜生意支出 ${rm(p.businessExp)}`);
    if (p.stale) L.push('🗓️ 新的一个月开始了，打开 App 记账后数字会更新。');
    if (s.updatedAt) {
      const u = new Date(s.updatedAt);
      L.push(`<i>数据更新：${u.getMonth() + 1}/${u.getDate()} ${pad(u.getHours())}:${pad(u.getMinutes())}</i>`);
    }
    return L.join('\n');
  }

  root.IncomeSummary = { plan, buildMessage, rm };
})(typeof globalThis !== 'undefined' ? globalThis : this);
