
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useEmergency } from '@/contexts/EmergencyContext';

const UsernameForm: React.FC = () => {
  const { setUserName } = useEmergency();
  const [inputName, setInputName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputName.trim()) {
      setUserName(inputName.trim());
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-green-50 p-4">
      <Card className="w-full max-w-md shadow-lg border-0 bg-white/90 backdrop-blur-sm">
        <CardHeader className="text-center pb-6">
          <CardTitle className="text-2xl font-bold text-slate-800 mb-2">
            🏠 משפחת שטוקהמר
          </CardTitle>
          <CardDescription className="text-slate-600 text-lg">
            מערכת דיווח משפחתי לשעת חירום
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-2 text-right">
                איך קוראים לך?
              </label>
              <Input
                id="name"
                type="text"
                value={inputName}
                onChange={(e) => setInputName(e.target.value)}
                placeholder="השם שלך..."
                className="text-right text-lg py-3"
                dir="rtl"
                required
              />
            </div>
            <Button 
              type="submit" 
              className="w-full py-3 text-lg font-semibold bg-blue-600 hover:bg-blue-700 transition-all duration-200"
              disabled={!inputName.trim()}
            >
              כניסה למערכת 🚀
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default UsernameForm;
