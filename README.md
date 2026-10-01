# LifeOS: Autonomous Executive Chief of Staff

> **Zero-typing, voice-first, high-execution operating system designed for radical low cognition, zero decision fatigue, and complete human sovereignty over delegated actions.**

---

## ⚡ Architecture Overview

LifeOS is an executive operating system built for principals who manage high stakes with minimal cognitive overhead. Instead of endless chat dialogs, LifeOS treats incoming voice memos, documents, and messaging streams as raw directives, synthesizing them into discrete, high-impact **Action Cards** presented one at a time in the executive Cockpit.

### Tech Stack
- **Framework:** Next.js 16 (App Router, Turbopack, TypeScript)
- **Styling:** Tailwind CSS (Dark-slate executive aesthetic, mobile-responsive)
- **Audio & Voice:** HTML5 `MediaRecorder` API + Web Audio API synthesizer for acoustic cues and real-time waveform visualization
- **Integration Layer:** Modular service adapter pattern for Google Workspace (Tasks, Calendar, Docs, Sheets, Drive) & Google AI Studio (`GEMINI_API_KEY`)
- **Database Readiness:** Complete PostgreSQL & Supabase schema with Row-Level Security (`schema.sql`)
- **Messaging Webhooks:** Native Meta/WhatsApp Cloud API receiver (`/api/webhooks/whatsapp`)

---

## 🛡️ Key Features

### 1. Emergency / Sick Shield (`SICK_DAY_PAUSE`)
- **One-Tap Quarantine:** Toggling the Sick Shield immediately quarantines all non-urgent action cards, secondary tasks, and standard routines across the app.
- **Streak Preservation:** Habit streaks are frozen with `SICK_DAY_PAUSE` status in the ledger rather than marked as failed.
- **Keystone Directive Focus:** Only directives explicitly tagged as `*KEYSTONE*` or critical deadlines (e.g., Morning Medication, urgent utility deadline) remain visible.
- **Zero Data Loss:** Standing down the shield immediately restores all pending items seamlessly.

### 2. The Cockpit & Single-Card Viewport Deck
- **Strict Viewport Rule:** Exactly **ONE** Action Card occupies the screen at a time to eliminate decision paralysis and visual clutter.
- **Sticky Pin Filter Bar:** Dynamic category filtering (`[ All ]`, `[ 💬 Responses ]`, `[ 📄 Artifacts ]`, `[ 🛡️ Protocols ]`, `[ ⚡ Life Ops ]`) with live count badges.
- **The 5-Action Decision Palette:**
  1. `[ 🚀 Approve & Execute ]`: High-contrast primary action. Dispatches the action via external adapters and logs to the audit ledger.
  2. `[ 🕒 Snooze / Defer ▾ ]`: Dropdown menu (`Tonight 8 PM`, `Tomorrow 9 AM`, `This Weekend`, `Next Month`). Removes card until scheduled wake trigger.
  3. `[ 🎙️ Quick Critique ]`: 5-second voice capture modal. Dictate adjustments (*"Make tone firmer, drop price 10%"*) to re-draft the card in place via Gemini.
  4. `[ 📥 Save to Drafts / Manual ]`: Moves item to native draft folder, releasing agent control.
  5. `[ 🗑️ Kill Mission ]`: Permanently cancels the task and logs user preference.
- **Interactive Preview Drawer:** Collapsible drawer displaying the exact drafted email, structured Google Doc outline, or itemized invoice breakdown.

### 3. Today's Runway (Ambient Focus Layer)
- **🟢 NOW Block:** Displays active routine window or deep work block with tap-to-resume controls.
- **⏳ UP NEXT:** Next 2 upcoming calendar events with direct Google Meet/Zoom links and time countdowns.
- **🎯 Today's North Stars:** Exactly 1 to 3 high-leverage focus items derived from active long-term missions.
- **🔄 Routines Launcher:** One-tap action chips to start scheduled routines (`Morning Protocol`, `Deep Work Launchpad`, `Evening Shutdown`).

### 4. Interactive Routine Player with Dual Timers
- **Markdown Native Spec:** Routines are defined in human-readable Markdown format compatible with Google Tasks notes:
  ```markdown
  # ROUTINE SPEC
  Window: 07:00 - 09:00 | Total: 45m | Mode: Time-Windowed
  [ ] 01. Hydrate & Lemon Water (05m)
  [ ] 02. Bathroom & Fresh Up (10m)
  [ ] 03. Morning Medication (02m) *KEYSTONE*
  [ ] 04. Shower & Dress (15m)
  [ ] 05. High-Protein Breakfast (13m)
  ```
- **Dual Timers:** Current Step Countdown Timer + Total Routine Runway Timer.
- **Web Audio Chimes:** Synthetic audio chimes sound upon step completion.
- **Keystone Isolation:** Under Emergency Shield, only `*KEYSTONE*` steps remain active while standard steps are quarantined.

### 5. Omnichannel Input Stream & WhatsApp Webhook
- **Voice Directive Capture:** Tap-to-record with live audio waveform canvas and 1-tap `[ Delegate to Staff ]`.
- **Media & Document Dropzone:** Drag-and-drop support for bills, receipts, lab reports, and contract PDFs.
- **Quick Scratchpad:** Minimalist textarea for delegating thoughts, links, and numbers.
- **Ingestion Log:** Chronological feed of captured inputs with inline playable audio waveform players.
- **WhatsApp Webhook:** Compliant `/api/webhooks/whatsapp` endpoint (`GET` verification challenge + `POST` media/message ingestion) with interactive test simulator.

---

## 🚀 Getting Started

### 1. Installation
```bash
npm install
```

### 2. Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Production Build
```bash
npm run build
npm run start
```

### 4. Optional Environment Variables
Create a `.env.local` file:
```env
# Optional: Google AI Studio Gemini API Key for live AI generation
GEMINI_API_KEY="your-gemini-api-key"

# Optional: WhatsApp Cloud API Webhook Verification Token
WHATSAPP_VERIFY_TOKEN="lifeos_chief_of_staff_secure_token"

# Optional: Google Workspace OAuth Token
GOOGLE_WORKSPACE_ACCESS_TOKEN=""
```
*(Note: If no API keys are provided, LifeOS runs with its built-in Executive Heuristic Synthesizer and mock integration adapters, guaranteeing 100% offline functionality.)*
