
'use strict';

/* ── History ── */
function renderHistory() {
  const logs    = Store.getLogs();
  const targets = Store.getTargets();
  const days    = Store.last30Days().reverse(); // most recent first
  const hasAny  = days.some(k => logs[k]);

  const rows = days.map(key => {
    const log   = logs[key];
    const fd    = Store.friendlyDate(key);
    const isToday = key === Store.todayKey();
    if (!log && !isToday) return ''; // skip empty days except today

    const score = log ? Store.calcScore(log, targets) : 0;
    const state = log ? Store.dayState(score) : 'missed';
    const scoreColor = score >= 80 ? '#66bb6a' : score >= 40 ? '#ffa726' : '#ef5350';

    const habitPills = Object.entries(Store.HABIT_META).map(([k, meta]) => {
      const val    = log ? (log[k] ?? 0) : 0;
      const target = targets[k];
      const done   = val >= target;
      return `<span class="hist-pill ${done ? 'hist-pill-done' : ''}" title="${meta.label}: ${val}/${target}">
        <span class="material-symbols-outlined" style="font-size:14px;color:${meta.color}">${meta.icon}</span>
        ${val}
      </span>`;
    }).join('');

    return `
      <div class="hist-row">
        <div class="hist-left">
          <div class="hist-date-block">
            <span class="hist-day">${fd.short}</span>
            <span class="hist-date-num">${fd.date.split(' ')[1]}</span>
          </div>
          <div class="hist-score-badge" style="background:${scoreColor}22;color:${scoreColor}">
            ${log ? score : '—'}
          </div>
        </div>
        <div class="hist-right">
          <div class="hist-label">${isToday ? 'Today' : fd.full}</div>
          <div class="hist-bar-wrap">
            <div class="hist-bar-fill" style="width:${score}%;background:${scoreColor}"></div>
          </div>
          <div class="hist-pills">${log ? habitPills : '<span class="hist-empty-label">No log recorded</span>'}</div>
        </div>
      </div>
    `;
  }).filter(Boolean).join('');

  const emptyState = `
    <div class="empty-state">
      <span class="material-symbols-outlined empty-icon">history</span>
      <div class="empty-title">No history yet</div>
      <div class="empty-sub">Start logging habits on the dashboard, or enable Demo Mode in Settings to see sample data.</div>
      <button class="btn-secondary" onclick="Router.navigate('settings')">Go to Settings</button>
    </div>
  `;

  document.getElementById('app').innerHTML = `
    <div class="screen screen-history">
      <div class="page-header">
        <h1 class="page-title">Wellness Archive</h1>
        <p class="page-sub">Review your journey and uncover patterns in your daily serenity habits.</p>
      </div>

      <div class="hist-list">
        ${hasAny ? rows : emptyState}
      </div>
    </div>
  `;
}

window.renderHistory = renderHistory;
