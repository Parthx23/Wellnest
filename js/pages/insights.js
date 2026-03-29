
'use strict';

/* ── Weekly Insights ── */
function renderInsights() {
  const ws = Store.getWeeklyStats();
  const days7 = Store.last7Days();

  const streakDots = days7.map(key => {
    const log   = Store.getLog(key);
    const score = Store.calcScore(log);
    const state = log ? Store.dayState(score) : 'missed';
    const fd    = Store.friendlyDate(key);
    const isToday = key === Store.todayKey();

    return `
      <div class="streak-day" title="${fd.full}: ${score}">
        <div class="streak-dot streak-${state} ${isToday ? 'streak-today' : ''}">
          ${state === 'completed' ? '<span class="material-symbols-outlined">check</span>' :
            state === 'partial'   ? '<span class="material-symbols-outlined">remove</span>' :
                                    '<span class="material-symbols-outlined">close</span>'}
        </div>
        <div class="streak-day-label">${fd.short}</div>
        <div class="streak-day-score">${log ? score : '—'}</div>
      </div>
    `;
  }).join('');

  const habitBars = Object.entries(Store.HABIT_META).map(([key, meta]) => {
    const pct = ws.habitAvgs[key] ?? 0;
    const isStrongest = key === ws.strongest;
    const isWeakest   = key === ws.weakest;
    return `
      <div class="insight-habit-row">
        <div class="insight-habit-left">
          <span class="material-symbols-outlined" style="color:${meta.color};font-size:18px">${meta.icon}</span>
          <span class="insight-habit-label">${meta.label}</span>
          ${isStrongest ? '<span class="badge badge-strong">Top</span>' : ''}
          ${isWeakest   ? '<span class="badge badge-weak">Focus</span>' : ''}
        </div>
        <div class="insight-bar-wrap">
          <div class="insight-bar-fill" style="width:${pct}%;background:${meta.color}"></div>
        </div>
        <span class="insight-pct">${pct}%</span>
      </div>
    `;
  }).join('');

  const avgColor = ws.avg >= 80 ? '#66bb6a' : ws.avg >= 40 ? '#ffa726' : '#ef5350';
  const strongMeta = Store.HABIT_META[ws.strongest];
  const weakMeta   = Store.HABIT_META[ws.weakest];

  document.getElementById('app').innerHTML = `
    <div class="screen screen-insights">
      <div class="page-header">
        <h1 class="page-title">Weekly Insights</h1>
        <p class="page-sub">Your focus tells a story — let's read it together.</p>
      </div>

      <!-- Summary Row -->
      <div class="insights-summary-row">
        <div class="summary-card">
          <div class="summary-val" style="color:${avgColor}">${ws.avg}</div>
          <div class="summary-label">7-day Avg</div>
        </div>
        <div class="summary-card">
          <span class="material-symbols-outlined" style="color:${strongMeta.color}">${strongMeta.icon}</span>
          <div class="summary-val sm">${strongMeta.label}</div>
          <div class="summary-label">Strongest</div>
        </div>
        <div class="summary-card">
          <span class="material-symbols-outlined" style="color:${weakMeta.color}">${weakMeta.icon}</span>
          <div class="summary-val sm">${weakMeta.label}</div>
          <div class="summary-label">Needs Love</div>
        </div>
      </div>

      <!-- 7-Day Streak -->
      <div class="section-header">7-Day Streak</div>
      <div class="streak-row">${streakDots}</div>

      <!-- Habit bars -->
      <div class="section-header">Category Trends <span class="section-sub">Daily completion rates over 7 days</span></div>
      <div class="insight-habits-list">
        ${habitBars}
      </div>

      <!-- Tip -->
      <div class="tip-card tip-card-accent">
        <div class="tip-icon"><span class="material-symbols-outlined">tips_and_updates</span></div>
        <div>
          <div class="tip-title">Your Weekly Tip</div>
          <div class="tip-body">${ws.tip}</div>
        </div>
      </div>

      <!-- Legend -->
      <div class="streak-legend">
        <span class="legend-dot streak-completed"></span> Completed (≥80)
        <span class="legend-dot streak-partial"></span> Partial (40-79)
        <span class="legend-dot streak-missed"></span> Missed (&lt;40)
      </div>
    </div>
  `;
}

window.renderInsights = renderInsights;
