import express from 'express';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import bodyParser from 'body-parser';
import path from 'path';
import csv from 'csv-parser';
import fs from 'fs';
import bcrypt from 'bcrypt';
import { WebSocketServer } from 'ws';
import http from 'http';

const app = express();
const port = 3000;

// Middleware
app.use(bodyParser.json());
app.use(express.static(path.resolve('public')));

// Database connection
const dbPromise = open({ filename: './data_plan.db', driver: sqlite3.Database });
dbPromise.then((db) =>
    db.run(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            pass TEXT NOT NULL
        );
    `)
);

// **Register**
app.post('/api/register', async (req, res) => {
    const { username, pass } = req.body;
    try {
        const db = await dbPromise;
        const existingUser = await db.get('SELECT * FROM users WHERE username = ?', [username]);
        if (existingUser) return res.status(400).json({ error: 'User already exists' });

        const hashedPassword = await bcrypt.hash(pass, 10);
        await db.run('INSERT INTO users (username, pass) VALUES (?, ?)', [username, hashedPassword]);
        res.status(201).json({ message: 'Registration successful' });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// **Login**
app.post('/api/login', async (req, res) => {
    const { username, pass } = req.body;
    try {
        const db = await dbPromise;
        const user = await db.get('SELECT * FROM users WHERE username = ?', [username]);
        if (!user) return res.status(404).json({ error: 'User not found' });

        const isPasswordValid = await bcrypt.compare(pass, user.pass);
        if (!isPasswordValid) return res.status(400).json({ error: 'Invalid credentials' });

        res.json({ userId: user.id });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// **Delete Account**
app.delete('/api/users/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const db = await dbPromise;
        await db.run('DELETE FROM users WHERE id = ?', [id]);
        res.json({ message: 'Account deleted' });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Create an HTTP server
const server = http.createServer(app);

// WebSocket server
const wss = new WebSocketServer({ server });

let connectedClients = [];

wss.on('connection', (ws) => {
    console.log('New WebSocket client connected');
    connectedClients.push(ws);

    ws.on('message', (data) => {
        try {
            const messageData = JSON.parse(data); // Parse the incoming message

            console.log('Message received:', messageData);

            // Broadcast the message to all connected clients
            connectedClients.forEach((client) => {
                if (client.readyState === client.OPEN) {
                    client.send(JSON.stringify(messageData));
                }
            });
        } catch (err) {
            console.error('Error processing message:', err);
        }
    });

    ws.on('close', () => {
        console.log('Client disconnected');
        connectedClients = connectedClients.filter((client) => client !== ws);
    });
});


// Start the combined server
server.listen(port, () => {
    console.log(`Express server running on http://localhost:${port}`);
    console.log(`WebSocket server running on ws://localhost:${port}`);
});
