// src/contexts/EmergencyContext.tsx
import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';

const WEBSOCKET_URL = 'ws://localhost:3000'; // Make sure this matches your server.js port
const POLLING_INTERVAL_MS = 3000; // Refresh data every 3 seconds - FOR TESTING/TEMPORARY FIX ONLY

interface FamilyMember {
  name: string;
  timestamp: Date;
  id: string;
}

interface ChatMessage {
  sender: string;
  message: string;
  timestamp: Date;
  id: string;
}

interface ServerMessage {
  type: 'INITIAL_DATA' | 'UPDATE_FAMILY_MEMBERS' | 'UPDATE_CHAT_MESSAGES';
  familyMembers?: FamilyMember[];
  chatMessages?: ChatMessage[];
  payload?: any;
}

interface EmergencyContextType {
  familyMembers: FamilyMember[];
  chatMessages: ChatMessage[];
  userName: string;
  setUserName: (name: string) => void;
  reportSafety: (name: string) => void;
  sendMessage: (sender: string, message: string) => void;
  isUserReported: boolean;
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

  const ws = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Function to establish WebSocket connection
  const connectWebSocket = useCallback(() => {
    if (ws.current) {
      ws.current.close(); // Close existing connection if any
    }

    ws.current = new WebSocket(WEBSOCKET_URL);

    ws.current.onopen = () => {
      console.log('WebSocket connected');
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      // Request initial data upon successful connection
      ws.current.send(JSON.stringify({ type: 'REQUEST_INITIAL_DATA' }));
    };

    ws.current.onmessage = (event) => {
      const data: ServerMessage = JSON.parse(event.data.toString());
      console.log('Received from server:', data); // Log to see what's coming in
      if (data.type === 'INITIAL_DATA' || data.type === 'UPDATE_FAMILY_MEMBERS') {
        setFamilyMembers(data.familyMembers.map(member => ({
          ...member,
          timestamp: new Date(member.timestamp)
        })));
      }
      if (data.type === 'INITIAL_DATA' || data.type === 'UPDATE_CHAT_MESSAGES') {
        setChatMessages(data.chatMessages.map(msg => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        })));
      }
    };

    ws.current.onclose = () => {
      console.log('WebSocket disconnected. Attempting to reconnect...');
      if (!reconnectTimeoutRef.current) {
        reconnectTimeoutRef.current = setTimeout(connectWebSocket, 3000);
      }
    };

    ws.current.onerror = (error) => {
      console.error('WebSocket error:', error);
      if (ws.current && ws.current.readyState === WebSocket.OPEN) {
        ws.current.close();
      }
    };
  }, []);

  // Initial connection and cleanup
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

  // Polling mechanism to request data periodically (as a temporary workaround)
  useEffect(() => {
    const pollingInterval = setInterval(() => {
      if (ws.current && ws.current.readyState === WebSocket.OPEN) {
        console.log('Polling server for updates...');
        ws.current.send(JSON.stringify({ type: 'REQUEST_INITIAL_DATA' }));
      }
    }, POLLING_INTERVAL_MS);

    return () => clearInterval(pollingInterval);
  }, []); // Empty dependency array means this runs once on mount and cleans up on unmount

  // Save username to localStorage
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

    // Optimistic update
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
      id: Date.now().toString()
    };

    // Optimistic update
    setChatMessages(prev => [...prev, newMessage]);

    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ type: 'SEND_MESSAGE', payload: newMessage }));
    } else {
      console.warn("WebSocket not connected. Message might not be synchronized.");
    }
  }, []);

  const isUserReported = familyMembers.some(member => member.name === userName);

  return (
    <EmergencyContext.Provider value={{
      familyMembers,
      chatMessages,
      userName,
      setUserName,
      reportSafety,
      sendMessage,
      isUserReported
    }}>
      {children}
    </EmergencyContext.Provider>
  );
};