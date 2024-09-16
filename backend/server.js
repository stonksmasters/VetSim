const express = require('express');
const cors = require('cors');
require('dotenv').config();
const OpenAI = require('openai'); // Importing the OpenAI SDK

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize OpenAI client
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// Middleware
app.use(cors()); // Allow cross-origin requests
app.use(express.json()); // Parse JSON bodies

// Utility function to handle OpenAI API call
const generateResponse = async (userMessage) => {
    try {
        // Call OpenAI to generate the completion
        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini", // Use your specific model here
            messages: [
                { 
                    role: "system", 
                    content: `You are role-playing as the owner of a pet named Buddy, a 5-year-old Golden Retriever who has been limping for the past two days. 
                    
                    Your job is to only respond when the vet student asks questions or requests tests. 
                    
                    Wait for the student to ask for information (like symptoms, tests, etc.) and provide relevant responses when prompted. Do not give too much information unless specifically asked.

                    If the student requests tests, provide the results: 
                    - X-ray: "No visible fractures, but there is mild soft tissue swelling in the left hip."
                    - Blood work: "Slightly elevated white blood cells, indicating mild inflammation."
                    
                    After the student makes a diagnosis, respond with whether their diagnosis is correct or not, and provide further details if needed.`
                },
                { role: "user", content: userMessage }
            ],
        });
        
        // Return the assistant's response
        return completion.choices[0].message.content;
    } catch (error) {
        console.error('Error interacting with GPT-4:', error.response ? error.response.data : error.message);
        throw new Error('Failed to communicate with GPT-4 Assistant');
    }
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
        
        // Send the response back to the frontend
        res.json({ message: assistantMessage });
    } catch (error) {
        // Error handling for any failures
        res.status(500).json({ error: error.message });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
