
import React, { createContext, useContext, useState, useEffect } from 'react';

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

  useEffect(() => {
    if (userName) {
      localStorage.setItem('stockhammer-username', userName);
    }
  }, [userName]);

  const reportSafety = (name: string) => {
    const existingMember = familyMembers.find(member => member.name === name);
    if (!existingMember) {
      const newMember: FamilyMember = {
        name,
        timestamp: new Date(),
        id: Date.now().toString()
      };
      setFamilyMembers(prev => [...prev, newMember]);
    }
  };

  const sendMessage = (sender: string, message: string) => {
    const newMessage: ChatMessage = {
      sender,
      message,
      timestamp: new Date(),
      id: Date.now().toString()
    };
    setChatMessages(prev => [...prev, newMessage]);
  };

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
