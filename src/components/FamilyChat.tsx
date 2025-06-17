// src/components/FamilyChat.tsx
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useEmergency } from '@/contexts/EmergencyContext';
import { MessageCircle, Send, Trash2, Smile } from 'lucide-react'; // Import Smile for reaction button
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'; // Import Popover components

const FamilyChat: React.FC = () => {
  const { chatMessages, userName, sendMessage, resetAllData, typingUsers, startTyping, stopTyping, addReaction } = useEmergency();
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatScrollContainerRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Common emojis for quick reaction
  const commonEmojis = ['👍', '❤️', '😂', '🙏', '😢', '🔥'];

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
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
      stopTyping();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);

    if (e.target.value.length > 0) {
      startTyping();
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      typingTimeoutRef.current = setTimeout(() => {
        stopTyping();
        typingTimeoutRef.current = null;
      }, 1000);
    } else {
      stopTyping();
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
    }
  };

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      stopTyping();
    };
  }, [stopTyping]);

  const handleAddReaction = (messageId: string, emoji: string) => {
    addReaction(messageId, emoji);
  };

  const formatTime = (timestamp: Date) => {
    return timestamp.toLocaleTimeString('he-IL', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const otherTypingUsers = typingUsers.filter(user => user !== userName);

  return (
    <Card className="flex flex-col h-[700px] shadow-lg border-0 bg-white/90 backdrop-blur-sm mx-auto w-full md:max-w-md">
      <CardHeader className="flex-shrink-0 pb-4">
        <CardTitle className="flex items-center gap-2 text-slate-800 text-right">
          <MessageCircle className="h-5 w-5 text-purple-600" />
          צ'אט משפחתי 💬
          <Button
            variant="ghost"
            size="icon"
            onClick={resetAllData}
            className="mr-auto text-red-500 hover:text-red-700"
            title="איפוס נתוני צ'אט וסטטוס"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-4 pt-0 overflow-hidden">
        <div ref={chatScrollContainerRef} className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thumb-rounded scrollbar-track-rounded scrollbar-thumb-gray-400 scrollbar-track-gray-100">
          {chatMessages.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <div className="text-2xl mb-2">💬</div>
              <p>תתחילו לשוחח...</p>
            </div>
          ) : (
            chatMessages.map((msg) => (
              <div
                key={msg.id}
                className={`p-2 rounded-lg max-w-[85%] overflow-hidden relative group ${ // Added relative and group for popover positioning
                  msg.sender === userName
                    ? 'bg-blue-100 text-blue-900 ml-auto'
                    : 'bg-gray-100 text-gray-900 mr-auto'
                } flex flex-col`}
                style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}
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

                {/* NEW: Reactions display */}
                {msg.reactions && msg.reactions.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2 text-xs">
                    {msg.reactions.map((reaction) => (
                      <span
                        key={reaction.emoji}
                        className="bg-white/70 px-2 py-0.5 rounded-full border border-gray-200 flex items-center cursor-pointer hover:bg-gray-200 transition-colors"
                        title={reaction.users.join(', ')} // Show who reacted on hover
                        onClick={() => handleAddReaction(msg.id, reaction.emoji)} // Allow toggling reaction
                      >
                        {reaction.emoji} {reaction.users.length}
                      </span>
                    ))}
                  </div>
                )}

                {/* NEW: Reaction button (Popover) - positioned absolutely for better placement */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={`absolute top-0.5 ${msg.sender === userName ? 'left-0.5' : 'right-0.5'} opacity-0 group-hover:opacity-100 transition-opacity p-1 h-auto w-auto`} // Hide by default, show on hover
                      title="הגב באימוג'י"
                    >
                      <Smile className="h-3 w-3" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-1 flex gap-1 bg-white/90 backdrop-blur-sm shadow-lg rounded-md border">
                    {commonEmojis.map(emoji => (
                      <Button
                        key={emoji}
                        variant="ghost"
                        size="sm"
                        className="p-1 h-auto w-auto text-lg hover:bg-gray-100"
                        onClick={() => handleAddReaction(msg.id, emoji)}
                      >
                        {emoji}
                      </Button>
                    ))}
                  </PopoverContent>
                </Popover>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
        
        {/* Typing indicator */}
        {otherTypingUsers.length > 0 && (
          <div className="text-right text-sm text-slate-500 mt-2 mb-2 pr-2">
            {otherTypingUsers.join(', ')} מקליד/ה...
          </div>
        )}

        <form onSubmit={handleSendMessage} className="flex-shrink-0 flex gap-2 pt-4">
          <Input
            value={newMessage}
            onChange={handleInputChange}
            placeholder="כתבו הודעה..."
            className="flex-1 text-right"
            dir="rtl"
          />
          <Button
            type="submit"
            size="sm"
            className="bg-purple-600 hover:bg-purple-700"
            disabled={!newMessage.trim()}
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default FamilyChat;