'use strict';

/* ─────────────────────────────────────────────────────────────────────────────
   WellNest Plant System
   • 6 growth stages driven by Wellness Score
   • Per-habit atmospheric effects (sun, water, sparkles, moon, petals)
   • Gentle CSS animations (sway, water rise, petal fall, sparkle pulse)
   • Daily reset — score resets with new day → plant regrows from seed
   • Real-time updates on every habit change
───────────────────────────────────────────────────────────────────────────── */

const PlantSystem = {

  /* ── Stage definitions ── */
  STAGES: [
    { label: 'Resting…',         emoji: '🌱', suggestion: 'Log your first habit to sprout your plant!' },
    { label: 'Sprouting',        emoji: '🌿', suggestion: 'Great start! A few more habits will grow new leaves.' },
    { label: 'Growing',          emoji: '🍃', suggestion: 'Your plant is growing! Pass 50 to see it thrive.' },
    { label: 'Thriving',         emoji: '🌳', suggestion: 'Looking lush! Push past 70 before buds appear.' },
    { label: 'Almost in bloom',  emoji: '🌸', suggestion: 'So close to full bloom — keep those habits going!' },
    { label: 'In full bloom! 🌺', emoji: '🌺', suggestion: 'Perfect wellness day. Your plant is absolutely thriving!' },
  ],

  _lastDateKey: null,
  _resetTimer:  null,

  /* ── Map score → stage (0–5) ── */
  getStage(score) {
    if (score === 0)  return 0;
    if (score <= 20)  return 1;
    if (score <= 45)  return 2;
    if (score <= 70)  return 3;
    if (score <= 95)  return 4;
    return 5;
  },

  /* ═══════════════════════════════════════════════════════
     SVG BUILDER — returns a full inline SVG string
     viewBox 0 0 200 320, designed for 180×288 display
  ═══════════════════════════════════════════════════════ */
  buildSVG() {
    return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 320"
     class="wn-plant-svg" aria-hidden="true" role="img">
  <defs>
    <!-- Pot gradient -->
    <linearGradient id="pot-g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%"   stop-color="#d4845a"/>
      <stop offset="100%" stop-color="#8b4513"/>
    </linearGradient>
    <!-- Soil gradient -->
    <radialGradient id="soil-g" cx="50%" cy="40%" r="60%">
      <stop offset="0%"   stop-color="#6b4226"/>
      <stop offset="100%" stop-color="#3e2010"/>
    </radialGradient>
    <!-- Leaf green gradient -->
    <linearGradient id="leaf-g1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%"   stop-color="#81c784"/>
      <stop offset="100%" stop-color="#388e3c"/>
    </linearGradient>
    <linearGradient id="leaf-g2" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%"   stop-color="#66bb6a"/>
      <stop offset="100%" stop-color="#2e7d32"/>
    </linearGradient>
    <linearGradient id="leaf-g3" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%"   stop-color="#4caf50"/>
      <stop offset="100%" stop-color="#1b5e20"/>
    </linearGradient>
    <!-- Drop shadow -->
    <filter id="leaf-sh" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="1" dy="2" stdDeviation="2" flood-color="#1b5e20" flood-opacity="0.18"/>
    </filter>
    <filter id="glow-f" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="3" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>

  <!-- ── Atmosphere (sun, moon, stars) ── -->
  <g id="pl-atm" style="opacity:0;transition:opacity 1s">
    <!-- Sun -->
    <circle id="pl-sun" cx="168" cy="34" r="19" fill="#ffd54f" opacity="0.55" filter="url(#glow-f)"/>
    <g id="pl-rays" opacity="0.45" stroke="#ffe082" stroke-width="2" stroke-linecap="round">
      <line x1="168" y1="9"  x2="168" y2="3"/>
      <line x1="186" y1="16" x2="191" y2="11"/>
      <line x1="193" y1="34" x2="199" y2="34"/>
      <line x1="186" y1="52" x2="191" y2="57"/>
      <line x1="168" y1="59" x2="168" y2="65"/>
      <line x1="150" y1="52" x2="145" y2="57"/>
      <line x1="143" y1="34" x2="137" y2="34"/>
      <line x1="150" y1="16" x2="145" y2="11"/>
    </g>
    <!-- Moon (shows at high sleep) -->
    <path id="pl-moon" d="M 28 28 Q 16 22 18 34 Q 20 48 32 44 Q 20 36 28 28"
          fill="#b0c4de" opacity="0" style="transition:opacity 1s"/>
    <!-- Stars -->
    <g id="pl-stars" opacity="0" style="transition:opacity 1s">
      <circle cx="14" cy="14" r="1.5" fill="#e8eaf6" opacity="0.9"/>
      <circle cx="48" cy="7"  r="1"   fill="#e8eaf6" opacity="0.7"/>
      <circle cx="36" cy="20" r="1.5" fill="#e8eaf6" opacity="0.8"/>
      <circle cx="72" cy="11" r="1"   fill="#e8eaf6" opacity="0.6"/>
      <circle cx="58" cy="25" r="1"   fill="#e8eaf6" opacity="0.5"/>
    </g>
  </g>

  <!-- ── Pot & Soil (always visible) ── -->
  <g id="pl-pot">
    <!-- Pot body -->
    <path d="M 57 265 L 43 308 L 157 308 L 143 265 Z" fill="url(#pot-g)" rx="4"/>
    <!-- Pot rim -->
    <rect x="46" y="257" width="108" height="13" rx="6.5" fill="#c4703d"/>
    <!-- Rim highlight -->
    <rect x="54" y="260" width="28" height="3.5" rx="1.75" fill="#e08a5a" opacity="0.55"/>
    <!-- Drainage hole hint -->
    <ellipse cx="100" cy="305" rx="9" ry="3" fill="#7a3a16" opacity="0.35"/>
    <!-- Soil -->
    <ellipse cx="100" cy="263" rx="49" ry="10" fill="url(#soil-g)"/>
    <ellipse cx="88"  cy="262" rx="13" ry="3.5" fill="#3e2010" opacity="0.35"/>
    <ellipse cx="113" cy="264" rx="8"  ry="2.5" fill="#3e2010" opacity="0.25"/>
  </g>

  <!-- ── Stage 0: Seed (only when score = 0) ── -->
  <g id="pl-s0" style="transition:opacity 0.8s">
    <ellipse cx="100" cy="259" rx="6" ry="4.5" fill="#5c3d1e"/>
    <ellipse cx="100" cy="257" rx="3" ry="2" fill="#7a5535" opacity="0.6"/>
  </g>

  <!-- ── Stage 1: First sprout ── -->
  <g id="pl-s1" style="opacity:0;transition:opacity 1s;transform-origin:100px 265px"
     class="pl-sway">
    <path d="M 100 261 Q 101 244 99 230" stroke="#66bb6a" stroke-width="3"
          fill="none" stroke-linecap="round"/>
    <!-- Left cotyledon -->
    <path d="M 99 234 C 92 226 78 224 76 232 C 74 239 87 243 99 237"
          fill="url(#leaf-g1)" filter="url(#leaf-sh)"/>
    <!-- Right cotyledon -->
    <path d="M 100 234 C 107 226 121 224 123 232 C 125 239 112 243 100 237"
          fill="url(#leaf-g1)" filter="url(#leaf-sh)"/>
  </g>

  <!-- ── Stage 2: Growing stem + first real leaves ── -->
  <g id="pl-s2" style="opacity:0;transition:opacity 1s;transform-origin:100px 265px"
     class="pl-sway">
    <path d="M 99 230 Q 96 210 102 194" stroke="#4caf50" stroke-width="3.2"
          fill="none" stroke-linecap="round"/>
    <!-- Left leaf -->
    <path d="M 101 213 C 88 202 68 198 63 210 C 59 221 76 229 101 220"
          fill="url(#leaf-g2)" filter="url(#leaf-sh)"/>
    <path d="M 101 213 Q 82 215 63 210" stroke="#388e3c" stroke-width="0.9"
          fill="none" opacity="0.5"/>
    <!-- Right leaf -->
    <path d="M 101 210 C 114 200 134 196 139 207 C 143 218 126 226 101 217"
          fill="url(#leaf-g2)" filter="url(#leaf-sh)"/>
    <path d="M 101 210 Q 120 212 139 207" stroke="#388e3c" stroke-width="0.9"
          fill="none" opacity="0.5"/>
    <!-- Tip bud -->
    <ellipse cx="102" cy="193" rx="4" ry="6" fill="#a5d6a7"/>
  </g>

  <!-- ── Stage 3: Taller + second leaf pair ── -->
  <g id="pl-s3" style="opacity:0;transition:opacity 1s;transform-origin:100px 265px"
     class="pl-sway">
    <path d="M 102 194 Q 98 172 105 155" stroke="#388e3c" stroke-width="3.5"
          fill="none" stroke-linecap="round"/>
    <!-- Left leaf 2 – large with midrib -->
    <path d="M 103 174 C 86 158 60 153 54 169 C 49 183 70 192 103 181"
          fill="url(#leaf-g2)" filter="url(#leaf-sh)"/>
    <path d="M 103 174 Q 78 175 54 169" stroke="#2e7d32" stroke-width="0.8"
          fill="none" opacity="0.45"/>
    <!-- Leaf veins left -->
    <path d="M 80 167 Q 72 171 66 174" stroke="#2e7d32" stroke-width="0.6"
          fill="none" opacity="0.35"/>
    <!-- Right leaf 2 – large -->
    <path d="M 103 172 C 120 156 146 151 152 167 C 157 181 136 190 103 179"
          fill="url(#leaf-g2)" filter="url(#leaf-sh)"/>
    <path d="M 103 172 Q 128 173 152 167" stroke="#2e7d32" stroke-width="0.8"
          fill="none" opacity="0.45"/>
    <!-- Top growing bud -->
    <path d="M 105 157 C 100 148 106 142 111 147 C 114 151 112 158 105 161"
          fill="#a5d6a7"/>
  </g>

  <!-- ── Stage 4: Full plant + flower buds ── -->
  <g id="pl-s4" style="opacity:0;transition:opacity 1s;transform-origin:100px 265px"
     class="pl-sway">
    <path d="M 105 155 Q 101 133 108 118" stroke="#2e7d32" stroke-width="4"
          fill="none" stroke-linecap="round"/>
    <!-- Left leaf 3 – widest -->
    <path d="M 104 138 C 83 120 52 114 45 133 C 39 149 62 160 104 148"
          fill="url(#leaf-g3)" filter="url(#leaf-sh)"/>
    <!-- Leaf notches (monstera style) -->
    <path d="M 73 132 Q 68 125 71 120" stroke="#f5f4ed" stroke-width="4"
          stroke-linecap="round" fill="none"/>
    <path d="M 58 139 Q 53 133 55 128" stroke="#f5f4ed" stroke-width="3.5"
          stroke-linecap="round" fill="none"/>
    <path d="M 104 138 Q 78 140 45 133" stroke="#1b5e20" stroke-width="0.8"
          fill="none" opacity="0.4"/>
    <!-- Right leaf 3 -->
    <path d="M 106 136 C 127 118 158 112 165 131 C 171 147 148 158 106 146"
          fill="url(#leaf-g3)" filter="url(#leaf-sh)"/>
    <path d="M 127 130 Q 132 123 129 118" stroke="#f5f4ed" stroke-width="4"
          stroke-linecap="round" fill="none"/>
    <path d="M 143 137 Q 148 131 146 126" stroke="#f5f4ed" stroke-width="3.5"
          stroke-linecap="round" fill="none"/>
    <!-- Flower buds -->
    <g transform="translate(66 108)">
      <path d="M 0 2 C -5 -5 -3 -14 0 -16 C 3 -14 5 -5 0 2" fill="#f48fb1"/>
      <path d="M -1 2 C -8 -4 -8 -12 -4 -15 C -1 -16 1 -14 0 2" fill="#f06292" opacity="0.75"/>
      <path d="M 1 2 C 8 -4 8 -12 4 -15 C 1 -16 -1 -14 0 2" fill="#f06292" opacity="0.75"/>
      <circle cx="0" cy="-5" r="3.5" fill="#fff176"/>
    </g>
    <g transform="translate(136 106)">
      <path d="M 0 2 C -5 -5 -3 -14 0 -16 C 3 -14 5 -5 0 2" fill="#f48fb1"/>
      <path d="M -1 2 C -8 -4 -8 -12 -4 -15 C -1 -16 1 -14 0 2" fill="#f06292" opacity="0.75"/>
      <path d="M 1 2 C 8 -4 8 -12 4 -15 C 1 -16 -1 -14 0 2" fill="#f06292" opacity="0.75"/>
      <circle cx="0" cy="-5" r="3.5" fill="#fff176"/>
    </g>
  </g>

  <!-- ── Stage 5: Full bloom 🌺 ── -->
  <g id="pl-s5" style="opacity:0;transition:opacity 1.2s;transform-origin:100px 265px"
     class="pl-sway">
    <path d="M 108 118 Q 104 100 106 86" stroke="#1b5e20" stroke-width="4.5"
          fill="none" stroke-linecap="round"/>
    <!-- Crown leaves -->
    <path d="M 106 98 C 90 80 65 75 58 90 C 52 103 72 112 106 101"
          fill="url(#leaf-g3)" filter="url(#leaf-sh)"/>
    <path d="M 107 96 C 122 78 147 73 154 88 C 160 101 140 110 107 99"
          fill="url(#leaf-g3)" filter="url(#leaf-sh)"/>
    <!-- Full flower 1 – left -->
    <g id="fl-1" transform="translate(72 78)" style="animation:flowerBob 3s ease-in-out infinite">
      <circle cx="0" cy="0" r="11" fill="#f48fb1" opacity="0.92"/>
      <circle cx="0" cy="-9"  r="5.5" fill="#e91e63" opacity="0.85"/>
      <circle cx="7.8" cy="4.5"  r="5.5" fill="#e91e63" opacity="0.85"/>
      <circle cx="-7.8" cy="4.5" r="5.5" fill="#e91e63" opacity="0.85"/>
      <circle cx="0" cy="0" r="5.5" fill="#fff9c4"/>
      <circle cx="0" cy="0" r="2.5" fill="#ff8f00"/>
    </g>
    <!-- Full flower 2 – right -->
    <g id="fl-2" transform="translate(134 76)" style="animation:flowerBob 3s ease-in-out infinite 0.4s">
      <circle cx="0" cy="0" r="11" fill="#f48fb1" opacity="0.92"/>
      <circle cx="0" cy="-9"  r="5.5" fill="#e91e63" opacity="0.85"/>
      <circle cx="7.8" cy="4.5"  r="5.5" fill="#e91e63" opacity="0.85"/>
      <circle cx="-7.8" cy="4.5" r="5.5" fill="#e91e63" opacity="0.85"/>
      <circle cx="0" cy="0" r="5.5" fill="#fff9c4"/>
      <circle cx="0" cy="0" r="2.5" fill="#ff8f00"/>
    </g>
    <!-- Crown flower – center -->
    <g id="fl-c" transform="translate(106 70)" style="animation:flowerBob 3.5s ease-in-out infinite 0.2s">
      <circle cx="0" cy="0" r="14" fill="#e91e63" opacity="0.9" filter="url(#glow-f)"/>
      <circle cx="0"   cy="-12" r="6.5" fill="#f48fb1"/>
      <circle cx="10.4" cy="6"  r="6.5" fill="#f48fb1"/>
      <circle cx="-10.4" cy="6" r="6.5" fill="#f48fb1"/>
      <circle cx="0" cy="0" r="7"   fill="#fff176"/>
      <circle cx="0" cy="0" r="3.5" fill="#ff8f00"/>
    </g>
  </g>

  <!-- ── Habit FX: Water drops (hydration) ── -->
  <g id="pl-water" style="opacity:0;transition:opacity 0.8s">
    <g class="wdrop" style="animation:wRise 2.2s ease-out infinite 0s">
      <path d="M 82 272 C 80 267 77 262 80 258 C 83 254 87 257 85 262 C 83 267 82 272 82 272"
            fill="#4fc3f7" opacity="0.8"/>
    </g>
    <g class="wdrop" style="animation:wRise 2.2s ease-out infinite 0.75s">
      <path d="M 116 274 C 114 269 111 264 114 260 C 117 256 121 259 119 264 C 117 269 116 274 116 274"
            fill="#29b6f6" opacity="0.7"/>
    </g>
    <g class="wdrop" style="animation:wRise 2.2s ease-out infinite 1.5s">
      <path d="M 99 270 C 97 265 94 260 97 256 C 100 252 104 255 102 260 C 100 265 99 270 99 270"
            fill="#4fc3f7" opacity="0.6"/>
    </g>
  </g>

  <!-- ── Habit FX: Sparkles (screenBreaks) ── -->
  <g id="pl-sparks" style="opacity:0;transition:opacity 0.8s">
    <g style="animation:spkl 1.6s ease-in-out infinite 0s">
      <path d="M 38 148 L 40 141 L 42 148 L 40 155 Z" fill="#fff176"/>
      <path d="M 33 148 L 40 145 L 47 148 L 40 151 Z" fill="#fff176"/>
    </g>
    <g style="animation:spkl 1.6s ease-in-out infinite 0.55s">
      <path d="M 162 165 L 164 158 L 166 165 L 164 172 Z" fill="#b2dfdb"/>
      <path d="M 157 165 L 164 162 L 171 165 L 164 168 Z" fill="#b2dfdb"/>
    </g>
    <g style="animation:spkl 1.6s ease-in-out infinite 1.1s">
      <path d="M 22 205 L 24 198 L 26 205 L 24 212 Z" fill="#c8e6c9"/>
      <path d="M 17 205 L 24 202 L 31 205 L 24 208 Z" fill="#c8e6c9"/>
    </g>
  </g>

  <!-- ── Habit FX: Petals (stressRelief) ── -->
  <g id="pl-petals" style="opacity:0;transition:opacity 0.8s">
    <g style="animation:pFall 3.5s ease-in infinite 0s">
      <ellipse cx="158" cy="96"  rx="7" ry="3" fill="#f48fb1" opacity="0.75" transform="rotate(-30 158 96)"/>
    </g>
    <g style="animation:pFall 3.5s ease-in infinite 1.15s">
      <ellipse cx="42"  cy="128" rx="6" ry="2.5" fill="#f8bbd0" opacity="0.65" transform="rotate(20 42 128)"/>
    </g>
    <g style="animation:pFall 3.5s ease-in infinite 2.3s">
      <ellipse cx="172" cy="182" rx="5" ry="2" fill="#f48fb1" opacity="0.55" transform="rotate(-50 172 182)"/>
    </g>
    <g style="animation:pFall 3.5s ease-in infinite 0.6s">
      <ellipse cx="28"  cy="160" rx="5" ry="2" fill="#fce4ec" opacity="0.6" transform="rotate(35 28 160)"/>
    </g>
  </g>

  <!-- ── Soil moisture indicator (hydration low → cracked) ── -->
  <g id="pl-cracks" style="opacity:0;transition:opacity 1s">
    <path d="M 88 260 L 86 264 L 90 267 L 87 271" stroke="#2d1608" stroke-width="0.8"
          fill="none" opacity="0.4"/>
    <path d="M 108 261 L 111 265 L 109 269" stroke="#2d1608" stroke-width="0.8"
          fill="none" opacity="0.35"/>
  </g>

</svg>`;
  },

  /* ═══════════════════════════════════════════════════════
     INJECT — write the plant into #plant-bg-wrap (bg only)
  ═══════════════════════════════════════════════════════ */
  inject() {
    /* Clean up any previous parallax scroll listener */
    if (this._parallaxCleanup) { this._parallaxCleanup(); this._parallaxCleanup = null; }

    const wrap = document.getElementById('plant-bg-wrap');
    if (!wrap) return;
    wrap.innerHTML = this.buildSVG();
    this._ensureStyles();
    this.update();

    /* Set up parallax after layout is ready */
    requestAnimationFrame(() => this._setupParallax());
  },

  /* ═══════════════════════════════════════════════════════
     UPDATE — sync all SVG elements to current data
  ═══════════════════════════════════════════════════════ */
  update() {
    const svgs = document.querySelectorAll('.wn-plant-svg');
    if (!svgs.length) return;

    const todayLog = Store.getTodayLog() || {};
    const targets  = Store.getTargets();
    const score    = Store.calcScore(todayLog, targets);
    const stage    = this.getStage(score);

    /* Habit completion ratios 0→1 */
    const R = {};
    for (const h of Object.keys(Store.HABIT_META)) {
      R[h] = targets[h] > 0 ? Math.min((todayLog[h] || 0) / targets[h], 1) : 0;
    }

    svgs.forEach(svg => {
      /* ── Growth stages (cumulative show) ── */
      const s0 = svg.querySelector('#pl-s0');
      if (s0) s0.style.opacity = stage === 0 ? '1' : '0';

      for (let s = 1; s <= 5; s++) {
        const el = svg.querySelector(`#pl-s${s}`);
        if (el) el.style.opacity = stage >= s ? '1' : '0';
      }

      /* ── Atmosphere ── */
      const atm = svg.querySelector('#pl-atm');
      if (atm) atm.style.opacity = stage === 0 ? '0' : String(Math.min(0.2 + stage * 0.16, 1));

      /* ── Sun ── */
      const sun  = svg.querySelector('#pl-sun');
      const rays = svg.querySelector('#pl-rays');
      if (sun)  sun.setAttribute('opacity',  String((0.3 + R.activity * 0.7).toFixed(2)));
      if (rays) rays.setAttribute('opacity', String((0.2 + R.activity * 0.6).toFixed(2)));

      /* ── Moon ── */
      const moon = svg.querySelector('#pl-moon');
      if (moon) moon.style.opacity = R.sleep > 0.6 ? String(((R.sleep - 0.6) / 0.4).toFixed(2)) : '0';

      /* ── Stars ── */
      const stars = svg.querySelector('#pl-stars');
      if (stars) stars.style.opacity = R.sleep > 0.7 ? String(((R.sleep - 0.7) / 0.3).toFixed(2)) : '0';

      /* ── Water drops ── */
      const water = svg.querySelector('#pl-water');
      if (water) water.style.opacity = R.hydration > 0 ? String(Math.min(R.hydration, 1).toFixed(2)) : '0';

      /* ── Soil cracks ── */
      const cracks = svg.querySelector('#pl-cracks');
      if (cracks) cracks.style.opacity = (stage > 0 && R.hydration < 0.3) ? String((0.3 - R.hydration).toFixed(2)) : '0';

      /* ── Sparkles ── */
      const sparks = svg.querySelector('#pl-sparks');
      if (sparks) sparks.style.opacity = R.screenBreaks > 0
        ? String(Math.min(R.screenBreaks * 0.85, 0.95).toFixed(2)) : '0';

      /* ── Petals ── */
      const petals = svg.querySelector('#pl-petals');
      if (petals) petals.style.opacity = R.stressRelief > 0
        ? String(Math.min(R.stressRelief, 1).toFixed(2)) : '0';
    });

    /* ── Update UI status bar (once) ── */
    this._updateStatusBar(stage, score);
  },

  /* ── Update the tiny stage pill in the greeting area ── */
  _updateStatusBar(stage, score) {
    const info   = this.STAGES[stage];
    const pill   = document.getElementById('pl-stage-label');
    if (pill) pill.textContent = `${info.emoji} ${info.label}`;

    /* drive CSS opacity via data-stage attribute */
    const wrap = document.getElementById('plant-bg-wrap');
    if (wrap) wrap.setAttribute('data-stage', String(stage));
  },

  /* ── Parallax scroll handler ──
     The plant (position:fixed) stays pinned to viewport.
     On scroll, we nudge the SVG upward at 28% of scroll speed
     so it appears to float in a deeper z-layer than the cards.
  ────────────────────────────────────── */
  _setupParallax() {
    /* The scroll container is .screen (the scrollable div) */
    const screen = document.querySelector('.screen-dashboard');
    const svg    = document.querySelector('#plant-bg-wrap .wn-plant-svg');
    if (!screen || !svg) return;

    let ticking = false;

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const scrollY    = screen.scrollTop;
        /* 0.28 = parallax depth factor: plant moves 28px per 100px scroll */
        const parallaxY  = -(scrollY * 0.28);
        svg.style.transform = `translateY(${parallaxY}px)`;
        ticking = false;
      });
    };

    screen.addEventListener('scroll', onScroll, { passive: true });

    /* Store cleanup so inject() can remove listener before re-creating */
    this._parallaxCleanup = () => screen.removeEventListener('scroll', onScroll);
  },

  /* ── Midnight daily-reset watcher ── */
  _watchDailyReset() {
    const todayKey = Store.todayKey();
    if (this._lastDateKey && this._lastDateKey !== todayKey) {
      /* New day — animate the wilting then re-inject with score 0 */
      const svg = document.querySelector('.wn-plant-svg');
      if (svg) {
        svg.style.transition = 'opacity 1.5s';
        svg.style.opacity = '0';
        setTimeout(() => {
          svg.style.opacity = '1';
          this.update();   /* score will now be 0 → seedling */
        }, 1600);
      }
    }
    this._lastDateKey = todayKey;
    this._resetTimer  = setTimeout(() => this._watchDailyReset(), 30_000); /* check every 30s */
  },

  /* ── CSS keyframes (injected once) ── */
  _ensureStyles() {
    if (document.getElementById('plant-keyframes')) return;
    const s = document.createElement('style');
    s.id = 'plant-keyframes';
    s.textContent = `
      /* ─ Sway ─ */
      @keyframes plSway {
        0%,100% { transform: rotate(-1.2deg); }
        50%      { transform: rotate( 1.2deg); }
      }
      /* ─ Water rise & fade ─ */
      @keyframes wRise {
        0%   { transform: translateY(0)    scale(1);   opacity: 0.8; }
        70%  { transform: translateY(-28px) scale(0.65); opacity: 0.35; }
        100% { transform: translateY(-42px) scale(0);   opacity: 0; }
      }
      /* ─ Sparkle pulse ─ */
      @keyframes spkl {
        0%,100% { opacity: 0;   transform: scale(0.4) rotate(0deg); }
        50%      { opacity: 0.9; transform: scale(1.3) rotate(45deg); }
      }
      /* ─ Petal fall ─ */
      @keyframes pFall {
        0%   { transform: translateY(0)    translateX(0)   rotate(0deg);   opacity: 0.82; }
        50%  { transform: translateY(65px)  translateX(-12px) rotate(-28deg); opacity: 0.45; }
        100% { transform: translateY(135px) translateX(-4px)  rotate(18deg);  opacity: 0; }
      }
      /* ─ Flower gentle bob ─ */
      @keyframes flowerBob {
        0%,100% { transform: translateY(0); }
        50%      { transform: translateY(-3px); }
      }
      /* ─ Sun size pulse ─ */
      @keyframes sunPulse {
        0%,100% { r:19; }
        50%      { r:21; }
      }

      /* Apply sway to each stage group */
      .wn-plant-svg .pl-sway {
        animation: plSway 5s ease-in-out infinite;
        transform-origin: 100px 265px;
      }
      #pl-s2.pl-sway { animation-duration: 5.5s; animation-delay: 0.3s; }
      #pl-s3.pl-sway { animation-duration: 6s;   animation-delay: 0.6s; }
      #pl-s4.pl-sway { animation-duration: 6.5s; animation-delay: 0.9s; }
      #pl-s5.pl-sway { animation-duration: 7s;   animation-delay: 1.2s; }

      #pl-sun { animation: sunPulse 3.5s ease-in-out infinite; }

      /* ══════════════════════════════════════════════════
         FIXED BACKGROUND PLANT + PARALLAX
      ══════════════════════════════════════════════════ */

      /* Fixed wrap: stays in-place as content scrolls */
      #plant-bg-wrap {
        position: fixed;
        bottom: 0;
        left: 50%;
        transform: translateX(-50%);
        width: min(430px, 100vw);
        height: 100dvh;
        pointer-events: none;
        z-index: 0;
        overflow: hidden;
        display: flex;
        align-items: flex-end;
        justify-content: center;
      }

      /* SVG inside: parallax nudge via JS transform */
      #plant-bg-wrap .wn-plant-svg {
        width: min(340px, 85%);
        height: auto;
        opacity: 0.28;
        display: block;
        flex-shrink: 0;
        margin-bottom: var(--bottom-nav-h, 72px);
        filter: saturate(1.3);
        /* opacity transition for stage changes;
           transform is set by JS with no CSS transition so parallax is instant */
        transition: opacity 1s ease;
        will-change: transform;
      }

      /* More vivid as plant grows */
      #plant-bg-wrap[data-stage="3"] .wn-plant-svg { opacity: 0.32; }
      #plant-bg-wrap[data-stage="4"] .wn-plant-svg { opacity: 0.36; }
      #plant-bg-wrap[data-stage="5"] .wn-plant-svg { opacity: 0.42; }

      /* Dashboard: no longer needs overflow:hidden (plant is fixed now) */
      .screen-dashboard {
        position: relative;
      }
      /* Content sits above the fixed plant */
      .screen-dashboard > *:not(#plant-bg-wrap) {
        position: relative;
        z-index: 1;
      }

      /* ── Tiny stage pill in the greeting ── */
      .plant-stage-pill {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        margin-top: 8px;
        font-size: 12px;
        font-weight: 700;
        color: var(--primary);
        background: color-mix(in srgb, var(--primary) 10%, transparent);
        padding: 4px 10px;
        border-radius: 20px;
        letter-spacing: 0.2px;
        border: 1px solid color-mix(in srgb, var(--primary) 20%, transparent);
        width: fit-content;
      }
    `;
    document.head.appendChild(s);
  },

  /* ── Init ── */
  init() {
    this._lastDateKey = Store.todayKey();
    this.inject();
    this._watchDailyReset();
  },
};

window.PlantSystem = PlantSystem;
