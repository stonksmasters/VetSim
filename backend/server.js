const express = require('express');
const cors = require('cors');
require('dotenv').config();
const OpenAI = require('openai'); 

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize OpenAI client
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// Middleware
app.use(cors());
app.use(express.json());

// Keep track of the game state
let gameState = {
    stage: 'gatheringInfo',
    information: {
        symptoms: [],
        tests: [],
    }
};

// Utility function to handle OpenAI API call
const generateResponse = async (userMessage) => {
    let messages = [];

    // Build dynamic context based on the current game state
    if (gameState.stage === 'gatheringInfo') {
        messages.push({ role: "system", content: `
            You are role-playing as a pet owner. The vet student will ask questions to diagnose a dog named Buddy, a 5-year-old Golden Retriever who is limping. 
            Respond only when the vet asks questions. Provide appropriate answers about the dog's symptoms and behavior.
            Allow the vet student to ask questions like 'Is Buddy eating normally?', 'Does Buddy wince when you touch his leg?'.
            Offer follow-up options for further testing like blood work, X-rays, or ultrasound based on their questions.
        `});
    } else if (gameState.stage === 'runningTests') {
        messages.push({ role: "system", content: `
            You are role-playing as a vet assistant providing test results. The student has chosen to run tests on Buddy. Provide relevant test results based on their choice:
            - Blood work: "Slightly elevated white blood cells, indicating mild inflammation."
            - X-ray: "No visible fractures, but there is mild soft tissue swelling in the left hip."
            - Ultrasound: "No internal injuries detected."
        `});
    } else if (gameState.stage === 'diagnosis') {
        messages.push({ role: "system", content: `
            The student is ready to make a diagnosis. Respond appropriately, confirming whether their diagnosis is correct or not.
            Offer feedback and suggest a treatment plan if the diagnosis is correct, or offer more clues if they are wrong.
        `});
    }

    messages.push({ role: "user", content: userMessage });

    // Call OpenAI API with the dynamic context
    const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: messages,
    });

    return completion.choices[0].message.content;
};

// Endpoint to handle GPT-4 Assistant chat
app.post('/chat', async (req, res) => {
    const { message: userMessage } = req.body;

    if (!userMessage) {
        return res.status(400).json({ error: 'No message provided' });
    }

    try {
        // Generate assistant response using OpenAI
        const assistantMessage = await generateResponse(userMessage);
        
        // Update game state based on user input
        if (userMessage.includes("X-ray") || userMessage.includes("blood test")) {
            gameState.stage = 'runningTests';
        } else if (userMessage.includes("diagnosis")) {
            gameState.stage = 'diagnosis';
        }

        // Send the response back to the frontend
        res.json({ message: assistantMessage });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
