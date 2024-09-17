document.getElementById('chatForm').addEventListener('submit', function(event) {
    event.preventDefault();
    const userInput = document.getElementById('userInput').value;
    const chatWindow = document.getElementById('chatWindow');
    const inputField = document.getElementById('userInput');
    
    // Add the user's message to the chat window
    const userMessage = document.createElement('div');
    userMessage.classList.add('chat-message', 'user-message');
    userMessage.textContent = userInput;
    chatWindow.appendChild(userMessage);

    // Scroll to the bottom of the chat window to show the new message
    chatWindow.scrollTop = chatWindow.scrollHeight;

    // Clear the input field
    inputField.value = '';

    // Disable the input field and submit button while waiting for GPT response
    inputField.disabled = true;

    // Add a loading message to indicate that the GPT is processing
    const loadingMessage = document.createElement('div');
    loadingMessage.classList.add('chat-message', 'loading-message');
    loadingMessage.textContent = 'GPT is thinking...';
    chatWindow.appendChild(loadingMessage);

    // Scroll to the bottom to show the loading message
    chatWindow.scrollTop = chatWindow.scrollHeight;

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
        // Remove the loading message
        loadingMessage.remove();

        // Display GPT's response
        const gptMessage = document.createElement('div');
        gptMessage.classList.add('chat-message', 'gpt-message');
        gptMessage.textContent = data.message;
        chatWindow.appendChild(gptMessage);

        // Scroll to the bottom of the chat window to show the new message
        chatWindow.scrollTop = chatWindow.scrollHeight;

        // Enable the input field again
        inputField.disabled = false;
        inputField.focus();
    })
    .catch(error => {
        console.error('Error:', error);

        // Remove the loading message
        loadingMessage.remove();

        // Display an error message in the chat window
        const errorMessage = document.createElement('div');
        errorMessage.classList.add('chat-message', 'error-message');
        errorMessage.textContent = 'Something went wrong. Please try again.';
        chatWindow.appendChild(errorMessage);

        // Scroll to the bottom of the chat window to show the error message
        chatWindow.scrollTop = chatWindow.scrollHeight;

        // Enable the input field again
        inputField.disabled = false;
        inputField.focus();
    });
});
