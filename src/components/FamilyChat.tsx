// src/components/FamilyChat.tsx
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useEmergency } from '@/contexts/EmergencyContext';
import { MessageCircle, Send } from 'lucide-react';

const FamilyChat: React.FC = () => {
  const { chatMessages, userName, sendMessage } = useEmergency();
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim()) {
      sendMessage(userName, newMessage.trim());
      setNewMessage('');
    }
  };

  const formatTime = (timestamp: Date) => {
    return timestamp.toLocaleTimeString('he-IL', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm h-96 flex flex-col">
      <CardHeader className="pb-4 flex-shrink-0">
        <CardTitle className="flex items-center gap-2 text-slate-800 text-right">
          <MessageCircle className="h-5 w-5 text-purple-600" />
          צ'אט משפחתי 💬
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col p-4 pt-0">
        <div className="flex-1 overflow-y-auto mb-4 space-y-3 min-h-0">
          {chatMessages.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <div className="text-2xl mb-2">💬</div>
              <p>תתחילו לשוחח...</p>
            </div>
          ) : (
            chatMessages.map((msg) => (
              <div
                key={msg.id}
                className={`p-3 rounded-lg max-w-xs ${
                  msg.sender === userName
                    ? 'bg-blue-100 text-blue-900 ml-auto text-right'
                    : 'bg-gray-100 text-gray-900 mr-auto text-right'
                }`}
              >
                <div className="bg-white/70 px-2 py-1 rounded-md mb-2 border-b-2 border-slate-300">
                  <div className="font-bold text-sm text-slate-700">
                    {msg.sender}
                  </div>
                </div>
                <div className="text-base leading-relaxed mb-2 font-medium">
                  {msg.message}
                </div>
                <div className="text-xs text-slate-500 opacity-75">
                  {formatTime(msg.timestamp)}
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
        
        <form onSubmit={handleSendMessage} className="flex gap-2 flex-shrink-0">
          <Button
            type="submit"
            size="sm"
            className="bg-purple-600 hover:bg-purple-700"
            disabled={!newMessage.trim()}
          >
            <Send className="h-4 w-4" />
          </Button>
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="כתבו הודעה..."
            className="flex-1 text-right"
            dir="rtl"
          />
        </form>
      </CardContent>
    </Card>
  );
};

export default FamilyChat;