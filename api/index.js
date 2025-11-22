const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');

const app = express();
const GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent";
const PEXELS_BASE_URL = "https://api.pexels.com/v1/search";

// Set up CORS to allow requests from your GitHub Pages frontend
app.use(cors()); 
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- SECURE PROXY ENDPOINT ---
app.post('/api/proxy', async (req, res) => {
    // These keys are retrieved securely from Vercel's private environment variables.
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    const PEXELS_API_KEY = process.env.PEXELS_API_KEY;

    // Check if Vercel has the keys configured
    if (!GEMINI_API_KEY || !PEXELS_API_KEY) {
        // This error will appear if you forgot to set the variables on the Vercel dashboard.
        return res.status(500).json({ error: "API keys not configured on the Vercel server." });
    }
    
    const { action, query, clientPayload } = req.body;

    if (!action) {
        return res.status(400).json({ error: "Missing 'action' parameter." });
    }

    try {
        let apiResponse;

        if (action === "geminiTranslate") {
            // --- GEMINI PROXY: Key is used on the server, never exposed ---
            const endpoint = `${GEMINI_BASE_URL}?key=${GEMINI_API_KEY}`;
            
            apiResponse = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(clientPayload)
            });

        } else if (action === "pexelsSearch") {
            // --- PEXELS PROXY: Key is used in the Authorization header on the server ---
            if (!query) return res.status(400).json({ error: "Missing query for Pexels." });

            const url = `${PEXELS_BASE_URL}?query=${encodeURIComponent(query)}&per_page=8&orientation=square`;
            
            apiResponse = await fetch(url, {
                method: 'GET',
                headers: { 'Authorization': PEXELS_API_KEY }
            });

        } else {
            return res.status(400).json({ error: `Unknown action: ${action}` });
        }

        // Forward the API result back to the frontend
        const data = await apiResponse.json();
        return res.status(apiResponse.status).json(data);

    } catch (error) {
        console.error("PROXY EXECUTION ERROR:", error.message);
        return res.status(500).json({ error: `Proxy failed due to server error: ${error.message}` });
    }
});

// IMPORTANT: Export the Express app object for Vercel to use it as a Serverless Function
module.exports = app;