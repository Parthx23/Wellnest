'use strict';

/* ─────────────────────────────────────────────────────────────────────────────
   OrbitUI — Single-Gesture Orbit Dial
   • Drag the glowing bubble clockwise to log progress, counter-clockwise to undo
   • Delta-based knob: grab anywhere on the SVG, turn like a physical dial
   • Arc fills towards the goal marker (12 o'clock) as you log more
   • Reaching the goal triggers a satisfying snap + glow animation
   • Target interaction time: < 5 seconds per habit
───────────────────────────────────────────────────────────────────────────── */

const OrbitUI = {
  R: 31,   /* arc radius */
  SZ: 88,  /* SVG viewBox size */

  _listeners: [],

  /* ─── public API ─────────────────────────────── */

  init() {
    this._injectStyles();
    this.cleanup();
    this._listeners = [];
    document.querySelectorAll('.orbit-dial-wrap').forEach(w => {
      this._renderDial(w);
      this._bindDrag(w);
    });
  },

  cleanup() {
    this._listeners.forEach(({ mm, mu, tm, tu }) => {
      document.removeEventListener('mousemove', mm);
      document.removeEventListener('mouseup',   mu);
      document.removeEventListener('touchmove', tm);
      document.removeEventListener('touchend',  tu);
    });
    this._listeners = [];
  },

  /* ─── render ──────────────────────────────────── */

  _renderDial(wrap) {
    const key    = wrap.dataset.key;
    const actual = parseFloat(wrap.dataset.actual);
    const target = parseFloat(wrap.dataset.target);
    const color  = wrap.dataset.color;
    const C      = this.SZ / 2;
    const { arc, bx, by } = this._geom(actual, target);
    const dv  = this._fmt(key, actual);
    const dt  = this._fmt(key, target);
    const unit = (Store.HABIT_META[key] || {}).unit || '';

    wrap.innerHTML = `
<svg viewBox="0 0 ${this.SZ} ${this.SZ}" class="orbit-svg" id="osvg-${key}">
  <defs>
    <filter id="og-${key}" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="2.8" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>

  <!-- track -->
  <circle cx="${C}" cy="${C}" r="${this.R}"
    fill="none" stroke="rgba(0,0,0,0.08)" stroke-width="5.5" stroke-linecap="round"/>

  <!-- goal marker at 12 o'clock -->
  <circle cx="${C}" cy="${C - this.R}" r="5.5"
    fill="${color}" opacity="0.18" class="orbit-goal-glow" id="og2-${key}"/>
  <circle cx="${C}" cy="${C - this.R}" r="2.8"
    fill="${color}" opacity="0.7"/>

  <!-- progress arc (clockwise from 12 o'clock) -->
  <circle cx="${C}" cy="${C}" r="${this.R}"
    fill="none" stroke="${color}" stroke-width="5.5" stroke-linecap="round"
    stroke-dasharray="${arc}"
    transform="rotate(-90,${C},${C})"
    class="orbit-arc" id="oarc-${key}"/>

  <!-- center value -->
  <text x="${C}" y="${C - 4}" text-anchor="middle" dominant-baseline="middle"
    class="orbit-val" fill="${color}" id="oval-${key}">${dv}</text>
  <text x="${C}" y="${C + 12}" text-anchor="middle"
    class="orbit-sub" id="osub-${key}">/${dt} ${unit}</text>

  <!-- draggable bubble -->
  <circle cx="${bx}" cy="${by}" r="8.5"
    fill="${color}" filter="url(#og-${key})"
    class="orbit-bubble" id="ob-${key}"/>
</svg>
<div class="orbit-hint">drag to adjust</div>`;

    if (actual >= target) this._flashGoal(key, color);
  },

  /* ─── drag (delta-knob mechanic) ─────────────── */

  _bindDrag(wrap) {
    const svg = wrap.querySelector('.orbit-svg');
    if (!svg) return;

    const key  = wrap.dataset.key;
    const C    = this.SZ / 2;
    let dragging = false, startA = 0, startV = 0;

    const rawAngle = (cx, cy) => {
      const r = svg.getBoundingClientRect();
      const sx = (cx - r.left)  * (this.SZ / r.width);
      const sy = (cy - r.top)   * (this.SZ / r.height);
      return Math.atan2(sy - C, sx - C);
    };

    const onStart = e => {
      dragging = true;
      const p = e.touches ? e.touches[0] : e;
      startA = rawAngle(p.clientX, p.clientY);
      startV = parseFloat(wrap.dataset.actual);
      svg.style.cursor = 'grabbing';
      e.preventDefault();
    };

    const mm = e => {
      if (!dragging) return;
      const p = e.touches ? e.touches[0] : e;
      const tgt  = parseFloat(wrap.dataset.target);
      const step = parseFloat(wrap.dataset.step);

      let delta = rawAngle(p.clientX, p.clientY) - startA;
      if (delta >  Math.PI) delta -= 2 * Math.PI;
      if (delta < -Math.PI) delta += 2 * Math.PI;

      let nv = Math.max(0, Math.min(tgt, startV + (delta / (2 * Math.PI)) * tgt));
      nv = Math.round(nv / step) * step;

      wrap.dataset.actual = nv;
      this._updateDial(wrap, nv);

      const log = Store.getTodayLog() || {};
      log[key] = nv;
      Store.setTodayLog(log);
      if (window.patchDashboard) patchDashboard(key);
      e.preventDefault();
    };

    const mu = () => {
      if (!dragging) return;
      dragging = false;
      svg.style.cursor = 'grab';
      const a = parseFloat(wrap.dataset.actual);
      const t = parseFloat(wrap.dataset.target);
      if (a >= t) this._flashGoal(key, wrap.dataset.color);
    };

    const tm = e => mm(e);
    const tu = ()  => mu();

    svg.addEventListener('mousedown',  onStart);
    svg.addEventListener('touchstart', onStart, { passive: false });
    document.addEventListener('mousemove',  mm);
    document.addEventListener('mouseup',    mu);
    document.addEventListener('touchmove',  tm, { passive: false });
    document.addEventListener('touchend',   tu);

    this._listeners.push({ mm, mu, tm, tu });
  },

  /* ─── lightweight DOM update ─────────────────── */

  _updateDial(wrap, actual) {
    const key    = wrap.dataset.key;
    const target = parseFloat(wrap.dataset.target);
    const { arc, bx, by } = this._geom(actual, target);

    const el = id => document.getElementById(id);
    const a = el(`oarc-${key}`); if (a) a.setAttribute('stroke-dasharray', arc);
    const b = el(`ob-${key}`);
    if (b) { b.setAttribute('cx', bx); b.setAttribute('cy', by); }
    const v = el(`oval-${key}`); if (v) v.textContent = this._fmt(key, actual);
  },

  /* ─── goal flash ──────────────────────────────── */

  _flashGoal(key, color) {
    const b = document.getElementById(`ob-${key}`);
    const g = document.getElementById(`og2-${key}`);
    if (b) { b.style.animation = 'none'; void b.offsetWidth; b.style.animation = 'orbitSnap .55s ease'; }
    if (g) { g.style.opacity = '0.85'; g.style.animation = 'none'; void g.offsetWidth; g.style.animation = 'orbitGoalPulse .7s ease forwards'; }
    if (window.VoiceSystem) {
      VoiceSystem.speak('Goal reached! Great job!');
    }
  },

  /* ─── geometry helpers ────────────────────────── */

  _geom(actual, target) {
    const C    = this.SZ / 2;
    const circ = 2 * Math.PI * this.R;
    const pct  = Math.min(actual / Math.max(target, 0.001), 1);
    const arcL = pct * circ;
    const arc  = `${arcL} ${circ - arcL}`;
    const ang  = pct * 2 * Math.PI - Math.PI / 2;   // clockwise from top
    const bx   = C + this.R * Math.cos(ang);
    const by   = C + this.R * Math.sin(ang);
    return { arc, bx, by };
  },

  _fmt(key, val) {
    if (key === 'sleep') return parseFloat(val).toFixed(1);
    return String(Math.round(val));
  },

  /* ─── styles ──────────────────────────────────── */

  _injectStyles() {
    if (document.getElementById('orbit-styles')) return;
    const s = document.createElement('style');
    s.id = 'orbit-styles';
    s.textContent = `
      /* ── Orbit card layout ── */
      .orbit-card-body {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;
      }
      .orbit-dial-wrap {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 2px;
        padding: 2px 0 0;
      }
      .orbit-svg {
        width: 86px;
        height: 86px;
        overflow: visible;
        display: block;
        cursor: grab;
      }
      .orbit-arc {
        transition: stroke-dasharray 0.08s linear;
      }

      /* Center text */
      .orbit-val {
        font-size: 17px;
        font-weight: 800;
        font-family: var(--font);
      }
      .orbit-sub {
        font-size: 9px;
        font-weight: 600;
        fill: var(--on-surface-variant);
        font-family: var(--font);
      }

      /* Draggable bubble */
      .orbit-bubble {
        transition: cx 0.06s linear, cy 0.06s linear;
        cursor: grab;
      }

      /* Hint label */
      .orbit-hint {
        font-size: 8.5px;
        font-weight: 700;
        letter-spacing: 0.4px;
        text-transform: uppercase;
        color: var(--on-surface-variant);
        opacity: 0.35;
        font-family: var(--font);
      }

      /* ── Animations ── */
      @keyframes orbitSnap {
        0%   { r: 8.5; }
        35%  { r: 13;  }
        65%  { r: 7;   }
        100% { r: 8.5; }
      }
      @keyframes orbitGoalPulse {
        0%   { r: 5.5;  opacity: 0.18; }
        50%  { r: 11;   opacity: 0.75; }
        100% { r: 5.5;  opacity: 0.85; }
      }

      /* ── Habit card adjusted for orbit ── */
      .habit-card {
        align-items: center;
      }
      .habit-card-top {
        width: 100%;
        justify-content: space-between;
      }
    `;
    document.head.appendChild(s);
  },
};

window.OrbitUI = OrbitUI;
