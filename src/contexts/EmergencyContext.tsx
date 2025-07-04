// src/contexts/EmergencyContext.tsx
import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';

const WEBSOCKET_URL = 'wss://shtokhamer-safe-zone-chat.onrender.com';

interface FamilyMember {
  name: string;
  timestamp: Date;
  id: string;
}

// NEW: Define reaction structure
interface Reaction {
  emoji: string;
  users: string[]; // Array of user names who reacted with this emoji
}

interface ChatMessage {
  sender: string;
  message: string;
  timestamp: Date;
  id: string;
  reactions: Reaction[]; // NEW: Add reactions array to chat messages
}

interface ServerMessage {
  type: 'INITIAL_DATA' | 'UPDATE_FAMILY_MEMBERS' | 'UPDATE_CHAT_MESSAGES' | 'REQUEST_INITIAL_DATA' | 'UPDATE_TYPING_USERS'; // Added UPDATE_TYPING_USERS
  familyMembers?: FamilyMember[];
  chatMessages?: ChatMessage[];
  payload?: any;
  typingUsers?: string[]; // Added typingUsers for INITIAL_DATA and UPDATE_TYPING_USERS
}

interface EmergencyContextType {
  familyMembers: FamilyMember[];
  chatMessages: ChatMessage[];
  userName: string;
  setUserName: (name: string) => void;
  reportSafety: (name: string) => void;
  sendMessage: (sender: string, message: string) => void;
  isUserReported: boolean;
  resetAllData: () => void;
  typingUsers: string[]; // State for typing users
  startTyping: () => void; // Function to signal typing start
  stopTyping: () => void; // Function to signal typing stop
  addReaction: (messageId: string, emoji: string) => void; // Function to add a reaction
}

const EmergencyContext = createContext<EmergencyContextType | undefined>(undefined);

export const useEmergency = () => {
  const context = useContext(EmergencyContext);
  if (!context) {
    throw new Error('useEmergency must be used within an EmergencyProvider');
  }
  return context;
};

export const EmergencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [userName, setUserName] = useState(() =>
    localStorage.getItem('stockhammer-username') || ''
  );
  // NEW: State to hold currently typing users
  const [typingUsers, setTypingUsers] = useState<string[]>([]);

  const ws = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const connectWebSocket = useCallback(() => {
    if (ws.current) {
      ws.current.close();
    }

    ws.current = new WebSocket(WEBSOCKET_URL);

    ws.current.onopen = () => {
      console.log('WebSocket connected');
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      ws.current.send(JSON.stringify({ type: 'REQUEST_INITIAL_DATA', payload: { userName } })); // Send userName on connect
    };

    ws.current.onmessage = (event) => {
      const data: ServerMessage = JSON.parse(event.data.toString());
      console.log('Received from server:', data);
      
      if (data.type === 'INITIAL_DATA') {
          if (data.familyMembers) {
              setFamilyMembers(data.familyMembers.map(member => ({
                  ...member,
                  timestamp: new Date(member.timestamp)
              })));
          }
          if (data.chatMessages) {
              // Ensure reactions are initialized or correctly parsed
              setChatMessages(data.chatMessages.map(msg => ({
                  ...msg,
                  timestamp: new Date(msg.timestamp),
                  reactions: msg.reactions || [] // Ensure reactions is an array
              })));
          }
          if (data.typingUsers) {
            setTypingUsers(data.typingUsers);
          }
      } else if (data.type === 'UPDATE_FAMILY_MEMBERS' && data.payload) {
          setFamilyMembers(data.payload.map((member: FamilyMember) => ({
              ...member,
              timestamp: new Date(member.timestamp)
          })));
      } else if (data.type === 'UPDATE_CHAT_MESSAGES' && data.payload) {
          // NEW: Ensure reactions are handled when updating chat messages
          setChatMessages(data.payload.map((msg: ChatMessage) => ({
              ...msg,
              timestamp: new Date(msg.timestamp),
              reactions: msg.reactions || [] // Ensure reactions is an array
          })));
      } else if (data.type === 'UPDATE_TYPING_USERS' && data.payload) { // NEW: Handle typing status updates
          setTypingUsers(data.payload);
      }
    };

    ws.current.onclose = () => {
      console.log('WebSocket disconnected. Attempting to reconnect...');
      if (!reconnectTimeoutRef.current) {
        reconnectTimeoutRef.current = setTimeout(connectWebSocket, 3000);
      }
      setTypingUsers([]); // Clear typing status if disconnected
    };

    ws.current.onerror = (error => {
      console.error('WebSocket error:', error);
      if (ws.current && ws.current.readyState === WebSocket.OPEN) {
        ws.current.close();
      }
    });
  }, [userName]);

  useEffect(() => {
    connectWebSocket();
    return () => {
      if (ws.current && ws.current.readyState === WebSocket.OPEN) {
        ws.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [connectWebSocket]);

  useEffect(() => {
    if (userName) {
      localStorage.setItem('stockhammer-username', userName);
    }
  }, [userName]);

  const reportSafety = useCallback((name: string) => {
    const newMember: FamilyMember = {
      name,
      timestamp: new Date(),
      id: Date.now().toString()
    };

    setFamilyMembers(prev => {
        if (!prev.some(member => member.id === newMember.id)) {
            return [...prev, newMember];
        }
        return prev;
    });

    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ type: 'REPORT_SAFETY', payload: newMember }));
    } else {
      console.warn("WebSocket not connected. Safety report might not be synchronized.");
    }
  }, []);

  const sendMessage = useCallback((sender: string, message: string) => {
    const newMessage: ChatMessage = {
      sender,
      message,
      timestamp: new Date(),
      id: Date.now().toString(),
      reactions: [] // NEW: Initialize reactions for new messages
    };

    setChatMessages(prev => [...prev, newMessage]);

    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ type: 'SEND_MESSAGE', payload: newMessage }));
      stopTyping(); // Stop typing after sending message
    } else {
      console.warn("WebSocket not connected. Message might not be synchronized.");
    }
  }, []); // Added stopTyping dependency

  const resetAllData = useCallback(() => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      console.log('Sending RESET_DATA request to server...');
      ws.current.send(JSON.stringify({ type: 'RESET_DATA' }));
    } else {
      console.warn("WebSocket not connected. Cannot send reset request.");
    }
  }, []);

  const startTyping = useCallback(() => {
    if (userName && ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ type: 'TYPING_START', payload: { userName } }));
    }
  }, [userName]);

  const stopTyping = useCallback(() => {
    if (userName && ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ type: 'TYPING_STOP', payload: { userName } }));
    }
  }, [userName]);

  // NEW: Function to add a reaction
  const addReaction = useCallback((messageId: string, emoji: string) => {
    if (userName && ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({
        type: 'ADD_REACTION',
        payload: { messageId, emoji, reactorName: userName }
      }));
    } else {
      console.warn("WebSocket not connected. Cannot add reaction.");
    }
  }, [userName]);

  const isUserReported = familyMembers.some(member => member.name === userName);

  return (
    <EmergencyContext.Provider value={{
      familyMembers,
      chatMessages,
      userName,
      setUserName,
      reportSafety,
      sendMessage,
      isUserReported,
      resetAllData,
      typingUsers,
      startTyping,
      stopTyping,
      addReaction // Expose addReaction function
    }}>
      {children}
    </EmergencyContext.Provider>
  );
};