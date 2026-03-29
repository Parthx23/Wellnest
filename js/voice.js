'use strict';

/* ─────────────────────────────────────────────────────────────────────────────
   WellNest Voice Reminder System
   • Uses Web Speech API (SpeechSynthesis) — no external deps
   • Finds the single worst habit (below 60% of target) and speaks a reminder
   • If all habits are on track → speaks a positive encouragement
   • Tap mic button again while speaking → stops immediately
   • en-IN voice, rate 1, pitch 1
───────────────────────────────────────────────────────────────────────────── */

const VoiceSystem = {

  /* ── Per-habit reminder messages (exactly as provided) ── */
  MESSAGES: {
    hydration:   'Your water intake is low. Please drink some water.',
    sleep:       'Your sleep target is low today. Try to rest early tonight.',
    activity:    'Your physical activity is below target. A short walk would help.',
    meals:       'You are behind on healthy meals today. Try to eat something balanced.',
    screenBreaks:'You have missed your screen breaks. Please rest your eyes for a while.',
    stressRelief:'You have not done stress relief today. Take five minutes to relax.',
  },

  /* Habits below this completion ratio get flagged */
  THRESHOLD: 0.6,

  /* ── Support check ── */
  get isSupported()  { return 'speechSynthesis' in window; },
  get isSpeaking()   { return this.isSupported && window.speechSynthesis.speaking; },

  /* ──────────────────────────────────────────────────────
     CORE: speak a message
  ────────────────────────────────────────────────────── */
  speak(message) {
    if (!this.isSupported) return;

    const utterance    = new SpeechSynthesisUtterance(message);
    utterance.lang     = 'en-IN';
    utterance.rate     = 1;
    utterance.pitch    = 1;
    utterance.volume   = 1;

    utterance.onstart = () => this._setButtonState('speaking');
    utterance.onend   = () => this._setButtonState('idle');
    utterance.onerror = () => this._setButtonState('idle');

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  },

  /* ── Stop any ongoing speech ── */
  stop() {
    if (!this.isSupported) return;
    window.speechSynthesis.cancel();
    this._setButtonState('idle');
  },

  /* ──────────────────────────────────────────────────────
     LOGIC: find the worst under-performing habit
     Returns { habit, message } or null if all ≥ threshold
  ────────────────────────────────────────────────────── */
  getReminder(log, targets) {
    const ranked = Object.keys(this.MESSAGES)
      .map(habit => {
        const t = targets[habit] ?? 0;
        const ratio = t > 0 ? Math.min((log[habit] ?? 0) / t, 1) : 1;
        return { habit, ratio };
      })
      .sort((a, b) => a.ratio - b.ratio);   // worst first

    const worst = ranked[0];
    if (!worst || worst.ratio >= this.THRESHOLD) return null;

    return { habit: worst.habit, message: this.MESSAGES[worst.habit] };
  },

  /* ──────────────────────────────────────────────────────
     PUBLIC TRIGGER: called by mic button
     • Tap once  → speak worst habit reminder (or praise)
     • Tap again → stop
  ────────────────────────────────────────────────────── */
  checkAndSpeak() {
    if (!this.isSupported) {
      this._toast('Voice reminders are not supported in this browser.');
      return;
    }

    /* Toggle off if already speaking */
    if (this.isSpeaking) {
      this.stop();
      return;
    }

    const log     = Store.getTodayLog() || {};
    const targets = Store.getTargets();
    const reminder = this.getReminder(log, targets);

    if (reminder) {
      /* Show a brief toast naming the habit */
      const meta = Store.HABIT_META[reminder.habit];
      this._toast(`Reminder: ${meta ? meta.label : reminder.habit}`);
      this.speak(reminder.message);
    } else {
      this.speak('Great job! All your habits are on track today. Keep it up!');
      this._toast('All habits on track! 🎉');
    }
  },

  /* ──────────────────────────────────────────────────────
     BUTTON STATE
  ────────────────────────────────────────────────────── */
  _setButtonState(state) {
    const btn  = document.getElementById('voice-btn');
    const icon = document.getElementById('voice-btn-icon');
    if (!btn) return;

    if (state === 'speaking') {
      btn.classList.add('voice-active');
      btn.title = 'Tap to stop';
      btn.setAttribute('aria-label', 'Stop voice reminder');
      if (icon) icon.textContent = 'stop_circle';
    } else {
      btn.classList.remove('voice-active');
      btn.title = 'Tap for voice reminder';
      btn.setAttribute('aria-label', 'Voice reminder');
      if (icon) icon.textContent = 'mic';
    }
  },

  /* ──────────────────────────────────────────────────────
     TOAST notification
  ────────────────────────────────────────────────────── */
  _toast(msg, duration = 3000) {
    let el = document.getElementById('voice-toast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'voice-toast';
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => el.classList.remove('show'), duration);
  },

  /* ──────────────────────────────────────────────────────
     STYLES (injected once)
  ────────────────────────────────────────────────────── */
  _injectStyles() {
    if (document.getElementById('voice-styles')) return;
    const s = document.createElement('style');
    s.id = 'voice-styles';
    s.textContent = `

      /* ─ Mic button in the header ─ */
      #voice-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 36px;
        height: 36px;
        border-radius: 50%;
        border: 1.5px solid var(--outline-variant);
        background: var(--surface-container-low);
        color: var(--on-surface-variant);
        cursor: pointer;
        flex-shrink: 0;
        font-family: var(--font);
        transition: background 0.2s, color 0.2s, border-color 0.2s, transform 0.15s;
        position: relative;
      }
      #voice-btn:hover {
        background: color-mix(in srgb, var(--primary) 10%, var(--surface-container-low));
        color: var(--primary);
        border-color: var(--primary);
      }
      #voice-btn:active { transform: scale(0.92); }
      #voice-btn .material-symbols-outlined { font-size: 19px; }

      /* ─ Speaking state: glowing pulse ring ─ */
      #voice-btn.voice-active {
        background: color-mix(in srgb, var(--primary) 15%, var(--surface-container-low));
        border-color: var(--primary);
        color: var(--primary);
        animation: voicePulse 1s ease-in-out infinite;
      }
      @keyframes voicePulse {
        0%   { box-shadow: 0 0 0 0   color-mix(in srgb, var(--primary) 45%, transparent); }
        60%  { box-shadow: 0 0 0 9px transparent; }
        100% { box-shadow: 0 0 0 0   transparent; }
      }

      /* ─ Waveform bars inside button while speaking ─ */
      #voice-btn.voice-active::before {
        content: '';
        position: absolute;
        inset: 0;
        border-radius: 50%;
        background: color-mix(in srgb, var(--primary) 8%, transparent);
        animation: voiceRipple 1.2s ease-out infinite;
      }
      @keyframes voiceRipple {
        0%   { transform: scale(1);   opacity: 0.8; }
        100% { transform: scale(1.7); opacity: 0; }
      }

      /* ─ Dash header updated to hold mic ─ */
      .dash-header-right {
        display: flex;
        align-items: center;
        gap: 10px;
      }

      /* ─ Toast notification ─ */
      #voice-toast {
        position: fixed;
        bottom: calc(var(--bottom-nav-h, 72px) + 12px);
        left: 50%;
        transform: translateX(-50%) translateY(14px);
        background: var(--on-surface);
        color: var(--surface);
        font-size: 13px;
        font-weight: 600;
        padding: 9px 18px;
        border-radius: 24px;
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.28s ease, transform 0.28s ease;
        z-index: 9999;
        font-family: var(--font);
        white-space: nowrap;
        max-width: calc(100vw - 40px);
        text-align: center;
        box-shadow: 0 4px 16px rgba(0,0,0,0.18);
      }
      #voice-toast.show {
        opacity: 1;
        transform: translateX(-50%) translateY(0);
      }
    `;
    document.head.appendChild(s);
  },

  /* ── Init ── */
  init() {
    this._injectStyles();
  },
};

window.VoiceSystem = VoiceSystem;
