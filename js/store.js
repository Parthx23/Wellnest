
// ─── WellNest Store ─────────────────────────────────────────────────────────
'use strict';

/* ── Keys ── */
const KEYS = {
  targets: 'wn_targets',
  logs:    'wn_logs',
  prefs:   'wn_prefs',
  onboarded: 'wn_onboarded',
};

/* ── Defaults ── */
const DEFAULT_TARGETS = {
  hydration:    8,   // glasses
  sleep:        8,   // hours
  activity:     30,  // minutes
  meals:        3,   // meals
  screenBreaks: 3,   // breaks
  stressRelief: 2,   // sessions
};

const DEFAULT_PREFS = {
  theme: 'light',
  demoMode: false,
  reminders: true,
  weeklyInsights: true,
};

const WEIGHTS = {
  hydration:    0.15,
  sleep:        0.25,
  activity:     0.20,
  meals:        0.15,
  screenBreaks: 0.10,
  stressRelief: 0.15,
};

const HABIT_META = {
  hydration:    { label: 'Hydration',       unit: 'glasses', icon: 'water_drop',    color: '#4fc3f7' },
  sleep:        { label: 'Sleep',           unit: 'hours',   icon: 'bedtime',       color: '#9575cd' },
  activity:     { label: 'Physical Activity', unit: 'mins',  icon: 'directions_run',color: '#66bb6a' },
  meals:        { label: 'Healthy Meals',   unit: 'meals',   icon: 'restaurant',    color: '#ffa726' },
  screenBreaks: { label: 'Screen Breaks',   unit: 'breaks',  icon: 'visibility_off',color: '#26c6da' },
  stressRelief: { label: 'Stress Relief',   unit: 'sessions',icon: 'self_improvement',color: '#ec407a' },
};

/* ── LocalStorage helpers ── */
const ls = {
  get: (k, fallback) => {
    try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : fallback; }
    catch { return fallback; }
  },
  set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
};

/* ── State ── */
let _targets  = ls.get(KEYS.targets,   DEFAULT_TARGETS);
let _logs     = ls.get(KEYS.logs,      {});
let _prefs    = ls.get(KEYS.prefs,     DEFAULT_PREFS);
let _onboarded= ls.get(KEYS.onboarded, false);

/* ── Date helpers ── */
function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function dateKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function last7Days() {
  return Array.from({length:7}, (_,i) => {
    const d = new Date(); d.setDate(d.getDate() - (6-i)); return dateKey(d);
  });
}

function last30Days() {
  return Array.from({length:30}, (_,i) => {
    const d = new Date(); d.setDate(d.getDate() - (29-i)); return dateKey(d);
  });
}

function friendlyDate(key) {
  const [y,m,d] = key.split('-').map(Number);
  const date = new Date(y, m-1, d);
  const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return { day: days[date.getDay()], short: days[date.getDay()].slice(0,3), date: `${months[m-1]} ${d}`, full: `${days[date.getDay()]}, ${months[m-1]} ${d}` };
}

/* ── Score Engine ── */
function calcScore(log, targets) {
  if (!log) return 0;
  const t = targets || _targets;
  let score = 0;
  for (const h of Object.keys(WEIGHTS)) {
    const actual = log[h] ?? 0;
    const target = t[h] ?? DEFAULT_TARGETS[h];
    score += Math.min(actual / target, 1) * WEIGHTS[h];
  }
  return Math.round(score * 100);
}

function dayState(score) {
  if (score >= 80) return 'completed';
  if (score >= 40) return 'partial';
  return 'missed';
}

/* ── Tip Engine ── */
const TIPS = {
  hydration:    "💧 You're under your hydration goal. Try keeping a water bottle at your desk and taking sips every 30 minutes.",
  sleep:        "🌙 Your sleep needs attention. Try winding down 30 minutes earlier tonight—dim lights and skip screens before bed.",
  activity:     "🏃 Movement booosts mood and energy. Even a 10‑minute walk counts—try breaking it into shorter sessions.",
  meals:        "🥗 Nourishing meals fuel your day. Try prepping simple, balanced options the night before.",
  screenBreaks: "👁 Give your eyes regular rest. Try the 20‑20‑20 rule: every 20 min, look 20 feet away for 20 seconds.",
  stressRelief: "🧘 Your stress relief scores are low. Even 2 minutes of deep breathing can reset your nervous system.",
};

