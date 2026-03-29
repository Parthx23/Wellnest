
'use strict';

/* ── Settings ── */
function renderSettings() {
  const targets = Store.getTargets();
  const prefs   = Store.getPrefs();

  const targetFields = Object.entries(Store.HABIT_META).map(([key, meta]) => `
    <div class="setting-habit-row">
      <span class="material-symbols-outlined" style="color:${meta.color}">${meta.icon}</span>
      <span class="setting-habit-label">${meta.label}</span>
      <div class="stepper-inline">
        <button class="stepper-btn sm" onclick="settingStep('${key}',-1)">
          <span class="material-symbols-outlined">remove</span>
        </button>
        <span class="stepper-val sm" id="st-val-${key}">${targets[key]}</span>
        <span class="stepper-unit">${meta.unit}</span>
        <button class="stepper-btn sm" onclick="settingStep('${key}',1)">
          <span class="material-symbols-outlined">add</span>
        </button>
      </div>
    </div>
  `).join('');

  document.getElementById('app').innerHTML = `
    <div class="screen screen-settings">
      <div class="page-header">
        <div class="profile-row">
          <div class="avatar">
            <span class="material-symbols-outlined">person</span>
          </div>
          <div>
            <div class="profile-name">Your Profile</div>
            <div class="profile-sub">Managing your wellness journey</div>
          </div>
        </div>
      </div>

      <!-- Daily Targets -->
      <div class="settings-section">
        <div class="settings-section-title">Daily Targets</div>
        <div class="settings-card">
          ${targetFields}
        </div>
        <button class="btn-primary" id="save-targets-btn" onclick="saveTargets()">
          <span class="material-symbols-outlined">save</span> Save Targets
        </button>
      </div>

      <!-- App Preferences -->
      <div class="settings-section">
        <div class="settings-section-title">App Preferences</div>
        <div class="settings-card">
          <div class="setting-row">
            <div class="setting-row-left">
              <span class="material-symbols-outlined">dark_mode</span>
              <div>
                <div class="setting-row-label">Dark Mode</div>
                <div class="setting-row-sub">Switch between light and dark</div>
              </div>
            </div>
            <label class="toggle-switch">
              <input type="checkbox" id="pref-theme" ${prefs.theme==='dark'?'checked':''} onchange="toggleTheme(this.checked)">
              <span class="toggle-thumb"></span>
            </label>
          </div>
          <div class="setting-row">
            <div class="setting-row-left">
              <span class="material-symbols-outlined">science</span>
              <div>
                <div class="setting-row-label">Demo Mode</div>
                <div class="setting-row-sub">Preload 14 days of sample data</div>
              </div>
            </div>
            <label class="toggle-switch">
              <input type="checkbox" id="pref-demo" ${prefs.demoMode?'checked':''} onchange="toggleDemo(this.checked)">
              <span class="toggle-thumb"></span>
            </label>
          </div>
        </div>
      </div>

      <!-- Data Management -->
      <div class="settings-section">
        <div class="settings-section-title">Data Management</div>
        <div class="settings-card">
          <div class="setting-row danger-row" onclick="confirmReset()">
            <div class="setting-row-left">
              <span class="material-symbols-outlined" style="color:#ef5350">delete_forever</span>
              <div>
                <div class="setting-row-label" style="color:#ef5350">Reset All Data</div>
                <div class="setting-row-sub">Clears all logs, targets, and preferences</div>
              </div>
            </div>
            <span class="material-symbols-outlined" style="color:var(--on-surface-variant)">chevron_right</span>
          </div>
        </div>
      </div>

      <div class="settings-footer">Crafted with care for your well-being 🌿</div>

      <!-- Confirm Reset Modal -->
      <div class="modal-overlay hidden" id="reset-modal">
        <div class="modal">
          <div class="modal-icon"><span class="material-symbols-outlined" style="color:#ef5350;font-size:36px">warning</span></div>
          <div class="modal-title">Reset all data?</div>
          <div class="modal-body">This will permanently delete all your logs, targets, and preferences. This action cannot be undone.</div>
          <div class="modal-actions">
            <button class="btn-ghost" onclick="closeModal()">Cancel</button>
            <button class="btn-danger" onclick="doReset()">Yes, Reset</button>
          </div>
        </div>
      </div>
    </div>
  `;

  // init local copy of targets for editing
  window._settingTargets = Store.getTargets();
}

window._settingTargets = null;

function settingStep(key, delta) {
  if (!window._settingTargets) window._settingTargets = Store.getTargets();
  const limits = { hydration:[1,20], sleep:[1,12], activity:[5,180], meals:[1,6], screenBreaks:[1,10], stressRelief:[1,6] };
  const [min, max] = limits[key];
  const step = key === 'sleep' ? 0.5 : 1;
  window._settingTargets[key] = Math.min(max, Math.max(min, +(window._settingTargets[key] + delta * step).toFixed(1)));
  const el = document.getElementById(`st-val-${key}`);
  if (el) el.textContent = window._settingTargets[key];
}

function saveTargets() {
  Store.setTargets(window._settingTargets || Store.getTargets());
  const btn = document.getElementById('save-targets-btn');
  if (btn) {
    btn.innerHTML = '<span class="material-symbols-outlined">check</span> Saved!';
    btn.classList.add('btn-success');
    setTimeout(() => {
      btn.innerHTML = '<span class="material-symbols-outlined">save</span> Save Targets';
      btn.classList.remove('btn-success');
    }, 2000);
  }
}

function toggleTheme(isDark) {
  Store.setPref('theme', isDark ? 'dark' : 'light');
  document.documentElement.classList.toggle('dark-mode', isDark);
}

function toggleDemo(on) {
  if (on) { Store.enableDemo(); }
  else     { Store.disableDemo(); }
}

function confirmReset() {
  document.getElementById('reset-modal').classList.remove('hidden');
}

function closeModal() {
  const m = document.getElementById('reset-modal');
  if (m) m.classList.add('hidden');
}

function doReset() {
  Store.resetAll();
  closeModal();
  Router.navigate('onboarding');
}

window.renderSettings  = renderSettings;
window.settingStep     = settingStep;
window.saveTargets     = saveTargets;
window.toggleTheme     = toggleTheme;
window.toggleDemo      = toggleDemo;
window.confirmReset    = confirmReset;
window.closeModal      = closeModal;
window.doReset         = doReset;
