// src/contexts/EmergencyContext.tsx
import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';

// כתובת ה-URL של שרת ה-WebSocket הפרוס ב-Render
const WEBSOCKET_URL = 'wss://shtokhamer-safe-zone-chat.onrender.com'; // **עודכן לכתובת ה-URL שסיפקת**

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
  type: 'INITIAL_DATA' | 'UPDATE_FAMILY_MEMBERS' | 'UPDATE_CHAT_MESSAGES' | 'REQUEST_INITIAL_DATA';
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
  resetAllData: () => void;
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
      ws.current.close();
    }

    ws.current = new WebSocket(WEBSOCKET_URL);

    ws.current.onopen = () => {
      console.log('WebSocket connected');
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      ws.current.send(JSON.stringify({ type: 'REQUEST_INITIAL_DATA' }));
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
              setChatMessages(data.chatMessages.map(msg => ({
                  ...msg,
                  timestamp: new Date(msg.timestamp)
              })));
          }
      } else if (data.type === 'UPDATE_FAMILY_MEMBERS' && data.payload) {
          setFamilyMembers(data.payload.map((member: FamilyMember) => ({
              ...member,
              timestamp: new Date(member.timestamp)
          })));
      } else if (data.type === 'UPDATE_CHAT_MESSAGES' && data.payload) {
          setChatMessages(data.payload.map((msg: ChatMessage) => ({
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

    ws.current.onerror = (error => {
      console.error('WebSocket error:', error);
      if (ws.current && ws.current.readyState === WebSocket.OPEN) {
        ws.current.close();
      }
    });
  }, []);

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
      id: Date.now().toString()
    };

    setChatMessages(prev => [...prev, newMessage]);

    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ type: 'SEND_MESSAGE', payload: newMessage }));
    } else {
      console.warn("WebSocket not connected. Message might not be synchronized.");
    }
  }, []);

  const resetAllData = useCallback(() => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      console.log('Sending RESET_DATA request to server...');
      ws.current.send(JSON.stringify({ type: 'RESET_DATA' }));
    } else {
      console.warn("WebSocket not connected. Cannot send reset request.");
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
      isUserReported,
      resetAllData
    }}>
      {children}
    </EmergencyContext.Provider>
  );
};