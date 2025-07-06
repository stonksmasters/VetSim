const chatForm = document.getElementById('chatForm');
const chatWindow = document.getElementById('chatWindow');
const inputField = document.getElementById('userInput');
const hintButton = document.getElementById('hintButton');
const scoreBoard = document.getElementById('scoreBoard');
const timerDisplay = document.getElementById('timer');

let score = JSON.parse(localStorage.getItem('score')) || { correct: 0, total: 0 };
let timerInterval = null;
let timeLeft = 0;
const TIMER_SECONDS = 120;

function updateScore() {
    scoreBoard.textContent = `Score: ${score.correct}/${score.total}`;
    localStorage.setItem('score', JSON.stringify(score));
}

function startTimer() {
    clearInterval(timerInterval);
    timeLeft = TIMER_SECONDS;
    timerDisplay.textContent = `Time: ${timeLeft}s`;
    timerInterval = setInterval(() => {
        timeLeft--;
        timerDisplay.textContent = `Time: ${timeLeft}s`;
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            timerDisplay.textContent = 'Time: 0s';
            inputField.disabled = true;
        }
    }, 1000);
}

updateScore();

function sendMessage(message) {
    // Add the user's message
    const userMessage = document.createElement('div');
    userMessage.classList.add('chat-message', 'user-message');
    userMessage.textContent = message;
    chatWindow.appendChild(userMessage);
    chatWindow.scrollTop = chatWindow.scrollHeight;

    inputField.value = '';
    inputField.disabled = true;

    const loadingMessage = document.createElement('div');
    loadingMessage.classList.add('chat-message', 'loading-message');
    loadingMessage.textContent = 'GPT is thinking...';
    chatWindow.appendChild(loadingMessage);
    chatWindow.scrollTop = chatWindow.scrollHeight;

    fetch('https://vetsim-1.onrender.com/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message })
    })
    .then(r => r.json())
    .then(data => {
        loadingMessage.remove();
        const gptMessage = document.createElement('div');
        gptMessage.classList.add('chat-message', 'gpt-message');
        gptMessage.textContent = data.message;
        chatWindow.appendChild(gptMessage);
        chatWindow.scrollTop = chatWindow.scrollHeight;
        inputField.disabled = false;
        inputField.focus();
        if (data.score) {
            score = data.score;
            updateScore();
        }
        if (data.message && data.message.includes('You are diagnosing')) {
            startTimer();
        }
    })
    .catch(err => {
        console.error('Error:', err);
        loadingMessage.remove();
        const errorMessage = document.createElement('div');
        errorMessage.classList.add('chat-message', 'error-message');
        errorMessage.textContent = 'Something went wrong. Please try again.';
        chatWindow.appendChild(errorMessage);
        chatWindow.scrollTop = chatWindow.scrollHeight;
        inputField.disabled = false;
        inputField.focus();
    });
}

chatForm.addEventListener('submit', function(e) {
    e.preventDefault();
    sendMessage(inputField.value);
});

hintButton.addEventListener('click', function() {
    sendMessage('hint');
});
