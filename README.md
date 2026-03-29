# 🌿 WellNest — Daily Wellness Tracker

> A mobile-first health habit tracker with a living plant, voice reminders, and a zero-friction orbit dial UI.

---

## ✨ Features

### 🎯 Core Tracking
- **6 daily habits** — Hydration, Sleep, Physical Activity, Healthy Meals, Screen Breaks, Stress Relief
- **Wellness Score** (0–100) — weighted formula across all 6 habits
- **Local persistence** — all data lives in `localStorage`, no backend needed
- **Daily reset** — logs rotate automatically at midnight

### 🌀 Single-Gesture Orbit Dial
The biggest UX differentiator. Each habit card shows a circular SVG dial instead of +/− buttons.

- **Drag anywhere on the dial** and rotate — clockwise increases value, counter-clockwise decreases
- **Delta-knob mechanic** — grab at any point, turn like a physical dial
- **Arc fills clockwise** from the 12 o'clock goal marker
- **Goal snap animation** — bubble pulses and goal ring flares when target is reached
- **< 5 seconds** to log any habit — one continuous gesture, zero cognitive load

### 🌿 Living Plant Background
A dynamic SVG plant grows with your Wellness Score — visible through the transparent glass cards as a full-screen fixed background.

| Score Range | Stage |
|---|---|
| 0 | 🌱 Resting — seed only |
| 1–20 | 🌿 Sprouting |
| 21–45 | 🍃 Growing |
| 46–70 | 🌳 Thriving |
| 71–95 | 🌸 Almost in bloom |
| 96–100 | 🌺 In full bloom! |

- **Habit-driven effects** — sun brightness (activity), moon + stars (sleep), water drops (hydration), sparkles (screen breaks), falling petals (stress relief), soil cracks (low hydration)
- **Parallax scroll** — plant moves at 28% of scroll speed, creating a depth layer behind the glass cards
- **Daily reset** — plant wilts at midnight and regrows from seed

### 🎙 Voice Reminders
- Tap the mic button to speak the most critical habit you haven't hit today
- Uses the Web Speech API (en-IN locale)
- Priority-ranked: the weakest habit (lowest ratio below 60%) speaks first
- Toast notification confirms which habit was flagged
- Mic icon pulses while speaking, switches to stop icon

### 🗓 Weekly Insights
- 7-day streak calendar (completed / partial / missed)
- Weekly average score, strongest habit, weakest habit
- Personalised wellness tip based on your data

### 📋 History
- Full log of past days with score badge and per-habit breakdown
- Colour-coded pills for completed habits

### ⚙ Settings
- Edit daily targets for all 6 habits
- Reset all data
- Demo mode (pre-fills realistic sample data)
- Dark mode toggle (persisted)

---

## 🖥 Tech Stack

| Layer | Choice |
|---|---|
| Structure | Vanilla HTML5 |
| Styling | Vanilla CSS (design tokens, glassmorphism, CSS Grid) |
| Logic | Vanilla JavaScript (ES6+, no framework) |
| Graphics | Inline SVG (plant, orbit dials, score ring) |
| Voice | Web Speech API (`speechSynthesis`) |
| Storage | `localStorage` |
| Server | Any static file server (e.g. `python -m http.server`) |

---

## 📁 File Structure

```
wellnest/
├── index.html               # App shell, nav, script registration
├── css/
│   └── styles.css           # Full design system — tokens, glassmorphism, grid
└── js/
    ├── store.js             # State management, scoring, localStorage
    ├── router.js            # Hash-based SPA router
    ├── plant.js             # SVG plant system — growth, animations, parallax
    ├── voice.js             # Voice reminder engine (Web Speech API)
    ├── orbit.js             # Single-Gesture Orbit Dial — drag to log habits
    └── pages/
        ├── dashboard.js     # Today screen — orbit cards, score, plant init
        ├── insights.js      # Weekly insights — streak, averages, tip
        ├── history.js       # Past logs with score breakdowns
        ├── onboarding.js    # First-run target setup
        └── settings.js      # Targets editor, reset, demo mode, dark mode
```

---

## 🧮 Wellness Score Formula

```
Score = round(
  min(hydration / target, 1) × 0.15 +
  min(sleep     / target, 1) × 0.25 +
  min(activity  / target, 1) × 0.20 +
  min(meals     / target, 1) × 0.15 +
  min(screenBreaks / target, 1) × 0.10 +
  min(stressRelief / target, 1) × 0.15
) × 100
```

Streak day states:
- ✅ **Completed** — score ≥ 80
- 🟡 **Partial** — score 40–79
- ⬜ **Missed** — score < 40

---

## 🚀 Running Locally

```bash
# Clone
git clone https://github.com/Parthx23/Wellnest.git
cd Wellnest/wellnest

# Serve (any static server works)
python -m http.server 3939

# Open
# http://localhost:3939
```

No build step. No dependencies. No npm install.

---

## 🎨 Design Highlights

- **Glassmorphism cards** — `rgba(255,255,255,0.22)` + `backdrop-filter: blur(8px)` so the plant bleeds through
- **CSS custom properties** — full light + dark mode token system
- **2 × 3 habit grid** — compact orbit cards in a CSS grid layout
- **Fixed plant background** — `position: fixed`, constrained to 430 px app width
- **Parallax depth** — scroll listener nudges the plant at 28% speed via `requestAnimationFrame`
- **Manrope** typeface from Google Fonts
- **Material Symbols** icon set

---

## 📱 Mobile-First

- Max width: 430 px (phone-sized)
- Bottom navigation bar with safe-area insets
- Touch events on orbit dials (`touchstart`, `touchmove`, `touchend`)
- `touch-action: none` on SVG for smooth drag without scroll conflict
- `viewport-fit=cover` for notch/island devices

---

## 🛣 Roadmap

- [ ] Plant species selector (Cactus, Fern, Monstera) in Settings
- [ ] Haptic feedback on goal reach (Vibration API)
- [ ] PWA manifest + service worker for offline + home screen install
- [ ] Export data as CSV / JSON
- [ ] Shareable wellness card (canvas snapshot)
- [ ] Notification reminders (Notification API)

---

## 👤 Author

**Parth Jakar**  
[GitHub](https://github.com/Parthx23)

---

## 📄 License

MIT — free to use, modify, and distribute.
