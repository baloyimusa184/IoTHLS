// Register
document.getElementById('registerForm')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const username = document.getElementById('registerUsername').value.trim();
    const password = document.getElementById('registerPassword').value.trim();

    try {
        const response = await fetch('/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, pass: password }), // Updated field name
        });

        const result = await response.json();
        alert(response.ok ? result.message : result.error);
    } catch (err) {
        console.error('Error during registration:', err);
    }
});

// Login
document.getElementById('loginForm')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value.trim();

    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, pass: password }), // Updated field name
        });

        const result = await response.json();
        if (response.ok) {
            sessionStorage.setItem('userId', result.userId);
            sessionStorage.setItem('username', username);
            window.location.href = '/home.html';
        } else {
            alert(result.error);
        }
    } catch (err) {
        console.error('Error during login:', err);
    }
});

let ws;
let wsInitialized = false;

// Initialize WebSocket connection
function initializeWebSocket() {
    ws = new WebSocket('ws://localhost:9876');

    ws.onopen = () => {
        console.log('WebSocket connection opened');
        const username = sessionStorage.getItem('username');
        if (username) {
            ws.send(JSON.stringify({ sender: 'Server', message: `${username} has joined the chat.` }));
        }
    };

    ws.onmessage = (event) => {
        const messageData = JSON.parse(event.data);
        const messageDiv = document.createElement('div');
        const timestamp = new Date(messageData.timestamp).toLocaleTimeString();
        messageDiv.textContent = `[${timestamp}] ${messageData.sender}: ${messageData.message}`;
        document.getElementById('chatBox').appendChild(messageDiv);
        document.getElementById('chatBox').scrollTop = document.getElementById('chatBox').scrollHeight;
    };

    ws.onclose = (event) => {
        console.error('WebSocket closed. Reconnecting...', event.reason);
        setTimeout(initializeWebSocket, 3000); // Try to reconnect after 3 seconds
    };

    ws.onerror = (error) => {
        console.error('WebSocket error:', error);
    };
}

// Ensure WebSocket is initialized only once
if (!wsInitialized) {
    initializeWebSocket();
    wsInitialized = true;
}

// Function to send messages via WebSocket
function sendMessage(message) {
    if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(message));
    } else {
        console.error('WebSocket is not open:', ws.readyState);
        alert('Unable to send message. WebSocket is disconnected.');
    }
}

const sendButton = document.getElementById('sendButton');
const messageInput = document.getElementById('messageInput');
const chatBox = document.getElementById('chatBox');

sendButton?.addEventListener('click', () => {
    const message = {
        sender: sessionStorage.getItem('username'),
        message: messageInput.value.trim(),
        timestamp: new Date().toISOString(), // Include a timestamp
    };

    if (message.message) {
        sendMessage(message); // Send the message via WebSocket
        messageInput.value = ''; // Clear input field after sending
    }
});

document.getElementById('logoutButton')?.addEventListener('click', () => {
    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.close(); // Close the WebSocket connection
    }
    sessionStorage.clear();
    window.location.href = '/index.html';
});

document.getElementById('deleteAccountButton')?.addEventListener('click', async () => {
    const userId = sessionStorage.getItem('userId');

    if (confirm('Are you sure you want to delete your account?')) {
        try {
            const response = await fetch(`/api/users/${userId}`, { method: 'DELETE' });
            const result = await response.json();
            if (response.ok) {
                alert(result.message);
                sessionStorage.clear();
                window.location.href = '/index.html';
            } else {
                alert(result.error);
            }
        } catch (err) {
            console.error('Error during account deletion:', err);
        }
    }
});
