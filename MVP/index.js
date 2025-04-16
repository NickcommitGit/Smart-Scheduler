import express from 'express';
import fetch from 'node-fetch';
import path from 'path';
import cors from 'cors';
import 'dotenv/config';
const app = express();
const port = 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files (index.html, etc.)
app.use(express.static(path.resolve(process.cwd(), 'public')));

// Function to filter out setup-related instructions and unwanted content
function filterSetupInstructions(response) {
  // List of unwanted phrases related to setup or installation
  const unwantedPhrases = [
    "installation", "setup", "configuration", "download", "install", 
    "step-by-step", "guide", "follow", "please", "note", "steps","absolutely","yes","certainly","additional tips","practice and revision","good luck"
  ];



  // Remove lines containing unwanted phrases
  return response.split('\n')
    .filter(line => !unwantedPhrases.some(phrase => line.toLowerCase().includes(phrase)))
    .join('\n');
}


// Function to limit response to the required number of days or tasks
function limitResponseToDays(response, maxDays) {
  // Split the response into sentences or days (assuming each day starts with "Day X:")
  const sentences = response.split('\n').filter(line => line.trim() !== '');
  const filteredSentences = [];
  let currentDay = 0;

  for (let sentence of sentences) {
    if (sentence.startsWith('Day') && currentDay < maxDays) {
      currentDay++;
    }
    if (currentDay <= maxDays) {
      filteredSentences.push(sentence);
    }
  }

  return filteredSentences.join('\n');
}


// Route to handle AI response generation
app.post('/api/generate-response', async (req, res) => {
    const { prompt,maxDays=45 } = req.body;  // Default to 10 days if not provided
    if (!prompt) {
        return res.status(400).json({ response: "Prompt is required." });
    }

    try {
        const apiKey = process.env.HUGGING_FACE_API_KEY; // Use the API key from .env file
        const endpoint = 'https://api-inference.huggingface.co/models/Qwen/Qwen2.5-72B-Instruct/v1/chat/completions';  // Your provided endpoint

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: "Qwen/Qwen2.5-1.5B-Instruct",  // Your model name
                messages: [{ role: "user", content: prompt }],  // Send the user prompt as the message
                max_tokens: 1200,
            }),
        });

        if (!response.ok) {
            console.error('Error from model API:', response.statusText);
            return res.status(500).json({ response: 'Error generating response from AI.' });
        }

        const data = await response.json();
        const aiResponse = data.choices && data.choices[0]?.message?.content || 'No response generated.';

        // Clean the AI response by removing setup instructions
        const cleanResponse = filterSetupInstructions(aiResponse);

        // Limit the response based on the maxDays (e.g., 10 days)
        const limitedResponse = limitResponseToDays(cleanResponse, maxDays);

        // Split the cleaned and limited response by sentences or full stops for readability
        const formattedResponse = limitedResponse
            .split('###')
            .map(sentence => sentence.trim())
            .filter(sentence => sentence.length > 0);  // Remove empty sentences

        res.json({ response: formattedResponse });

    } catch (error) {
        console.error('Error generating response:', error);
        res.status(500).json({ response: "Error generating response. Please try again later." });
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
