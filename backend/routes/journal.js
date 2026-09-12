const express = require('express');
const router = express.Router();
const { GoogleGenAI } = require('@google/genai');

// Initialize the Google Gen AI SDK (picks up GEMINI_API_KEY from process.env)
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

/**
 * Keyword-based mood detection — used only when the Gemini call fails
 * (bad/missing API key, network error, rate limit, etc). This used to be
 * dead commented-out code; it's now the real fallback path.
 */
function keywordFallbackAnalysis(transcript) {
    const text = transcript.toLowerCase();
    let mood = "Stable / Content";
    let capacity = 90;

    if (text.includes('tired') || text.includes('exhausted') || text.includes('sad')) {
        mood = "Tired / Stressed";
        capacity = 45;
    } else if (text.includes('sick') || text.includes('fever') || text.includes('ill')) {
        mood = "Weak / Ill";
        capacity = 20;
    } else if (text.includes('happy') || text.includes('great') || text.includes('good')) {
        mood = "Energized / Happy";
        capacity = 100;
    }

    return {
        mood,
        capacity,
        summary: "Analyzed with keyword fallback (AI service was unavailable)."
    };
}

// Local store to keep entries during runtime
let journalLogs = [
    { 
        mood_variant: "Stable / Content", 
        output_capacity: 90, 
        summary: "Default active baseline log state.",
        created_at: new Date() 
    }
];

// POST Endpoint: /api/journal/entry
router.post('/entry', async (req, res) => {
    const { transcript } = req.body;
    console.log("🎙️ Received voice entry transcript:", transcript);

    let mood = "Stable / Content";
    let capacity = 90;
    let summary = "Voice journal entry captured.";

    if (transcript && transcript.trim().length > 0) {
        try {
            // Call Gemini 2.5 Flash with structured JSON output enforcement
            const response = await ai.models.generateContent({
                model: 'gemini-3.6-flash',
                contents: `Analyze the following user voice journal transcript and evaluate their emotional state: "${transcript}"`,
                config: {
                    responseMimeType: 'application/json',
                    responseSchema: {
                        type: 'OBJECT',
                        properties: {
                            mood_variant: { 
                                type: 'STRING', 
                                description: 'Categorize into one of: "Energized / Happy", "Stable / Content", "Tired / Stressed", or "Weak / Ill"' 
                            },
                            output_capacity: { 
                                type: 'INTEGER', 
                                description: 'A score from 0 to 100 representing productivity/energy capacity' 
                            },
                            summary: { 
                                type: 'STRING', 
                                description: 'A 1-sentence summary of what the user talked about' 
                            }
                        },
                        required: ['mood_variant', 'output_capacity', 'summary']
                    }
                }
            });

            // Parse Gemini's structured response
            const aiResult = JSON.parse(response.text);
            
            mood = aiResult.mood_variant || mood;
            capacity = aiResult.output_capacity ?? capacity;
            summary = aiResult.summary || summary;

            console.log("✨ Gemini Sentiment Result:", aiResult);

        } catch (error) {
            console.error("⚠️ Gemini API processing error, using keyword fallback:", error.message);
            const fallback = keywordFallbackAnalysis(transcript);
            mood = fallback.mood;
            capacity = fallback.capacity;
            summary = fallback.summary;
        }
    }

    const newLog = { 
        mood_variant: mood, 
        output_capacity: capacity, 
        summary: summary,
        transcript: transcript || null,
        created_at: new Date() 
    };

    journalLogs.unshift(newLog); // Place newest logs at top of feed

    res.status(200).json({ success: true, ...newLog });
});

// GET Endpoint: /api/journal/logs
router.get('/logs', (req, res) => {
    res.status(200).json(journalLogs);
});

module.exports = router;