// Register
document.getElementById('registerForm')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const username = document.getElementById('registerUsername').value;
    const pass = document.getElementById('registerPassword').value;
  
    try {
        const response = await fetch('/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, pass }),
        });
  
        const result = await response.json();
        alert(response.ok ? result.message : result.error);
    } catch (err) {
        console.error(err);
    }
  });
  
  // Login
  document.getElementById('loginForm')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const username = document.getElementById('loginUsername').value;
    const pass = document.getElementById('loginPassword').value;
  
    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, pass }),
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
        console.error(err);
    }
  });
  
  // Logout
  document.getElementById('logoutButton')?.addEventListener('click', () => {
    sessionStorage.clear();
    window.location.href = '/index.html';
  });
  
  // Delete Account
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
            console.error(err);
        }
    }
  });
  let ws;

document.addEventListener('DOMContentLoaded', () => {
    const chatBox = document.getElementById('chatBox');
    const chatInput = document.getElementById('chatInput');
    const sendButton = document.getElementById('sendButton');

    if (sessionStorage.getItem('username')) {
        const username = sessionStorage.getItem('username');

        // Connect to WebSocket server
        ws = new WebSocket('ws://localhost:3000');

        ws.onopen = () => {
            console.log('Connected to WebSocket as:', username);
        };

        ws.onmessage = (event) => {
            const messageData = JSON.parse(event.data);
            const messageDiv = document.createElement('div');
            messageDiv.textContent = `${messageData.sender}: ${messageData.message}`;
            chatBox.appendChild(messageDiv);
            chatBox.scrollTop = chatBox.scrollHeight;
        };

        ws.onclose = () => {
            console.log('WebSocket connection closed');
        };

        ws.onerror = (error) => {
            console.error('WebSocket error:', error);
        };

        // Send message on button click
        sendButton?.addEventListener('click', () => {
            const message = chatInput.value.trim();
            if (message && ws) {
                ws.send(JSON.stringify({ sender: username, message }));
                chatInput.value = ''; // Clear input field after sending
            }
        });

        // Send message on Enter key press
        chatInput?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                sendButton.click();
            }
        });
    }
});
