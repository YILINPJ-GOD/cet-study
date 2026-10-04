/* ===== SVG 图表：折线图 / 柱状图 / 打卡日历 ===== */
App.charts = {};

/* 折线图 series: [{name,color,data:[{x,y}]}] */
App.charts.line = function (opts) {
  const W = 620, H = 250, PL = 40, PR = 14, PT = 16, PB = 30;
  const max = opts.max || 100, min = opts.min || 0;
  const xLabels = [];
  for (const s of opts.series) for (const p of s.data) if (!xLabels.includes(p.x)) xLabels.push(p.x);
  if (!xLabels.length) return '<div class="empty">暂无数据，快去练习吧</div>';
  const n = xLabels.length;
  const X = i => PL + (n === 1 ? (W - PL - PR) / 2 : i * (W - PL - PR) / (n - 1));
  const Y = v => PT + (1 - (v - min) / (max - min)) * (H - PT - PB);
  let svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" style="width:100%;height:auto">';
  for (const g of [0, 0.25, 0.5, 0.75, 1]) {
    const y = PT + g * (H - PT - PB);
    svg += '<line x1="' + PL + '" y1="' + y + '" x2="' + (W - PR) + '" y2="' + y + '" stroke="#e6e9f2" stroke-width="1"/>';
    svg += '<text x="' + (PL - 6) + '" y="' + (y + 4) + '" text-anchor="end" font-size="10" fill="#8b93ab">' + Math.round(max - g * (max - min)) + (opts.yUnit || '') + '</text>';
  }
  const step = Math.ceil(n / 10);
  xLabels.forEach((lab, i) => {
    if (i % step === 0 || i === n - 1) svg += '<text x="' + X(i) + '" y="' + (H - 8) + '" text-anchor="middle" font-size="10" fill="#8b93ab">' + lab.slice(5) + '</text>';
  });
  for (const s of opts.series) {
    const pts = s.data.map((p, i) => ({ x: X(xLabels.indexOf(p.x)), y: Y(p.y), v: p.y, lab: p.x }));
    let d = '', started = false;
    for (const p of pts) {
      if (p.y == null || p.v == null) { started = false; continue; }
      d += (started ? 'L' : 'M') + p.x.toFixed(1) + ' ' + p.y.toFixed(1) + ' ';
      started = true;
    }
    svg += '<path d="' + d + '" fill="none" stroke="' + s.color + '" stroke-width="2.2" stroke-linejoin="round"/>';
    for (const p of pts) {
      if (p.v == null) continue;
      svg += '<circle cx="' + p.x.toFixed(1) + '" cy="' + p.y.toFixed(1) + '" r="3.2" fill="' + s.color + '"><title>' + s.name + ' ' + p.lab + '：' + p.v + (opts.yUnit || '') + '</title></circle>';
    }
  }
  svg += '</svg>';
  let legend = '<div class="chart-legend">';
  for (const s of opts.series) legend += '<span><i class="dot" style="background:' + s.color + '"></i>' + s.name + '</span>';
  legend += '</div>';
  return svg + legend;
};

/* 柱状图 data: [{label,value,color}] */
App.charts.bars = function (opts) {
  const W = 620, H = 210, PL = 40, PR = 10, PT = 14, PB = 26;
  const max = opts.max || Math.max(1, ...opts.data.map(d => d.value));
  const n = opts.data.length;
  if (!n) return '<div class="empty">暂无数据</div>';
  const bw = (W - PL - PR) / n;
  let svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" style="width:100%;height:auto">';
  for (const g of [0, 0.5, 1]) {
    const y = PT + g * (H - PT - PB);
    svg += '<line x1="' + PL + '" y1="' + y + '" x2="' + (W - PR) + '" y2="' + y + '" stroke="#e6e9f2"/>';
    svg += '<text x="' + (PL - 6) + '" y="' + (y + 4) + '" text-anchor="end" font-size="10" fill="#8b93ab">' + Math.round(max - g * max) + (opts.yUnit || '') + '</text>';
  }
  opts.data.forEach((d, i) => {
    const h = (d.value / max) * (H - PT - PB);
    const x = PL + i * bw + bw * 0.18;
    svg += '<rect x="' + x.toFixed(1) + '" y="' + (H - PB - h).toFixed(1) + '" width="' + (bw * 0.64).toFixed(1) + '" height="' + Math.max(h, d.value > 0 ? 2 : 0).toFixed(1) + '" rx="5" fill="' + (d.color || '#6366f1') + '"><title>' + d.label + '：' + (opts.fmt ? opts.fmt(d.value) : d.value) + '</title></rect>';
    svg += '<text x="' + (PL + i * bw + bw / 2).toFixed(1) + '" y="' + (H - 8) + '" text-anchor="middle" font-size="10" fill="#8b93ab">' + d.label + '</text>';
    if (d.value > 0) svg += '<text x="' + (PL + i * bw + bw / 2).toFixed(1) + '" y="' + (H - PB - h - 4).toFixed(1) + '" text-anchor="middle" font-size="9.5" fill="#5a6480">' + (opts.fmt ? opts.fmt(d.value) : d.value) + '</text>';
  });
  svg += '</svg>';
  return svg;
};

/* 打卡日历（月视图）el 为容器 */
App.charts.calendar = function (el, base) {
  let cur = base ? new Date(base) : new Date();
  const render = () => {
    const y = cur.getFullYear(), m = cur.getMonth();
    const first = new Date(y, m, 1);
    const startPad = first.getDay();
    const daysIn = new Date(y, m + 1, 0).getDate();
    const todayStr = App.today();
    let html = '<div class="cal-nav"><button class="btn plain sm" data-act="prev">‹ 上月</button><b>' + y + '年' + (m + 1) + '月</b><button class="btn plain sm" data-act="next" ' + (App.today(cur) >= todayStr ? 'disabled' : '') + '>下月 ›</button></div>';
    html += '<div class="cal">';
    for (const h of ['日', '一', '二', '三', '四', '五', '六']) html += '<div class="h">' + h + '</div>';
    for (let i = 0; i < startPad; i++) html += '<div class="d off"></div>';
    for (let d = 1; d <= daysIn; d++) {
      const dt = y + '-' + String(m + 1).padStart(2, '0') + '-' + String(d).padStart(2, '0');
      const st = App.store.days[dt];
      const sec = st ? st.sec : 0;
      let cls = 'd';
      if (sec >= App.CHECKIN_SEC) cls += ' on';
      else if (sec >= 120) cls += ' mid';
      if (dt === todayStr) cls += ' today';
      html += '<div class="' + cls + '" title="' + dt + (sec ? ' 学习 ' + App.fmtSec(sec) : ' 未学习') + '">' + d + '</div>';
    }
    html += '</div><div class="note" style="margin-top:8px">深色=达标打卡（≥' + App.CHECKIN_SEC / 60 + '分钟）· 浅色=有学习 · 悬停查看时长</div>';
    el.innerHTML = html;
    el.querySelector('[data-act=prev]').onclick = () => { cur = new Date(y, m - 1, 1); render(); };
    const nx = el.querySelector('[data-act=next]');
    if (nx && !nx.disabled) nx.onclick = () => { cur = new Date(y, m + 1, 1); render(); };
  };
  render();
};
