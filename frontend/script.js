document.getElementById('chatForm').addEventListener('submit', function(event) {
    event.preventDefault();
    const userInput = document.getElementById('userInput').value;
    const chatWindow = document.getElementById('chatWindow');

    // Add the user's message to the chat window
    const userMessage = document.createElement('div');
    userMessage.classList.add('chat-message', 'user-message');
    userMessage.textContent = userInput;
    chatWindow.appendChild(userMessage);

    // Scroll to the bottom of the chat window to show the new message
    chatWindow.scrollTop = chatWindow.scrollHeight;

    // Clear the input field
    document.getElementById('userInput').value = '';

    // Send the user's message to the backend to interact with GPT
    fetch('https://vetsim.onrender.com/chat', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: userInput })
    })
    
    
    .then(response => response.json())
    .then(data => {
        // Display GPT's response
        const gptMessage = document.createElement('div');
        gptMessage.classList.add('chat-message', 'gpt-message');
        gptMessage.textContent = data.message;
        chatWindow.appendChild(gptMessage);

        // Scroll to the bottom of the chat window to show the new message
        chatWindow.scrollTop = chatWindow.scrollHeight;
    })
    .catch(error => {
        console.error('Error:', error);
    });
});
