'use strict';

/* ── Daily Dashboard ── */
function renderDashboard() {
  const targets   = Store.getTargets();
  const todayLog  = Store.getTodayLog() || {};
  const score     = Store.calcScore(todayLog, targets);
  const today     = Store.friendlyDate(Store.todayKey());
  const completed = Object.keys(Store.HABIT_META).filter(h => (todayLog[h] ?? 0) >= targets[h]).length;
  const hour      = new Date().getHours();
  const greeting  = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  /* ── Orbit-style habit cards ── */
  const habitCards = Object.entries(Store.HABIT_META).map(([key, meta]) => {
    const actual = todayLog[key] ?? 0;
    const target = targets[key];
    const done   = actual >= target;
    const step   = key === 'sleep' ? 0.5 : 1;
    return `
      <div class="habit-card ${done ? 'habit-done' : ''}" id="hcard-${key}">
        <div class="habit-card-top">
          <div class="habit-card-icon-wrap" style="background:${meta.color}22">
            <span class="material-symbols-outlined" style="color:${meta.color}">${meta.icon}</span>
          </div>
          <span class="habit-card-label">${meta.label}</span>
          <span class="habit-done-badge material-symbols-outlined"
                style="opacity:${done ? 1 : 0}">check_circle</span>
        </div>
        <div class="orbit-dial-wrap"
             id="orbit-${key}"
             data-key="${key}"
             data-actual="${actual}"
             data-target="${target}"
             data-color="${meta.color}"
             data-step="${step}">
        </div>
      </div>`;
  }).join('');

  const scoreColor = score >= 80 ? '#66bb6a' : score >= 40 ? '#ffa726' : '#ef5350';

  document.getElementById('app').innerHTML = `
    <div class="screen screen-dashboard">

      <!-- fixed background plant -->
      <div id="plant-bg-wrap" aria-hidden="true"></div>

      <div class="dash-header">
        <div class="app-logo">
          <span class="material-symbols-outlined" style="color:var(--primary)">spa</span>
          <span class="logo-text">WellNest</span>
        </div>
        <div class="dash-header-right">
          <div class="dash-date">${today.full}</div>
          <button id="voice-btn" onclick="VoiceSystem.checkAndSpeak()"
            title="Tap for voice reminder" aria-label="Voice reminder">
            <span class="material-symbols-outlined" id="voice-btn-icon">mic</span>
          </button>
        </div>
      </div>

      <div class="dash-greeting">
        <h2 class="greeting-text">${greeting}.<br>Let's check in today.</h2>
        <div class="plant-stage-pill" id="pl-stage-label">🌱 Resting…</div>
      </div>

      <!-- score card -->
      <div class="wellness-score-card">
        <div class="score-ring-wrap">
          <svg class="score-ring" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="50" fill="none" stroke="var(--surface-variant)" stroke-width="10"/>
            <circle cx="60" cy="60" r="50" fill="none" stroke="${scoreColor}" stroke-width="10"
              stroke-dasharray="${Math.round(Math.PI*100)}" stroke-dashoffset="${Math.round(Math.PI*100*(1-score/100))}"
              stroke-linecap="round" transform="rotate(-90 60 60)"
              style="transition:stroke-dashoffset .6s ease"/>
          </svg>
          <div class="score-center">
            <div class="score-num" style="color:${scoreColor}">${score}</div>
            <div class="score-label">Wellness</div>
          </div>
        </div>
        <div class="score-detail">
          <div class="score-title">Overall Wellness</div>
          <div class="score-sub">${scoreSubtext(score, completed)}</div>
          <div class="score-chips">${completed} of 6 habits completed</div>
        </div>
      </div>

      <div class="section-header">Today's Habits</div>
      <div class="habit-list">${habitCards}</div>

      <div class="tip-card">
        <div class="tip-icon"><span class="material-symbols-outlined">lightbulb</span></div>
        <div>
          <div class="tip-title">Wellness Insight</div>
          <div class="tip-body" id="dash-tip">Loading…</div>
        </div>
      </div>
    </div>
  `;

  /* weekly tip */
  try { document.getElementById('dash-tip').textContent = Store.getWeeklyStats().tip; } catch {}

  /* systems */
  if (window.PlantSystem)  PlantSystem.init();
  if (window.VoiceSystem)  VoiceSystem.init();
  if (window.OrbitUI)      OrbitUI.init();
}

/* ── Score subtext ── */
function scoreSubtext(score, done) {
  if (done === 6)  return '🎉 Perfect day! All habits complete.';
  if (score >= 80) return "You're crushing it! Just a bit more.";
  if (score >= 40) return "You're building better habits!";
  if (done === 0)  return "Drag a dial to log your first habit.";
  return "Every step counts — keep going.";
}

/* ── Lightweight patch — no full re-render ── */
function patchDashboard(changedKey) {
  const targets  = Store.getTargets();
  const todayLog = Store.getTodayLog() || {};
  const newScore = Store.calcScore(todayLog, targets);
  const actual   = todayLog[changedKey] ?? 0;
  const target   = targets[changedKey];
  const done     = actual >= target;

  /* update orbit dial itself (already done inside OrbitUI._updateDial) */
  const orbitWrap = document.getElementById(`orbit-${changedKey}`);
  if (orbitWrap && window.OrbitUI) {
    orbitWrap.dataset.actual = actual;
    /* _updateDial already called by drag handler; skip duplicate call */
  }

  /* update card done state + badge */
  const card = document.getElementById(`hcard-${changedKey}`);
  if (card) {
    card.classList.toggle('habit-done', done);
    const badge = card.querySelector('.habit-done-badge');
    if (badge) badge.style.opacity = done ? '1' : '0';
  }

  /* score ring */
  const scoreColor = newScore >= 80 ? '#66bb6a' : newScore >= 40 ? '#ffa726' : '#ef5350';
  document.querySelectorAll('.score-ring circle:last-child').forEach(r => {
    r.style.stroke = scoreColor;
    r.setAttribute('stroke-dashoffset', Math.round(Math.PI * 100 * (1 - newScore / 100)));
  });
  const numEl = document.querySelector('.score-num');
  if (numEl) { numEl.textContent = newScore; numEl.style.color = scoreColor; }

  const completed = Object.keys(Store.HABIT_META).filter(h => (todayLog[h] ?? 0) >= targets[h]).length;
  const subEl  = document.querySelector('.score-sub');
  if (subEl)  subEl.textContent  = scoreSubtext(newScore, completed);
  const chipEl = document.querySelector('.score-chips');
  if (chipEl) chipEl.textContent = `${completed} of 6 habits completed`;

  /* plant */
  if (window.PlantSystem) PlantSystem.update();
}

window.renderDashboard = renderDashboard;
window.patchDashboard  = patchDashboard;
