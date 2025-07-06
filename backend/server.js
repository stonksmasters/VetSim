const express = require('express');
const cors = require('cors');
require('dotenv').config();
const OpenAI = require('openai');

const app = express();
const PORT = process.env.PORT || 5000;

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});
const categories = ["Small animal", "Large animal", "Surgery", "Pharmacology"];
let score = { correct: 0, total: 0 };


app.use(cors());
app.use(express.json());

// Store the scenario details for each session
let currentScenario = null;

// Utility function to generate dynamic case with GPT
const generateScenario = async () => {
    const category = categories[Math.floor(Math.random() * categories.length)];
    const messages = [
        {
            role: 'system',
            content: `
                You are responsible for generating random pet scenarios for vet students to diagnose in the category of ${category}.

                1. Pet details (species, breed, age)
                2. Symptoms (e.g., limping, lethargy, vomiting, etc.)
                3. The correct diagnosis (e.g., fracture, infection, inflammation, etc.)
                Format the response as:
                Pet: species, breed, age.
                Symptoms: description.
                Diagnosis: correct diagnosis.
            `,
        },
    ];

    try {
        const completion = await openai.chat.completions.create({
            model: "gpt-4",
            messages: messages,
        });

        const responseText = completion.choices[0].message.content;

        // Manually parse the response text into scenario components
        const petMatch = responseText.match(/Pet:\s*(.*)/);
        const symptomsMatch = responseText.match(/Symptoms:\s*(.*)/);
        const diagnosisMatch = responseText.match(/Diagnosis:\s*(.*)/);

        if (!petMatch || !symptomsMatch || !diagnosisMatch) {
            throw new Error('Failed to generate a valid scenario');
        }

        return {
            pet: petMatch[1],
            symptoms: symptomsMatch[1],
            diagnosis: diagnosisMatch[1],
            category: category,
        };
    } catch (error) {
        console.error('Error generating scenario:', error.response ? error.response.data : error.message);
        throw new Error('Failed to generate scenario');
    }
};

// Utility function to generate test results dynamically
const generateTestResults = async (testType) => {
    const messages = [
        {
            role: 'system',
            content: `
                You are a vet test result generator. Based on the scenario, generate a detailed test result for the following test:
                Test type: ${testType}
                Symptoms: ${currentScenario.symptoms}
                Diagnosis: ${currentScenario.diagnosis}
            `,
        },
    ];

    try {
        const completion = await openai.chat.completions.create({
            model: "gpt-4",
            messages: messages,
        });
        return completion.choices[0].message.content;
    } catch (error) {
        console.error('Error generating test results:', error.response ? error.response.data : error.message);
        throw new Error('Failed to generate test results');
    }
};

// Utility function to provide feedback on the vet student's diagnosis
const evaluateDiagnosis = async (userDiagnosis) => {
    const messages = [
        {
            role: 'system',
            content: `
                You are a vet diagnosis evaluator. The student has provided the following diagnosis: "${userDiagnosis}".
                The correct diagnosis is: "${currentScenario.diagnosis}".
                Provide feedback to the student about their diagnosis and suggest treatment if correct.
            `,
        },
    ];

    try {
        const completion = await openai.chat.completions.create({
            model: "gpt-4",
            messages: messages,
        });
        return completion.choices[0].message.content;
    } catch (error) {
        console.error('Error evaluating diagnosis:', error.response ? error.response.data : error.message);
        throw new Error('Failed to evaluate diagnosis');
    }
};

// Utility function to generate a hint for the current scenario
const generateHint = async () => {
    const messages = [
        {
            role: 'system',
            content: `
                You are a veterinary tutor. Provide a short hint to help the student narrow down the diagnosis without revealing the answer.
                Pet: ${currentScenario.pet}
                Symptoms: ${currentScenario.symptoms}
            `,
        },
    ];

    try {
        const completion = await openai.chat.completions.create({
            model: "gpt-4",
            messages: messages,
        });
        return completion.choices[0].message.content;
    } catch (error) {
        console.error('Error generating hint:', error.response ? error.response.data : error.message);
        throw new Error('Failed to generate hint');
    }
};

// Endpoint to handle GPT-4 Assistant chat
app.post('/chat', async (req, res) => {
    const { message: userMessage } = req.body;

    if (!userMessage) {
        return res.status(400).json({ error: 'No message provided' });
    }

    try {
        // Check if a scenario has been generated, if not, generate a new one
        if (!currentScenario) {
            const scenario = await generateScenario();
            currentScenario = scenario; // Store the scenario
            res.json({ message: `You are diagnosing ${currentScenario.pet}. Symptoms: ${currentScenario.symptoms}`, category: currentScenario.category, score });
            return;
        }

        // If a test is requested (X-ray, blood test, ultrasound)
        if (userMessage.toLowerCase().includes("x-ray") || userMessage.toLowerCase().includes("blood test") || userMessage.toLowerCase().includes("ultrasound")) {
            const testType = userMessage.toLowerCase().includes("x-ray") ? "X-ray" : userMessage.toLowerCase().includes("blood test") ? "Blood test" : "Ultrasound";
            const testResults = await generateTestResults(testType);
            res.json({ message: testResults, score });
            return;
        }
        // If the user requests a hint
        if (userMessage.toLowerCase().includes("hint")) {
            const hint = await generateHint();
            res.json({ message: hint, score });
            return;
        }

        // If the user provides a diagnosis
        if (userMessage.toLowerCase().includes("diagnosis")) {
            const diagnosis = userMessage.replace(/diagnosis:/i, "").trim();
            const correct = diagnosis.toLowerCase().includes(currentScenario.diagnosis.toLowerCase());
            const feedback = await evaluateDiagnosis(diagnosis);
            score.total++;
            if (correct) score.correct++;
            res.json({ message: feedback, correct, score });
            currentScenario = null; // Reset the scenario for the next session
            return;
        }

        res.json({ message: "Please ask a question, request a test (X-ray, blood test, ultrasound), or provide a diagnosis.", score });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
