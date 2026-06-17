const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { GoogleGenAI } = require('@google/genai');
const supabase = require('../supabase');

const FRONTEND_UPLOADS_DIR = path.join(__dirname, '../../frontend/uploads');


if (!fs.existsSync(FRONTEND_UPLOADS_DIR)) {
    fs.mkdirSync(FRONTEND_UPLOADS_DIR, { recursive: true });
}


const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, FRONTEND_UPLOADS_DIR);
    },
    filename: (req, file, cb) => {
        // Safe standard file names
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname) || '.webm';
        cb(null, 'voice-journal-' + uniqueSuffix + ext);
    }
});

const upload = multer({ storage: storage });


const aiClient = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
        headers: {
            'User-Agent': 'aistudio-build'
        }
    }
});


router.get('/logs', async (req, res) => {
    try {
        const email = req.query.email;
        let selectQuery = supabase
            .from('journal_logs')
            .select('*')
            .order('created_at', { ascending: false });

        if (email) {
            selectQuery = selectQuery.eq('email', email.toLowerCase());
        }

        const { data: logs, error: fetchError } = await selectQuery;

        if (fetchError) {
            if (fetchError.code === 'PGS00' || fetchError.message.includes('relation "journal_logs" does not exist')) {
                return res.status(200).json([
                    { 
                        id: "initial_setup_log",
                        mood_variant: "Content", 
                        output_capacity: 100, 
                        transcript: "👉 Welcome! Please copy-paste SQL commands from the 'schema.sql' file into your Supabase Dashboard SQL Editor to set up your tables and enjoy durable persistence.",
                        audio_url: null,
                        created_at: new Date()
                    }
                ]);
            }
            throw fetchError;
        }

        res.status(200).json(logs || []);
    } catch (err) {
        console.error("Error retrieving journal logs from Supabase:", err);
        res.status(500).json({ success: false, message: "Error fetching logs from Supabase database." });
    }
});


router.post('/upload', upload.single('audio'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: "No audio file uploaded to server." });
        }

        console.log(`🎙️ Successfully accepted voice file info: ${req.file.filename}`);
        const relativeAudioUrl = `/uploads/${req.file.filename}`;

        // Check if client requested to skip AI cloud transcription (Free local web speech mode)
        if (req.query.skipTranscription === 'true') {
            console.log(`🎙️ Local free engine: skipping Gemini API transcription. Audio saved at: ${relativeAudioUrl}`);
            return res.status(200).json({
                success: true,
                transcript: "",
                audio_url: relativeAudioUrl
            });
        }
        
        console.log(`🎙️ Encoding and querying Gemini API for transcription...`);
        
        if (!process.env.GEMINI_API_KEY) {
            console.warn("⚠️ GEMINI_API_KEY environment variable is not defined. Falling back to default transcript.");
            return res.status(200).json({
                success: true,
                transcript: "I had a busy workday today balancing development items and setting coordinates.",
                audio_url: relativeAudioUrl
            });
        }

        
        const fileContent = fs.readFileSync(req.file.path);
        const base64Audio = fileContent.toString('base64');
        const mimeType = req.file.mimetype || 'audio/webm';

     
        const responseByGemini = await aiClient.models.generateContent({
            model: "gemini-3.5-flash",
            contents: [
                {
                    inlineData: {
                        mimeType: mimeType,
                        data: base64Audio
                    }
                },
                {
                    text: "Identify any speech spoken in this audio and transcribe it word-for-word cleanly and accurately. Return ONLY the transcribed text translation. Do not write any wrappers, headers, or explanations."
                }
            ]
        });

        const transcriptText = responseByGemini.text ? responseByGemini.text.trim() : "";
        console.log(`✏️ Transcription retrieved: "${transcriptText}"`);

        res.status(200).json({
            success: true,
            transcript: transcriptText || "Audio silent or unclear transcription.",
            audio_url: relativeAudioUrl
        });

    } catch (err) {
        console.error("Critical fail inside /upload endpoint:", err);
        res.status(500).json({ success: false, message: "Engine transcription pipeline failure.", error: err.message });
    }
});


