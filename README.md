# MindSync

MindSync is a voice-journaling productivity application that analyzes a user's emotional state and adapts their daily workflow accordingly. Users record spoken journal entries, which are transcribed in-browser and analyzed by Google's Gemini API to produce a mood classification and a productivity capacity score ("Squishy Score"). This data drives a mood calendar, an energy-aware task scheduler, and long-term goal tracking.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Roadmap](#roadmap)


## Overview

MindSync's dashboard is presented through an animated mascot, Squishy, alongside four core modules: Voice Journaling, Mood Tracking, a Scheduler, and Settings. Each voice or quick-tap mood entry is analyzed and stored, feeding into the calendar view and the task-prioritization logic.

## Features

| Feature | Description |
|---|---|
| Voice Journaling | Records and transcribes a spoken entry client-side (Web Speech API), then submits the transcript for AI mood/productivity analysis. |
| Quick Mood Check-in | Logs a mood in a single tap, without a full journal entry. |
| Mood Calendar | Displays the most recent mood logged per calendar day for the current month. |
| Task Scheduler | Daily to-do list with energy-level tagging (high/medium/low); tasks can be reordered based on the most recently logged mood. |
| Long-Term Goals | Tracks multi-day goals with automatic, time-based progress calculation and an aggregate overall-progress metric. |
| Authentication | Signup/login backed by Supabase (PostgreSQL), persisting across server restarts. |

## Tech Stack

- **Backend:** Node.js, Express
- **Database / Auth:** Supabase (PostgreSQL)
- **AI:** Google Gemini API (`@google/genai`)
- **Frontend:** HTML5, vanilla JavaScript, Tailwind CSS, Font Awesome

## Project Structure

```
MindSync/
├── backend/
│   ├── routes/
│   │   ├── auth.js        # Signup/login routes, backed by Supabase
│   │   └── journal.js     # Journal entry analysis via Gemini, with keyword-based fallback
│   ├── server.js
│   └── package.json
└── frontend/
    ├── css/style.css
    ├── js/
    │   ├── app.js          # Dashboard interactivity
    │   └── api.js          # Fetch wrapper for backend endpoints
    ├── login.html
    ├── signup.html
    └── dashboard.html
```

## Roadmap

- Persist journal entries in Supabase alongside user accounts.
- Hash passwords with bcrypt.
- Move long-term goals into Supabase for cross-device access.
- Add mood-reactive styling/animation to the Squishy mascot.


