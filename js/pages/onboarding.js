
'use strict';

/* ── Onboarding page ── */
function renderOnboarding() {
  const targets = Store.getTargets();

  const habitFields = Object.entries(Store.HABIT_META).map(([key, meta]) => `
    <div class="habit-setup-card" id="setup-${key}">
      <div class="habit-setup-left">
        <div class="habit-icon-wrap" style="background:${meta.color}18">
          <span class="material-symbols-outlined habit-icon" style="color:${meta.color}">${meta.icon}</span>
        </div>
        <div>
          <div class="habit-setup-label">${meta.label}</div>
          <div class="habit-setup-sub">${habitDesc(key)}</div>
        </div>
      </div>
      <div class="habit-setup-right">
        <button class="stepper-btn" onclick="onboardingStep('${key}', -1)" aria-label="decrease">
          <span class="material-symbols-outlined">remove</span>
        </button>
        <span class="stepper-val" id="onb-val-${key}">${targets[key]}</span>
        <span class="stepper-unit">${meta.unit}/day</span>
        <button class="stepper-btn" onclick="onboardingStep('${key}', 1)" aria-label="increase">
          <span class="material-symbols-outlined">add</span>
        </button>
      </div>
    </div>
  `).join('');

  document.getElementById('app').innerHTML = `
    <div class="screen screen-onboarding">
      <div class="onb-header">
        <div class="app-logo">
          <span class="material-symbols-outlined" style="color:var(--primary)">spa</span>
          <span class="logo-text">WellNest</span>
        </div>
        <h1 class="onb-headline">Define your own rhythm.</h1>
        <p class="onb-sub">Welcome to your sanctuary. Let's set the foundations for your well-being. These daily targets are your compass, not a rigid map.</p>
      </div>

      <div class="habit-setup-list">
        ${habitFields}
      </div>

      <div class="onb-footer">
        <p class="onb-hint">You can adjust these goals any time in your profile.</p>
        <button class="btn-primary btn-full" id="onb-start" onclick="finishOnboarding()">
          Begin My Journey
          <span class="material-symbols-outlined">arrow_forward</span>
        </button>
      </div>
    </div>
  `;
}

function habitDesc(key) {
  const descs = {
    hydration:    'Stay refreshed and clear-minded.',
    sleep:        'Restorative rest for body and soul.',
    activity:     'Move in ways that feel good.',
    meals:        'Mindful nourishment through the day.',
    screenBreaks: 'Give your eyes a moment of rest.',
    stressRelief: 'Pause and reconnect with breath.',
  };
  return descs[key] || '';
}

window._onbTargets = null;

function onboardingStep(key, delta) {
  if (!window._onbTargets) window._onbTargets = Store.getTargets();
  const limits = { hydration:[1,20], sleep:[1,12], activity:[5,180], meals:[1,6], screenBreaks:[1,10], stressRelief:[1,6] };
  const [min, max] = limits[key];
  const meta = Store.HABIT_META[key];

  // For sleep use 0.5 step
  const step = key === 'sleep' ? 0.5 : 1;
  window._onbTargets[key] = Math.min(max, Math.max(min, +(window._onbTargets[key] + delta * step).toFixed(1)));

  const el = document.getElementById(`onb-val-${key}`);
  if (el) el.textContent = window._onbTargets[key];
}

function finishOnboarding() {
  const targets = window._onbTargets || Store.getTargets();
  Store.setTargets(targets);
  Store.setOnboarded(true);
  window._onbTargets = null;
  Router.navigate('dashboard');
}

window.renderOnboarding = renderOnboarding;
window.onboardingStep   = onboardingStep;
window.finishOnboarding = finishOnboarding;
