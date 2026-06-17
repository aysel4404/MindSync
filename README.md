# MindSync

MindSync is a developer workspace helper that checks your mood and productivity. You can record voice entries (journals), and the app uses AI to transcribe them, find your mood, and project a "Squishy Score" for your daily workflow.
Your companion in the dashboard is Squishy, a friendly animated mascot that changes size, color, and expressions to match your current feeling.

---

##  How It Works

1. **Frontend UI**: Built with simple HTML5 and styled with Tailwind CSS. It has login, signup, and a responsive dashboard.
2. **Squishy Mascot**: A custom-shaped element that moves with CSS animations to feel alive and changes dynamically based on your analyzed mood.
3. **Audio Capture**: Captures your voice through the browser's microphone using the `MediaRecorder` API and sends it to the backend as an audio file.
4. **AI Processing**: 
   - Transcribes your recorded wave/webm voice files.
   - Analyzes your mood category (like Joyful, Tired, Stressed) and gives a numeric productivity rating.
   - Uses the official Google Gemini SDK (`@google/genai`).
5. **Database**: Users and journal history are stored in Supabase (PostgreSQL).

---

## File Structure

- `/frontend/` — Contains HTML files (`login.html`, `signup.html`, `dashboard.html`), CSS styles, and client JavaScript.
- `/backend/` — Express server setup and routes for handling user auth and voice upload/analysis.
- `schema.sql` — SQL definition to set up required database tables in Supabase.
- `.env` — Your private environment keys (Supabase keys).

---
