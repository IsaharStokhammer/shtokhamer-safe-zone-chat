// server.js
import { WebSocketServer } from 'ws';
import http from 'http';

const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('WebSocket server is running');
});

const wss = new WebSocketServer({ server });

let familyMembers = [];
let chatMessages = [];

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
      case 'REQUEST_INITIAL_DATA': // NEW: Handle polling request
        ws.send(JSON.stringify({ type: 'INITIAL_DATA', familyMembers, chatMessages }));
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