// server.js
import { WebSocketServer } from 'ws';
import http from 'http';

const PORT = process.env.PORT || 3000;

// Create a simple HTTP server (needed for WebSocket server)
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('WebSocket server is running');
});

// Create WebSocket server
const wss = new WebSocketServer({ server });

// In-memory data store (for simplicity)
let familyMembers = [];
let chatMessages = [];

// Function to broadcast messages to all connected clients
function broadcast(data) {
  wss.clients.forEach(client => {
    if (client.readyState === client.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
}

wss.on('connection', ws => {
  console.log('Client connected');

  // Send initial data to the newly connected client upon connection
  ws.send(JSON.stringify({ type: 'INITIAL_DATA', familyMembers, chatMessages }));

  ws.on('message', message => {
    const data = JSON.parse(message.toString());
    console.log('Received:', data);

    switch (data.type) {
      case 'REPORT_SAFETY':
        const { name, timestamp, id } = data.payload;
        if (!familyMembers.some(member => member.id === id)) {
          familyMembers.push({ name, timestamp: new Date(timestamp), id });
          broadcast({ type: 'UPDATE_FAMILY_MEMBERS', payload: familyMembers });
        }
        break;
      case 'SEND_MESSAGE':
        const { sender, message: chatMsg, timestamp: msgTimestamp, id: msgId } = data.payload;
        chatMessages.push({ sender, message: chatMsg, timestamp: new Date(msgTimestamp), id: msgId });
        broadcast({ type: 'UPDATE_CHAT_MESSAGES', payload: chatMessages });
        break;
      case 'REQUEST_INITIAL_DATA':
        ws.send(JSON.stringify({ type: 'INITIAL_DATA', familyMembers, chatMessages }));
        break;
      case 'RESET_DATA': // Handle reset request from client
        console.log('Received RESET_DATA request. Resetting in-memory data.');
        familyMembers = []; // Reset family members
        chatMessages = [];  // Reset chat messages
        // Broadcast the new, empty state to all connected clients
        broadcast({ type: 'INITIAL_DATA', familyMembers, chatMessages });
        break;
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
  });

  ws.on('error', error => {
    console.error('WebSocket error:', error);
  });
});

server.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});