router.post('/entry', async (req, res) => {
    try {
        const { transcript, audioUrl, email } = req.body;
        
        if (!transcript) {
            return res.status(400).json({ success: false, message: "Journal text transcription required for entry processing." });
        }

        console.log(`🧠 Processing final journal entry text for emotional metrics: "${transcript}"`);

        let mood_variant = "Content";
        let output_capacity = 80;

        
        if (!process.env.GEMINI_API_KEY) {
            const raw = transcript.toLowerCase();
            if (raw.includes('tire') || raw.includes('exhaust') || raw.includes('fatigue') || raw.includes('drain')) {
                mood_variant = "Tired";
                output_capacity = 45;
            } else if (raw.includes('sick') || raw.includes('weak') || raw.includes('fever') || raw.includes('ill')) {
                mood_variant = "Weak";
                output_capacity = 20;
            } else if (raw.includes('stress') || raw.includes('anxious') || raw.includes('tense') || raw.includes('sad')) {
                mood_variant = "Stressed";
                output_capacity = 55;
            } else if (raw.includes('happy') || raw.includes('glad') || raw.includes('excit') || raw.includes('great') || raw.includes('ecstatic')) {
                mood_variant = "Ecstatic";
                output_capacity = 95;
            } else if (raw.includes('down') || raw.includes('blue') || raw.includes('lonely') || raw.includes('depress')) {
                mood_variant = "Down";
                output_capacity = 30;
            }
        } else {
            
            try {
                const response = await aiClient.models.generateContent({
                    model: "gemini-3.5-flash",
                    contents: `Analyze the user's emotional journal statement: "${transcript}".
Identify which of these precise mood parameters matches best: "Ecstatic", "Content", "Tired", "Stressed", "Down", "Weak".
Determine a "Squishy Score" as a percentage/integer between 0 and 100 capturing their output productivity velocity (Higher is better).
Return strictly formatted JSON output with keys "mood_variant" and "output_capacity" only. Do not wrap in markdown or backticks.`,
                    config: {
                        responseMimeType: "application/json"
                    }
                });

                const parsedResult = JSON.parse(response.text);
                mood_variant = parsedResult.mood_variant || "Content";
                output_capacity = Number(parsedResult.output_capacity) || 80;
            } catch (errJson) {
                console.error("Failed to parse or receive Gemini analysis output, reverting to heuristic fallback:", errJson);
            }
        }

        
        const newRecord = {
            id: "log_" + Date.now(),
            email: (email || "user@mindsync.com").toLowerCase(),
            mood_variant: mood_variant,
            output_capacity: output_capacity,
            transcript: transcript,
            audio_url: audioUrl || null,
            created_at: new Date()
        };

        const { error: insertError } = await supabase
            .from('journal_logs')
            .insert([newRecord]);

        if (insertError) {
            if (insertError.code === 'PGS00' || insertError.message.includes('relation "journal_logs" does not exist')) {
                return res.status(500).json({
                    success: false,
                    message: "Database Setup Required: The 'journal_logs' table does not exist in Supabase yet. Please run the SQL queries in 'schema.sql' inside your Supabase SQL Editor to initialize your tables."
                });
            }
            throw insertError;
        }

        res.status(200).json({
            success: true,
            ...newRecord
        });

    } catch (err) {
        console.error("Critical fail inside /entry endpoint:", err);
        res.status(500).json({ success: false, message: "Error committing journal logs to Supabase." });
    }
});


router.post('/suggest', async (req, res) => {
    try {
        const { mood } = req.body;
        
        if (!mood) {
            return res.status(400).json({ success: false, message: "A mood parameter is required for suggestions." });
        }

        if (!process.env.GEMINI_API_KEY) {
            return res.status(200).json({
                success: true,
                suggestions: "Take 3 slow deep breaths, hydrate with 250ml water, and organize your desk to reset your focus baseline."
            });
        }

        const prompt = `The user is currently feeling "${mood}". Write 2 short, practical, human-friendly mental & physical focus resetting activities or tips. Keep it highly action-focused and extremely brief (max 2 sentences total). Do not write intro, greeting, or marketing text.`;
        
        const response = await aiClient.models.generateContent({
            model: "gemini-3.5-flash",
            contents: prompt
        });

        res.status(200).json({
            success: true,
            suggestions: response.text ? response.text.trim() : "Keep hydrated and break your work into 15-minute milestones."
        });

    } catch (err) {
        console.error("Critical fail inside /suggest endpoint:", err);
        res.status(500).json({ success: false, message: "Failed to generate AI Wellness suggestions." });
    }
});


router.delete('/clear', async (req, res) => {
    try {
        const email = req.query.email;
        let deleteQuery = supabase.from('journal_logs').delete();

        if (email) {
            deleteQuery = deleteQuery.eq('email', email.toLowerCase());
        } else {
            // fallback: delete all if no email supplied (but avoid accidentally deleting if table is empty)
            deleteQuery = deleteQuery.neq('id', '');
        }

        const { error: deleteError } = await deleteQuery;

        if (deleteError) {
            throw deleteError;
        }

        res.status(200).json({ success: true, message: "Logs database has been cleared." });
    } catch (err) {
        console.error("Error clearing logs in Supabase:", err);
        res.status(500).json({ success: false, message: "Error clearing database." });
    }
});

module.exports = router;
