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
let chatMessages = []; // Updated to store reactions
const typingUsers = new Map(); // Map to store { userName: timestamp_of_last_typing_event }

function broadcast(data) {
  wss.clients.forEach(client => {
    if (client.readyState === client.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
}

// Function to broadcast typing status
function broadcastTypingStatus() {
  const activeTypingUsers = Array.from(typingUsers.keys()); // Get array of names
  broadcast({ type: 'UPDATE_TYPING_USERS', payload: activeTypingUsers });
}

wss.on('connection', ws => {
  console.log('Client connected');

  // Send initial data to the newly connected client upon connection
  ws.send(JSON.stringify({ type: 'INITIAL_DATA', familyMembers, chatMessages, typingUsers: Array.from(typingUsers.keys()) }));

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
        // NEW: Initialize message with empty reactions array
        chatMessages.push({ sender, message: chatMsg, timestamp: new Date(msgTimestamp), id: msgId, reactions: [] }); 
        broadcast({ type: 'UPDATE_CHAT_MESSAGES', payload: chatMessages });
        if (typingUsers.has(sender)) {
          typingUsers.delete(sender);
          broadcastTypingStatus();
        }
        break;
      case 'REQUEST_INITIAL_DATA':
        ws.send(JSON.stringify({ type: 'INITIAL_DATA', familyMembers, chatMessages, typingUsers: Array.from(typingUsers.keys()) }));
        break;
      case 'RESET_DATA':
        console.log('Received RESET_DATA request. Resetting only familyMembers.');
        familyMembers = [];
        typingUsers.clear(); // Clear typing status on reset as well
        broadcast({ type: 'INITIAL_DATA', familyMembers, chatMessages, typingUsers: Array.from(typingUsers.keys()) });
        break;
      case 'TYPING_START': // NEW: Typing started
        if (data.payload.userName && !typingUsers.has(data.payload.userName)) {
          typingUsers.set(data.payload.userName, Date.now());
          broadcastTypingStatus();
        }
        break;
      case 'TYPING_STOP': // NEW: Typing stopped
        if (typingUsers.has(data.payload.userName)) {
          typingUsers.delete(data.payload.userName);
          broadcastTypingStatus();
        }
        break;
      case 'ADD_REACTION': // NEW: Handle adding reactions
        const { messageId, emoji, reactorName } = data.payload;
        const messageToReact = chatMessages.find(msg => msg.id === messageId);
        if (messageToReact) {
          // Check if reaction from this user already exists for this emoji
          const existingReactionIndex = messageToReact.reactions.findIndex(
            reaction => reaction.emoji === emoji && reaction.users.includes(reactorName)
          );

          if (existingReactionIndex > -1) {
            // User already reacted with this emoji - remove reaction
            messageToReact.reactions[existingReactionIndex].users = messageToReact.reactions[existingReactionIndex].users.filter(
                user => user !== reactorName
            );
            if (messageToReact.reactions[existingReactionIndex].users.length === 0) {
                messageToReact.reactions.splice(existingReactionIndex, 1); // Remove emoji if no users left
            }
          } else {
            // Add new reaction or add user to existing emoji reaction
            const emojiGroup = messageToReact.reactions.find(reaction => reaction.emoji === emoji);
            if (emojiGroup) {
                emojiGroup.users.push(reactorName);
            } else {
                messageToReact.reactions.push({ emoji, users: [reactorName] });
            }
          }
          broadcast({ type: 'UPDATE_CHAT_MESSAGES', payload: chatMessages }); // Broadcast updated messages
        }
        break;
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
    // Remove disconnected client from typing users if they were typing
    // This requires tracking which userName belongs to which ws client.
    // For simplicity, we'll clear all typing users if ANY client disconnects
    // A more robust solution would track `ws.userName = data.payload.userName` on connect/first message
    typingUsers.clear(); // Simple solution: clear all if any disconnects
    broadcastTypingStatus();
  });

  ws.on('error', error => {
    console.error('WebSocket error:', error);
  });
});

server.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});