function generateTip(weakestHabit) {
  return TIPS[weakestHabit] || "Keep showing up—every small step is progress toward a healthier you. 🌿";
}

/* ── Demo Data ── */
function generateDemoData() {
  const logs = {};
  for (let i = 1; i <= 14; i++) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const k = dateKey(d);
    const rand = (min, max) => Math.round(min + Math.random() * (max - min));
    logs[k] = {
      hydration:    rand(5, 10),
      sleep:        parseFloat((rand(55, 90)/10).toFixed(1)),
      activity:     rand(15, 60),
      meals:        rand(2, 4),
      screenBreaks: rand(1, 5),
      stressRelief: rand(1, 3),
    };
  }
  return logs;
}

/* ── Public API ── */
const Store = {
  HABIT_META,
  WEIGHTS,
  DEFAULT_TARGETS,

  // Targets
  getTargets: () => ({ ..._targets }),
  setTargets: (t) => { _targets = { ...DEFAULT_TARGETS, ...t }; ls.set(KEYS.targets, _targets); },

  // Logs
  getLogs: () => ({ ..._logs }),
  getLog: (key) => _logs[key] ? { ..._logs[key] } : null,
  getTodayLog: () => _logs[todayKey()] ? { ..._logs[todayKey()] } : null,
  setLog: (key, data) => { _logs[key] = { ..._logs[key], ...data }; ls.set(KEYS.logs, _logs); },
  setTodayLog: (data) => Store.setLog(todayKey(), data),

  // Prefs
  getPrefs: () => ({ ..._prefs }),
  setPref: (k, v) => { _prefs[k] = v; ls.set(KEYS.prefs, _prefs); },

  // Onboarding
  isOnboarded: () => _onboarded,
  setOnboarded: (v) => { _onboarded = v; ls.set(KEYS.onboarded, v); },

  // Score
  calcScore,
  dayState,
  todayKey,
  dateKey,
  last7Days,
  last30Days,
  friendlyDate,
  generateTip,

  // Weekly stats
  getWeeklyStats() {
    const days = last7Days();
    const scores = days.map(k => ({ key: k, log: _logs[k], score: calcScore(_logs[k]) }));
    const avg = Math.round(scores.reduce((s,d)=>s+d.score,0) / 7);

    // Per-habit averages
    const habitAvgs = {};
    for (const h of Object.keys(WEIGHTS)) {
      const vals = days.map(k => {
        const log = _logs[k];
        if (!log) return 0;
        return Math.min((log[h]??0) / _targets[h], 1) * 100;
      });
      habitAvgs[h] = Math.round(vals.reduce((a,b)=>a+b,0)/7);
    }

    const sorted = Object.entries(habitAvgs).sort((a,b)=>b[1]-a[1]);
    const strongest = sorted[0][0];
    const weakest   = sorted[sorted.length-1][0];

    return { days: scores, avg, habitAvgs, strongest, weakest, tip: generateTip(weakest) };
  },

  // Demo mode
  enableDemo() {
    _prefs.demoMode = true;
    ls.set(KEYS.prefs, _prefs);
    const demo = generateDemoData();
    _logs = { ..._logs, ...demo };
    ls.set(KEYS.logs, _logs);
  },

  disableDemo() {
    _prefs.demoMode = false;
    ls.set(KEYS.prefs, _prefs);
    // Remove demo keys (last 14 days that aren't today)
    const today = todayKey();
    for (let i = 1; i <= 14; i++) {
      const d = new Date(); d.setDate(d.getDate()-i);
      const k = dateKey(d);
      if (k !== today) delete _logs[k];
    }
    ls.set(KEYS.logs, _logs);
  },

  resetAll() {
    _targets   = { ...DEFAULT_TARGETS };
    _logs      = {};
    _prefs     = { ...DEFAULT_PREFS };
    _onboarded = false;
    localStorage.removeItem(KEYS.targets);
    localStorage.removeItem(KEYS.logs);
    localStorage.removeItem(KEYS.prefs);
    localStorage.removeItem(KEYS.onboarded);
  },
};

window.Store = Store;
